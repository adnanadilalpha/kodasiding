"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { SiteNav } from "@/lib/cms/types";
import { isProfilesHref } from "@/lib/cms/nav-slots";
import { scrollToHash } from "@/lib/cms/scroll-to-hash";
import { lockBodyScroll } from "@/lib/dom/lock-body-scroll";
import { useQuote } from "@/components/site/quote-provider";

export function SiteHeader({
  nav,
  forceSolid = false,
}: {
  nav: SiteNav;
  forceSolid?: boolean;
}) {
  const { openQuote } = useQuote();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const showDealer = nav.show_find_dealer === true;
  const solidNav =
    forceSolid ||
    scrolled ||
    menuOpen ||
    pathname === "/profiles" ||
    pathname === "/find-dealer";

  useEffect(() => {
    if (!menuOpen) return;
    return lockBodyScroll();
  }, [menuOpen]);

  useEffect(() => {
    function update() {
      setScrolled(window.scrollY > 0);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  function onNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (scrollToHash(href)) {
      event.preventDefault();
      closeMenu();
    }
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 transition-colors duration-300 ${menuOpen ? "z-60" : "z-40"} ${
        solidNav ? "bg-brand-primary-active" : "bg-transparent"
      }`}
      style={{
        paddingRight: "var(--scroll-lock-compensation, 0px)",
      }}
    >
      <div
        className={`relative flex h-16 items-center justify-between gap-4 px-page lg:h-24 ${menuOpen ? "z-60" : ""}`}
      >
        <Link
          href="/"
          className={`shrink-0 ${menuOpen ? "invisible lg:visible" : ""}`}
          aria-label={nav.logo_alt || "Koda Siding"}
          tabIndex={menuOpen ? -1 : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/koda-logo.svg"
            alt={nav.logo_alt || "Koda Siding"}
            width={134}
            height={36}
            className="h-8 w-auto lg:h-10"
          />
        </Link>

        <nav className="hidden items-center gap-10 lg:flex" aria-label="Primary">
          {nav.links.map((link) => {
            const isProfiles = isProfilesHref(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => onNavClick(e, link.href)}
                className={
                  isProfiles
                    ? "text-base font-medium text-text-inverse uppercase"
                    : "text-base text-text-inverse"
                }
              >
                {isProfiles ? `${link.label} →` : link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-8 lg:flex">
          {showDealer ? (
            <Link
              href={nav.find_dealer_href}
              className="font-display text-base text-text-inverse uppercase underline decoration-from-font"
            >
              {nav.find_dealer_label}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={openQuote}
            className="rounded-md border border-border-strong bg-bg-primary px-8 py-3 font-display text-base whitespace-nowrap text-brand-primary uppercase"
          >
            {nav.quote_label}
          </button>
        </div>

        <button
          type="button"
          className="flex size-10 items-center justify-center text-text-inverse lg:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <span className="relative block size-5" aria-hidden>
              <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 bg-text-inverse" />
              <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 bg-text-inverse" />
            </span>
          ) : (
            <span className="flex flex-col gap-1.5" aria-hidden>
              <span className="block h-0.5 w-6 bg-text-inverse" />
              <span className="block h-0.5 w-6 bg-text-inverse" />
              <span className="block h-0.5 w-6 bg-text-inverse" />
            </span>
          )}
        </button>
      </div>

      <div
        className={`border-b border-white/10 ${menuOpen ? "max-lg:border-transparent" : ""}`}
      />

      {menuOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          {/* Exposed page strip — click closes */}
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu"
            onClick={closeMenu}
          />

          {/* Figma: 273/390 ≈ 70% mobile, 624/744 ≈ 84% tablet */}
          <div className="relative z-10 flex h-full w-[70%] flex-col bg-brand-primary-active px-8 py-16 sm:w-[84%]">
            <div className="flex min-h-0 flex-1 flex-col items-center justify-between">
              <Link
                href="/"
                className="shrink-0 self-start"
                aria-label={nav.logo_alt || "Koda Siding"}
                onClick={closeMenu}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/koda-logo.svg"
                  alt={nav.logo_alt || "Koda Siding"}
                  width={160}
                  height={44}
                  className="h-14 w-auto sm:h-32"
                />
              </Link>

              <nav
                className="flex flex-col items-center gap-12 sm:gap-16"
                aria-label="Mobile"
              >
                {nav.links.map((link) => {
                  const isProfiles = isProfilesHref(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => onNavClick(e, link.href)}
                      className={
                        isProfiles
                          ? "text-[26px] leading-none font-medium whitespace-nowrap text-text-inverse uppercase sm:text-[56px]"
                          : "text-[32px] leading-none whitespace-nowrap text-text-inverse sm:text-[64px]"
                      }
                    >
                      {isProfiles ? `${link.label} →` : link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex w-full shrink-0 flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-12">
                {showDealer ? (
                  <Link
                    href={nav.find_dealer_href}
                    className="font-display text-base whitespace-nowrap text-text-inverse uppercase underline decoration-from-font"
                    onClick={closeMenu}
                  >
                    {nav.find_dealer_label}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    openQuote();
                  }}
                  className="rounded-md border border-border-strong bg-bg-primary px-6 py-3 font-display text-base leading-none whitespace-nowrap text-brand-primary uppercase sm:px-8"
                >
                  {nav.quote_label}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
