import type { Metadata } from "next";
import { AboutContact } from "@/components/site/about-contact";
import { BreadcrumbJsonLd } from "@/components/site/json-ld";
import { QuoteProvider } from "@/components/site/quote-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  FOOTER_LINK_SLOTS,
  NAV_LINK_SLOTS,
  syncLinksToSlots,
} from "@/lib/cms/nav-slots";
import {
  DEFAULT_ABOUT_PAGE_SEO,
  mergeAboutPage,
  mergePageSeo,
  mergePagesSeoBag,
} from "@/lib/cms/page-seo-defaults";
import { getSiteContent } from "@/lib/cms/queries";
import { normalizeQuoteFormSettings } from "@/lib/cms/quote-form";
import {
  applyPageSeoMetadata,
  loadSeoContext,
  resolvePageOgImage,
} from "@/lib/cms/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, ogImage, snapshot } = await loadSeoContext();
  const pageSeo = mergePageSeo(
    DEFAULT_ABOUT_PAGE_SEO,
    mergePagesSeoBag(snapshot?.settings?.pages_seo).about_seo,
  );
  const pageOg = resolvePageOgImage(snapshot?.media, pageSeo, ogImage);
  return applyPageSeoMetadata(seo, pageOg, pageSeo, {
    fallbackTitle: DEFAULT_ABOUT_PAGE_SEO.title,
    fallbackDescription: DEFAULT_ABOUT_PAGE_SEO.description,
    fallbackOgTitle: DEFAULT_ABOUT_PAGE_SEO.og_title,
    fallbackOgDescription: DEFAULT_ABOUT_PAGE_SEO.og_description,
    fallbackPath: "/about",
  });
}

export default async function AboutPage() {
  const snapshot = await getSiteContent();
  const settings = snapshot?.settings;
  const nav = {
    ...(settings?.nav ?? {
      logo_alt: "Koda Siding",
      links: [],
      find_dealer_label: "Find a dealer",
      find_dealer_href: "/find-dealer",
      show_find_dealer: false,
      quote_label: "Request a quote",
    }),
    links: syncLinksToSlots(NAV_LINK_SLOTS, settings?.nav.links),
  };
  const footer = {
    ...(settings?.footer ?? {
      tagline: "",
      copyright: "",
      links: [],
      social: [],
    }),
    links: syncLinksToSlots(FOOTER_LINK_SLOTS, settings?.footer.links),
  };
  const about = mergeAboutPage(settings?.pages_seo?.about);

  return (
    <QuoteProvider form={normalizeQuoteFormSettings(settings?.quote_form)}>
      {settings?.seo ? (
        <BreadcrumbJsonLd
          seo={settings.seo}
          items={[
            { name: "Home", path: "/" },
            { name: "Contact", path: "/about" },
          ]}
        />
      ) : null}
      <div className="flex min-h-full flex-col bg-bg-secondary">
        <SiteHeader nav={nav} forceSolid />
        <main id="main" className="flex-1 pt-16 lg:pt-24">
          <AboutContact copy={about} />
        </main>
        <SiteFooter footer={footer} logoAlt={nav.logo_alt} />
      </div>
    </QuoteProvider>
  );
}
