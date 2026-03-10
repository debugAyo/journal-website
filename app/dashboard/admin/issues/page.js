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

  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(null); // volumeId or null
  const [submitting, setSubmitting] = useState(false);

  const [volumeForm, setVolumeForm] = useState({ volumeNumber: "", year: "" });
  const [issueForm, setIssueForm] = useState({ issueNumber: "", title: "", publishedAt: "" });

  const isAdmin = session?.user?.role === "ADMIN";

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

  const loadVolumes = async () => {
    try {
      const res = await fetch("/api/admin/volumes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVolumes(data.volumes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated" || !isAdmin) return;
    loadVolumes();
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

      await loadVolumes();
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await loadVolumes();
      setShowIssueModal(null);
      setIssueForm({ issueNumber: "", title: "", publishedAt: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading...
      </div>
    );
  }

  if (!isAdmin) return null;

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
                  <button
                    onClick={() => setShowIssueModal(volume.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg"
                  >
                    + Add Issue
                  </button>
                </div>

                {(volume.issues || []).length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {volume.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="px-6 py-3 flex justify-between items-center hover:bg-gray-50"
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
                        </div>
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
    </>
  );
}
