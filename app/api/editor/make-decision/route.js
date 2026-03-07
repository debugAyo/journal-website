import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["EDITOR", "ADMIN"];
const VALID_DECISIONS = ["ACCEPT", "MINOR_REVISION", "MAJOR_REVISION", "REJECT"];

function getStatusFromDecision(decision) {
  if (decision === "ACCEPT") return "ACCEPTED";
  if (decision === "REJECT") return "REJECTED";
  return "REVISION_REQUIRED";
}

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ALLOWED_ROLES.includes(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { articleId, decision, decisionLetter } = body;

    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    if (!decision || !VALID_DECISIONS.includes(decision)) {
      return NextResponse.json(
        { error: "Valid decision is required (ACCEPT, MINOR_REVISION, MAJOR_REVISION, REJECT)" },
        { status: 400 }
      );
    }

    if (!decisionLetter || !decisionLetter.trim()) {
      return NextResponse.json({ error: "Decision letter is required" }, { status: 400 });
    }

    const editor = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!editor) {
      return NextResponse.json({ error: "Editor not found" }, { status: 404 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Get the submitting author
    const latestSubmission = await prisma.submission.findFirst({
      where: { articleId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestSubmission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Get reviewer comments if revision required (anonymised)
    let reviewerComments = [];
    if (decision === "MINOR_REVISION" || decision === "MAJOR_REVISION") {
      const completedReviews = await prisma.review.findMany({
        where: { articleId, status: "COMPLETED" },
        select: { commentsToAuthor: true, recommendation: true },
      });
      reviewerComments = completedReviews.map((r, i) => ({
        reviewerNumber: i + 1,
        recommendation: r.recommendation,
        comments: r.commentsToAuthor,
      }));
    }

    const newStatus = getStatusFromDecision(decision);

    await prisma.$transaction(async (tx) => {
      // Update article status
      await tx.article.update({
        where: { id: articleId },
        data: { status: newStatus },
      });

      // Create editorial decision record
      await tx.editorialDecision.create({
        data: {
          articleId,
          editorId: editor.id,
          decision,
          comments: decisionLetter.trim(),
          decidedAt: new Date(),
        },
      });

      // Build notification message
      let notificationMessage = `Editorial Decision for "${article.title}": ${decision.replace("_", " ")}.\n\n${decisionLetter.trim()}`;

      if (reviewerComments.length > 0) {
        notificationMessage += "\n\n--- Reviewer Comments ---\n";
        reviewerComments.forEach((rc) => {
          notificationMessage += `\nReviewer ${rc.reviewerNumber} (${rc.recommendation?.replace("_", " ") || "N/A"}):\n${rc.comments}\n`;
        });
      }

      // Notify author
      await tx.notification.create({
        data: {
          userId: latestSubmission.submittedBy,
          type: "editorial_decision",
          message: notificationMessage,
        },
      });
    });

    return NextResponse.json({ message: "Editorial decision recorded successfully" });
  } catch (error) {
    console.error("Make decision error:", error);
    return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
  }
}
