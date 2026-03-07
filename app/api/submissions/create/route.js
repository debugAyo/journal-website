import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_ARTICLE_TYPES = ["research", "review", "case_study", "short_communication"];

function getWordCount(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to submit" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      abstract,
      keywords,
      articleType,
      coAuthors,
      manuscriptUrl,
      coverLetterUrl,
      conflictOfInterest,
      fundingInfo,
      notesToEditor,
    } = body;

    // Validate required fields
    if (!title || !abstract || !keywords || !manuscriptUrl) {
      return NextResponse.json(
        { error: "Title, abstract, keywords and manuscript are required" },
        { status: 400 }
      );
    }

    const abstractWordCount = getWordCount(abstract);
    if (abstractWordCount < 150) {
      return NextResponse.json(
        { error: "Abstract must be at least 150 words" },
        { status: 400 }
      );
    }

    if (!VALID_ARTICLE_TYPES.includes(articleType)) {
      return NextResponse.json(
        { error: "Invalid article type" },
        { status: 400 }
      );
    }

    if (!Array.isArray(coAuthors)) {
      return NextResponse.json(
        { error: "coAuthors must be an array" },
        { status: 400 }
      );
    }

    const hasInvalidCoAuthor = coAuthors.some((coAuthor) => {
      if (!coAuthor || typeof coAuthor !== "object") {
        return true;
      }
      const hasName = typeof coAuthor.name === "string" && coAuthor.name.trim().length > 0;
      const hasEmail = typeof coAuthor.email === "string" && coAuthor.email.trim().length > 0;
      const hasAffiliation =
        coAuthor.affiliation === undefined || typeof coAuthor.affiliation === "string";
      const hasCorresponding = typeof coAuthor.isCorresponding === "boolean";
      return !(hasName && hasEmail && hasAffiliation && hasCorresponding);
    });

    if (hasInvalidCoAuthor) {
      return NextResponse.json(
        {
          error:
            "Each coAuthor must include name, email, affiliation, and isCorresponding fields.",
        },
        { status: 400 }
      );
    }

    // Find the logged in user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create the article
    const article = await prisma.article.create({
      data: {
        title: String(title).trim(),
        abstract: String(abstract).trim(),
        keywords: String(keywords)
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
        status: "SUBMITTED",
        manuscriptUrl,
        submittedAt: new Date(),
      },
    });

    // Create submission record
    await prisma.submission.create({
      data: {
        articleId: article.id,
        submittedBy: user.id,
        coverLetter: coverLetterUrl || null,
        notes: JSON.stringify({
          articleType,
          coAuthors,
          conflictOfInterest: conflictOfInterest || "",
          fundingInfo: fundingInfo || "",
          notesToEditor: notesToEditor || "",
        }),
        revisionNumber: 1,
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "submission_received",
        message: `Your manuscript "${title}" has been submitted successfully and is under editorial review.`,
      },
    });

    return NextResponse.json(
      {
        message: "Manuscript submitted successfully",
        articleId: article.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Submission failed. Please try again." },
      { status: 500 }
    );
  }
}
