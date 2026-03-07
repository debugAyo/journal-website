"use client";

import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageShell />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const doSearch = useCallback(async (searchQuery, searchPage = 1) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&page=${searchPage}`);
      const data = await res.json();
      setResults(data.articles || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setPage(data.page || 1);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
    doSearch(query);
  };

  const handlePageChange = (newPage) => {
    doSearch(query, newPage);
    router.push(`/search?q=${encodeURIComponent(query)}&page=${newPage}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <Header />

      {/* Search Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_140%_at_8%_0%,#1f6d68_0%,#124543_48%,#1f1b17_100%)] text-white py-16">
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[#7dc4bd]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-[#d5a66a]/20 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Search Articles</h1>
          
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, abstract, or keywords..."
                className="w-full rounded-xl border border-[var(--card-border)] bg-white pl-12 pr-32 py-4 text-lg text-[var(--gray-900)] shadow-lg outline-none focus:border-[var(--primary-300)] focus:ring-2 focus:ring-[var(--primary-200)]"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[var(--primary-600)] px-6 py-2.5 font-medium text-white transition hover:bg-[var(--primary-700)]"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <div className="skeleton h-6 w-3/4 mb-3"></div>
                <div className="skeleton h-4 w-full mb-2"></div>
                <div className="skeleton h-4 w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {total > 0 && (
              <div className="mb-6 flex items-center justify-between">
                <p className="text-[var(--gray-600)]">
                  Found <span className="font-semibold text-[var(--gray-900)]">{total}</span> result{total !== 1 ? "s" : ""} for{" "}
                  <span className="font-semibold text-[var(--primary-700)]">&ldquo;{initialQuery}&rdquo;</span>
                </p>
              </div>
            )}

            {results.length === 0 && initialQuery && !loading && (
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center shadow-sm">
                <span className="text-5xl block mb-4">🔍</span>
                <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">No Results Found</h3>
                <p className="text-[var(--gray-500)] mb-6">
                  We couldn&apos;t find any articles matching &ldquo;{initialQuery}&rdquo;
                </p>
                <div className="text-sm text-[var(--gray-500)]">
                  <p className="mb-2">Try:</p>
                  <ul className="list-disc list-inside text-left max-w-xs mx-auto">
                    <li>Using different keywords</li>
                    <li>Checking your spelling</li>
                    <li>Using more general terms</li>
                  </ul>
                </div>
              </div>
            )}

            {!initialQuery && !loading && (
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center shadow-sm">
                <span className="text-5xl block mb-4">📚</span>
                <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">Start Searching</h3>
                <p className="text-[var(--gray-500)]">
                  Enter a keyword to search through our published articles
                </p>
              </div>
            )}

            <div className="space-y-4">
              {results.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="group block rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary-200)] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="mb-2 text-lg font-semibold text-[var(--gray-900)] transition-colors group-hover:text-[var(--primary-700)]">
                      {article.title}
                    </h2>
                    <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[var(--gray-300)] transition-all group-hover:translate-x-1 group-hover:text-[var(--primary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="mb-4 line-clamp-2 text-sm text-[var(--gray-600)]">
                    {article.abstract?.slice(0, 200)}...
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {article.keywords?.slice(0, 4).map((keyword, i) => (
                      <span
                        key={i}
                        className="rounded-lg border border-[var(--primary-200)] bg-[var(--primary-50)] px-2.5 py-1 text-xs font-medium text-[var(--primary-700)]"
                      >
                        {keyword}
                      </span>
                    ))}
                    {article.keywords?.length > 4 && (
                      <span className="text-xs text-[var(--gray-400)]">+{article.keywords.length - 4} more</span>
                    )}
                    {article.publishedAt && (
                      <span className="ml-auto text-xs text-[var(--gray-400)]">
                        {new Date(article.publishedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-[var(--gray-200)] bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--gray-50)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <div className="flex items-center gap-1 px-4">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                          page === pageNum
                            ? "bg-[var(--primary-600)] text-white"
                            : "border border-[var(--gray-200)] bg-white text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-lg border border-[var(--gray-200)] bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--gray-50)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

function SearchPageShell() {
  return <div className="min-h-screen bg-[var(--background)]" />;
}
