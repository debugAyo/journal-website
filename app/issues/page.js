import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Browse Issues | IJECCET",
  description: "Browse all volumes and issues of IJECCET",
};

async function getVolumesWithIssues() {
  try {
    const volumes = await prisma.volume.findMany({
      orderBy: { year: "desc" },
    });

    const issues = await prisma.issue.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { issueNumber: "asc" },
    });

    // Get article counts
    const issueIds = issues.map((i) => i.id);
    const articleCounts = await prisma.article.groupBy({
      by: ["issueId"],
      where: { issueId: { in: issueIds }, status: "PUBLISHED" },
      _count: { id: true },
    });

    const articleCountMap = new Map(articleCounts.map((ac) => [ac.issueId, ac._count.id]));

    const issuesByVolume = issues.reduce((acc, issue) => {
      if (!acc[issue.volumeId]) acc[issue.volumeId] = [];
      acc[issue.volumeId].push({
        ...issue,
        articleCount: articleCountMap.get(issue.id) || 0,
      });
      return acc;
    }, {});

    return volumes.map((volume) => ({
      ...volume,
      issues: issuesByVolume[volume.id] || [],
    }));
  } catch (error) {
    console.error("Error fetching volumes:", error);
    return [];
  }
}

export default async function IssuesPage() {
  const volumes = await getVolumesWithIssues();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_140%_at_8%_0%,#1f6d68_0%,#124543_48%,#1f1b17_100%)] text-white py-16">
        <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-[#7dc4bd]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#d5a66a]/20 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Browse Issues</h1>
          <p className="text-white/80 text-lg">
            Explore all published volumes and issues of IJECCET
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {volumes.length === 0 ? (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center shadow-sm">
            <span className="text-5xl block mb-4">📚</span>
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">No Issues Yet</h3>
            <p className="text-[var(--gray-500)] mb-6">Check back soon for published issues.</p>
            <Link href="/dashboard/submit" className="inline-flex rounded-lg bg-[var(--primary-600)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-700)]">
              Submit Your Research
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {volumes.map((volume) => (
              <div key={volume.id} className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm transition-shadow hover:shadow-lg">
                <div className="border-b border-[var(--gray-200)] bg-[linear-gradient(120deg,#ffffff_0%,#f5f0e8_100%)] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--gray-900)]">
                      <svg className="w-5 h-5 text-[var(--primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Volume {volume.volumeNumber}
                    </h2>
                    <span className="rounded-full border border-[var(--gray-300)] bg-white px-3 py-1 text-sm font-medium text-[var(--gray-600)]">
                      {volume.year}
                    </span>
                  </div>
                </div>

                {volume.issues.length > 0 ? (
                  <div className="divide-y divide-[var(--gray-200)]">
                    {volume.issues.map((issue) => (
                      <Link
                        key={issue.id}
                        href={`/issues/${volume.volumeNumber}/${issue.issueNumber}`}
                        className="group flex items-center justify-between px-6 py-5 transition-colors hover:bg-[var(--primary-50)]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-100)] transition-colors group-hover:bg-[var(--primary-600)]">
                            <span className="font-bold text-[var(--primary-700)] transition-colors group-hover:text-white">
                              {issue.issueNumber}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--gray-900)] transition-colors group-hover:text-[var(--primary-700)]">
                              Issue {issue.issueNumber}
                              {issue.title && `: ${issue.title}`}
                            </p>
                            <p className="mt-0.5 flex items-center gap-2 text-sm text-[var(--gray-500)]">
                              <span>{issue.articleCount} articles</span>
                              <span>•</span>
                              <span>
                                {issue.publishedAt &&
                                  new Date(issue.publishedAt).toLocaleDateString("en-GB", {
                                    month: "long",
                                    year: "numeric",
                                  })}
                              </span>
                            </p>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-[var(--gray-400)] transition-all group-hover:translate-x-1 group-hover:text-[var(--primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-[var(--gray-500)]">
                    <p>No issues published in this volume yet.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
