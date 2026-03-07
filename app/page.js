import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { ArticleCard, SectionHeader, EmptyState } from "@/app/components/ui/Cards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ubuntu Journal | Open-Access Academic Publication",
  description: "An open-access academic journal where researchers publish high-quality peer-reviewed articles.",
};

async function getHomePageData() {
  try {
    // Get latest issue
    const latestIssue = await prisma.issue.findFirst({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
    });

    let latestIssueArticles = [];
    let volume = null;

    if (latestIssue) {
      volume = await prisma.volume.findUnique({
        where: { id: latestIssue.volumeId },
      });

      latestIssueArticles = await prisma.article.findMany({
        where: { issueId: latestIssue.id, status: "PUBLISHED" },
        take: 5,
        orderBy: { publishedAt: "desc" },
      });
    }

    // Homepage articles selected by admin
    const featuredArticles = await prisma.article.findMany({
      where: { status: "PUBLISHED", showOnHomepage: true },
      take: 6,
      orderBy: { publishedAt: "desc" },
    });

    // Fallback if admin has not selected any articles yet
    const recentArticles =
      featuredArticles.length > 0
        ? featuredArticles
        : await prisma.article.findMany({
            where: { status: "PUBLISHED" },
            take: 6,
            orderBy: { publishedAt: "desc" },
          });

    // Get stats
    const [publishedCount, authorCount, issueCount] = await Promise.all([
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.user.count({ where: { role: "AUTHOR" } }),
      prisma.issue.count({ where: { publishedAt: { not: null } } }),
    ]);

    return {
      latestIssue,
      volume,
      latestIssueArticles,
      recentArticles,
      stats: { publishedCount, authorCount, issueCount },
    };
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return {
      latestIssue: null,
      volume: null,
      latestIssueArticles: [],
      recentArticles: [],
      stats: { publishedCount: 0, authorCount: 0, issueCount: 0 },
    };
  }
}

export default async function HomePage() {
  const { latestIssue, volume, latestIssueArticles, recentArticles, stats } =
    await getHomePageData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 gradient-bg" />
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-300/10 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-8 border border-white/20">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Open Access • Peer Reviewed
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Ubuntu Journal
            </h1>
            <p className="text-xl md:text-2xl text-[#d8ece9] mb-3 font-light">
              Advancing Knowledge Through Open Scholarship
            </p>
            <p className="text-amber-100/90 mb-10 text-lg">
              ISSN: XXXX-XXXX (Online)
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/submit"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#175653] hover:bg-[#f0f6f5] font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Submit Your Research
              </Link>
              <Link
                href="/issues"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold px-8 py-4 rounded-xl transition-all duration-300 border border-white/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Browse Issues
              </Link>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatItem icon="articles" value={stats.publishedCount} label="Published Articles" color="primary" />
            <StatItem icon="authors" value={stats.authorCount} label="Contributing Authors" color="accent" />
            <StatItem icon="issues" value={stats.issueCount} label="Published Issues" color="ink" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest Issue - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Issue Card */}
            {latestIssue && volume ? (
              <div
                className="rounded-2xl p-6 text-white shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #103838 0%, #175653 55%, #2f8b83 100%)",
                  boxShadow: "0 20px 38px rgba(16,56,56,0.28)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#bfddd8]">Latest Issue</span>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-1">
                  Volume {volume.volumeNumber}, Issue {latestIssue.issueNumber}
                </h3>
                {latestIssue.title && (
                  <p className="text-[#d8ece9] mb-2">{latestIssue.title}</p>
                )}
                <p className="text-[#bfddd8] text-sm mb-6">
                  {latestIssue.publishedAt &&
                    new Date(latestIssue.publishedAt).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })}
                </p>
                
                <Link
                  href={`/issues/${volume.volumeNumber}/${latestIssue.issueNumber}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
                >
                  View Full Issue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-gray-500 text-center py-4">No issues published yet.</p>
              </div>
            )}

            {/* Articles in this Issue */}
            {latestIssueArticles.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">In This Issue</h4>
                <div className="space-y-1">
                  {latestIssueArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <div className="space-y-2">
                {[
                  { href: "/submit", label: "Author Guidelines", icon: "guidelines" },
                  { href: "/about", label: "Publication Ethics", icon: "ethics" },
                  { href: "/editorial-board", label: "Editorial Board", icon: "board" },
                  { href: "/search", label: "Search Articles", icon: "search" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[var(--primary-50)] border border-[var(--primary-100)] text-[var(--primary-700)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                      <QuickLinkIcon name={link.icon} />
                    </span>
                    <span className="text-gray-700 font-medium group-hover:text-[var(--primary-700)] transition-colors">
                      {link.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Articles - Main Content */}
          <div className="lg:col-span-2">
            <SectionHeader
              title="Featured Articles"
              subtitle="Editor-curated peer-reviewed publications"
              action={{ href: "/issues", label: "View All" }}
            />
            
            {recentArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📄"
                title="No articles yet"
                description="Be the first to publish your research in Ubuntu Journal."
                action={{ href: "/dashboard/submit", label: "Submit Manuscript" }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Publish With Us</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Ubuntu Journal provides a world-class platform for researchers to share their work with a global audience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureItem
              icon={OpenAccessIcon}
              title="Open Access"
              description="Free to read, download, and share under CC BY license"
            />
            <FeatureItem
              icon={ReviewIcon}
              title="Rigorous Review"
              description="Double-blind peer review by expert reviewers"
            />
            <FeatureItem
              icon={FastTrackIcon}
              title="Fast Publication"
              description="4-6 week review process with rapid publication"
            />
            <FeatureItem
              icon={DoiIcon}
              title="DOI Assignment"
              description="Every article receives a unique Digital Object Identifier"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-3xl p-12 overflow-hidden" style={{ background: "linear-gradient(140deg, #1f1b17 0%, #2a342f 60%, #103838 100%)" }}>
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d5a66a]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2f8b83]/30 rounded-full blur-3xl" />
          
          <div className="relative text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Share Your Research?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join our community of researchers and contribute to the advancement of knowledge. 
              Submit your manuscript today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/submit"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl transition-all duration-300"
              >
                Submit Manuscript
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl transition-all duration-300 border border-white/30"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Stat Item Component
function StatItem({ icon, value, label, color }) {
  const colors = {
    primary: "from-[#175653] to-[#2f8b83]",
    accent: "from-[#8f6030] to-[#b98547]",
    ink: "from-[#2c3d4e] to-[#4f6477]",
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-6 hover:shadow-lg hover:border-[var(--gray-300)] transition-all duration-300 group">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-white`}>
          <StatGlyph name={icon} />
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-[var(--gray-500)] text-sm">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Feature Item Component
function FeatureItem({ icon: Icon, title, description }) {
  return (
    <div className="text-center p-6 rounded-2xl border border-transparent hover:border-[var(--gray-200)] hover:bg-[var(--gray-50)] transition-all duration-300 group">
      <div className="w-16 h-16 bg-[var(--primary-50)] border border-[var(--primary-100)] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[var(--primary-600)] group-hover:text-white group-hover:scale-110 transition-all duration-300 text-[var(--primary-700)]">
        <Icon />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-[var(--gray-500)] text-sm">{description}</p>
    </div>
  );
}

