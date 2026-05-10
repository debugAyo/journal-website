import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const issues = await prisma.issue.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    // Get volume data
    const volumeIds = Array.from(new Set(issues.map((i) => i.volumeId)));
    const volumes = await prisma.volume.findMany({
      where: { id: { in: volumeIds } },
    });

    const volumeMap = new Map(volumes.map((v) => [v.id, v]));

    // Get article counts
    const issueIds = issues.map((i) => i.id);
    const articleCounts = await prisma.article.groupBy({
      by: ["issueId"],
      where: { issueId: { in: issueIds } },
      _count: { id: true },
    });

    const articleCountMap = new Map(
      articleCounts.map((ac) => [ac.issueId, ac._count.id])
    );

    const hydratedIssues = issues.map((issue) => ({
      ...issue,
      volume: volumeMap.get(issue.volumeId) || null,
      articleCount: articleCountMap.get(issue.id) || 0,
    }));

    return NextResponse.json({ issues: hydratedIssues });
  } catch (error) {
    console.error("Fetch issues error:", error);
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { volumeId, issueNumber, title, publishedAt, issuePdfUrl } = body;

    if (!volumeId) {
      return NextResponse.json({ error: "volumeId is required" }, { status: 400 });
    }

    if (!issueNumber || typeof issueNumber !== "number") {
      return NextResponse.json({ error: "issueNumber is required" }, { status: 400 });
    }

    const volume = await prisma.volume.findUnique({
      where: { id: volumeId },
    });

    if (!volume) {
      return NextResponse.json({ error: "Volume not found" }, { status: 404 });
    }

    // Check if issue number already exists for this volume
    const existing = await prisma.issue.findFirst({
      where: { volumeId, issueNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Issue ${issueNumber} already exists in this volume` },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.create({
      data: {
        volumeId,
        issueNumber,
        title: title || null,
        issuePdfUrl: issuePdfUrl || null,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    console.error("Create issue error:", error);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { issueId, issueNumber, title, publishedAt, issuePdfUrl } = body;

    if (!issueId) {
      return NextResponse.json({ error: "issueId is required" }, { status: 400 });
    }

    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    if (issueNumber && typeof issueNumber === "number") {
      const existing = await prisma.issue.findFirst({
        where: {
          volumeId: issue.volumeId,
          issueNumber,
          id: { not: issueId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `Issue ${issueNumber} already exists in this volume` },
          { status: 400 }
        );
      }
    }

    const publishedAtValue =
      publishedAt === undefined ? issue.publishedAt : (publishedAt ? new Date(publishedAt) : null);

    const updated = await prisma.issue.update({
      where: { id: issueId },
      data: {
        issueNumber: issueNumber ?? issue.issueNumber,
        title: title ?? issue.title,
        issuePdfUrl: issuePdfUrl ?? issue.issuePdfUrl,
        publishedAt: publishedAtValue,
      },
    });

    return NextResponse.json({ issue: updated });
  } catch (error) {
    console.error("Update issue error:", error);
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}
