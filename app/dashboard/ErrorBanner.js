"use client";

const ERROR_MAP = {
  "Failed to fetch": "We're having trouble connecting to the server. Please check your internet connection and try again.",
  "Failed to load": "Unable to load data at this time. Please refresh the page or try again later.",
  "NetworkError": "A network error occurred. Please check your connection.",
  "AbortError": "The request took too long. Please try again.",
  "timed out": "The request took too long to complete. Please try again.",
  "500": "Something went wrong on our end. Our team has been notified.",
  "401": "Your session may have expired. Please sign in again.",
  "403": "You don't have permission to perform this action.",
  "404": "The requested resource could not be found.",
};

function friendlyMessage(rawError) {
  if (!rawError) return "Something unexpected happened. Please try again.";
  const lower = rawError.toLowerCase();
  for (const [key, msg] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key.toLowerCase())) return msg;
  }
  // Strip debug info and technical jargon for production
  if (lower.includes("[debug:") || lower.includes("exception:") || lower.includes("module")) {
    return "Something went wrong. Please try again or contact support if the issue persists.";
  }
  return rawError;
}

export default function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;

  const message = friendlyMessage(error);

  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6" role="alert">
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p className="text-sm flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-0.5 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
