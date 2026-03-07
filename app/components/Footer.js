import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const socialLinks = [
    { key: "x", href: siteConfig.socialLinks?.x, label: "X" },
    { key: "linkedin", href: siteConfig.socialLinks?.linkedin, label: "LinkedIn" },
    { key: "github", href: siteConfig.socialLinks?.github, label: "GitHub" },
  ].filter((item) => Boolean(item.href));

  const quickLinks = [
    { href: "/issues", label: "Browse Issues" },
    { href: "/submit", label: "Submit Manuscript" },
    { href: "/about", label: "About Us" },
    { href: "/editorial-board", label: "Editorial Board" },
  ];

  const authorLinks = [
    { href: "/submit", label: "Author Guidelines" },
    { href: "/auth/register", label: "Register" },
    { href: "/auth/login", label: "Login" },
    { href: "/auth/login?callbackUrl=/dashboard", label: "Dashboard" },
  ];

  return (
    <footer className="mt-16 border-t border-[var(--gray-200)] bg-[linear-gradient(180deg,#f7f3ec_0%,#f2ece2_55%,#e8dfd0_100%)] text-[var(--gray-800)]">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#175653] via-[#2a6f85] to-[#8f6030] rounded-xl flex items-center justify-center shadow-lg shadow-[#175653]/20">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <div>
                <span className="text-xl font-bold text-[var(--gray-900)] block">{siteConfig.brand.name}</span>
                <span className="text-xs text-[var(--gray-500)] uppercase tracking-widest">{siteConfig.brand.tagline}</span>
              </div>
            </div>
            <p className="text-[var(--gray-600)] text-sm leading-relaxed mb-6">
              An open-access peer-reviewed academic publication committed to advancing knowledge 
              and promoting scholarly excellence across disciplines.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 bg-white/80 border border-[var(--gray-300)] rounded-full text-[var(--gray-700)] font-medium">
                ISSN: {siteConfig.brand.issn}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-[var(--gray-600)] hover:text-[var(--primary-700)] transition-colors duration-200 text-sm flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 text-[var(--gray-400)] group-hover:text-[var(--primary-600)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Authors */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-4">
              For Authors
            </h4>
            <ul className="space-y-3">
              {authorLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-[var(--gray-600)] hover:text-[var(--primary-700)] transition-colors duration-200 text-sm flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 text-[var(--gray-400)] group-hover:text-[var(--primary-600)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Resources */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-4">
              Get in Touch
            </h4>
            <div className="space-y-4">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-3 text-[var(--gray-600)] hover:text-[var(--primary-700)] transition-colors group"
              >
                <div className="w-10 h-10 bg-white border border-[var(--gray-300)] rounded-lg flex items-center justify-center group-hover:bg-[var(--primary-600)] group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm">{siteConfig.contact.email}</span>
              </a>
              
              {/* Social Links */}
              <div className="pt-4">
                <p className="text-xs text-[var(--gray-500)] uppercase tracking-wider mb-3">Follow Us</p>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.key}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white border border-[var(--gray-300)] hover:bg-[var(--primary-600)] hover:text-white rounded-lg flex items-center justify-center transition-colors"
                      aria-label={social.label}
                    >
                      {social.key === "x" && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      )}
                      {social.key === "linkedin" && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      )}
                      {social.key === "github" && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--gray-300)] bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[var(--gray-600)] text-sm">
              © {currentYear} {siteConfig.brand.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-[var(--gray-600)]">
              <span>{siteConfig.footerCredits.text}</span>
              <svg className="w-4 h-4 text-[var(--accent-500)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-[var(--primary-700)] font-semibold">
                {siteConfig.footerCredits.authorName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
