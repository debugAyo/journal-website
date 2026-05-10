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
    const { issueId, articleId, featured } = body;

    if (!issueId || !articleId || typeof featured !== "boolean") {
      return NextResponse.json({ error: "issueId, articleId, and featured are required" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article || article.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Published article not found" }, { status: 404 });
    }

    if (article.issueId !== issueId) {
      return NextResponse.json({ error: "Article is not assigned to this issue" }, { status: 400 });
    }

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { featuredInIssue: featured },
    });

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error("Feature article error:", error);
    return NextResponse.json({ error: "Failed to update featured status" }, { status: 500 });
  }
}
