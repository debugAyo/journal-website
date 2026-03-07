import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["EDITOR", "ADMIN"];

function hasEditorAccess(role) {
  return ALLOWED_ROLES.includes(role);
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || !hasEditorAccess(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reviewers = await prisma.user.findMany({
      where: { role: "REVIEWER" },
      select: {
        id: true,
        name: true,
        email: true,
        affiliation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!reviewers.length) {
      return NextResponse.json({ reviewers: [] });
    }

    const reviewerIds = reviewers.map((reviewer) => reviewer.id);
    const activeReviews = await prisma.review.findMany({
      where: {
        reviewerId: { in: reviewerIds },
        status: { in: ["INVITED", "ACCEPTED"] },
      },
      select: {
        reviewerId: true,
      },
    });

    const activeReviewCounts = activeReviews.reduce((acc, review) => {
      const currentCount = acc.get(review.reviewerId) || 0;
      acc.set(review.reviewerId, currentCount + 1);
      return acc;
    }, new Map());

    const payload = reviewers.map((reviewer) => ({
      id: reviewer.id,
      name: reviewer.name,
      email: reviewer.email,
      affiliation: reviewer.affiliation,
      activeReviewCount: activeReviewCounts.get(reviewer.id) || 0,
    }));

    return NextResponse.json({ reviewers: payload });
  } catch (error) {
    console.error("Fetch reviewers error:", error);
    return NextResponse.json({ error: "Failed to fetch reviewers" }, { status: 500 });
  }
}
