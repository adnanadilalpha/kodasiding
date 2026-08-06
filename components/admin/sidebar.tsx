"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { lockBodyScroll } from "@/lib/dom/lock-body-scroll";

const pages = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/home", label: "Home" },
  { href: "/admin/profiles", label: "Profiles" },
  { href: "/admin/dealer", label: "Find dealer" },
  { href: "/admin/quotes", label: "Quotes" },
] as const;

type ToolItem = { href: string; label: string; ownerOnly?: boolean };

const tools: ToolItem[] = [
  { href: "/admin/email", label: "Email setup", ownerOnly: true },
  { href: "/admin/settings", label: "Site settings" },
  { href: "/admin/admins", label: "Admins", ownerOnly: true },
];

export function AdminSidebar({
  email,
  role,
}: {
  email: string;
  role: "owner" | "editor";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const visibleTools = tools.filter(
    (item) => !item.ownerOnly || role === "owner",
  );

  const currentLabel =
    [...pages, ...visibleTools].find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.label ?? "Admin";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const unlock = lockBodyScroll();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function signOut() {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function linkClass(href: string) {
    return `block w-full rounded-[9px] px-3 py-2.5 text-base leading-none transition ${
      isActive(href)
        ? "bg-accent-warm text-text-primary"
        : "text-text-inverse hover:bg-white/8"
    }`;
  }

  function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex flex-1 flex-col gap-5 p-4" aria-label="Admin">
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-none text-[#ddddd7]">Pages</p>
          <div className="flex w-full max-w-37.5 flex-col gap-2.5">
            {pages.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm leading-none text-[#ddddd7]">System</p>
          <div className="flex w-full max-w-37.5 flex-col gap-2.5">
            {visibleTools.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Small screens — compact header + drawer */}
      <header
        className={`flex shrink-0 items-center gap-3 bg-brand-primary px-4 py-3 md:hidden ${
          menuOpen ? "relative z-60" : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/koda-logo.svg"
          alt="Koda Siding"
          width={84}
          height={23}
          className="h-5.75 w-auto shrink-0"
        />
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-inverse">
          {currentLabel}
        </p>
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-[9px] text-text-inverse transition hover:bg-white/8"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <span className="relative block size-4" aria-hidden>
              <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 bg-current" />
              <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 bg-current" />
            </span>
          ) : (
            <span className="flex flex-col gap-1" aria-hidden>
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          )}
        </button>
      </header>

      {menuOpen ? (
        <div
          id={menuId}
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Admin menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-10 flex h-full w-[min(100%,18.5rem)] flex-col bg-brand-primary shadow-lg">
            <div className="px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/koda-logo.svg"
                alt="Koda Siding"
                width={84}
                height={23}
                className="h-5.75 w-auto"
              />
            </div>

            <NavGroups onNavigate={() => setMenuOpen(false)} />

            <div className="mt-auto border-t border-white/8 p-4">
              <div className="flex flex-col gap-3 text-base leading-none">
                <p className="truncate text-text-inverse">{email}</p>
                <button
                  type="button"
                  onClick={signOut}
                  className="w-fit text-left text-[#ff383c] transition hover:opacity-80"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop — Figma: 182px rail */}
      <aside className="hidden h-full w-45.5 shrink-0 flex-col bg-brand-primary md:flex">
        <div className="px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/koda-logo.svg"
            alt="Koda Siding"
            width={134}
            height={36}
            className="h-9 w-auto"
          />
        </div>

        <NavGroups />

        <div className="mt-auto border-t border-white/8 p-4">
          <div className="flex flex-col gap-3 text-base leading-none">
            <p className="truncate text-text-inverse">{email}</p>
            <button
              type="button"
              onClick={signOut}
              className="w-fit text-left text-[#ff383c] transition hover:opacity-80"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