function StatGlyph({ name }) {
  switch (name) {
    case "articles":
      return <BookOpenIcon className="w-7 h-7" />;
    case "authors":
      return <ScholarIcon className="w-7 h-7" />;
    case "issues":
      return <ArchiveIcon className="w-7 h-7" />;
    default:
      return <BookOpenIcon className="w-7 h-7" />;
  }
}

function QuickLinkIcon({ name }) {
  switch (name) {
    case "guidelines":
      return <BookOpenIcon className="w-4 h-4" />;
    case "ethics":
      return <ScaleIcon className="w-4 h-4" />;
    case "board":
      return <PeopleIcon className="w-4 h-4" />;
    case "search":
      return <SearchIcon className="w-4 h-4" />;
    default:
      return <BookOpenIcon className="w-4 h-4" />;
  }
}

function OpenAccessIcon() {
  return <GlobeGridIcon className="w-7 h-7" />;
}

function ReviewIcon() {
  return <MicroscopeIcon className="w-7 h-7" />;
}

function FastTrackIcon() {
  return <BoltIcon className="w-7 h-7" />;
}

function DoiIcon() {
  return <TargetIcon className="w-7 h-7" />;
}

function BookOpenIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 6.5v13m0-13c-1.2-.9-2.9-1.4-4.8-1.4C5.4 5.1 3.7 5.6 2.5 6.5v13c1.2-.9 2.9-1.4 4.7-1.4 1.9 0 3.6.5 4.8 1.4m0-13c1.2-.9 2.9-1.4 4.8-1.4 1.8 0 3.5.5 4.7 1.4v13c-1.2-.9-2.9-1.4-4.7-1.4-1.9 0-3.6.5-4.8 1.4" />
    </svg>
  );
}

function ArchiveIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M4 7.5h16M5.5 7.5l1 11h11l1-11M9 11.5h6M9 14.5h6M7 4.5h10" />
    </svg>
  );
}

function ScholarIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M4 9.5L12 5l8 4.5-8 4.5-8-4.5ZM8.5 12v3.4c0 1.3 1.6 2.6 3.5 2.6s3.5-1.3 3.5-2.6V12M19.5 10v4" />
    </svg>
  );
}

function GlobeGridIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" strokeWidth={1.9} />
      <path strokeWidth={1.9} strokeLinecap="round" d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
    </svg>
  );
}

function MicroscopeIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M9 5h4M11 5v4l3 3M8 16h10M6 19h12M7 16a4 4 0 1 1 8 0" />
    </svg>
  );
}

function BoltIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M13.5 3.5 6.5 13h4l-1 7.5L17.5 11h-4l0-7.5Z" />
    </svg>
  );
}

function TargetIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" strokeWidth={1.9} />
      <circle cx="12" cy="12" r="3.5" strokeWidth={1.9} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="m16.5 7.5 2.8-2.8m0 0-1 .1.1 1" />
    </svg>
  );
}

function ScaleIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 5v14M7 8h10M6 8l-2 4h4l-2-4Zm12 0-2 4h4l-2-4ZM9 19h6" />
    </svg>
  );
}

function PeopleIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 1.5a2.5 2.5 0 1 0 0-5M4.5 18a4.5 4.5 0 0 1 9 0M14.5 18a3.5 3.5 0 0 1 5 0" />
    </svg>
  );
}

function SearchIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" strokeWidth={1.9} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="m19 19-3.5-3.5" />
    </svg>
  );
}
