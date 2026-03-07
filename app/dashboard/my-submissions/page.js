"use client";
import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import HomeBar from "@/app/components/HomeBar";

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  REVISION_REQUIRED: "bg-orange-100 text-orange-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PUBLISHED: "bg-purple-100 text-purple-700",
};

export default function MySubmissionsPage() {
  return (
    <Suspense fallback={<MySubmissionsShell />}>
      <MySubmissionsContent />
    </Suspense>
  );
}

function MySubmissionsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const submitted = searchParams.get("submitted");

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let didCancel = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch("/api/submissions/my-submissions", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load submissions");
        }

        if (!didCancel) {
          setSubmissions(data.submissions || []);
          setError(""); // Clear any previous errors on success
        }
      })
      .catch((err) => {
        if (!didCancel) {
          setError(
            err?.name === "AbortError"
              ? "Request timed out while loading submissions. Please refresh."
              : err?.message || "Failed to load submissions"
          );
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (!didCancel) {
          setLoading(false);
        }
      });

    return () => {
      didCancel = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const intervalId = setInterval(() => {
      fetch("/api/submissions/my-submissions", { cache: "no-store" })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return;
          setSubmissions(data.submissions || []);
          setError("");
        })
        .catch(() => {
          // Keep current data visible; this is only a silent background sync.
        });
    }, 15000);

    const onFocus = () => {
      fetch("/api/submissions/my-submissions", { cache: "no-store" })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return;
          setSubmissions(data.submissions || []);
          setError("");
        })
        .catch(() => {
          // Ignore focus refresh failures silently.
        });
    };

    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [status]);

  return (
    <div className="min-h-screen bg-[var(--gray-50)] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <HomeBar backHref="/dashboard" backLabel="Back to Dashboard" />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
            <p className="text-gray-500 mt-1">Track all your manuscript submissions</p>
          </div>
          <Link
            href="/dashboard/submit"
            className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold px-5 py-2.5 rounded-lg transition"
          >
            + New Submission
          </Link>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <span className="text-2xl flex-shrink-0">🎉</span>
            <span>Your manuscript has been submitted successfully! We will be in touch soon.</span>
          </div>
        )}

        {error && submissions.length === 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Submissions Table */}
        <div className="bg-white rounded-xl border border-[var(--gray-200)] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg mb-4">No submissions yet</p>
              <Link
                href="/dashboard/submit"
                className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Submit Your First Manuscript
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Title</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Keywords</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Submitted</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{sub.article?.title || "Untitled submission"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {sub.article?.keywords?.slice(0, 3).join(", ") || "No keywords"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sub.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[sub.article?.status] || "bg-gray-100 text-gray-600"}`}>
                        {(sub.article?.status || "DRAFT").replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function MySubmissionsShell() {
  return <div className="min-h-screen bg-gray-50" />;
}
