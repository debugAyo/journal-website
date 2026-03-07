import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: { submittedBy: user.id },
      orderBy: { createdAt: "desc" },
    });

    const articleIds = submissions.map((submission) => submission.articleId);
    const articles = articleIds.length
      ? await prisma.article.findMany({
          where: { id: { in: articleIds } },
        })
      : [];

    const articleMap = new Map(articles.map((article) => [article.id, article]));

    const hydratedSubmissions = submissions.map((submission) => ({
      ...submission,
      article: articleMap.get(submission.articleId) || null,
    }));

    return NextResponse.json({ submissions: hydratedSubmissions });
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}