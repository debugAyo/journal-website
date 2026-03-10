"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import ErrorBanner from "@/app/dashboard/ErrorBanner";

const DECISIONS = [
  { value: "ACCEPT", label: "Accept", color: "bg-green-100 text-green-700" },
  { value: "MINOR_REVISION", label: "Minor Revision", color: "bg-yellow-100 text-yellow-700" },
  { value: "MAJOR_REVISION", label: "Major Revision", color: "bg-orange-100 text-orange-700" },
  { value: "REJECT", label: "Reject", color: "bg-red-100 text-red-700" },
];

const recommendationColors = {
  ACCEPT: "bg-green-100 text-green-700",
  MINOR_REVISION: "bg-yellow-100 text-yellow-700",
  MAJOR_REVISION: "bg-orange-100 text-orange-700",
  REJECT: "bg-red-100 text-red-700",
};

export default function EditorDecisionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = params.articleId;

  const [submission, setSubmission] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [decision, setDecision] = useState("");
  const [decisionLetter, setDecisionLetter] = useState("");

  const hasAccess = ["EDITOR", "ADMIN"].includes(session?.user?.role);

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

  useEffect(() => {
    if (status !== "authenticated" || !hasAccess || !articleId) return;

    const loadData = async () => {
      try {
        // Fetch submission data
        const res = await fetch("/api/editor/submissions");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const found = (data.submissions || []).find((s) => s.article?.id === articleId);
        if (!found) throw new Error("Submission not found");

        setSubmission(found);

        // Fetch reviews for this article
        const reviewsRes = await fetch(`/api/editor/article-reviews?articleId=${articleId}`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [status, hasAccess, articleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!decision) {
      setError("Please select a decision");
      return;
    }
    if (!decisionLetter.trim()) {
      setError("Decision letter is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/editor/make-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          decision,
          decisionLetter,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push("/dashboard/editor");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  // Calculate recommendation summary
  const recommendationSummary = reviews.reduce((acc, r) => {
    if (r.recommendation) {
      acc[r.recommendation] = (acc[r.recommendation] || 0) + 1;
    }
    return acc;
  }, {});

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading decision page...
      </div>
    );
  }

  if (!hasAccess) return null;

  if (error && !submission) {
    return (
      <div className="flex items-center justify-center py-20">
        <ErrorBanner error={error} />
      </div>
    );
  }

  const article = submission?.article;

  return (
    <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Make Editorial Decision</h1>
          <p className="text-gray-500 mt-1">Review all feedback and render your decision</p>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError("")} />

        {/* Article Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{article?.title}</h2>
          <p className="text-gray-600 text-sm">{article?.abstract}</p>
        </div>

        {/* Reviews Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Recommendation Summary</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(recommendationSummary).map(([rec, count]) => (
              <span
                key={rec}
                className={`text-xs font-semibold px-3 py-1 rounded-full ${recommendationColors[rec] || "bg-gray-100 text-gray-700"}`}
              >
                {count} {rec.replace("_", " ")}
              </span>
            ))}
            {Object.keys(recommendationSummary).length === 0 && (
              <span className="text-gray-500 text-sm">No completed reviews yet</span>
            )}
          </div>
        </div>

        {/* Individual Reviews */}
        {reviews.filter((r) => r.status === "COMPLETED").length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Completed Reviews</h3>
            {reviews
              .filter((r) => r.status === "COMPLETED")
              .map((review, index) => (
                <div key={review.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-semibold text-gray-600">
                      Reviewer {index + 1}
                    </span>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        recommendationColors[review.recommendation] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {review.recommendation?.replace("_", " ") || "N/A"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Comments to Editor (Confidential)
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {review.commentsToEditor || "No comments"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Comments to Author
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {review.commentsToAuthor || "No comments"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Decision Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Your Decision</h3>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Decision *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DECISIONS.map((d) => (
                <label
                  key={d.value}
                  className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                    decision === d.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    value={d.value}
                    checked={decision === d.value}
                    onChange={(e) => setDecision(e.target.value)}
                    className="sr-only"
                  />
                  <span className={`font-medium text-sm ${d.color.split(" ")[1]}`}>
                    {d.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Decision Letter to Author *
            </label>
            <textarea
              value={decisionLetter}
              onChange={(e) => setDecisionLetter(e.target.value)}
              rows={10}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your decision letter to the author..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/editor")}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Decision"}
            </button>
          </div>
        </form>
    </>
  );
}
