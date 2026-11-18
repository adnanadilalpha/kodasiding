import type { Metadata } from "next";
import { KodaVentCtaSection } from "@/components/site/kodavent-cta";
import { KodaVentHeroSection } from "@/components/site/kodavent-hero";
import { KodaVentInstalledSection } from "@/components/site/kodavent-installed";
import { KodaVentInstallationSection } from "@/components/site/kodavent-installation";
import { KodaVentProductDesignSection } from "@/components/site/kodavent-product-design";
import {
  BreadcrumbJsonLd,
  ProductJsonLd,
} from "@/components/site/json-ld";
import { QuoteProvider } from "@/components/site/quote-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { DEFAULT_PAGE_KODAVENT } from "@/lib/cms/kodavent-defaults";
import {
  FOOTER_LINK_SLOTS,
  NAV_LINK_SLOTS,
  syncLinksToSlots,
} from "@/lib/cms/nav-slots";
import { getSiteContent } from "@/lib/cms/queries";
import { normalizeQuoteFormSettings } from "@/lib/cms/quote-form";
import {
  absoluteUrl,
  buildPageMetadata,
  loadSeoContext,
  parseSiteUrl,
} from "@/lib/cms/seo-metadata";
import { mediaUrlFromMap } from "@/lib/cms/urls";
import type { MediaAsset, PageKodaVent } from "@/lib/cms/types";

function mergePage(raw: PageKodaVent | null | undefined): PageKodaVent {
  const base = DEFAULT_PAGE_KODAVENT;
  if (!raw) return base;
  return {
    id: raw.id ?? 1,
    hero: { ...base.hero, ...raw.hero },
    product_design: {
      ...base.product_design,
      ...raw.product_design,
      annotations:
        raw.product_design?.annotations ?? base.product_design.annotations,
    },
    installed: { ...base.installed, ...raw.installed },
    installation: {
      ...base.installation,
      ...raw.installation,
      methods: raw.installation?.methods ?? base.installation.methods,
    },
    cta: { ...base.cta, ...raw.cta },
    seo: { ...base.seo, ...raw.seo },
    updated_at: raw.updated_at,
  };
}

/** Map design annotations → install-step illustrations from the same snapshot. */
function resolveDesignDetailImages(
  page: PageKodaVent,
  media: Record<string, MediaAsset>,
): Record<string, string | null> {
  const methods = page.installation?.methods ?? [];
  const nc = methods.find((m) => m.id === "new-construction") ?? methods[0];
  const rt = methods.find((m) => m.id === "retrofit") ?? methods[1];

  const stepImage = (
    method: (typeof methods)[number] | undefined,
    number: string,
  ) => {
    const step = method?.steps?.find((s) => s.number === number);
    return mediaUrlFromMap(media, step?.image_media_id ?? null);
  };

  return {
    "ann-flange": stepImage(nc, "10"),
    "ann-seal": stepImage(nc, "05"),
    "ann-retrofit": stepImage(rt, "01"),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { seo, ogImage, snapshot } = await loadSeoContext();
  const page = mergePage(snapshot?.page_kodavent);
  const pageSeo = page.seo;
  const pageOg =
    mediaUrlFromMap(snapshot?.media ?? {}, pageSeo.og_image_media_id) ||
    mediaUrlFromMap(snapshot?.media ?? {}, page.hero.image_media_id) ||
    ogImage;
  const path = pageSeo.canonical_path?.trim() || "/kodavent";
  const description =
    pageSeo.description?.trim() ||
    page.hero.description ||
    seo.description;
  const absoluteTitle =
    pageSeo.title?.trim() ||
    "KodaVent | 4-Inch Exhaust Vent Cover | KODA Siding";
  const ogTitle = pageSeo.og_title?.trim() || absoluteTitle;
  const ogDescription = pageSeo.og_description?.trim() || description;

  const base = buildPageMetadata(seo, pageOg, {
    title: "KodaVent",
    description,
    path,
  });

  const metadataBase = parseSiteUrl(seo.site_url);
  const canonical = absoluteUrl(metadataBase, path);

  return {
    ...base,
    title: { absolute: absoluteTitle },
    description,
    alternates: { canonical },
    openGraph: {
      ...base.openGraph,
      title: ogTitle,
      description: ogDescription,
      url: canonical,
    },
    twitter: {
      ...base.twitter,
      title: ogTitle,
      description: ogDescription,
    },
  };
}

export default async function KodaVentPage() {
  const snapshot = await getSiteContent();

  if (!snapshot) {
    return (
      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center bg-bg-primary px-6 py-24 text-center"
      >
        <h1 className="font-display text-4xl font-bold tracking-wide text-brand-primary uppercase">
          KodaVent
        </h1>
        <p className="mt-4 max-w-md text-base text-text-primary/80">
          Content is not synced yet. Save any section in admin to go live.
        </p>
      </main>
    );
  }

  const { settings, page_kodavent, documents, media } = snapshot;
  const page = mergePage(page_kodavent);
  const nav = {
    ...settings.nav,
    links: syncLinksToSlots(NAV_LINK_SLOTS, settings.nav.links),
  };
  const footer = {
    ...settings.footer,
    links: syncLinksToSlots(FOOTER_LINK_SLOTS, settings.footer.links),
  };

  const heroImage = mediaUrlFromMap(media, page.hero.image_media_id);
  const installedImage = mediaUrlFromMap(media, page.installed.image_media_id);
  const productImage = heroImage;

  // Distinct install drawings (not the hero product) paired to each design callout.
  const detailImages = resolveDesignDetailImages(page, media);

  return (
    <QuoteProvider form={normalizeQuoteFormSettings(settings.quote_form)}>
      <BreadcrumbJsonLd
        seo={settings.seo}
        items={[
          { name: "Home", path: "/" },
          { name: "KodaVent", path: "/kodavent" },
        ]}
      />
      <ProductJsonLd
        seo={settings.seo}
        name="KodaVent"
        description={
          page.seo.description ||
          page.hero.description ||
          "4-inch exhaust vent cover from KODA Siding."
        }
        imageUrl={productImage}
        path="/kodavent"
      />
      <div className="flex min-h-full flex-col bg-bg-primary">
        <SiteHeader nav={nav} forceSolid />
        <main id="main" className="flex-1">
          <KodaVentHeroSection hero={page.hero} imageUrl={heroImage} />
          <KodaVentProductDesignSection
            section={page.product_design}
            detailImages={detailImages}
          />
          <KodaVentInstalledSection
            section={page.installed}
            imageUrl={installedImage}
          />
          <KodaVentInstallationSection
            section={page.installation}
            media={media}
            documents={documents}
          />
          <KodaVentCtaSection cta={page.cta} />
        </main>
        <SiteFooter footer={footer} logoAlt={nav.logo_alt} />
      </div>
    </QuoteProvider>
  );
}
