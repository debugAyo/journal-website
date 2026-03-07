import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = Number(searchParams.get("page")) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    if (!q.trim()) {
      return NextResponse.json({
        articles: [],
        total: 0,
        page,
        totalPages: 0,
      });
    }

    const whereClause = {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { abstract: { contains: q, mode: "insensitive" } },
        { keywords: { hasSome: [q] } },
      ],
    };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          abstract: true,
          keywords: true,
          publishedAt: true,
          doi: true,
        },
      }),
      prisma.article.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
