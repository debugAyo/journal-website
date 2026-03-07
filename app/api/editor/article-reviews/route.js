import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["EDITOR", "ADMIN"];

export async function GET(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || !ALLOWED_ROLES.includes(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { articleId },
      orderBy: { createdAt: "asc" },
    });

    // Get reviewer names
    const reviewerIds = reviews.map((r) => r.reviewerId);
    const reviewers = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true },
    });

    const reviewerMap = new Map(reviewers.map((r) => [r.id, r.name]));

    const hydratedReviews = reviews.map((review) => ({
      ...review,
      reviewerName: reviewerMap.get(review.reviewerId) || "Unknown",
    }));

    return NextResponse.json({ reviews: hydratedReviews });
  } catch (error) {
    console.error("Fetch article reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
