import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["REVIEWER", "ADMIN"];

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || !ALLOWED_ROLES.includes(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: { reviewerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!reviews.length) {
      return NextResponse.json({ reviews: [] });
    }

    const articleIds = Array.from(new Set(reviews.map((r) => r.articleId)));
    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        title: true,
        abstract: true,
        manuscriptUrl: true,
      },
    });

    const articleMap = new Map(articles.map((a) => [a.id, a]));

    const hydratedReviews = reviews.map((review) => ({
      ...review,
      article: articleMap.get(review.articleId) || null,
    }));

    return NextResponse.json({ reviews: hydratedReviews });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
