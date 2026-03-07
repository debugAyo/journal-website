import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = user.role;
    let stats = {};
    let recentActivity = [];

    if (role === "AUTHOR" || role === "ADMIN" || role === "EDITOR") {
      // Get author stats
      const submissions = await prisma.submission.findMany({
        where: { submittedBy: user.id },
        select: { articleId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      const articleIds = submissions.map((s) => s.articleId);
      const articles = articleIds.length
        ? await prisma.article.findMany({
            where: { id: { in: articleIds } },
            select: { id: true, title: true, status: true },
          })
        : [];

      const articleMap = new Map(articles.map((a) => [a.id, a]));

      const mySubmissions = submissions.length;
      const underReview = articles.filter(
        (a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW"
      ).length;
      const published = articles.filter((a) => a.status === "PUBLISHED").length;

      stats = { mySubmissions, underReview, published };

      // Recent activity for authors
      recentActivity = submissions.slice(0, 5).map((s) => {
        const article = articleMap.get(s.articleId);
        return {
          type: "submission",
          title: article?.title || "Untitled",
          status: article?.status || "DRAFT",
          date: s.createdAt,
        };
      });
    }

    if (role === "REVIEWER") {
      const reviews = await prisma.review.findMany({
        where: { reviewerId: user.id },
        select: { id: true, status: true, createdAt: true, articleId: true },
        orderBy: { createdAt: "desc" },
      });

      const pendingInvitations = reviews.filter((r) => r.status === "INVITED").length;
      const activeReviews = reviews.filter((r) => r.status === "ACCEPTED").length;
      const completed = reviews.filter(
        (r) => r.status === "COMPLETED" || r.status === "DECLINED"
      ).length;

      stats = { pendingInvitations, activeReviews, completed };

      // Get article titles for recent activity
      const articleIds = reviews.slice(0, 5).map((r) => r.articleId);
      const articles = articleIds.length
        ? await prisma.article.findMany({
            where: { id: { in: articleIds } },
            select: { id: true, title: true },
          })
        : [];

      const articleMap = new Map(articles.map((a) => [a.id, a]));

      recentActivity = reviews.slice(0, 5).map((r) => ({
        type: "review",
        title: articleMap.get(r.articleId)?.title || "Untitled",
        status: r.status,
        date: r.createdAt,
      }));
    }

    if (role === "EDITOR") {
      const [newSubmissions, underReviewArticles, awaitingDecision] = await Promise.all([
        prisma.article.count({ where: { status: "SUBMITTED" } }),
        prisma.article.count({ where: { status: "UNDER_REVIEW" } }),
        prisma.article.count({ where: { status: "ACCEPTED" } }),
      ]);

      stats = {
        newSubmissions,
        underReview: underReviewArticles,
        awaitingDecision,
        ...(stats || {}),
      };
    }

    if (role === "ADMIN") {
      const [totalArticles, totalUsers, publishedArticles] = await Promise.all([
        prisma.article.count(),
        prisma.user.count(),
        prisma.article.count({ where: { status: "PUBLISHED" } }),
      ]);

      stats = {
        totalArticles,
        totalUsers,
        published: publishedArticles,
        ...(stats || {}),
      };
    }

    return NextResponse.json({ stats, recentActivity });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
