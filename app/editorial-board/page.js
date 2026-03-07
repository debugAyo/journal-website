import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Editorial Board | UJ",
  description: "Meet the editorial board of Ubuntu Journal",
};

async function getEditorialBoard() {
  try {
    const editors = await prisma.user.findMany({
      where: { role: { in: ["EDITOR", "ADMIN"] } },
      select: { id: true, name: true, affiliation: true, role: true },
      orderBy: { name: "asc" },
    });
    return editors;
  } catch (error) {
    console.error("Error fetching editorial board:", error);
    return [];
  }
}

export default async function EditorialBoardPage() {
  const editors = await getEditorialBoard();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(110%_140%_at_10%_0%,#1f6d68_0%,#124543_46%,#1f1b17_100%)] text-white py-20">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#7dc4bd]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#d5a66a]/20 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
            Journal Leadership
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold mb-4">Editorial Board</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Meet the distinguished scholars guiding Ubuntu Journal&apos;s editorial vision
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Editor-in-Chief */}
        <div className="rounded-2xl border border-[#23635d] bg-[linear-gradient(135deg,#1f6d68_0%,#175653_55%,#124543_100%)] p-8 text-white mb-8 shadow-xl shadow-[#124543]/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="rounded-full border border-white/35 bg-white/15 px-3 py-1 text-sm font-medium">Leadership</span>
          </div>
          <h2 className="text-2xl font-bold mb-6">Editor-in-Chief</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/15 ring-1 ring-white/30 flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <p className="text-xl font-semibold">Editorial Team</p>
              <p className="text-[#cfe8e5]">Ubuntu Journal</p>
            </div>
          </div>
        </div>

        {/* Associate Editors */}
        {editors.length > 0 ? (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 mb-8 shadow-md">
            <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-6 flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-[var(--primary-600)]"></span>
              Editorial Board Members
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editors.map((editor) => (
                <div
                  key={editor.id}
                  className="flex items-center gap-4 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] p-4 transition-colors hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[linear-gradient(135deg,#1f6d68_0%,#2f8b83_65%,#4ea69e_100%)] flex items-center justify-center text-white font-bold">
                    {editor.name?.charAt(0) || "E"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--gray-900)]">{editor.name}</p>
                    {editor.affiliation && (
                      <p className="text-[var(--gray-500)] text-sm">{editor.affiliation}</p>
                    )}
                  </div>
                  {editor.role === "ADMIN" && (
                    <span className="rounded-full border border-[#d8c2a0] bg-[#f7efe3] px-2 py-1 text-xs font-medium text-[#8f6030]">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center mb-8 shadow-md">
            <span className="text-5xl block mb-4">👥</span>
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">Growing Our Team</h3>
            <p className="text-[var(--gray-500)]">
              Our editorial board is being assembled. Check back soon!
            </p>
          </div>
        )}

        {/* Become a Reviewer CTA */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[linear-gradient(130deg,#ffffff_0%,#f8f4ed_100%)] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-[var(--primary-100)] text-[var(--primary-700)] flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">📝</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-2">Become a Reviewer</h2>
              <p className="text-[var(--gray-600)]">
                UJ welcomes applications from qualified researchers to join our panel of peer reviewers.
                If you&apos;re interested in contributing to the peer review process, register an
                account and contact the editorial office.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="whitespace-nowrap rounded-lg bg-[var(--primary-600)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[var(--primary-700)]/20 transition hover:-translate-y-0.5 hover:bg-[var(--primary-700)]"
            >
              Register Interest
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
