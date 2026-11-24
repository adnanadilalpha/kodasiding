import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/site/json-ld";
import { InstallationDiyPage } from "@/components/site/installation-diy";
import { QuoteProvider } from "@/components/site/quote-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  FALLBACK_INSTALLATION_MANUAL,
  mergeInstallationPage,
} from "@/lib/cms/installation-defaults";
import {
  FOOTER_LINK_SLOTS,
  NAV_LINK_SLOTS,
  syncLinksToSlots,
} from "@/lib/cms/nav-slots";
import { getSiteContent } from "@/lib/cms/queries";
import { normalizeQuoteFormSettings } from "@/lib/cms/quote-form";
import {
  DEFAULT_INSTALLATION_PAGE_SEO,
  mergePageSeo,
} from "@/lib/cms/page-seo-defaults";
import {
  applyPageSeoMetadata,
  loadSeoContext,
  resolvePageOgImage,
} from "@/lib/cms/seo-metadata";
import { mediaUrlFromMap, publicMediaUrl } from "@/lib/cms/urls";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, ogImage, snapshot } = await loadSeoContext();
  const pageSeo = mergePageSeo(
    DEFAULT_INSTALLATION_PAGE_SEO,
    snapshot?.settings?.pages_seo?.installation,
  );
  const pageOg = resolvePageOgImage(snapshot?.media, pageSeo, ogImage);
  return applyPageSeoMetadata(seo, pageOg, pageSeo, {
    fallbackTitle: DEFAULT_INSTALLATION_PAGE_SEO.title,
    fallbackDescription: DEFAULT_INSTALLATION_PAGE_SEO.description,
    fallbackOgTitle: DEFAULT_INSTALLATION_PAGE_SEO.og_title,
    fallbackOgDescription: DEFAULT_INSTALLATION_PAGE_SEO.og_description,
    fallbackPath: "/installation",
  });
}

export default async function InstallationPage() {
  const snapshot = await getSiteContent();

  if (!snapshot) {
    return (
      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center bg-bg-primary px-6 py-24 text-center"
      >
        <h1 className="font-display text-4xl font-bold tracking-wide text-brand-primary uppercase">
          Installation
        </h1>
        <p className="mt-4 max-w-md text-base text-text-primary/80">
          Content is not synced yet. Save any section in admin to go live.
        </p>
      </main>
    );
  }

  const { settings, home, videos, documents, media } = snapshot;
  const section = mergeInstallationPage(home.videos_section);

  const nav = {
    ...settings.nav,
    links: syncLinksToSlots(NAV_LINK_SLOTS, settings.nav.links),
    show_find_dealer: settings.nav.show_find_dealer === true,
  };
  const footer = {
    ...settings.footer,
    links: syncLinksToSlots(FOOTER_LINK_SLOTS, settings.footer.links),
  };

  const manual = documents.find((d) => d.key === section.manual_document_key);
  const manualUrl = manual
    ? publicMediaUrl(manual.storage_path, manual.bucket)
    : FALLBACK_INSTALLATION_MANUAL;

  const videoThumbs: Record<string, string | null> = {};
  for (const v of videos) {
    if (v.thumbnail_media_id) {
      videoThumbs[v.thumbnail_media_id] = mediaUrlFromMap(
        media,
        v.thumbnail_media_id,
      );
    }
  }

  return (
    <QuoteProvider form={normalizeQuoteFormSettings(settings.quote_form)}>
      <BreadcrumbJsonLd
        seo={settings.seo}
        items={[
          { name: "Home", path: "/" },
          { name: "Installation", path: "/installation" },
        ]}
      />
      <div className="flex min-h-full flex-col bg-bg-primary">
        <SiteHeader nav={nav} forceSolid />
        <main id="main" className="flex-1">
          <InstallationDiyPage
            section={section}
            videos={videos}
            thumbs={videoThumbs}
            manualUrl={manualUrl}
          />
        </main>
        <SiteFooter footer={footer} logoAlt={nav.logo_alt} />
      </div>
    </QuoteProvider>
  );
}
