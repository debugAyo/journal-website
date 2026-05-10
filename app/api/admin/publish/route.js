import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { articleId, issueId, doi, pageStart, pageEnd, publishedUrl, showOnHomepage } = body;

    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    if (!issueId) {
      return NextResponse.json({ error: "issueId is required" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, status: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Only accepted articles can be published" },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Get all authors (submitters) for this article to notify
    const submissions = await prisma.submission.findMany({
      where: { articleId },
      select: { submittedBy: true },
    });

    const authorIds = Array.from(new Set(submissions.map((s) => s.submittedBy)));

    await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "PUBLISHED",
        issueId,
        doi: doi || null,
        pageStart: pageStart ? Number(pageStart) : null,
        pageEnd: pageEnd ? Number(pageEnd) : null,
        publishedUrl: publishedUrl || null,
        showOnHomepage: Boolean(showOnHomepage),
        publishedAt: new Date(),
      },
    });

    // Notify all authors outside the publish update to avoid transaction timeouts.
    if (authorIds.length > 0) {
      try {
        await prisma.notification.createMany({
          data: authorIds.map((authorId) => ({
            userId: authorId,
            type: "article_published",
            message: `Congratulations! Your article "${article.title}" has been published.${doi ? ` DOI: ${doi}` : ""}`,
          })),
        });
      } catch (notifyError) {
        console.error("Notification createMany failed:", notifyError);
      }
    }

    revalidatePath("/");
    revalidatePath("/issues");

    return NextResponse.json({ message: "Article published successfully" });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json({ error: "Failed to publish article" }, { status: 500 });
  }
}
