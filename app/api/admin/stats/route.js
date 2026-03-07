import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalUsers,
      totalArticles,
      publishedArticles,
      featuredOnHomepage,
      pendingSubmissions,
      acceptedArticles,
      publishedArticleList,
    ] =
      await Promise.all([
        prisma.user.count(),
        prisma.article.count(),
        prisma.article.count({ where: { status: "PUBLISHED" } }),
        prisma.article.count({ where: { status: "PUBLISHED", showOnHomepage: true } }),
        prisma.article.count({ where: { status: "SUBMITTED" } }),
        prisma.article.findMany({
          where: { status: "ACCEPTED" },
          select: {
            id: true,
            title: true,
            submittedAt: true,
          },
          orderBy: { submittedAt: "desc" },
        }),
        prisma.article.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            title: true,
            publishedAt: true,
            showOnHomepage: true,
          },
          orderBy: { publishedAt: "desc" },
          take: 20,
        }),
      ]);

    return NextResponse.json({
      totalUsers,
      totalArticles,
      publishedArticles,
      featuredOnHomepage,
      pendingSubmissions,
      acceptedArticles,
      publishedArticleList,
    });
  } catch (error) {
    console.error("Fetch stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
