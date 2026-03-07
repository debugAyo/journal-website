import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["REVIEWER", "ADMIN"];

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ALLOWED_ROLES.includes(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
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

    if (review.status !== "INVITED") {
      return NextResponse.json({ error: "This review invitation is no longer pending" }, { status: 400 });
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

    await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { status: "ACCEPTED" },
      });

      // Notify reviewer
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "review_accepted",
          message: `You have accepted to review "${article?.title || "the article"}".`,
        },
      });

      // Notify editors
      if (editors.length > 0) {
        await tx.notification.createMany({
          data: editors.map((editor) => ({
            userId: editor.id,
            type: "reviewer_accepted",
            message: `${user.name} has accepted to review "${article?.title || "an article"}".`,
          })),
        });
      }
    });

    return NextResponse.json({ message: "Review invitation accepted" });
  } catch (error) {
    console.error("Accept review error:", error);
    return NextResponse.json({ error: "Failed to accept review" }, { status: 500 });
  }
}
