import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

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

    // Only allow Cloudinary URLs to prevent SSRF
    const parsed = new URL(fileUrl);
    if (!parsed.hostname.endsWith("cloudinary.com")) {
      return NextResponse.json({ error: "Invalid file source" }, { status: 400 });
    }

    const publicId = extractPublicId(fileUrl);
    if (!publicId) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Fetch the file from Cloudinary server-side and stream it to the user.
    // This works on ALL Cloudinary plans (including free) — no private_download_url needed.
    const cloudinaryResponse = await fetch(fileUrl);

    if (!cloudinaryResponse.ok) {
      console.error("Cloudinary fetch failed:", cloudinaryResponse.status, cloudinaryResponse.statusText);
      return NextResponse.json({ error: "File not found on storage" }, { status: 404 });
    }

    // Determine filename for the Content-Disposition header
    const filename = publicId.includes("/")
      ? publicId.substring(publicId.lastIndexOf("/") + 1)
      : publicId;

    // Determine content type
    const contentType = cloudinaryResponse.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(cloudinaryResponse.body, {
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
