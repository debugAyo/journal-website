import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }) {
  const { volume, issue } = await params;
  return {
    title: `Volume ${volume}, Issue ${issue} | IJECCET`,
    description: `Table of contents for Volume ${volume}, Issue ${issue} of IJECCET`,
  };
}

async function getIssueData(volumeNumber, issueNumber) {
  try {
    const volume = await prisma.volume.findUnique({
      where: { volumeNumber: Number(volumeNumber) },
    });

    if (!volume) return null;

    const issue = await prisma.issue.findFirst({
      where: { volumeId: volume.id, issueNumber: Number(issueNumber) },
    });

    if (!issue) return null;

    const articles = await prisma.article.findMany({
      where: { issueId: issue.id, status: "PUBLISHED" },
      orderBy: { pageStart: "asc" },
    });

    // Get submission info for authors
    const articleIds = articles.map((a) => a.id);
    const submissions = await prisma.submission.findMany({
      where: { articleId: { in: articleIds } },
      orderBy: { revisionNumber: "asc" },
    });

    const userIds = Array.from(new Set(submissions.map((s) => s.submittedBy)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const authorsByArticle = submissions.reduce((acc, sub) => {
      if (!acc[sub.articleId]) acc[sub.articleId] = [];
      const name = userMap.get(sub.submittedBy);
      if (name && !acc[sub.articleId].includes(name)) {
        acc[sub.articleId].push(name);
      }
      return acc;
    }, {});

    return {
      volume,
      issue,
      articles: articles.map((a) => ({
        ...a,
        authors: authorsByArticle[a.id] || [],
      })),
    };
  } catch (error) {
    console.error("Error fetching issue:", error);
    return null;
  }
}

export default async function IssuePage({ params }) {
  const { volume, issue } = await params;
  const data = await getIssueData(volume, issue);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />

      <section className="relative overflow-hidden bg-[radial-gradient(120%_140%_at_8%_0%,#1f6d68_0%,#124543_48%,#1f1b17_100%)] py-16 text-white">
        <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-[#7dc4bd]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#d5a66a]/20 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Volume {data.volume.volumeNumber}, Issue {data.issue.issueNumber}
          </h1>
          {data.issue.title && (
            <p className="mx-auto max-w-2xl text-lg text-white/80">{data.issue.title}</p>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-4">
          <Link href="/issues" className="text-sm font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]">
            ← Back to Issues
          </Link>
        </div>

        <div className="mb-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
          <h2 className="mb-2 text-2xl font-bold text-[var(--gray-900)]">
            Volume {data.volume.volumeNumber}, Issue {data.issue.issueNumber}
          </h2>
          {data.issue.title && (
            <p className="mb-2 text-lg text-[var(--gray-600)]">{data.issue.title}</p>
          )}
          <p className="text-[var(--gray-500)]">
            Published:{" "}
            {data.issue.publishedAt &&
              new Date(data.issue.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
          </p>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-[var(--gray-900)]">Table of Contents</h2>

        {data.articles.length === 0 ? (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center text-[var(--gray-500)] shadow-sm">
            No articles in this issue.
          </div>
        ) : (
          <div className="space-y-4">
            {data.articles.map((article) => (
              <div key={article.id} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm transition-shadow hover:shadow-md">
                <Link
                  href={`/articles/${article.id}`}
                  className="mb-2 block text-lg font-semibold text-[var(--gray-900)] hover:text-[var(--primary-700)]"
                >
                  {article.title}
                </Link>
                <p className="mb-2 text-sm text-[var(--gray-600)]">
                  {article.authors.join(", ") || "Anonymous"}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--gray-500)]">
                  {article.pageStart && article.pageEnd && (
                    <span>Pages {article.pageStart}-{article.pageEnd}</span>
                  )}
                  {article.doi && (
                    <a
                      href={`https://doi.org/${article.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                    >
                      DOI: {article.doi}
                    </a>
                  )}
                  {(article.publishedUrl || article.manuscriptUrl) && (
                    <a
                      href={article.publishedUrl || article.manuscriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-[var(--primary-600)] px-3 py-1 text-xs font-medium text-white transition hover:bg-[var(--primary-700)]"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
