import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["EDITOR", "ADMIN"];
const ARTICLE_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
  "ACCEPTED",
  "REJECTED",
  "PUBLISHED",
];

function isAllowedRole(role) {
  return ALLOWED_ROLES.includes(role);
}

export async function GET(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || !isAllowedRole(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    if (statusFilter && !ARTICLE_STATUSES.includes(statusFilter)) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (!submissions.length) {
      return NextResponse.json({ submissions: [] });
    }

    const articleIds = Array.from(new Set(submissions.map((item) => item.articleId)));
    const userIds = Array.from(new Set(submissions.map((item) => item.submittedBy)));

    const [articles, users, reviews] = await Promise.all([
      prisma.article.findMany({
        where: {
          id: { in: articleIds },
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          affiliation: true,
        },
      }),
      prisma.review.findMany({
        where: { articleId: { in: articleIds } },
        select: {
          articleId: true,
          status: true,
          dueDate: true,
        },
      }),
    ]);

    const articleMap = new Map(articles.map((article) => [article.id, article]));
    const userMap = new Map(users.map((user) => [user.id, user]));

    const reviewSummaryByArticleId = reviews.reduce((acc, review) => {
      const summary = acc.get(review.articleId) || {
        reviewCount: 0,
        completedReviewCount: 0,
        latestDueDate: null,
      };

      summary.reviewCount += 1;
      if (review.status === "COMPLETED") {
        summary.completedReviewCount += 1;
      }
      if (review.dueDate && (!summary.latestDueDate || review.dueDate > summary.latestDueDate)) {
        summary.latestDueDate = review.dueDate;
      }

      acc.set(review.articleId, summary);
      return acc;
    }, new Map());

    const hydratedSubmissions = submissions
      .map((submission) => {
        const article = articleMap.get(submission.articleId);
        if (!article) {
          return null;
        }

        const reviewSummary = reviewSummaryByArticleId.get(submission.articleId) || {
          reviewCount: 0,
          completedReviewCount: 0,
          latestDueDate: null,
        };

        return {
          ...submission,
          article,
          user: userMap.get(submission.submittedBy) || null,
          reviewCount: reviewSummary.reviewCount,
          completedReviewCount: reviewSummary.completedReviewCount,
          latestDueDate: reviewSummary.latestDueDate,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ submissions: hydratedSubmissions });
  } catch (error) {
    console.error("Editor submissions error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
