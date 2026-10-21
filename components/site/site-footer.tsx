"use client";

import Link from "next/link";
import type { SiteFooter as SiteFooterData } from "@/lib/cms/types";
import { isProfilesHref } from "@/lib/cms/nav-slots";
import { safeHref } from "@/lib/cms/safe-href";
import { getSocialIcon } from "@/lib/cms/social-icons";
import { scrollToHash } from "@/lib/cms/scroll-to-hash";

export function SiteFooter({
  footer,
  logoAlt,
}: {
  footer: SiteFooterData;
  logoAlt?: string;
}) {
  const brand = logoAlt?.trim() || "Koda Siding";

  return (
    <footer className="border-t border-white/8 bg-bg-secondary py-12 lg:py-16">
      <div className="flex w-full flex-col gap-8 px-page sm:gap-16 lg:gap-16">
        {/* Mobile + tablet: centered stack (Figma). Desktop: split row. */}
        <div className="flex flex-col items-center gap-8 sm:gap-16 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <Link href="/" aria-label={brand} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/koda-logo.svg"
              alt={brand}
              width={206}
              height={56}
              className="h-16 w-auto brightness-0 sm:h-22 lg:h-14"
            />
          </Link>

          <nav
            className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:w-auto sm:gap-x-10 sm:gap-y-4 lg:justify-end"
            aria-label="Footer"
          >
            {footer.links.map((link) => {
              const isProfiles = isProfilesHref(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (scrollToHash(link.href)) e.preventDefault();
                  }}
                  className="text-lg whitespace-nowrap text-text-primary sm:text-2xl lg:text-2xl"
                >
                  {isProfiles ? `${link.label}` : link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {footer.social?.length ? (
          <ul className="flex flex-wrap justify-center gap-4 lg:justify-start">
            {footer.social.map((item) => {
              const Icon = getSocialIcon(item.icon);
              return (
                <li key={`${item.icon}-${item.href}`}>
                  <a
                    href={safeHref(item.href, "#")}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="inline-flex size-10 items-center justify-center text-text-primary transition hover:opacity-70"
                  >
                    <Icon size={22} stroke={1.5} />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}

        {/* Mobile/tablet: tagline then copyright, both centered. Desktop: split. */}
        <div className="flex flex-col items-center gap-6 text-center sm:gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:text-left">
          <p className="order-2 text-sm text-text-primary sm:text-base lg:order-1">
            {footer.copyright}
          </p>
          <p className="order-1 text-sm text-text-primary sm:text-base lg:order-2">
            {footer.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
