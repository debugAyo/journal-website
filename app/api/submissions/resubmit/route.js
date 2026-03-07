import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["AUTHOR", "ADMIN"];

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ADMIN can always resubmit; AUTHOR must be the original submitter
    const isAdmin = session.user.role === "ADMIN";

    const body = await req.json();
    const { articleId, manuscriptUrl, coverLetterUrl, notesToEditor } = body;

    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    if (!manuscriptUrl) {
      return NextResponse.json({ error: "manuscriptUrl is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.status !== "REVISION_REQUIRED") {
      return NextResponse.json(
        { error: "Article is not awaiting revision" },
        { status: 400 }
      );
    }

    // Get original submission to verify submitter and get revision number
    const originalSubmission = await prisma.submission.findFirst({
      where: { articleId },
      orderBy: { revisionNumber: "asc" },
    });

    if (!originalSubmission) {
      return NextResponse.json({ error: "Original submission not found" }, { status: 404 });
    }

    // Check if user is the original submitter (unless admin)
    if (!isAdmin && originalSubmission.submittedBy !== user.id) {
      return NextResponse.json(
        { error: "Only the original author can resubmit this article" },
        { status: 403 }
      );
    }

    // Get current highest revision number
    const latestSubmission = await prisma.submission.findFirst({
      where: { articleId },
      orderBy: { revisionNumber: "desc" },
    });

    const newRevisionNumber = (latestSubmission?.revisionNumber || 0) + 1;

    // Find editors to notify
    const editors = await prisma.user.findMany({
      where: { role: { in: ["EDITOR", "ADMIN"] } },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      // Create new submission record
      await tx.submission.create({
        data: {
          articleId,
          submittedBy: user.id,
          coverLetter: coverLetterUrl || null,
          notes: notesToEditor || null,
          revisionNumber: newRevisionNumber,
        },
      });

      // Update article manuscript URL and status
      await tx.article.update({
        where: { id: articleId },
        data: {
          manuscriptUrl,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      // Notify editors
      if (editors.length > 0) {
        await tx.notification.createMany({
          data: editors.map((editor) => ({
            userId: editor.id,
            type: "revision_submitted",
            message: `A revised manuscript (Revision ${newRevisionNumber}) has been submitted for "${article.title}".`,
          })),
        });
      }
    });

    return NextResponse.json({
      message: `Revision ${newRevisionNumber} submitted successfully`,
    });
  } catch (error) {
    console.error("Resubmit error:", error);
    return NextResponse.json({ error: "Failed to submit revision" }, { status: 500 });
  }
}
