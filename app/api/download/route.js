import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract public_id from Cloudinary URL
// e.g. .../raw/upload/v123/journal-manuscripts/manuscript-123.pdf => journal-manuscripts/manuscript-123.pdf
function extractPublicId(url) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return match ? match[1] : null;
}

function extractSupabaseObject(parsedUrl) {
  const parts = parsedUrl.pathname.split("/").filter(Boolean);
  const objectIndex = parts.indexOf("object");
  if (objectIndex === -1) return null;

  const maybeScope = parts[objectIndex + 1];
  const scopeIsPublicOrSign = maybeScope === "public" || maybeScope === "sign";
  const bucketIndex = scopeIsPublicOrSign ? objectIndex + 2 : objectIndex + 1;
  const pathIndex = bucketIndex + 1;

  const bucket = parts[bucketIndex];
  const path = parts.slice(pathIndex).join("/");

  if (!bucket || !path) return null;
  return { bucket, path };
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Only allow Cloudinary or Supabase Storage URLs to prevent SSRF
    const parsed = new URL(fileUrl);
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
    const isCloudinary = parsed.hostname.endsWith("cloudinary.com");
    const isSupabase = supabaseHost
      ? parsed.hostname === supabaseHost && parsed.pathname.startsWith("/storage/v1/")
      : false;

    if (!isCloudinary && !isSupabase) {
      return NextResponse.json(
        { error: "Invalid file source" },
        { status: 400 }
      );
    }

    let filename;
    if (isCloudinary) {
      const publicId = extractPublicId(fileUrl);
      if (!publicId) {
        return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
      }
      filename = publicId.includes("/")
        ? publicId.substring(publicId.lastIndexOf("/") + 1)
        : publicId;
    } else {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      filename = pathParts.length ? pathParts[pathParts.length - 1] : "download";
    }

    if (isSupabase && supabaseAdmin) {
      const objectInfo = extractSupabaseObject(parsed);
      if (!objectInfo) {
        return NextResponse.json({ error: "Invalid Supabase file URL" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin.storage
        .from(objectInfo.bucket)
        .download(objectInfo.path);

      if (error || !data) {
        console.error("Supabase download failed:", error?.message || "No data");
        return NextResponse.json({ error: "File not found on storage" }, { status: 404 });
      }

      const arrayBuffer = await data.arrayBuffer();
      const contentType = data.type || "application/octet-stream";

      return new NextResponse(Buffer.from(arrayBuffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (isSupabase && !fileUrl.includes("/public/")) {
      return NextResponse.json(
        { error: "Supabase file is private. Configure SUPABASE_SERVICE_ROLE_KEY or use a public bucket." },
        { status: 403 }
      );
    }

    // Fetch the file from storage server-side and stream it to the user.
    const storageResponse = await fetch(fileUrl);

    if (!storageResponse.ok) {
      console.error("Storage fetch failed:", storageResponse.status, storageResponse.statusText);
      return NextResponse.json({ error: "File not found on storage" }, { status: 404 });
    }

    // Determine content type
    const contentType = storageResponse.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(storageResponse.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
