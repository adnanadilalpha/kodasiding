"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const pages = [
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
  const visibleTools = tools.filter(
    (item) => !item.ownerOnly || role === "owner",
  );

  async function signOut() {
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

  return (
    <>
      {/* Small screens */}
      <header className="flex shrink-0 items-center gap-3 bg-brand-primary px-4 py-3 md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/koda-logo.svg"
          alt="Koda Siding"
          width={84}
          height={23}
          className="h-5.75 w-auto shrink-0"
        />
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="Admin">
          {[...pages, ...visibleTools].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-[9px] px-2.5 py-2 text-sm ${
                isActive(item.href)
                  ? "bg-accent-warm text-text-primary"
                  : "text-text-inverse"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={signOut}
          className="shrink-0 text-sm text-[#ff383c]"
        >
          Sign out
        </button>
      </header>

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

        <nav className="flex flex-1 flex-col gap-5 p-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-none text-[#ddddd7]">Pages</p>
            <div className="flex w-37.5 flex-col gap-2.5">
              {pages.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(item.href)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm leading-none text-[#ddddd7]">System</p>
            <div className="flex w-37.5 flex-col gap-2.5">
              {visibleTools.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(item.href)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

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
