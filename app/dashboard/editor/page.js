"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TABS = ["New", "Under Review", "Awaiting Decision", "Accepted", "Rejected"];

const defaultDeskRejectMessage =
  "Thank you for submitting your manuscript to our journal. After an initial editorial assessment, we are unable to proceed with peer review at this time. We appreciate your interest and encourage you to consider us for future submissions.";

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysSince(dateValue) {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "-";
  const diff = Date.now() - parsed.getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  return `${days} day${days === 1 ? "" : "s"}`;
}

function getRecommendationSummary(item) {
  if (!item.reviewCount) return "No reviews yet";
  if (item.completedReviewCount === 0) return "Reviews pending";
  if (item.completedReviewCount < item.reviewCount) {
    return `${item.completedReviewCount}/${item.reviewCount} completed`;
  }
  return `${item.reviewCount} completed`;
}

export default function EditorDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState("New");
  const [submissions, setSubmissions] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [assignModalItem, setAssignModalItem] = useState(null);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([]);
  const [reviewDueDate, setReviewDueDate] = useState("");
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [deskRejectItem, setDeskRejectItem] = useState(null);
  const [deskRejectMessage, setDeskRejectMessage] = useState(defaultDeskRejectMessage);
  const [deskRejecting, setDeskRejecting] = useState(false);

  const hasAccess = ["EDITOR", "ADMIN"].includes(session?.user?.role);

  const loadSubmissions = useCallback(async () => {
    const res = await fetch("/api/editor/submissions");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Failed to load editor submissions");
    }
    setSubmissions(data.submissions || []);
  }, []);

  const loadReviewers = useCallback(async () => {
    const res = await fetch("/api/editor/reviewers");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Failed to load reviewers");
    }
    setReviewers(data.reviewers || []);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated" && !hasAccess) {
      router.push("/dashboard");
      return;
    }

    if (status !== "authenticated" || !hasAccess) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([loadSubmissions(), loadReviewers()]);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load dashboard data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Auto-refresh so assignment/decision changes appear without manual reload.
    const intervalId = setInterval(async () => {
      try {
        await Promise.all([loadSubmissions(), loadReviewers()]);
      } catch {
        // Preserve last known state and avoid noisy errors during background refresh.
      }
    }, 15000);

    const onFocus = async () => {
      try {
        await Promise.all([loadSubmissions(), loadReviewers()]);
      } catch {
        // Ignore focus refresh errors; existing data remains visible.
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, hasAccess, router, loadReviewers, loadSubmissions]);

  const filteredReviewers = useMemo(() => {
    const query = reviewerSearch.trim().toLowerCase();
    if (!query) return reviewers;
    return reviewers.filter((reviewer) => {
      return (
        reviewer.name?.toLowerCase().includes(query) ||
        reviewer.email?.toLowerCase().includes(query) ||
        reviewer.affiliation?.toLowerCase().includes(query)
      );
    });
  }, [reviewers, reviewerSearch]);

  const tabData = useMemo(() => {
    const newItems = submissions.filter((item) => item.article?.status === "SUBMITTED");
    const underReview = submissions.filter((item) => item.article?.status === "UNDER_REVIEW");
    const awaitingDecision = underReview.filter(
      (item) => item.reviewCount > 0 && item.reviewCount === item.completedReviewCount
    );
    const accepted = submissions.filter((item) => item.article?.status === "ACCEPTED");
    const rejected = submissions.filter((item) => item.article?.status === "REJECTED");

    return {
      New: newItems,
      "Under Review": underReview,
      "Awaiting Decision": awaitingDecision,
      Accepted: accepted,
      Rejected: rejected,
    };
  }, [submissions]);

  const activeItems = tabData[activeTab] || [];

  const toggleReviewer = (reviewerId) => {
    setSelectedReviewerIds((prev) => {
      if (prev.includes(reviewerId)) {
        return prev.filter((id) => id !== reviewerId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, reviewerId];
    });
  };

  const openAssignModal = (item) => {
    setAssignModalItem(item);
    setSelectedReviewerIds([]);
    setReviewDueDate("");
    setReviewerSearch("");
  };

  const closeAssignModal = () => {
    setAssignModalItem(null);
    setSelectedReviewerIds([]);
    setReviewDueDate("");
    setReviewerSearch("");
    setAssigning(false);
  };

  const submitReviewerAssignment = async () => {
    if (!assignModalItem?.article?.id) return;
    if (selectedReviewerIds.length < 2 || selectedReviewerIds.length > 3) {
      setError("Please select between 2 and 3 reviewers.");
      return;
    }
    if (!reviewDueDate) {
      setError("Please select a review due date.");
      return;
    }

    setAssigning(true);
    setError("");

    try {
      const res = await fetch("/api/editor/assign-reviewers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: assignModalItem.article.id,
          reviewerIds: selectedReviewerIds,
          dueDate: reviewDueDate,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to assign reviewers");
      }

      await loadSubmissions();
      closeAssignModal();
    } catch (err) {
      setError(err?.message || "Failed to assign reviewers");
      setAssigning(false);
    }
  };

  const openDeskRejectModal = (item) => {
    setDeskRejectItem(item);
    setDeskRejectMessage(defaultDeskRejectMessage);
  };

  const closeDeskRejectModal = () => {
    setDeskRejectItem(null);
    setDeskRejectMessage(defaultDeskRejectMessage);
    setDeskRejecting(false);
  };

  const submitDeskReject = async () => {
    if (!deskRejectItem?.article?.id || !deskRejectMessage.trim()) {
      setError("Rejection message is required.");
      return;
    }

    setDeskRejecting(true);
    setError("");

    try {
      const res = await fetch("/api/editor/desk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: deskRejectItem.article.id,
          message: deskRejectMessage.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to desk reject submission");
      }

      await loadSubmissions();
      closeDeskRejectModal();
    } catch (err) {
      setError(err?.message || "Failed to desk reject submission");
      setDeskRejecting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading editorial dashboard...
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--gray-50)] py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Editorial Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage submissions, reviewer assignments, and decisions</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-[var(--gray-200)] overflow-hidden">
          <div className="border-b border-gray-200 px-4">
            <div className="flex gap-2 overflow-x-auto py-3">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-[var(--primary-700)] text-white"
                      : "bg-[var(--gray-100)] text-[var(--gray-700)] hover:bg-[var(--gray-200)]"
                  }`}
                >
                  {tab} ({(tabData[tab] || []).length})
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Details</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                      No submissions in this tab.
                    </td>
                  </tr>
                ) : (
                  activeItems.map((item) => {
                    const article = item.article;
                    const authorName = item.user?.name || item.user?.email || "Unknown author";

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-gray-900">{article?.title || "Untitled"}</p>
                          <p className="text-sm text-gray-500 mt-1">Author: {authorName}</p>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-gray-600">
                          {activeTab === "New" && (
                            <div className="space-y-1">
                              <p>Submitted by: {authorName}</p>
                              <p>Days since submission: {getDaysSince(item.createdAt)}</p>
                            </div>
                          )}
                          {activeTab === "Under Review" && (
                            <div className="space-y-1">
                              <p>Reviewers assigned: {item.reviewCount}</p>
                              <p>Reviews received: {item.completedReviewCount}</p>
                              <p>Due date: {formatDate(item?.latestDueDate)}</p>
                            </div>
                          )}
                          {activeTab === "Awaiting Decision" && (
                            <div className="space-y-1">
                              <p>Number of reviews: {item.reviewCount}</p>
                              <p>Recommendations: {getRecommendationSummary(item)}</p>
                            </div>
                          )}
                          {activeTab === "Accepted" && <p>Accepted date: {formatDate(item.createdAt)}</p>}
                          {activeTab === "Rejected" && <p>Rejected date: {formatDate(item.createdAt)}</p>}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-gray-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            {activeTab === "New" && (
                              <>
                                <button
                                  onClick={() => openAssignModal(item)}
                                  className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white text-sm font-semibold px-3 py-2 rounded-lg"
                                >
                                  Assign Reviewers
                                </button>
                                <button
                                  onClick={() => openDeskRejectModal(item)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2 rounded-lg"
                                >
                                  Desk Reject
                                </button>
                              </>
                            )}
                            {activeTab === "Under Review" && (
                              <Link
                                href={`/dashboard/editor/decision/${article?.id}`}
                                className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-3 py-2 rounded-lg"
                              >
                                View Reviews
                              </Link>
                            )}
                            {activeTab === "Awaiting Decision" && (
                              <Link
                                href={`/dashboard/editor/decision/${article?.id}`}
                                className="bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-semibold px-3 py-2 rounded-lg"
                              >
                                Make Decision
                              </Link>
                            )}
                            {(activeTab === "Accepted" || activeTab === "Rejected") && (
                              <Link
                                href={`/dashboard/editor/decision/${article?.id}`}
                                className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-3 py-2 rounded-lg"
                              >
                                View Details
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {assignModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assign Reviewers</h2>
              <p className="text-sm text-gray-500 mt-1">Select 2-3 reviewers for this submission</p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <input
                type="text"
                placeholder="Search reviewers by name, email, or affiliation"
                value={reviewerSearch}
                onChange={(e) => setReviewerSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
              />

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filteredReviewers.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-gray-500">No reviewers found.</p>
                ) : (
                  filteredReviewers.map((reviewer) => {
                    const checked = selectedReviewerIds.includes(reviewer.id);
                    const disabled = !checked && selectedReviewerIds.length >= 3;

                    return (
                      <label
                        key={reviewer.id}
                        className={`flex items-start gap-3 px-3 py-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleReviewer(reviewer.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{reviewer.name}</p>
                          <p className="text-sm text-gray-600">{reviewer.affiliation || "No affiliation"}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {reviewer.email} • Active reviews: {reviewer.activeReviewCount}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review due date</label>
                <input
                  type="date"
                  value={reviewDueDate}
                  onChange={(e) => setReviewDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReviewerAssignment}
                disabled={assigning}
                className="px-4 py-2 rounded-lg bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold disabled:opacity-50"
              >
                {assigning ? "Assigning..." : "Assign Reviewers"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deskRejectItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Desk Reject Submission</h2>
              <p className="text-sm text-gray-500 mt-1">Send a rejection message to the author</p>
            </div>

            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                rows={8}
                value={deskRejectMessage}
                onChange={(e) => setDeskRejectMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeDeskRejectModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitDeskReject}
                disabled={deskRejecting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {deskRejecting ? "Submitting..." : "Confirm Desk Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
