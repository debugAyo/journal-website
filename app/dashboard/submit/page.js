"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ErrorBanner from "@/app/dashboard/ErrorBanner";

export default function SubmitArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/dashboard/submit");
    }
  }, [status, router]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState({
    manuscriptUrl: 0,
    coverLetterUrl: 0,
  });
  const [uploadingField, setUploadingField] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    keywords: "",
    articleType: "research",
    coAuthors: [],
    manuscriptUrl: "",
    coverLetterUrl: "",
    declarationChecked: false,
    conflictOfInterest: "",
    fundingInfo: "",
    notesToEditor: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addCoAuthor = () => {
    setFormData((prev) => ({
      ...prev,
      coAuthors: [
        ...prev.coAuthors,
        { name: "", email: "", affiliation: "", isCorresponding: false },
      ],
    }));
  };

  const removeCoAuthor = (index) => {
    setFormData((prev) => ({
      ...prev,
      coAuthors: prev.coAuthors.filter((_, i) => i !== index),
    }));
  };

  const updateCoAuthor = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.coAuthors];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, coAuthors: updated };
    });
  };

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

        xhr.onerror = () => reject(new Error("File upload failed. Please try again."));
        xhr.send(data);
      });

      setFormData((prev) => ({ ...prev, [field]: result.url }));
      setUploadProgress((prev) => ({ ...prev, [field]: 100 }));
    } catch (err) {
      setError(err?.message || "File upload failed. Please try again.");
      setUploadProgress((prev) => ({ ...prev, [field]: 0 }));
    } finally {
      setUploadingField("");
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      setError("Please sign in before submitting a manuscript.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/submissions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/dashboard/my-submissions?submitted=true");
    } catch (err) {
      setError("Submission failed. Please try again.");
      setLoading(false);
    }
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit Manuscript</h1>
          <p className="text-gray-500 mt-1">Complete all steps to submit your article</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center mb-8">
          {["Manuscript Info", "Authors", "Files", "Declaration", "Review"].map(
            (label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span className="text-xs mt-1 text-gray-500 hidden md:block">{label}</span>
                </div>
                {i < 4 && (
                  <div className={`flex-1 h-1 mx-1 ${step > i + 1 ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            )
          )}
        </div>

        {/* Error */}
        <ErrorBanner error={error} onDismiss={() => setError("")} />

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-md p-8">

          {/* STEP 1 — Manuscript Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Manuscript Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Article Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  placeholder="Enter the full title of your article"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abstract * <span className="text-gray-400 font-normal">(minimum 150 words)</span>
                </label>
                <textarea
                  name="abstract"
                  value={formData.abstract}
                  onChange={handleChange}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  placeholder="Write your abstract here..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Word count: {formData.abstract.trim().split(/\s+/).filter(Boolean).length}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords * <span className="text-gray-400 font-normal">(comma separated)</span>
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  placeholder="e.g. machine learning, neural networks, deep learning"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Article Type *</label>
                <select
                  name="articleType"
                  value={formData.articleType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                >
                  <option value="research">Research Article</option>
                  <option value="review">Review Article</option>
                  <option value="case_study">Case Study</option>
                  <option value="short_communication">Short Communication</option>
                </select>
              </div>

              <button
                onClick={() => {
                  if (!formData.title || !formData.abstract || !formData.keywords) {
                    setError("Please fill in all required fields");
                    return;
                  }
                  if (formData.abstract.trim().split(/\s+/).filter(Boolean).length < 150) {
                    setError("Abstract must be at least 150 words");
                    return;
                  }
                  setError("");
                  nextStep();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Next → Authors
              </button>
            </div>
          )}

          {/* STEP 2 — Authors */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Authors</h2>

              {/* Primary Author */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-700 mb-1">Primary Author (You)</p>
                <p className="text-gray-700">{session?.user?.name}</p>
                <p className="text-gray-500 text-sm">{session?.user?.email}</p>
              </div>

              {/* Co-Authors */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">Co-Authors</label>
                  <button
                    onClick={addCoAuthor}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg"
                  >
                    + Add Co-Author
                  </button>
                </div>

                {formData.coAuthors.length === 0 && (
                  <p className="text-gray-400 text-sm italic">No co-authors added yet.</p>
                )}

                {formData.coAuthors.map((author, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-600">Co-Author {index + 1}</span>
                      <button
                        onClick={() => removeCoAuthor(index)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={author.name}
                        onChange={(e) => updateCoAuthor(index, "name", e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={author.email}
                        onChange={(e) => updateCoAuthor(index, "email", e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Affiliation"
                        value={author.affiliation}
                        onChange={(e) => updateCoAuthor(index, "affiliation", e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={author.isCorresponding}
                          onChange={(e) => updateCoAuthor(index, "isCorresponding", e.target.checked)}
                        />
                        Corresponding Author
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={prevStep} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50">
                  ← Back
                </button>
                <button onClick={nextStep} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
                  Next → Files
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — File Upload */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Files</h2>

              {uploadingField && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                  ⏳ Uploading {uploadingField === "manuscriptUrl" ? "manuscript" : "cover letter"}: {uploadProgress[uploadingField]}%
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manuscript File * <span className="text-gray-400 font-normal">(PDF or Word, max 10MB)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, "manuscriptUrl")}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none"
                />
                {uploadProgress.manuscriptUrl > 0 && uploadProgress.manuscriptUrl < 100 && (
                  <p className="text-blue-600 text-sm mt-1">Uploading: {uploadProgress.manuscriptUrl}%</p>
                )}
                {formData.manuscriptUrl && (
                  <p className="text-green-600 text-sm mt-1">✓ Manuscript uploaded successfully</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Letter <span className="text-gray-400 font-normal">(optional, PDF or Word)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, "coverLetterUrl")}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none"
                />
                {uploadProgress.coverLetterUrl > 0 && uploadProgress.coverLetterUrl < 100 && (
                  <p className="text-blue-600 text-sm mt-1">Uploading: {uploadProgress.coverLetterUrl}%</p>
                )}
                {formData.coverLetterUrl && (
                  <p className="text-green-600 text-sm mt-1">✓ Cover letter uploaded successfully</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={prevStep} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50">
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!formData.manuscriptUrl) {
                      setError("Please upload your manuscript file");
                      return;
                    }
                    setError("");
                    nextStep();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  Next → Declaration
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — Declaration */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Declaration</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conflict of Interest Statement
                </label>
                <textarea
                  name="conflictOfInterest"
                  value={formData.conflictOfInterest}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Declare any conflicts of interest, or write 'None'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funding Information
                </label>
                <textarea
                  name="fundingInfo"
                  value={formData.fundingInfo}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List any funding sources, or write 'None'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes to Editor <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="notesToEditor"
                  value={formData.notesToEditor}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special notes for the editor..."
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="declarationChecked"
                  checked={formData.declarationChecked}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span className="text-sm text-gray-600">
                  I confirm that this manuscript is original, has not been published elsewhere, and is not currently under review at another journal. All authors have approved this submission.
                </span>
              </label>

              <div className="flex gap-3">
                <button onClick={prevStep} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50">
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!formData.declarationChecked) {
                      setError("Please check the declaration checkbox to continue");
                      return;
                    }
                    setError("");
                    nextStep();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  Next → Review
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Review & Submit */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Review & Submit</h2>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-600">Title:</span>
                  <p className="text-gray-800 mt-0.5">{formData.title}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Article Type:</span>
                  <p className="text-gray-800 mt-0.5 capitalize">{formData.articleType.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Keywords:</span>
                  <p className="text-gray-800 mt-0.5">{formData.keywords}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Abstract:</span>
                  <p className="text-gray-800 mt-0.5 line-clamp-3">{formData.abstract}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Authors:</span>
                  <p className="text-gray-800 mt-0.5">
                    {session?.user?.name}
                    {formData.coAuthors.length > 0 && `, ${formData.coAuthors.map((a) => a.name).join(", ")}`}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Manuscript:</span>
                  <p className="text-green-600 mt-0.5">✓ Uploaded</p>
                </div>
                {formData.coverLetterUrl && (
                  <div>
                    <span className="font-semibold text-gray-600">Cover Letter:</span>
                    <p className="text-green-600 mt-0.5">✓ Uploaded</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={prevStep} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50">
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "🚀 Submit Manuscript"}
                </button>
              </div>
            </div>
          )}
        </div>
    </>
  );
}