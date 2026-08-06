import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FindDealer } from "@/components/site/find-dealer";
import { BreadcrumbJsonLd } from "@/components/site/json-ld";
import { QuoteProvider } from "@/components/site/quote-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  FOOTER_LINK_SLOTS,
  NAV_LINK_SLOTS,
  syncLinksToSlots,
} from "@/lib/cms/nav-slots";
import { getSiteContent } from "@/lib/cms/queries";
import { normalizeQuoteFormSettings } from "@/lib/cms/quote-form";
import {
  buildPageMetadata,
  loadSeoContext,
} from "@/lib/cms/seo-metadata";
import type { Dealer } from "@/lib/cms/types";

const DEALER_DESCRIPTION =
  "Search for a Koda Siding dealer near you by U.S. city or ZIP.";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, ogImage, showFindDealer } = await loadSeoContext();
  if (!showFindDealer) {
    return buildPageMetadata(seo, ogImage, {
      title: "Not found",
      path: "/find-dealer",
      noIndex: true,
    });
  }
  return buildPageMetadata(seo, ogImage, {
    title: "Find a dealer",
    description: DEALER_DESCRIPTION,
    path: "/find-dealer",
  });
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
  const footer = {
    ...settings.footer,
    links: syncLinksToSlots(FOOTER_LINK_SLOTS, settings.footer.links),
  };

  const published: Dealer[] = (dealers ?? []).filter((d) => d.is_published);

  return (
    <QuoteProvider form={normalizeQuoteFormSettings(settings.quote_form)}>
      <BreadcrumbJsonLd
        seo={settings.seo}
        items={[
          { name: "Home", path: "/" },
          { name: "Find a dealer", path: "/find-dealer" },
        ]}
      />
      <div className="flex min-h-full flex-col bg-bg-secondary">
        <SiteHeader nav={nav} forceSolid />
        <main id="main" className="flex-1 pt-16 lg:pt-24">
          <FindDealer dealers={published} />
        </main>
        <SiteFooter footer={footer} logoAlt={nav.logo_alt} />
      </div>
    </QuoteProvider>
  );
}
