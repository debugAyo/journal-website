"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ErrorBanner from "@/app/dashboard/ErrorBanner";

export default function PublishArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = params.articleId;

  const [article, setArticle] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState("");
  const [doi, setDoi] = useState("");
  const [pageStart, setPageStart] = useState("");
  const [pageEnd, setPageEnd] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [showOnHomepage, setShowOnHomepage] = useState(true);

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

  useEffect(() => {
    if (status !== "authenticated" || !isAdmin || !articleId) return;

    const loadData = async () => {
      try {
        // Fetch the article via admin stats or editor submissions
        const statsRes = await fetch("/api/admin/stats");
        const statsData = await statsRes.json();
        if (!statsRes.ok) throw new Error(statsData.error);

        const found = (statsData.acceptedArticles || []).find((a) => a.id === articleId);
        if (!found) throw new Error("Accepted article not found");

        setArticle(found);

        // Fetch issues
        const issuesRes = await fetch("/api/admin/issues");
        const issuesData = await issuesRes.json();
        if (!issuesRes.ok) throw new Error(issuesData.error);

        setIssues(issuesData.issues || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [status, isAdmin, articleId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError("");

    const data = new FormData();
    data.append("file", file);

    try {
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
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
            reject(new Error(parsed.error || "Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(data);
      });

      setPublishedUrl(result.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedIssue) {
      setError("Please select an issue");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          issueId: selectedIssue,
          doi: doi || null,
          pageStart: pageStart ? Number(pageStart) : null,
          pageEnd: pageEnd ? Number(pageEnd) : null,
          publishedUrl: publishedUrl || null,
          showOnHomepage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push("/dashboard/admin?published=true");
    } catch (err) {
      setError(err.message);
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

  if (error && !article) {
    return (
      <div className="flex items-center justify-center py-20">
        <ErrorBanner error={error} />
      </div>
    );
  }

  return (
    <>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Publish Article</h1>
            <p className="text-gray-500 mt-1">Assign to issue and set publication details</p>
          </div>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError("")} />

        {/* Article Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{article?.title}</h2>
          <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            Accepted
          </span>
        </div>

        {/* Publish Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Issue *
            </label>
            <select
              value={selectedIssue}
              onChange={(e) => setSelectedIssue(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select an issue...</option>
              {issues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  Vol {issue.volume?.volumeNumber}, Issue {issue.issueNumber}
                  {issue.title ? `: ${issue.title}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="10.xxxx/xxxxx"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Start</label>
              <input
                type="number"
                value={pageStart}
                onChange={(e) => setPageStart(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page End</label>
              <input
                type="number"
                value={pageEnd}
                onChange={(e) => setPageEnd(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Final Typeset PDF (optional)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {uploading && (
              <p className="text-blue-600 text-sm mt-1">Uploading: {uploadProgress}%</p>
            )}
            {publishedUrl && (
              <p className="text-green-600 text-sm mt-1">✓ PDF uploaded</p>
            )}
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={showOnHomepage}
              onChange={(e) => setShowOnHomepage(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-gray-700">Feature this article on homepage after publishing</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/admin")}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Article"}
            </button>
          </div>
        </form>
    </>
  );
}
