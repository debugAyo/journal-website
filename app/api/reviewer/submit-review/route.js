import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["REVIEWER", "ADMIN"];
const VALID_RECOMMENDATIONS = ["ACCEPT", "MINOR_REVISION", "MAJOR_REVISION", "REJECT"];

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ALLOWED_ROLES.includes(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { reviewId, recommendation, commentsToEditor, commentsToAuthor, qualityRatings } = body;

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    if (!recommendation || !VALID_RECOMMENDATIONS.includes(recommendation)) {
      return NextResponse.json(
        { error: "Valid recommendation is required (ACCEPT, MINOR_REVISION, MAJOR_REVISION, REJECT)" },
        { status: 400 }
      );
    }

    if (!commentsToEditor || !commentsToEditor.trim()) {
      return NextResponse.json({ error: "Comments to editor are required" }, { status: 400 });
    }

    if (!commentsToAuthor || !commentsToAuthor.trim()) {
      return NextResponse.json({ error: "Comments to author are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.reviewerId !== user.id) {
      return NextResponse.json({ error: "You are not assigned to this review" }, { status: 403 });
    }

    if (review.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "You must accept the review invitation before submitting" },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: review.articleId },
      select: { title: true },
    });

    // Find editors to notify
    const editors = await prisma.user.findMany({
      where: { role: { in: ["EDITOR", "ADMIN"] } },
      select: { id: true },
    });

    // Check if all reviews for this article will be completed after this one
    const allReviewsForArticle = await prisma.review.findMany({
      where: { articleId: review.articleId },
    });

    const willAllBeCompleted = allReviewsForArticle.every(
      (r) => r.id === reviewId || r.status === "COMPLETED" || r.status === "DECLINED"
    );

    await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: {
          status: "COMPLETED",
          recommendation,
          commentsToEditor: commentsToEditor.trim(),
          commentsToAuthor: commentsToAuthor.trim(),
          qualityRatings: qualityRatings || null,
          submittedAt: new Date(),
        },
      });

      // Notify editors that review has been submitted
      if (editors.length > 0) {
        await tx.notification.createMany({
          data: editors.map((editor) => ({
            userId: editor.id,
            type: "review_submitted",
            message: `A review has been submitted for "${article?.title || "an article"}" with recommendation: ${recommendation.replace("_", " ")}.`,
          })),
        });
      }

      // If all reviews completed, send additional notification
      if (willAllBeCompleted && editors.length > 0) {
        await tx.notification.createMany({
          data: editors.map((editor) => ({
            userId: editor.id,
            type: "all_reviews_completed",
            message: `All reviews for "${article?.title || "an article"}" are now complete. Ready for editorial decision.`,
          })),
        });
      }
    });

    return NextResponse.json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
