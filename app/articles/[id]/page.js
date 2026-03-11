import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CopyCitationButton from "./CopyCitationButton";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const article = await prisma.article.findUnique({
      where: { id, status: "PUBLISHED" },
      select: { title: true, abstract: true },
    });

    if (!article) return { title: "Article Not Found | UJ" };

    return {
      title: `${article.title} | UJ`,
      description: article.abstract?.slice(0, 155) || "",
      openGraph: {
        title: article.title,
        description: article.abstract?.slice(0, 155) || "",
        type: "article",
      },
    };
  } catch {
    return { title: "Article | UJ" };
  }
}

async function getArticleData(id) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article || article.status !== "PUBLISHED") {
      return null;
    }

    // Get issue and volume info
    let issue = null;
    let volume = null;
    if (article.issueId) {
      issue = await prisma.issue.findUnique({ where: { id: article.issueId } });
      if (issue) {
        volume = await prisma.volume.findUnique({ where: { id: issue.volumeId } });
      }
    }

    // Get authors from submissions
    const submissions = await prisma.submission.findMany({
      where: { articleId: id },
      orderBy: { revisionNumber: "asc" },
    });

    const userIds = Array.from(new Set(submissions.map((s) => s.submittedBy)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, affiliation: true, email: true },
    });

    // Parse co-authors from first submission notes
    let coAuthors = [];
    if (submissions[0]?.notes) {
      try {
        const notes = JSON.parse(submissions[0].notes);
        coAuthors = notes.coAuthors || [];
      } catch { }
    }

    const primaryAuthor = users[0];
    const authors = [
      { name: primaryAuthor?.name, affiliation: primaryAuthor?.affiliation, isCorresponding: true },
      ...coAuthors,
    ];

    return { article, issue, volume, authors };
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const data = await getArticleData(id);

  if (!data) {
    notFound();
  }

  const { article, issue, volume, authors } = data;

  // Generate citation
  const authorNames = authors.map((a) => a.name).filter(Boolean).join(", ");
  const year = article.publishedAt ? new Date(article.publishedAt).getFullYear() : "";
  const citation = `${authorNames} (${year}). ${article.title}. IJECCET${volume ? `, ${volume.volumeNumber}` : ""}${issue ? `(${issue.issueNumber})` : ""}${article.pageStart && article.pageEnd ? `, ${article.pageStart}-${article.pageEnd}` : ""}.${article.doi ? ` https://doi.org/${article.doi}` : ""}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/issues" className="hover:text-blue-600">Issues</Link>
          {volume && issue && (
            <>
              <span>/</span>
              <Link href={`/issues/${volume.volumeNumber}/${issue.issueNumber}`} className="hover:text-blue-600">
                Vol. {volume.volumeNumber}, Issue {issue.issueNumber}
              </Link>
            </>
          )}
        </nav>

        {/* Article Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">{article.title}</h1>

          {/* Authors */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Authors</h2>
            <div className="space-y-2">
              {authors.map((author, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {author.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">
                      {author.name}
                      {author.isCorresponding && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Corresponding
                        </span>
                      )}
                    </p>
                    {author.affiliation && (
                      <p className="text-gray-500 text-sm">{author.affiliation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publication Info */}
          <div className="flex flex-wrap gap-3 mb-6">
            {volume && issue && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Vol. {volume.volumeNumber}, Issue {issue.issueNumber}
              </span>
            )}
            {article.pageStart && article.pageEnd && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                Pages {article.pageStart}-{article.pageEnd}
              </span>
            )}
            {article.publishedAt && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(article.publishedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {article.doi && (
              <a
                href={`https://doi.org/${article.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                DOI: {article.doi}
              </a>
            )}
          </div>

          {/* Download Button */}
          {(article.publishedUrl || article.manuscriptUrl) && (
            <a
              href={(article.publishedUrl || article.manuscriptUrl).replace("/upload/", "/upload/fl_attachment/")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
          )}
        </header>

        {/* Abstract */}
        <section className="bg-white rounded-xl border border-gray-100 p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            Abstract
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">{article.abstract}</p>
        </section>

        {/* Keywords */}
        {article.keywords && article.keywords.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
              Keywords
            </h2>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((keyword, i) => (
                <Link
                  key={i}
                  href={`/search?q=${encodeURIComponent(keyword)}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors font-medium"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* How to Cite */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            How to Cite
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm font-mono text-gray-200 mb-4">
            {citation}
          </div>
          <CopyCitationButton citation={citation} />
        </section>
      </article>

      <Footer />
    </div>
  );
}
