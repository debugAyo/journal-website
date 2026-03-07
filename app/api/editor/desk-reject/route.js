import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["EDITOR", "ADMIN"];

function hasEditorAccess(role) {
  return ALLOWED_ROLES.includes(role);
}

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || !hasEditorAccess(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { articleId, message } = body;

    if (!articleId || !message) {
      return NextResponse.json(
        { error: "articleId and message are required" },
        { status: 400 }
      );
    }

    const [article, latestSubmission] = await Promise.all([
      prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, title: true },
      }),
      prisma.submission.findFirst({
        where: { articleId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!latestSubmission) {
      return NextResponse.json({ error: "Submission not found for article" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: articleId },
        data: { status: "REJECTED" },
      });

      await tx.notification.create({
        data: {
          userId: latestSubmission.submittedBy,
          type: "desk_rejection",
          message,
        },
      });
    });

    return NextResponse.json({ message: "Submission desk rejected" });
  } catch (error) {
    console.error("Desk reject error:", error);
    return NextResponse.json({ error: "Failed to desk reject submission" }, { status: 500 });
  }
}
