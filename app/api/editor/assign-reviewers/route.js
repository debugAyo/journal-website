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
    const { articleId, reviewerIds, dueDate } = body;

    if (!articleId || !Array.isArray(reviewerIds) || reviewerIds.length === 0 || !dueDate) {
      return NextResponse.json(
        { error: "articleId, reviewerIds, and dueDate are required" },
        { status: 400 }
      );
    }

    const uniqueReviewerIds = Array.from(new Set(reviewerIds));
    if (uniqueReviewerIds.length < 2 || uniqueReviewerIds.length > 3) {
      return NextResponse.json(
        { error: "Please assign between 2 and 3 reviewers" },
        { status: 400 }
      );
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const reviewers = await prisma.user.findMany({
      where: {
        id: { in: uniqueReviewerIds },
        role: "REVIEWER",
      },
      select: { id: true },
    });

    if (reviewers.length !== uniqueReviewerIds.length) {
      return NextResponse.json(
        { error: "One or more reviewerIds are invalid" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.createMany({
        data: uniqueReviewerIds.map((reviewerId) => ({
          articleId,
          reviewerId,
          dueDate: parsedDueDate,
          status: "INVITED",
        })),
      });

      await tx.article.update({
        where: { id: articleId },
        data: { status: "UNDER_REVIEW" },
      });

      await tx.notification.createMany({
        data: uniqueReviewerIds.map((reviewerId) => ({
          userId: reviewerId,
          type: "review_invitation",
          message: `You have been invited to review the submission \"${article.title}\".`,
        })),
      });
    });

    return NextResponse.json({ message: "Reviewers assigned successfully" });
  } catch (error) {
    console.error("Assign reviewers error:", error);
    return NextResponse.json({ error: "Failed to assign reviewers" }, { status: 500 });
  }
}
