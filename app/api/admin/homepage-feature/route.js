import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function PATCH(req) {
  try {
    const session = await auth();

    if (!session?.user?.email || session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { articleId, showOnHomepage } = body;

    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    if (typeof showOnHomepage !== "boolean") {
      return NextResponse.json({ error: "showOnHomepage must be a boolean" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Only published articles can be featured on homepage" },
        { status: 400 }
      );
    }

    await prisma.article.update({
      where: { id: articleId },
      data: { showOnHomepage },
    });

    revalidatePath("/");

    return NextResponse.json({ message: "Homepage feature updated" });
  } catch (error) {
    console.error("Homepage feature update error:", error);
    return NextResponse.json({ error: "Failed to update homepage feature" }, { status: 500 });
  }
}
