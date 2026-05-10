import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export const metadata = {
  title: "Author Guidelines | IJECCET",
  description: "Guidelines for authors submitting to IJECCET",
};

export default function SubmitGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />

      <section className="relative overflow-hidden bg-[radial-gradient(120%_140%_at_8%_0%,#1f6d68_0%,#124543_48%,#1f1b17_100%)] py-16 text-white">
        <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-[#7dc4bd]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#d5a66a]/20 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Author Guidelines</h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Please read these guidelines carefully before submitting your manuscript.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-md">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[var(--gray-900)]">Manuscript Types</h2>
            <ul className="ml-4 list-inside list-disc space-y-2 text-[var(--gray-700)]">
              <li><strong>Original Research:</strong> 3,000-5,000 words, excluding references</li>
              <li><strong>Review Articles:</strong> 4,000-6,000 words, comprehensive literature reviews</li>
              <li><strong>Case Reports:</strong> 1,500-2,500 words, novel clinical cases</li>
              <li><strong>Short Communications:</strong> Up to 1,500 words, preliminary findings</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[var(--gray-900)]">Manuscript Format</h2>
            <ul className="ml-4 list-inside list-disc space-y-2 text-[var(--gray-700)]">
              <li>PDF format required</li>
              <li>Double-spaced text with 12-point font</li>
              <li>Margins of at least 2.5 cm on all sides</li>
              <li>Pages numbered consecutively</li>
              <li>Line numbers throughout (preferred)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[var(--gray-900)]">Manuscript Structure</h2>
            <div className="space-y-3 text-[var(--gray-700)]">
              <p><strong>Title Page:</strong> Include title, author names and affiliations, corresponding author contact details.</p>
              <p><strong>Abstract:</strong> Structured abstract (Background, Methods, Results, Conclusions) of up to 300 words.</p>
              <p><strong>Keywords:</strong> 3-6 keywords for indexing purposes.</p>
              <p><strong>Main Text:</strong> Introduction, Methods, Results, Discussion, Conclusion.</p>
              <p><strong>References:</strong> IEEE style, numbered in order of appearance.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[var(--gray-900)]">Ethical Requirements</h2>
            <ul className="ml-4 list-inside list-disc space-y-2 text-[var(--gray-700)]">
              <li>Ethics committee approval for human/animal studies</li>
              <li>Informed consent for patient-identifiable data</li>
              <li>Declaration of conflicts of interest</li>
              <li>Trial registration for clinical trials (e.g., ClinicalTrials.gov)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[var(--gray-900)]">Submission Process</h2>
            <ol className="ml-4 list-inside list-decimal space-y-2 text-[var(--gray-700)]">
              <li>Create an account or log in to the submission system</li>
              <li>Complete the submission form with manuscript details</li>
              <li>Upload your manuscript as a PDF file</li>
              <li>Add co-author information if applicable</li>
              <li>Submit and await confirmation email</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-[var(--gray-900)]">Review Timeline</h2>
            <p className="text-[var(--gray-700)]">
              Initial editorial screening: 1-2 weeks. Peer review: 4-6 weeks. Decision notification
              will be sent via email. Authors may be asked to revise and resubmit based on
              reviewer feedback.
            </p>
          </section>

          <div className="border-t border-[var(--gray-200)] pt-6">
            <Link
              href="/dashboard/submit"
              className="inline-block rounded-lg bg-[var(--primary-600)] px-8 py-3 font-semibold text-white transition hover:bg-[var(--primary-700)]"
            >
              Submit Your Manuscript
            </Link>
            <p className="mt-3 text-sm text-[var(--gray-500)]">
              You must be logged in to submit a manuscript.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
