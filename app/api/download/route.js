import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

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

    const response = await fetch(fileUrl);

    if (!response.ok) {
      // If direct fetch fails, try authenticated Cloudinary URL
      return NextResponse.json(
        { error: "File not found or inaccessible" },
        { status: 404 }
      );
    }

    // Determine filename and content type from URL
    const urlPath = parsed.pathname;
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
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
