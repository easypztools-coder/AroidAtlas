"use client";

import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  explore: {
    title: "Explore",
    links: [
      { label: "Species Database", href: "/plants" },
      { label: "Genera", href: "/plants" },
      { label: "Collections", href: "/collections" },
      { label: "Compare Tool", href: "/compare" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Care Guides", href: "/learn" },
      { label: "Identification", href: "/identify" },
      { label: "Price Data", href: "/learn" },
      { label: "Glossary", href: "/learn" },
    ],
  },
  about: {
    title: "About",
    links: [
      { label: "Mission", href: "/about" },
      { label: "Methodology", href: "/about" },
      { label: "Contributors", href: "/about" },
      { label: "Contact", href: "/about" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="relative border-t border-primary/10 bg-gradient-to-b from-background to-forest-dark">
      <div className="section-container py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand + Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo.png"
                alt="Ariod Atlas"
                width={140}
                height={38}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-3 text-xs text-muted leading-relaxed max-w-xs">
              The definitive visual encyclopedia of rare tropical plants.
            </p>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-xs font-medium text-heading mb-2">
                Stay updated
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 rounded-lg border border-primary/10 bg-card/60 px-3 py-2 text-xs text-heading placeholder-muted/50 outline-none transition-all duration-300 focus:border-primary/30 focus:bg-card"
                />
                <button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-background transition-all duration-300 hover:bg-primary-dark">
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-heading uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted transition-colors duration-200 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-primary/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted/60">
            &copy; {new Date().getFullYear()} Ariod Atlas. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Social Icons */}
            <a href="#" className="text-muted/40 hover:text-primary transition-colors duration-200" aria-label="Twitter">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.3174 10.7743L19.1457 4H17.7646L12.6839 9.88256L8.66188 4H4L10.1247 12.8957L4 20H5.38113L10.7535 13.7878L15.016 20H19.6779L13.3171 10.7743H13.3174ZM11.5049 12.9666L10.8988 12.0833L5.89329 5.03921H8.00229L12.0467 10.884L12.6528 11.7674L17.7652 19.0108H15.6562L11.5049 12.9669V12.9666Z" />
              </svg>
            </a>
            <a href="#" className="text-muted/40 hover:text-primary transition-colors duration-200" aria-label="Instagram">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
              </svg>
            </a>
            <a href="#" className="text-muted/40 hover:text-primary transition-colors duration-200" aria-label="GitHub">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}