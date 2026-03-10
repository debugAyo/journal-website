import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AutoRefresh from "./AutoRefresh";

async function getDashboardStats(userEmail, role) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) return { stats: {}, recentActivity: [] };

    let stats = {};
    let recentActivity = [];

    // Author stats
    const submissions = await prisma.submission.findMany({
      where: { submittedBy: user.id },
      select: { articleId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const articleIds = submissions.map((s) => s.articleId);
    const articles = articleIds.length
      ? await prisma.article.findMany({
          where: { id: { in: articleIds } },
          select: { id: true, title: true, status: true },
        })
      : [];

    const articleMap = new Map(articles.map((a) => [a.id, a]));

    const mySubmissions = submissions.length;
    const underReview = articles.filter(
      (a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW"
    ).length;
    const published = articles.filter((a) => a.status === "PUBLISHED").length;

    stats.mySubmissions = mySubmissions;
    stats.underReview = underReview;
    stats.published = published;

    // Recent activity
    recentActivity = submissions.slice(0, 5).map((s) => {
      const article = articleMap.get(s.articleId);
      return {
        type: "submission",
        title: article?.title || "Untitled",
        status: article?.status || "DRAFT",
        date: s.createdAt,
      };
    });

    if (role === "REVIEWER") {
      const reviews = await prisma.review.findMany({
        where: { reviewerId: user.id },
        select: { id: true, status: true, createdAt: true, articleId: true },
        orderBy: { createdAt: "desc" },
      });

      stats.pendingInvitations = reviews.filter((r) => r.status === "INVITED").length;
      stats.activeReviews = reviews.filter((r) => r.status === "ACCEPTED").length;
      stats.completedReviews = reviews.filter(
        (r) => r.status === "COMPLETED" || r.status === "DECLINED"
      ).length;

      // Get review activity
      const reviewArticleIds = reviews.slice(0, 5).map((r) => r.articleId);
      const reviewArticles = reviewArticleIds.length
        ? await prisma.article.findMany({
            where: { id: { in: reviewArticleIds } },
            select: { id: true, title: true },
          })
        : [];
      const reviewArticleMap = new Map(reviewArticles.map((a) => [a.id, a]));

      if (reviews.length > submissions.length) {
        recentActivity = reviews.slice(0, 5).map((r) => ({
          type: "review",
          title: reviewArticleMap.get(r.articleId)?.title || "Untitled",
          status: r.status,
          date: r.createdAt,
        }));
      }
    }

    if (role === "EDITOR") {
      const [newSubmissions, underReviewCount, awaitingDecision] = await Promise.all([
        prisma.article.count({ where: { status: "SUBMITTED" } }),
        prisma.article.count({ where: { status: "UNDER_REVIEW" } }),
        prisma.article.count({ where: { status: "ACCEPTED" } }),
      ]);

      stats.newSubmissions = newSubmissions;
      stats.editorUnderReview = underReviewCount;
      stats.awaitingDecision = awaitingDecision;
    }

    if (role === "ADMIN") {
      const [totalArticles, totalUsers, publishedCount] = await Promise.all([
        prisma.article.count(),
        prisma.user.count(),
        prisma.article.count({ where: { status: "PUBLISHED" } }),
      ]);

      stats.totalArticles = totalArticles;
      stats.totalUsers = totalUsers;
      stats.adminPublished = publishedCount;
    }

    return { stats, recentActivity };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return { stats: {}, recentActivity: [] };
  }
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  const role = session?.user?.role || "AUTHOR";
  const displayName = session?.user?.name || session?.user?.email || "User";

  const { stats, recentActivity } = await getDashboardStats(session.user.email, role);

  // Get role-specific dashboard links
  const getDashboardLinks = () => {
    const baseLinks = [
      { href: "/dashboard/my-submissions", label: "My Submissions", icon: "📄" },
      { href: "/dashboard/submit", label: "Submit Manuscript", icon: "✏️" },
    ];

    const roleLinks = {
      REVIEWER: [
        { href: "/dashboard/reviewer", label: "Review Dashboard", icon: "📋" },
      ],
      EDITOR: [
        { href: "/dashboard/editor", label: "Editor Dashboard", icon: "📊" },
      ],
      ADMIN: [
        { href: "/dashboard/admin", label: "Admin Dashboard", icon: "⚙️" },
        { href: "/dashboard/admin/users", label: "Manage Users", icon: "👥" },
        { href: "/dashboard/admin/issues", label: "Manage Issues", icon: "📚" },
      ],
    };

    return [...baseLinks, ...(roleLinks[role] || [])];
  };

  return (
    <>
      <AutoRefresh intervalMs={15000} />

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {displayName.split(" ")[0]}
        </h1>
        <p className="text-gray-500">
          You are logged in as{" "}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eaf5f4] text-[#175653] capitalize">
            {role.toLowerCase()}
          </span>
        </p>
      </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {role === "AUTHOR" && (
            <>
              <DashboardCard title="My Submissions" value={stats.mySubmissions || 0} icon="📝" color="blue" />
              <DashboardCard title="Under Review" value={stats.underReview || 0} icon="🔍" color="amber" />
              <DashboardCard title="Published" value={stats.published || 0} icon="✅" color="emerald" />
            </>
          )}
          {role === "REVIEWER" && (
            <>
              <DashboardCard title="Pending Invitations" value={stats.pendingInvitations || 0} icon="📬" color="amber" />
              <DashboardCard title="Active Reviews" value={stats.activeReviews || 0} icon="📋" color="blue" />
              <DashboardCard title="Completed" value={stats.completedReviews || 0} icon="✅" color="emerald" />
            </>
          )}
          {role === "EDITOR" && (
            <>
              <DashboardCard title="New Submissions" value={stats.newSubmissions || 0} icon="📨" color="blue" />
              <DashboardCard title="Under Review" value={stats.editorUnderReview || 0} icon="🔍" color="amber" />
              <DashboardCard title="Awaiting Decision" value={stats.awaitingDecision || 0} icon="⏳" color="rose" />
            </>
          )}
          {role === "ADMIN" && (
            <>
              <DashboardCard title="Total Articles" value={stats.totalArticles || 0} icon="📚" color="blue" />
              <DashboardCard title="Total Users" value={stats.totalUsers || 0} icon="👥" color="emerald" />
              <DashboardCard title="Published" value={stats.adminPublished || 0} icon="📖" color="purple" />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getDashboardLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[#ddd6ca] hover:border-[#b98547] hover:bg-[#fbf6ee] transition-all duration-200 group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {link.icon}
                </span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#175653] text-center">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <span className="text-4xl block mb-3">📭</span>
              <p>No recent activity to show</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((activity, index) => (
                <div key={index} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xl flex-shrink-0">
                      {activity.type === "submission" ? "📄" : "📋"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-sm text-gray-500">
                        {activity.type === "submission" ? "Manuscript" : "Review"} •{" "}
                        {new Date(activity.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                      activity.status === "PUBLISHED"
                        ? "bg-purple-100 text-purple-700"
                        : activity.status === "ACCEPTED" || activity.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : activity.status === "REJECTED" || activity.status === "DECLINED"
                        ? "bg-red-100 text-red-700"
                        : activity.status === "UNDER_REVIEW" || activity.status === "INVITED"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {(activity.status || "DRAFT").replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
  );
}

function DashboardCard({ title, value, icon, color }) {
  const colors = {
    blue: "from-[#1f6d68] to-[#2f8b83] shadow-[#1f6d68]/20",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/20",
    amber: "from-[#b98547] to-[#8f6030] shadow-[#8f6030]/20",
    rose: "from-rose-500 to-rose-600 shadow-rose-500/20",
    purple: "from-[#2a6f85] to-[#175653] shadow-[#175653]/20",
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-6 hover:shadow-lg hover:border-[var(--gray-300)] transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 flex-shrink-0 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}