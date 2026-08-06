import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unavailable",
  robots: { index: false, follow: false },
};

export default function UnavailablePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg-primary px-6 py-24 text-center">
      <h1 className="font-display text-4xl font-bold tracking-wide text-brand-primary uppercase">
        Not available in your region
      </h1>
      <p className="mt-4 max-w-md text-base text-text-primary/80">
        Koda Siding is currently available to visitors in the United States,
        Canada, and other regions selected by the site owner.
      </p>
    </main>
  );
}
