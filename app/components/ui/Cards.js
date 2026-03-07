import Link from "next/link";

/**
 * Modern Article Card Component
 * Displays article previews with hover effects
 */
export function ArticleCard({ article, variant = "default" }) {
  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  if (variant === "compact") {
    return (
      <Link
        href={`/articles/${article.id}`}
        className="group block py-3 border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50 -mx-4 px-4 rounded-lg"
      >
        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 transition-colors">
          {article.title}
        </h3>
        {formattedDate && (
          <p className="text-sm text-gray-400 mt-1">{formattedDate}</p>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/articles/${article.id}`}
      className="group block bg-white rounded-xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 transition-colors flex-1">
          {article.title}
        </h3>
        <svg
          className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      
      {article.abstract && (
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {article.abstract.slice(0, 150)}...
        </p>
      )}
      
      <div className="flex items-center justify-between">
        {article.keywords && article.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.keywords.slice(0, 2).map((keyword, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full"
              >
                {keyword}
              </span>
            ))}
            {article.keywords.length > 2 && (
              <span className="text-gray-400 text-xs">+{article.keywords.length - 2}</span>
            )}
          </div>
        )}
        {formattedDate && (
          <span className="text-gray-400 text-xs">{formattedDate}</span>
        )}
      </div>
    </Link>
  );
}

/**
 * Stat Card Component
 * Displays statistics with icon and animated number
 */
export function StatCard({ icon, value, label, color = "blue" }) {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      value: "text-blue-600",
    },
    green: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      value: "text-emerald-600",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      value: "text-purple-600",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      value: "text-amber-600",
    },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 ${c.bg} rounded-xl flex items-center justify-center`}>
          <span className={`text-2xl ${c.icon}`}>{icon}</span>
        </div>
        <div>
          <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Card Component
 * Displays features with icon, title, and description
 */
export function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group">
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
        <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * Issue Card Component
 * Displays issue information in a card format
 */
export function IssueCard({ volume, issue }) {
  const formattedDate = issue.publishedAt
    ? new Date(issue.publishedAt).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/issues/${volume.volumeNumber}/${issue.issueNumber}`}
      className="group block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-blue-200 text-sm font-medium">Current Issue</span>
          <h3 className="text-xl font-bold mt-1">
            Volume {volume.volumeNumber}, Issue {issue.issueNumber}
          </h3>
          {issue.title && (
            <p className="text-blue-100 text-sm mt-1">{issue.title}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
      
      {formattedDate && (
        <p className="text-blue-200 text-sm">{formattedDate}</p>
      )}
      
      {issue.articleCount !== undefined && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <span className="text-sm font-medium">{issue.articleCount} Articles</span>
        </div>
      )}
      
      <div className="mt-4 flex items-center gap-2 text-sm font-medium">
        <span>View Issue</span>
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

/**
 * Empty State Component
 * Displays when no content is available
 */
export function EmptyState({ icon = "📭", title, description, action }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
      <span className="text-5xl block mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <Link href={action.href} className="btn-primary inline-flex">
          {action.label}
        </Link>
      )}
    </div>
  );
}

/**
 * Section Header Component
 * Displays section title with optional link
 */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 group"
        >
          {action.label}
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}
