"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

const RECOMMENDATIONS = [
  { value: "ACCEPT", label: "Accept", color: "text-green-600" },
  { value: "MINOR_REVISION", label: "Minor Revision", color: "text-yellow-600" },
  { value: "MAJOR_REVISION", label: "Major Revision", color: "text-orange-600" },
  { value: "REJECT", label: "Reject", color: "text-red-600" },
];

const RATING_CRITERIA = ["originality", "methodology", "clarity", "references"];

export default function ReviewFormPage() {
  return (
    <Suspense fallback={<ReviewFormShell />}>
      <ReviewFormContent />
    </Suspense>
  );
}

function ReviewFormContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const reviewId = params.reviewId;
  const isViewMode = searchParams.get("view") === "true";

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [recommendation, setRecommendation] = useState("");
  const [commentsToEditor, setCommentsToEditor] = useState("");
  const [commentsToAuthor, setCommentsToAuthor] = useState("");
  const [qualityRatings, setQualityRatings] = useState({
    originality: 3,
    methodology: 3,
    clarity: 3,
    references: 3,
  });

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

  useEffect(() => {
    if (status !== "authenticated" || !hasAccess || !reviewId) return;

    fetch("/api/reviewer/my-reviews")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const found = (data.reviews || []).find((r) => r.id === reviewId);
        if (!found) throw new Error("Review not found");
        
        // Allow viewing completed reviews or editing accepted ones
        if (!isViewMode && found.status !== "ACCEPTED") {
          throw new Error("Review is not in progress");
        }
        if (isViewMode && found.status !== "COMPLETED") {
          throw new Error("Cannot view incomplete review");
        }
        
        setReview(found);
        
        // Pre-fill form with existing data for view mode
        if (isViewMode && found.status === "COMPLETED") {
          setRecommendation(found.recommendation || "");
          setCommentsToEditor(found.commentsToEditor || "");
          setCommentsToAuthor(found.commentsToAuthor || "");
          if (found.qualityRatings) {
            setQualityRatings(found.qualityRatings);
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, hasAccess, reviewId, isViewMode]);

  const handleRatingChange = (criterion, value) => {
    setQualityRatings((prev) => ({
      ...prev,
      [criterion]: Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recommendation) {
      setError("Please select a recommendation");
      return;
    }
    if (!commentsToEditor.trim()) {
      setError("Comments to editor are required");
      return;
    }
    if (!commentsToAuthor.trim()) {
      setError("Comments to author are required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviewer/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          recommendation,
          commentsToEditor,
          commentsToAuthor,
          qualityRatings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/reviewer");
      }, 2000);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading review form...
      </div>
    );
  }

  if (!hasAccess) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
          <p className="text-gray-600">Thank you for your review. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isViewMode ? "Review Details" : "Submit Review"}
            </h1>
            <p className="text-gray-500 mt-1">
              {isViewMode 
                ? "Your submitted review for this manuscript" 
                : "Complete your peer review for this manuscript"}
            </p>
          </div>
          <Link 
            href="/dashboard/reviewer"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Article Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{review?.article?.title}</h2>
          <p className="text-gray-600 text-sm mb-4">{review?.article?.abstract}</p>
          {review?.article?.manuscriptUrl && (
            <a
              href={review.article.manuscriptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              📄 Download Manuscript
            </a>
          )}
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {isViewMode && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              ✓ This review was submitted on {review?.submittedAt ? new Date(review.submittedAt).toLocaleDateString() : "N/A"}
            </div>
          )}

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Recommendation {!isViewMode && "*"}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {RECOMMENDATIONS.map((rec) => (
                <label
                  key={rec.value}
                  className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition ${
                    isViewMode ? "cursor-default" : "cursor-pointer"
                  } ${
                    recommendation === rec.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="recommendation"
                    value={rec.value}
                    checked={recommendation === rec.value}
                    onChange={(e) => !isViewMode && setRecommendation(e.target.value)}
                    disabled={isViewMode}
                    className="sr-only"
                  />
                  <span className={`font-medium ${rec.color}`}>{rec.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quality Ratings */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Quality Ratings (1-5)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {RATING_CRITERIA.map((criterion) => (
                <div key={criterion}>
                  <label className="block text-sm text-gray-600 capitalize mb-1">{criterion}</label>
                  <select
                    value={qualityRatings[criterion]}
                    onChange={(e) => !isViewMode && handleRatingChange(criterion, e.target.value)}
                    disabled={isViewMode}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Comments to Editor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Comments to Editor {!isViewMode && "*"} <span className="font-normal text-gray-400">(Confidential)</span>
            </label>
            <textarea
              value={commentsToEditor}
              onChange={(e) => !isViewMode && setCommentsToEditor(e.target.value)}
              readOnly={isViewMode}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 read-only:bg-gray-50"
              placeholder={isViewMode ? "" : "Confidential comments for the editor only..."}
            />
          </div>

          {/* Comments to Author */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Comments to Author {!isViewMode && "*"} <span className="font-normal text-gray-400">(Will be shared)</span>
            </label>
            <textarea
              value={commentsToAuthor}
              onChange={(e) => !isViewMode && setCommentsToAuthor(e.target.value)}
              readOnly={isViewMode}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 read-only:bg-gray-50"
              placeholder={isViewMode ? "" : "Constructive feedback for the author..."}
            />
          </div>

          {/* Submit / Back Button */}
          {isViewMode ? (
            <div className="flex justify-center">
              <Link
                href="/dashboard/reviewer"
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
              >
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/reviewer")}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function ReviewFormShell() {
  return <div className="min-h-screen bg-gray-50" />;
}
