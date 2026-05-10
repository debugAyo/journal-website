import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { issueId, articleId } = body;

    if (!issueId || !articleId) {
      return NextResponse.json({ error: "issueId and articleId are required" }, { status: 400 });
    }

    const [issue, article] = await Promise.all([
      prisma.issue.findUnique({ where: { id: issueId } }),
      prisma.article.findUnique({ where: { id: articleId } }),
    ]);

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    if (!article || article.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Published article not found" }, { status: 404 });
    }

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: {
        issueId,
        featuredInIssue: false,
      },
    });

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error("Assign article error:", error);
    return NextResponse.json({ error: "Failed to assign article" }, { status: 500 });
  }
}
