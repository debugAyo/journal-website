import Link from "next/link";

export default function HomeBar({ backHref = "/dashboard", backLabel = "Back to Dashboard" }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <span aria-hidden="true">←</span>
        {backLabel}
      </Link>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        <span aria-hidden="true">🏠</span>
        Home
      </Link>
    </div>
  );
}
