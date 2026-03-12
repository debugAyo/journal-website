import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export const metadata = {
  title: "Editorial Board | IJECCET",
  description:
    "Meet the editorial board of the International Journal of Electronics, Computing, Communications Engineering and Technologies",
};

/* ── Static editorial board data ── */

const editorInChief = {
  name: "Dr. Suleiman Zubair",
  role: "Editor-in-Chief",
  responsibility: "Overall academic and ethical oversight",
  affiliation: "HOD, TME — Federal University of Technology, Minna",
  email: "zubairman@futminna.edu.ng",
  phone: "+234 703 193 7355",
};

const managingEditors = [
  {
    name: "Dr. Michael David",
    email: "mikeforheaven@futminna.edu.ng",
    phone: "+234 803 346 9642",
  },
  {
    name: "Dr. Stephen S. Oyewobi",
    email: "oyewobistephen@futminna.edu.ng",
    phone: "+234 703 862 7625",
  },
  {
    name: "Dr. Waheed M. Audu",
    email: "audum@futminna.edu.ng",
    phone: "+234 806 571 1113",
  },
];

const sectionEditors = [
  { name: "Dr. Alakali Babawuya" },
  { name: "Dr. J. A. Ajiboye" },
  { name: "Dr. Ahmed Aliyu" },
];

const advisoryBoard = {
  description:
    "Comprising senior academics and accomplished experts from the School of Electrical Engineering and Technology (SEET), including professors and supervisors of doctoral researchers.",
};

const reviewPanel = {
  description:
    "Postgraduate coordinators across all SEET departments serve as peer reviewers, ensuring every submission undergoes rigorous quality evaluation.",
};

/* ── Helpers ── */

function initials(name) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ContactLine({ email, phone }) {
  if (!email && !phone) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {email && (
        <a
          href={`mailto:${email}`}
          className="text-[#8ec6c0] hover:text-white transition-colors"
        >
          {email}
        </a>
      )}
      {phone && <span className="text-white/60">{phone}</span>}
    </div>
  );
}

function ContactLineDark({ email, phone }) {
  if (!email && !phone) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {email && (
        <a
          href={`mailto:${email}`}
          className="text-[var(--primary-600)] hover:text-[var(--primary-800)] transition-colors"
        >
          {email}
        </a>
      )}
      {phone && (
        <span className="text-[var(--gray-400)]">{phone}</span>
      )}
    </div>
  );
}

/* ── Page ── */

export default function EditorialBoardPage() {
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
          <h1 className="mt-4 text-4xl md:text-5xl font-bold mb-4">
            Editorial Board
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Meet the distinguished scholars guiding IJECCET&apos;s editorial
            vision and upholding the highest standards of academic publishing.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-10">
        {/* ─── Editor-in-Chief ─── */}
        <section className="rounded-2xl border border-[#23635d] bg-[linear-gradient(135deg,#1f6d68_0%,#175653_55%,#124543_100%)] p-8 md:p-10 text-white shadow-xl shadow-[#124543]/30">
          <div className="flex items-center gap-2 mb-6">
            <span className="rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Leadership
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-8">Editor-in-Chief</h2>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-xl bg-white/15 ring-1 ring-white/30 flex items-center justify-center backdrop-blur-sm text-xl font-bold shrink-0">
              {initials(editorInChief.name)}
            </div>
            <div>
              <p className="text-xl font-semibold">{editorInChief.name}</p>
              <p className="text-[#cfe8e5] text-sm mt-0.5">
                {editorInChief.affiliation}
              </p>
              <p className="text-white/60 text-sm mt-1">
                {editorInChief.responsibility}
              </p>
              <ContactLine
                email={editorInChief.email}
                phone={editorInChief.phone}
              />
            </div>
          </div>
        </section>

        {/* ─── Managing Editors ─── */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-md">
          <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-2 flex items-center gap-2">
            <span className="w-1 h-6 rounded-full bg-[var(--primary-600)]" />
            Managing Editors
          </h2>
          <p className="text-[var(--gray-500)] text-sm mb-6">
            Handle day-to-day workflow, communications and journal operations
            (TME Journal Committee)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {managingEditors.map((editor) => (
              <div
                key={editor.name}
                className="rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] p-5 transition-colors hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-lg bg-[linear-gradient(135deg,#1f6d68_0%,#2f8b83_65%,#4ea69e_100%)] flex items-center justify-center text-white text-sm font-bold">
                    {initials(editor.name)}
                  </div>
                  <p className="font-medium text-[var(--gray-900)]">
                    {editor.name}
                  </p>
                </div>
                <ContactLineDark email={editor.email} phone={editor.phone} />
              </div>
            ))}
          </div>
        </section>

        {/* ─── Section Editors ─── */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-md">
          <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-2 flex items-center gap-2">
            <span className="w-1 h-6 rounded-full bg-[var(--accent-400)]" />
            Section Editors
          </h2>
          <p className="text-[var(--gray-500)] text-sm mb-6">
            Oversee submissions within specific disciplines and topic areas (PG
            Coordinators, SEET)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sectionEditors.map((editor) => (
              <div
                key={editor.name}
                className="flex items-center gap-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] p-4 transition-colors hover:border-[var(--accent-400)]/40 hover:bg-[#faf6ef]"
              >
                <div className="w-10 h-10 rounded-lg bg-[linear-gradient(135deg,#b98547_0%,#d5a66a_100%)] flex items-center justify-center text-white text-sm font-bold">
                  {initials(editor.name)}
                </div>
                <p className="font-medium text-[var(--gray-900)]">
                  {editor.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Advisory Board & Peer Review Panel ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Advisory Board */}
          <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-[var(--primary-100)] text-[var(--primary-700)] flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.466.89 6.062 2.346m0-14.304a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.346m0-14.304v14.304"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-2">
              Advisory Board
            </h2>
            <p className="text-[var(--gray-600)] text-sm leading-relaxed">
              {advisoryBoard.description}
            </p>
          </section>

          {/* Peer Review Panel */}
          <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-[#f7efe3] text-[#8f6030] flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-2">
              Peer Review Panel
            </h2>
            <p className="text-[var(--gray-600)] text-sm leading-relaxed">
              {reviewPanel.description}
            </p>
          </section>
        </div>

        {/* ─── Become a Reviewer CTA ─── */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[linear-gradient(130deg,#ffffff_0%,#f8f4ed_100%)] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-[var(--primary-100)] text-[var(--primary-700)] flex items-center justify-center flex-shrink-0">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-2">
                Become a Reviewer
              </h2>
              <p className="text-[var(--gray-600)]">
                IJECCET welcomes applications from qualified researchers to join
                our panel of peer reviewers. If you&apos;re interested in
                contributing to the peer review process, register an account and
                contact the editorial office.
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
