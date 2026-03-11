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

    // Extract the actual file extension (pdf, docx, etc) from the public_id
    const ext = publicId.includes(".")
      ? publicId.substring(publicId.lastIndexOf(".") + 1)
      : "";

    // Use Cloudinary's private_download_url with the real extension
    const signedUrl = cloudinary.utils.private_download_url(publicId, ext, {
      resource_type: "raw",
      expires_at: Math.floor(Date.now() / 1000) + 300,
    });

    // Redirect the browser to the signed URL — Cloudinary will serve the file
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
