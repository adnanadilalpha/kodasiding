import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you requested could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg-primary px-6 py-24 text-center">
      <h1 className="font-display text-4xl font-bold tracking-wide text-brand-primary uppercase">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-base text-text-primary/80">
        That page doesn’t exist or is no longer available.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-md bg-accent-warm px-8 py-3 text-base text-text-primary"
      >
        Back to home
      </Link>
    </main>
  );
}
