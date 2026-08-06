import type { Metadata } from "next";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { buildRootMetadata } from "@/lib/cms/seo-metadata";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body
        className="flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:rounded-md focus:bg-bg-primary focus:px-4 focus:py-2 focus:text-brand-primary focus:shadow-lg"
        >
          Skip to content
        </a>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
