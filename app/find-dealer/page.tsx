import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FindDealer } from "@/components/site/find-dealer";
import { QuoteProvider } from "@/components/site/quote-provider";
import { SiteHeader } from "@/components/site/site-header";
import { NAV_LINK_SLOTS, syncLinksToSlots } from "@/lib/cms/nav-slots";
import { getSiteContent } from "@/lib/cms/queries";
import { normalizeQuoteFormSettings } from "@/lib/cms/quote-form";
import type { Dealer } from "@/lib/cms/types";

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getSiteContent();
  if (snapshot?.settings.nav.show_find_dealer !== true) {
    return { title: "Not found" };
  }
  return {
    title: "Find a dealer",
    description:
      "Search for a Koda Siding dealer near you by U.S. city or ZIP.",
  };
}

export default async function FindDealerPage() {
  const snapshot = await getSiteContent();

  if (!snapshot || snapshot.settings.nav.show_find_dealer !== true) {
    notFound();
  }

  const { settings, dealers } = snapshot;
  const nav = {
    ...settings.nav,
    links: syncLinksToSlots(NAV_LINK_SLOTS, settings.nav.links),
  };

  const published: Dealer[] = (dealers ?? []).filter((d) => d.is_published);

  return (
    <QuoteProvider form={normalizeQuoteFormSettings(settings.quote_form)}>
      <div className="flex min-h-full flex-col bg-bg-secondary">
        <SiteHeader nav={nav} forceSolid />
        <main className="flex-1 pt-16 lg:pt-24">
          <FindDealer dealers={published} />
        </main>
      </div>
    </QuoteProvider>
  );
}
