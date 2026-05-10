import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "manuscripts";

export async function GET() {
    const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!hasUrl || !hasAnonKey) {
        return NextResponse.json(
            {
                ok: false,
                configured: false,
                error: "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY",
            },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            ok: true,
            configured: true,
            bucket: STORAGE_BUCKET,
        },
        { status: 200 }
    );
}

export async function POST(req) {
    try {
        const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
        const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

        if (!hasUrl || !hasAnonKey) {
            return NextResponse.json(
                {
                    error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
                    configured: false,
                },
                { status: 500 }
            );
        }

        const storageClient = supabaseAdmin ?? supabase;
        if (!storageClient) {
            return NextResponse.json(
                { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
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
        // Check file type (allow fallback to file extension when MIME type is missing)
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        const fileName = file.name || "";
        const lowerName = fileName.toLowerCase();
        const allowedByName =
            lowerName.endsWith(".pdf") ||
            lowerName.endsWith(".doc") ||
            lowerName.endsWith(".docx");
        const typeIsUnknown = !file.type || file.type === "application/octet-stream";
        if (!allowedTypes.includes(file.type) && !(typeIsUnknown && allowedByName)) {
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

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const originalName = file.name || "manuscript";
        const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const objectPath = `journal-manuscripts/${Date.now()}-${safeName}`;

        const { error: uploadError } = await storageClient.storage
            .from(STORAGE_BUCKET)
            .upload(objectPath, buffer, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
            });

        if (uploadError) {
            console.error("Upload error details:", {
                message: uploadError.message,
                statusCode: uploadError.statusCode,
                bucket: STORAGE_BUCKET,
                objectPath,
                hasServiceKey,
            });
            return NextResponse.json(
                {
                    error: uploadError.message || "Upload failed",
                    code: uploadError.code,
                    statusCode: uploadError.statusCode,
                    bucket: STORAGE_BUCKET,
                },
                { status: 500 }
            );
        }

        const { data: publicData } = storageClient.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(objectPath);

        return NextResponse.json(
            {
                url: publicData?.publicUrl,
                path: objectPath,
                bucket: STORAGE_BUCKET,
            },
            { status: 200 }
        );

    } catch (error)  {
        console.error("Upload error:", error);

        return NextResponse.json(
            { error: "File Upload failed. Please try again." },
            { status: 500 }
        );
    }
}
