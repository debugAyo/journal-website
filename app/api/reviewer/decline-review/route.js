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
        data: { status: "DECLINED" },
      });

      // Notify editors that reviewer declined so they can find replacement
      if (editors.length > 0) {
        await tx.notification.createMany({
          data: editors.map((editor) => ({
            userId: editor.id,
            type: "reviewer_declined",
            message: `${user.name} has declined to review "${article?.title || "an article"}". Please assign a replacement reviewer.`,
          })),
        });
      }
    });

    return NextResponse.json({ message: "Review invitation declined" });
  } catch (error) {
    console.error("Decline review error:", error);
    return NextResponse.json({ error: "Failed to decline review" }, { status: 500 });
  }
}
