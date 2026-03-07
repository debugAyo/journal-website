"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingArticleId, setUpdatingArticleId] = useState(null);
  const loadStats = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load admin stats");
      setStats(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load admin stats");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, []);


  const isAdmin = session?.user?.role === "ADMIN";

  const toggleHomepageFeature = async (articleId, nextValue) => {
    setUpdatingArticleId(articleId);
    setError("");

    try {
      const res = await fetch("/api/admin/homepage-feature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, showOnHomepage: nextValue }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update homepage visibility");
      }

      await loadStats(false);
    } catch (err) {
      setError(err.message || "Failed to update homepage visibility");
    } finally {
      setUpdatingArticleId(null);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated" && !isAdmin) {
      router.push("/dashboard");
      return;
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (status !== "authenticated" || !isAdmin) return;

    loadStats(true);

    // Keep dashboard fresh when publication state changes.
    const intervalId = setInterval(() => loadStats(false), 15000);
    const onFocus = () => loadStats(false);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, isAdmin, loadStats]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading admin dashboard...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[var(--gray-50)] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--gray-900)]">Admin Dashboard</h1>
          <p className="text-[var(--gray-500)] mt-1">Manage the journal system and homepage curation</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
            <p className="text-sm text-[var(--gray-500)]">Total Users</p>
            <p className="text-3xl font-bold text-[var(--gray-900)]">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
            <p className="text-sm text-[var(--gray-500)]">Total Articles</p>
            <p className="text-3xl font-bold text-[var(--gray-900)]">{stats?.totalArticles || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
            <p className="text-sm text-[var(--gray-500)]">Published</p>
            <p className="text-3xl font-bold text-green-600">{stats?.publishedArticles || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
            <p className="text-sm text-[var(--gray-500)]">Featured Home</p>
            <p className="text-3xl font-bold text-[var(--primary-700)]">{stats?.featuredOnHomepage || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
            <p className="text-sm text-[var(--gray-500)]">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600">{stats?.pendingSubmissions || 0}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/dashboard/admin/issues"
            className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white rounded-xl p-6 flex items-center gap-4 transition"
          >
            <span className="text-3xl">📚</span>
            <div>
              <p className="font-semibold">Manage Issues</p>
              <p className="text-sm opacity-80">Create volumes and issues</p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/users"
            className="bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white rounded-xl p-6 flex items-center gap-4 transition"
          >
            <span className="text-3xl">👥</span>
            <div>
              <p className="font-semibold">Manage Users</p>
              <p className="text-sm opacity-80">Change user roles</p>
            </div>
          </Link>
          <Link
            href="/dashboard/editor"
            className="bg-[var(--gray-700)] hover:bg-[var(--gray-800)] text-white rounded-xl p-6 flex items-center gap-4 transition"
          >
            <span className="text-3xl">📝</span>
            <div>
              <p className="font-semibold">Editorial Dashboard</p>
              <p className="text-sm opacity-80">Manage submissions</p>
            </div>
          </Link>
        </div>

        {/* Accepted Articles Awaiting Publication */}
        <div className="bg-white rounded-xl border border-[var(--gray-200)] overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Accepted Articles Awaiting Publication
            </h2>
          </div>

          {(stats?.acceptedArticles || []).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No accepted articles awaiting publication.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Title</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Submitted</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(stats?.acceptedArticles || []).map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{article.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {article.submittedAt
                        ? new Date(article.submittedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/admin/publish/${article.id}`}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                      >
                        Publish
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[var(--gray-200)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--gray-200)]">
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">Homepage Featured Articles</h2>
            <p className="text-sm text-[var(--gray-500)] mt-1">
              Select which published articles appear in the homepage Featured Articles section.
            </p>
          </div>

          {(stats?.publishedArticleList || []).length === 0 ? (
            <div className="p-8 text-center text-[var(--gray-500)]">No published articles found.</div>
          ) : (
            <div className="divide-y divide-[var(--gray-100)]">
              {(stats?.publishedArticleList || []).map((article) => (
                <div key={article.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="font-medium text-[var(--gray-900)]">{article.title}</p>
                    <p className="text-sm text-[var(--gray-500)] mt-1">
                      Published: {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) : "-"}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleHomepageFeature(article.id, !article.showOnHomepage)}
                    disabled={updatingArticleId === article.id}
                    className={`text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60 ${
                      article.showOnHomepage
                        ? "bg-[var(--primary-50)] text-[var(--primary-700)] border border-[var(--primary-200)]"
                        : "bg-[var(--gray-100)] text-[var(--gray-700)] border border-[var(--gray-300)]"
                    }`}
                  >
                    {updatingArticleId === article.id
                      ? "Updating..."
                      : article.showOnHomepage
                      ? "Featured on Homepage"
                      : "Not Featured"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
