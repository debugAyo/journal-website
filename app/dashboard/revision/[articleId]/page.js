"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

export default function RevisionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = params.articleId;

  const [article, setArticle] = useState(null);
  const [decision, setDecision] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState({ manuscript: 0, response: 0 });
  const [uploadingField, setUploadingField] = useState("");

  const [manuscriptUrl, setManuscriptUrl] = useState("");
  const [coverLetterUrl, setCoverLetterUrl] = useState("");
  const [notesToEditor, setNotesToEditor] = useState("");

  const hasAccess = ["AUTHOR", "ADMIN"].includes(session?.user?.role);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !articleId) return;

    const loadData = async () => {
      try {
        // Fetch submissions to get article and check ownership
        const subsRes = await fetch("/api/submissions/my-submissions");
        const subsData = await subsRes.json();
        if (!subsRes.ok) throw new Error(subsData.error);

        const submission = (subsData.submissions || []).find(
          (s) => s.articleId === articleId
        );

        if (!submission && session.user.role !== "ADMIN") {
          throw new Error("Article not found or you don't have access");
        }

        const foundArticle = submission?.article;
        if (!foundArticle) throw new Error("Article not found");

        if (foundArticle.status !== "REVISION_REQUIRED") {
          throw new Error("Article is not awaiting revision");
        }

        setArticle(foundArticle);

        // Fetch editor submissions to get decision and reviews
        if (session.user.role === "ADMIN" || session.user.role === "EDITOR") {
          const editorRes = await fetch("/api/editor/submissions");
          const editorData = await editorRes.json();
          if (editorRes.ok) {
            const editorSub = (editorData.submissions || []).find(
              (s) => s.articleId === articleId
            );
            if (editorSub) {
              // Get reviews for this article
              // For now, we'll pass empty reviews since we need another API
            }
          }
        }

        // Get decision from notification (simplified approach)
        // In production, you'd have a dedicated API endpoint
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [status, articleId, session?.user?.role]);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setUploadingField(field);
    setUploadProgress((prev) => ({ ...prev, [field]: 0 }));

    const data = new FormData();
    data.append("file", file);

    try {
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress((prev) => ({ ...prev, [field]: percent }));
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
            reject(new Error(parsed.error || "File upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("File upload failed"));
        xhr.send(data);
      });

      if (field === "manuscript") {
        setManuscriptUrl(result.url);
      } else {
        setCoverLetterUrl(result.url);
      }
      setUploadProgress((prev) => ({ ...prev, [field]: 100 }));
    } catch (err) {
      setError(err?.message || "File upload failed");
      setUploadProgress((prev) => ({ ...prev, [field]: 0 }));
    } finally {
      setUploadingField("");
    }
  };

  const handleSubmit = async () => {
    if (!manuscriptUrl) {
      setError("Please upload your revised manuscript");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submissions/resubmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          manuscriptUrl,
          coverLetterUrl,
          notesToEditor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push("/dashboard/my-submissions?resubmitted=true");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading revision page...
      </div>
    );
  }

  if (error && !article) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit Revision</h1>
          <p className="text-gray-500 mt-1">Upload your revised manuscript</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Article Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{article?.title}</h2>
          <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
            Revision Required
          </span>
        </div>

        {/* Decision Letter */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Editor Decision</h3>
          <p className="text-blue-700 text-sm">
            The editor has requested revisions. Please review the reviewer comments below
            and upload your revised manuscript.
          </p>
        </div>

        {/* Reviewer Comments Placeholder */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviewer Comments</h3>
          <p className="text-gray-500 text-sm">
            Reviewer comments will be displayed here once the notification system provides them.
            Check your notifications for detailed reviewer feedback.
          </p>
        </div>

        {/* Revision Form */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
          <h3 className="text-lg font-semibold text-gray-900">Upload Revised Files</h3>

          {uploadingField && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              Uploading: {uploadProgress[uploadingField]}%
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Revised Manuscript * <span className="text-gray-400">(PDF or Word)</span>
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e, "manuscript")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            />
            {manuscriptUrl && (
              <p className="text-green-600 text-sm mt-1">✓ Manuscript uploaded</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response to Reviewers <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e, "response")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
            />
            {coverLetterUrl && (
              <p className="text-green-600 text-sm mt-1">✓ Response uploaded</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes to Editor <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notesToEditor}
              onChange={(e) => setNotesToEditor(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
              placeholder="Any additional notes for the editor..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard/my-submissions")}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !manuscriptUrl}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Revision"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
