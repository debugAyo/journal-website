import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const maxDuration = 120;

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
});

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function GET() {
    const configured = Boolean(
        cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret
    );

    if (!configured) {
        return NextResponse.json(
            {
                ok: false,
                configured: false,
                error: "Missing one or more Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
            },
            { status: 500 }
        );
    }

    try {
        const ping = await cloudinary.api.ping();
        return NextResponse.json(
            {
                ok: true,
                configured: true,
                cloudName: cloudinaryCloudName,
                ping,
            },
            { status: 200 }
        );
    } catch (error) {
        const message =
            error?.message ||
            error?.error?.message ||
            String(error);
        const httpCode = error?.http_code || error?.error?.http_code;
        const errorName = error?.name || error?.error?.name;

        return NextResponse.json(
            {
                ok: false,
                configured: true,
                cloudName: cloudinaryCloudName,
                error: message,
                httpCode,
                errorName,
            },
            { status: 502 }
        );
    }
}

export async function POST(req) {
    try {
        if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
            return NextResponse.json(
                { error: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET." },
                { status: 500 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }
        // Check file type
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Only PDF and Word documents are allowed" },
                { status: 400 }
            );
        }

        if (typeof file.size === "number" && file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: "File is too large. Maximum allowed size is 10MB." },
                { status: 400 }
            );
        }
        
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        //Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader
            .upload_stream(
                {
                    resource_type: "raw",
                    folder: "journal-manuscripts",
                    public_id: `manuscript-${Date.now()}`,
                    timeout: 120000,

                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }           
             )
             .end(buffer);

        });

                return NextResponse.json(
                        {
                                url: result.secure_url,
                                public_id: result.public_id,
                            },
                        { status: 200 }
                );

            } catch (error)  {
        console.error("Upload error:", error);

                if (error?.name === "TimeoutError" || error?.http_code === 499) {
                        return NextResponse.json(
                                { error: "Upload timed out while sending to Cloudinary. Please retry with a smaller file or check network stability." },
                                { status: 504 }
                        );
                }

        return NextResponse.json(
            { error: "File Upload failed. Please try again."},
            { status: 500 }
        );
      }
            
}
    