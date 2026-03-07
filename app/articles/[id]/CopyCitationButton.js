"use client";

export default function CopyCitationButton({ citation }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(citation);
  };

  return (
    <button
      onClick={handleCopy}
      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
    >
      Copy APA Citation
    </button>
  );
}
