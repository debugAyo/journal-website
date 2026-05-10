import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const volumes = await prisma.volume.findMany({
      orderBy: { year: "desc" },
    });

    // Get issues for each volume
    const volumeIds = volumes.map((v) => v.id);
    const issues = await prisma.issue.findMany({
      where: { volumeId: { in: volumeIds } },
      orderBy: { issueNumber: "asc" },
    });

    // Get article counts per issue
    const issueIds = issues.map((i) => i.id);
    const articleCounts = await prisma.article.groupBy({
      by: ["issueId"],
      where: { issueId: { in: issueIds } },
      _count: { id: true },
    });

    const articleCountMap = new Map(
      articleCounts.map((ac) => [ac.issueId, ac._count.id])
    );

    const issuesByVolume = issues.reduce((acc, issue) => {
      if (!acc[issue.volumeId]) acc[issue.volumeId] = [];
      acc[issue.volumeId].push({
        ...issue,
        articleCount: articleCountMap.get(issue.id) || 0,
      });
      return acc;
    }, {});

    const hydratedVolumes = volumes.map((volume) => ({
      ...volume,
      issues: issuesByVolume[volume.id] || [],
      issueCount: (issuesByVolume[volume.id] || []).length,
      articleCount: (issuesByVolume[volume.id] || []).reduce(
        (sum, issue) => sum + (issue.articleCount || 0),
        0
      ),
    }));

    return NextResponse.json({ volumes: hydratedVolumes });
  } catch (error) {
    console.error("Fetch volumes error:", error);
    return NextResponse.json({ error: "Failed to fetch volumes" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { volumeNumber, year } = body;

    if (!volumeNumber || typeof volumeNumber !== "number") {
      return NextResponse.json({ error: "volumeNumber is required" }, { status: 400 });
    }

    if (!year || typeof year !== "number") {
      return NextResponse.json({ error: "year is required" }, { status: 400 });
    }

    const existing = await prisma.volume.findUnique({
      where: { volumeNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Volume ${volumeNumber} already exists` },
        { status: 400 }
      );
    }

    const volume = await prisma.volume.create({
      data: { volumeNumber, year },
    });

    return NextResponse.json({ volume }, { status: 201 });
  } catch (error) {
    console.error("Create volume error:", error);
    return NextResponse.json({ error: "Failed to create volume" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { volumeId, volumeNumber, year } = body;

    if (!volumeId) {
      return NextResponse.json({ error: "volumeId is required" }, { status: 400 });
    }

    const volume = await prisma.volume.findUnique({ where: { id: volumeId } });
    if (!volume) {
      return NextResponse.json({ error: "Volume not found" }, { status: 404 });
    }

    if (volumeNumber && typeof volumeNumber === "number") {
      const existing = await prisma.volume.findUnique({ where: { volumeNumber } });
      if (existing && existing.id !== volumeId) {
        return NextResponse.json(
          { error: `Volume ${volumeNumber} already exists` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.volume.update({
      where: { id: volumeId },
      data: {
        volumeNumber: volumeNumber ?? volume.volumeNumber,
        year: year ?? volume.year,
      },
    });

    return NextResponse.json({ volume: updated });
  } catch (error) {
    console.error("Update volume error:", error);
    return NextResponse.json({ error: "Failed to update volume" }, { status: 500 });
  }
}
