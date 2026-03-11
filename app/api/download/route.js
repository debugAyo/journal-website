import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract the public_id from a Cloudinary URL
// e.g. https://res.cloudinary.com/xxx/raw/upload/v123/journal-manuscripts/manuscript-123.pdf
// => journal-manuscripts/manuscript-123.pdf
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

    // Generate a signed Cloudinary URL to bypass delivery restrictions
    const publicId = extractPublicId(fileUrl);
    if (!publicId) {
      return NextResponse.json({ error: "Invalid file URL format" }, { status: 400 });
    }

    const signedUrl = cloudinary.url(publicId, {
      resource_type: "raw",
      type: "upload",
      sign_url: true,
      secure: true,
    });

    const response = await fetch(signedUrl);

    if (!response.ok) {
      console.error("[DOWNLOAD] Signed URL fetch failed:", response.status, signedUrl);
      // Fallback: try the original URL
      const fallbackResponse = await fetch(fileUrl);
      if (!fallbackResponse.ok) {
        return NextResponse.json(
          { error: "File not found or inaccessible" },
          { status: 404 }
        );
      }
      return streamFile(fallbackResponse, parsed.pathname);
    }

    return streamFile(response, parsed.pathname);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}

function streamFile(response, urlPath) {
  const filename = urlPath.substring(urlPath.lastIndexOf("/") + 1) || "manuscript";

  let contentType = "application/octet-stream";
  if (filename.endsWith(".pdf")) contentType = "application/pdf";
  else if (filename.endsWith(".docx")) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  else if (filename.endsWith(".doc")) contentType = "application/msword";

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new NextResponse(response.body, {
    status: 200,
    headers,
  });
}
