import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId } = await params;

    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    const submissions = await prisma.submission.findMany({
      where: { articleId },
      orderBy: { revisionNumber: "asc" },
      select: {
        id: true,
        revisionNumber: true,
        coverLetter: true,
        notes: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ versions: submissions });
  } catch (error) {
    console.error("Fetch versions error:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}
