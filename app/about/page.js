import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export const metadata = {
  title: "About | IJECCET",
  description: "About IJECCET - our mission, scope, and publication ethics",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(115%_135%_at_12%_0%,#1f6d68_0%,#124543_45%,#1f1b17_100%)] py-20 text-white">
        <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-[#7dc4bd]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-[#d5a66a]/20 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About IJECCET</h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Advancing knowledge through open scholarship and rigorous peer review
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <Section
            icon="🎯"
            title="Mission Statement"
            content={
              <p className="leading-relaxed text-[var(--gray-600)]">
                The International Journal of Electronics, Computing, Communications Engineering
                and Technologies (IJECCET) is dedicated to the advancement of knowledge through
                the publication of high-quality, peer-reviewed research articles, reviews, and scholarly
                works. Our mission is to provide an open-access platform for researchers, academics,
                and professionals to share their findings with the global community.
              </p>
            }
          />

          <Section
            icon="📚"
            title="Scope"
            content={
              <>
                <p className="mb-4 leading-relaxed text-[var(--gray-600)]">
                  IJECCET publishes original research across its core disciplines, including but not limited to:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Electronics Engineering",
                    "Computer Science",
                    "Communications Engineering",
                    "Information Technology",
                    "Embedded Systems",
                    "Emerging Technologies",
                  ].map((field) => (
                    <div key={field} className="flex items-center gap-2 text-[var(--gray-600)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--primary-500)]"></span>
                      {field}
                    </div>
                  ))}
                </div>
              </>
            }
          />

          <Section
            icon="🔬"
            title="Peer Review Process"
            content={
              <div className="space-y-4">
                <p className="leading-relaxed text-[var(--gray-600)]">
                  All submissions undergo rigorous double-blind peer review. Each manuscript is evaluated
                  by at least two independent reviewers with expertise in the relevant field.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ProcessStep number="1" title="Submission" description="Author submits manuscript through our portal" />
                  <ProcessStep number="2" title="Review" description="Double-blind peer review by experts" />
                  <ProcessStep number="3" title="Decision" description="Editorial decision within 4-6 weeks" />
                </div>
              </div>
            }
          />

          <Section
            icon="🌍"
            title="Open Access Policy"
            content={
              <p className="leading-relaxed text-[var(--gray-600)]">
                UJ is committed to open access publishing. All articles are freely available to read,
                download, and share under the Creative Commons Attribution (CC BY) license. We believe
                that open access promotes the widest possible dissemination of research findings and
                maximizes their impact on scholarship and practice.
              </p>
            }
          />

          <Section
            icon="⚖️"
            title="Publication Ethics"
            content={
              <p className="leading-relaxed text-[var(--gray-600)]">
                IJECCET adheres to the highest standards of publication ethics as outlined by the Committee
                on Publication Ethics (COPE). We take allegations of misconduct seriously and have
                established procedures for investigating and addressing ethical concerns, including
                plagiarism, data fabrication, and conflicts of interest.
              </p>
            }
          />

          <Section
            icon="📧"
            title="Contact"
            content={
              <div className="flex items-center gap-4">
                <a
                  href="mailto:ijeccet@futminna.edu.ng"
                  className="inline-flex items-center gap-2 font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  ijeccet@futminna.edu.ng
                </a>
              </div>
            }
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Section({ icon, title, content }) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-100)] text-[var(--primary-700)]">
          <span className="text-2xl">{icon}</span>
        </div>
        <h2 className="text-xl font-semibold text-[var(--gray-900)]">{title}</h2>
      </div>
      {content}
    </div>
  );
}

function ProcessStep({ number, title, description }) {
  return (
    <div className="rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] p-4 text-center">
      <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-600)] text-sm font-bold text-white">
        {number}
      </div>
      <h4 className="mb-1 font-semibold text-[var(--gray-900)]">{title}</h4>
      <p className="text-sm text-[var(--gray-500)]">{description}</p>
    </div>
  );
}
