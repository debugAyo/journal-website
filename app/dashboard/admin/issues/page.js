"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ErrorBanner from "@/app/dashboard/ErrorBanner";

export default function AdminIssuesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(null); // volumeId or null
  const [showEditVolumeModal, setShowEditVolumeModal] = useState(false);
  const [showEditIssueModal, setShowEditIssueModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issuePdfUploading, setIssuePdfUploading] = useState(false);
  const [issuePdfProgress, setIssuePdfProgress] = useState(0);
  const [assigningArticleId, setAssigningArticleId] = useState("");
  const [updatingFeaturedId, setUpdatingFeaturedId] = useState(null);

  const [volumeForm, setVolumeForm] = useState({ volumeNumber: "", year: "" });
  const [issueForm, setIssueForm] = useState({ issueNumber: "", title: "", publishedAt: "", issuePdfUrl: "" });
  const [volumeEditForm, setVolumeEditForm] = useState({ id: "", volumeNumber: "", year: "" });
  const [issueEditForm, setIssueEditForm] = useState({ id: "", issueNumber: "", title: "", publishedAt: "", issuePdfUrl: "" });

  const isAdmin = session?.user?.role === "ADMIN";

  const formatDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const getIssueLabel = (issueId) => {
    if (!issueId) return "";
    for (const volume of volumes) {
      const match = (volume.issues || []).find((issue) => issue.id === issueId);
      if (match) {
        return `Vol ${volume.volumeNumber}, Issue ${match.issueNumber}`;
      }
    }
    return "";
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

  const loadData = async () => {
    try {
      const [volumesRes, articlesRes] = await Promise.all([
        fetch("/api/admin/volumes"),
        fetch("/api/admin/articles"),
      ]);

      const volumesData = await volumesRes.json();
      const articlesData = await articlesRes.json();

      if (!volumesRes.ok) throw new Error(volumesData.error);
      if (!articlesRes.ok) throw new Error(articlesData.error);

      setVolumes(volumesData.volumes || []);
      setArticles(articlesData.articles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setArticlesLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated" || !isAdmin) return;
    loadData();
  }, [status, isAdmin]);

  const handleCreateVolume = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/volumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumeNumber: Number(volumeForm.volumeNumber),
          year: Number(volumeForm.year),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await loadData();
      setShowVolumeModal(false);
      setVolumeForm({ volumeNumber: "", year: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumeId: showIssueModal,
          issueNumber: Number(issueForm.issueNumber),
          title: issueForm.title || null,
          publishedAt: issueForm.publishedAt || null,
          issuePdfUrl: issueForm.issuePdfUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await loadData();
      setShowIssueModal(null);
      setIssueForm({ issueNumber: "", title: "", publishedAt: "", issuePdfUrl: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditVolume = (volume) => {
    setVolumeEditForm({
      id: volume.id,
      volumeNumber: String(volume.volumeNumber ?? ""),
      year: String(volume.year ?? ""),
    });
    setShowEditVolumeModal(true);
  };

  const openEditIssue = (issue) => {
    setIssueEditForm({
      id: issue.id,
      issueNumber: String(issue.issueNumber ?? ""),
      title: issue.title || "",
      publishedAt: formatDateInput(issue.publishedAt),
      issuePdfUrl: issue.issuePdfUrl || "",
    });
    setAssigningArticleId("");
    setShowEditIssueModal(true);
  };

  const handleUpdateVolume = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/volumes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumeId: volumeEditForm.id,
          volumeNumber: Number(volumeEditForm.volumeNumber),
          year: Number(volumeEditForm.year),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await loadData();
      setShowEditVolumeModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateIssue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/issues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issueEditForm.id,
          issueNumber: Number(issueEditForm.issueNumber),
          title: issueEditForm.title || null,
          publishedAt: issueEditForm.publishedAt || null,
          issuePdfUrl: issueEditForm.issuePdfUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await loadData();
      setShowEditIssueModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignArticle = async () => {
    if (!assigningArticleId) {
      setError("Select an article to assign.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/issues/assign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issueEditForm.id,
          articleId: assigningArticleId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await loadData();
      setAssigningArticleId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (articleId, nextValue) => {
    setUpdatingFeaturedId(articleId);
    setError("");

    try {
      const res = await fetch("/api/admin/issues/feature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issueEditForm.id,
          articleId,
          featured: nextValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingFeaturedId(null);
    }
  };

  const handleIssuePdfUpload = async (e, setForm) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files are allowed for issue uploads.");
      e.target.value = "";
      return;
    }

    setError("");
    setIssuePdfUploading(true);
    setIssuePdfProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setIssuePdfProgress(percent);
          }
        };

        xhr.onload = () => {
          let parsed;
          try {
            parsed = JSON.parse(xhr.responseText || "{}");
          } catch {
            parsed = {};
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || "Issue PDF upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Issue PDF upload failed"));
        xhr.send(formData);
      });

      setForm((prev) => ({ ...prev, issuePdfUrl: data.url || "" }));
      setIssuePdfProgress(100);
    } catch (err) {
      setError(err.message || "Issue PDF upload failed");
      setIssuePdfProgress(0);
    } finally {
      setIssuePdfUploading(false);
    }
  };

  if (status === "loading" || loading || articlesLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading...
      </div>
    );
  }

  if (!isAdmin) return null;

  const assignedArticles = articles.filter((article) => article.issueId === issueEditForm.id);

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Issues</h1>
          <p className="text-gray-500 mt-1">Create and organize volumes and issues</p>
        </div>
        <button
          onClick={() => setShowVolumeModal(true)}
          className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold px-4 py-2 rounded-lg"
        >
          + New Volume
        </button>
      </div>

      <ErrorBanner error={error} onDismiss={() => setError("")} />

        {/* Volumes Accordion */}
        <div className="space-y-4">
          {volumes.length === 0 ? (
            <div className="bg-white rounded-xl border border-[var(--gray-200)] p-8 text-center text-gray-500">
              No volumes yet. Create your first volume to get started.
            </div>
          ) : (
            volumes.map((volume) => (
              <div key={volume.id} className="bg-white rounded-xl border border-[var(--gray-200)] overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Volume {volume.volumeNumber} ({volume.year})
                    </h3>
                    <p className="text-sm text-gray-500">
                      {volume.issueCount} issues • {volume.articleCount} articles
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditVolume(volume)}
                      className="border border-gray-300 text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      Edit Volume
                    </button>
                    <button
                      onClick={() => setShowIssueModal(volume.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg"
                    >
                      + Add Issue
                    </button>
                  </div>
                </div>

                {(volume.issues || []).length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {volume.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            Issue {issue.issueNumber}
                            {issue.title && `: ${issue.title}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {issue.articleCount} articles
                            {issue.publishedAt &&
                              ` • Published: ${new Date(issue.publishedAt).toLocaleDateString()}`}
                          </p>
                          {issue.issuePdfUrl && (
                            <a
                              href={issue.issuePdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-sm text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                            >
                              Issue PDF
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => openEditIssue(issue)}
                          className="border border-gray-300 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-100"
                        >
                          Edit Issue
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      {/* Create Volume Modal */}
      {showVolumeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create New Volume</h2>
            </div>
            <form onSubmit={handleCreateVolume} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume Number *
                </label>
                <input
                  type="number"
                  value={volumeForm.volumeNumber}
                  onChange={(e) =>
                    setVolumeForm({ ...volumeForm, volumeNumber: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <input
                  type="number"
                  value={volumeForm.year}
                  onChange={(e) => setVolumeForm({ ...volumeForm, year: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVolumeModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Volume Modal */}
      {showEditVolumeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Volume</h2>
            </div>
            <form onSubmit={handleUpdateVolume} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume Number *
                </label>
                <input
                  type="number"
                  value={volumeEditForm.volumeNumber}
                  onChange={(e) =>
                    setVolumeEditForm({ ...volumeEditForm, volumeNumber: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <input
                  type="number"
                  value={volumeEditForm.year}
                  onChange={(e) => setVolumeEditForm({ ...volumeEditForm, year: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditVolumeModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create New Issue</h2>
            </div>
            <form onSubmit={handleCreateIssue} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Number *
                </label>
                <input
                  type="number"
                  value={issueForm.issueNumber}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, issueNumber: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleIssuePdfUpload(e, setIssueForm)}
                  disabled={issuePdfUploading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                {issuePdfUploading && (
                  <div className="mt-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-[var(--primary-600)] transition-all"
                        style={{ width: `${issuePdfProgress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Uploading... {issuePdfProgress}%</p>
                  </div>
                )}
                {issueForm.issuePdfUrl && (
                  <p className="mt-1 text-xs text-gray-500">PDF uploaded.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Published Date (optional)
                </label>
                <input
                  type="date"
                  value={issueForm.publishedAt}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, publishedAt: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(null)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Issue Modal */}
      {showEditIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Issue</h2>
            </div>
            <form onSubmit={handleUpdateIssue} className="px-6 py-4 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Number *
                  </label>
                  <input
                    type="number"
                    value={issueEditForm.issueNumber}
                    onChange={(e) =>
                      setIssueEditForm({ ...issueEditForm, issueNumber: e.target.value })
                    }
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Published Date (optional)
                  </label>
                  <input
                    type="date"
                    value={issueEditForm.publishedAt}
                    onChange={(e) =>
                      setIssueEditForm({ ...issueEditForm, publishedAt: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={issueEditForm.title}
                  onChange={(e) => setIssueEditForm({ ...issueEditForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleIssuePdfUpload(e, setIssueEditForm)}
                  disabled={issuePdfUploading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                {issuePdfUploading && (
                  <div className="mt-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-[var(--primary-600)] transition-all"
                        style={{ width: `${issuePdfProgress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Uploading... {issuePdfProgress}%</p>
                  </div>
                )}
                {issueEditForm.issuePdfUrl && (
                  <a
                    href={issueEditForm.issuePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                  >
                    View current PDF
                  </a>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Assign Articles</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a published article to assign to this issue.
                </p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                  <select
                    value={assigningArticleId}
                    onChange={(e) => setAssigningArticleId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select an article...</option>
                    {articles.map((article) => {
                      const label = getIssueLabel(article.issueId);
                      return (
                        <option key={article.id} value={article.id}>
                          {article.title}{label ? ` (Assigned to ${label})` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignArticle}
                    disabled={submitting || !assigningArticleId}
                    className="rounded-lg bg-[var(--primary-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-700)] disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Featured Articles</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Toggle which assigned articles are featured in this issue.
                </p>
                {assignedArticles.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No assigned articles yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {assignedArticles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                        <span className="text-sm text-gray-800">{article.title}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(article.id, !article.featuredInIssue)}
                          disabled={updatingFeaturedId === article.id}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border transition disabled:opacity-60 ${
                            article.featuredInIssue
                              ? "bg-[var(--primary-50)] text-[var(--primary-700)] border-[var(--primary-200)]"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {updatingFeaturedId === article.id
                            ? "Updating..."
                            : article.featuredInIssue
                            ? "Featured"
                            : "Not Featured"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditIssueModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
