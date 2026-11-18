"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { SiteNav } from "@/lib/cms/types";
import { normalizeLinkHref } from "@/lib/cms/nav-slots";
import { scrollToHash } from "@/lib/cms/scroll-to-hash";
import { lockBodyScroll } from "@/lib/dom/lock-body-scroll";
import { useQuote } from "@/components/site/quote-provider";

function linkKind(href: string): { kind: "hash"; id: string } | { kind: "path"; path: string } {
  const normalized = normalizeLinkHref(href);
  if (normalized.startsWith("/#") || normalized.startsWith("#")) {
    return { kind: "hash", id: normalized.replace(/^\/?#/, "") };
  }
  const path = normalized.split(/[?#]/)[0] || "/";
  return { kind: "path", path };
}

function navLinkClass(active: boolean, mobile: boolean) {
  if (mobile) {
    return active
      ? "text-[32px] leading-none font-medium whitespace-nowrap text-text-inverse uppercase sm:text-[64px]"
      : "text-[32px] leading-none whitespace-nowrap text-text-inverse/55 uppercase sm:text-[64px]";
  }
  return active
    ? "text-base font-medium text-text-inverse"
    : "text-base text-text-inverse/60 transition hover:text-text-inverse";
}

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
  const [activeHash, setActiveHash] = useState<string | null>(null);
  const showDealer = nav.show_find_dealer === true;
  const onHome = pathname === "/";
  const solidNav =
    forceSolid ||
    scrolled ||
    menuOpen ||
    pathname === "/profiles" ||
    pathname === "/find-dealer" ||
    pathname === "/kodavent";

  useEffect(() => {
    if (!menuOpen) return;
    return lockBodyScroll();
  }, [menuOpen]);

  useEffect(() => {
    function update() {
      setScrolled(window.scrollY > 8);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Scroll-spy home sections so hash nav items reflect the current section.
  useEffect(() => {
    if (!onHome) {
      setActiveHash(null);
      return;
    }

    const hashIds = nav.links
      .map((link) => linkKind(link.href))
      .filter((k): k is { kind: "hash"; id: string } => k.kind === "hash")
      .map((k) => k.id);

    const uniqueIds = [...new Set(hashIds)].filter(Boolean);
    if (uniqueIds.length === 0) return;

    function readUrlHash() {
      const hash = window.location.hash.replace(/^#/, "");
      return hash && uniqueIds.includes(hash) ? hash : null;
    }

    // Prefer URL hash immediately (covers /kodavent → /#why-koda navigations).
    const initialHash = readUrlHash();
    if (initialHash) {
      setActiveHash(initialHash);
      const target = document.getElementById(initialHash);
      if (target) {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "auto", block: "start" });
          setActiveHash(initialHash);
        });
      }
    }

    function onHashChange() {
      const next = readUrlHash();
      if (next) setActiveHash(next);
    }
    window.addEventListener("hashchange", onHashChange);

    const elements = uniqueIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) {
      return () => window.removeEventListener("hashchange", onHashChange);
    }

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }

        const urlHash = readUrlHash();

        let bestId: string | null = null;
        let bestRatio = 0;
        for (const id of uniqueIds) {
          const ratio = ratios.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        // Near top of home (hero) — clear only when there's no hash target.
        if (window.scrollY < 80 && !urlHash) {
          setActiveHash(null);
          return;
        }

        // While a hash is in the URL, keep that item active until another
        // section clearly takes the viewport (user scrolled away).
        if (urlHash) {
          const hashRatio = ratios.get(urlHash) ?? 0;
          if (hashRatio > 0 || bestId === urlHash || bestRatio < 0.15) {
            setActiveHash(urlHash);
            return;
          }
        }

        setActiveHash(bestRatio > 0.08 ? bestId : urlHash);
      },
      {
        rootMargin: "-15% 0px -50% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const el of elements) observer.observe(el);

    // After cross-page nav, the browser may scroll to the hash a tick later.
    // Re-assert active once layout/scroll settle.
    const settle = window.setTimeout(() => {
      const hash = readUrlHash();
      if (hash) setActiveHash(hash);
    }, 100);

    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("hashchange", onHashChange);
      observer.disconnect();
    };
  }, [onHome, nav.links]);

  function isActive(href: string) {
    const kind = linkKind(href);
    if (kind.kind === "path") {
      return pathname === kind.path || pathname.startsWith(`${kind.path}/`);
    }
    return onHome && activeHash === kind.id;
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function onNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    void import("@/lib/analytics/track-client").then(
      ({ trackAnalyticsEvent }) => {
        void trackAnalyticsEvent("nav_click", {
          label: href,
          metadata: { href },
        });
      },
    );

    const kind = linkKind(href);
    if (kind.kind === "hash") {
      event.preventDefault();
      closeMenu();
      if (onHome) {
        if (scrollToHash(href)) setActiveHash(kind.id);
        return;
      }
      // Cross-page: App Router often drops hash on soft nav — full assign
      // lands on the section and lets the home spy seed the active item.
      window.location.assign(`/#${kind.id}`);
      return;
    }

    closeMenu();
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 ${menuOpen ? "z-60" : "z-40"} ${
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
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => onNavClick(e, link.href)}
                aria-current={active ? "page" : undefined}
                className={navLinkClass(active, false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-8 lg:flex">
          {showDealer ? (
            <Link
              href={nav.find_dealer_href}
              aria-current={
                pathname === nav.find_dealer_href ? "page" : undefined
              }
              className={`font-display text-base uppercase underline decoration-from-font ${
                pathname === nav.find_dealer_href
                  ? "text-text-inverse"
                  : "text-text-inverse/70 hover:text-text-inverse"
              }`}
            >
              {nav.find_dealer_label}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={openQuote}
            className="rounded-md border border-transparent bg-white px-8 py-3 font-display text-base whitespace-nowrap text-text-primary uppercase"
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
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu"
            onClick={closeMenu}
          />

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
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => onNavClick(e, link.href)}
                      aria-current={active ? "page" : undefined}
                      className={navLinkClass(active, true)}
                    >
                      {link.label}
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
                  className="rounded-md border border-transparent bg-white px-6 py-3 font-display text-base leading-none whitespace-nowrap text-text-primary uppercase sm:px-8"
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
