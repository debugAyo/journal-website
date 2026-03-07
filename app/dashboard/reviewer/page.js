"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TABS = ["Pending Invitations", "Active Reviews", "Completed"];

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getDaysRemaining(dueDate) {
  if (!dueDate) return "-";
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return "-";
  const diff = due.getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

const statusBadgeColors = {
  INVITED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-yellow-100 text-yellow-700",
  DECLINED: "bg-red-100 text-red-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export default function ReviewerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Pending Invitations");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(null);

  const hasAccess = ["REVIEWER", "ADMIN"].includes(session?.user?.role);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated" && !hasAccess) {
      router.push("/dashboard");
      return;
    }
  }, [status, hasAccess, router]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/reviewer/my-reviews");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !hasAccess) return;
    loadReviews();

    const intervalId = setInterval(() => {
      loadReviews();
    }, 15000);

    const onFocus = () => loadReviews();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, hasAccess, loadReviews]);

  const handleAccept = async (reviewId) => {
    setProcessing(reviewId);
    setError("");
    try {
      const res = await fetch("/api/reviewer/accept-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (reviewId) => {
    setProcessing(reviewId);
    setError("");
    try {
      const res = await fetch("/api/reviewer/decline-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const tabData = {
    "Pending Invitations": reviews.filter((r) => r.status === "INVITED"),
    "Active Reviews": reviews.filter((r) => r.status === "ACCEPTED"),
    Completed: reviews.filter((r) => r.status === "COMPLETED" || r.status === "DECLINED"),
  };

  const activeItems = tabData[activeTab] || [];

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading reviewer dashboard...
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <div className="min-h-screen bg-[var(--gray-50)] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reviewer Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your review assignments</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
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
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Article</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                    {activeTab === "Pending Invitations" ? "Abstract Preview" : "Details"}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                      No reviews in this tab.
                    </td>
                  </tr>
                ) : (
                  activeItems.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-gray-900">
                          {review.article?.title || "Untitled"}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-gray-600 max-w-xs">
                        {activeTab === "Pending Invitations" && (
                          <div>
                            <p className="line-clamp-2">{review.article?.abstract?.slice(0, 150)}...</p>
                            <p className="mt-2 text-gray-500">Due: {formatDate(review.dueDate)}</p>
                            <p className="text-gray-500">Assigned: {formatDate(review.createdAt)}</p>
                          </div>
                        )}
                        {activeTab === "Active Reviews" && (
                          <div>
                            <p>Due: {formatDate(review.dueDate)}</p>
                            <p className="text-yellow-600 font-medium">{getDaysRemaining(review.dueDate)}</p>
                          </div>
                        )}
                        {activeTab === "Completed" && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeColors[review.status]}`}>
                              {review.status}
                            </span>
                            <span className="text-gray-500">
                              {review.status === "COMPLETED" ? formatDate(review.submittedAt) : formatDate(review.createdAt)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {activeTab === "Pending Invitations" && (
                            <>
                              <button
                                onClick={() => handleAccept(review.id)}
                                disabled={processing === review.id}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
                              >
                                {processing === review.id ? "..." : "Accept"}
                              </button>
                              <button
                                onClick={() => handleDecline(review.id)}
                                disabled={processing === review.id}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
                              >
                                {processing === review.id ? "..." : "Decline"}
                              </button>
                            </>
                          )}
                          {activeTab === "Active Reviews" && (
                            <Link
                              href={`/dashboard/reviewer/review/${review.id}`}
                              className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white text-sm font-semibold px-3 py-2 rounded-lg"
                            >
                              Write Review
                            </Link>
                          )}
                          {activeTab === "Completed" && review.status === "COMPLETED" && (
                            <Link
                              href={`/dashboard/reviewer/review/${review.id}?view=true`}
                              className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-3 py-2 rounded-lg"
                            >
                              View Review
                            </Link>
                          )}
                          {activeTab === "Completed" && review.status === "DECLINED" && (
                            <span className="text-gray-500 text-sm">Declined</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
