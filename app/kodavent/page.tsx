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
  applyPageSeoMetadata,
  loadSeoContext,
  resolvePageOgImage,
} from "@/lib/cms/seo-metadata";
import { mediaUrlFromMap } from "@/lib/cms/urls";
import type { PageKodaVent } from "@/lib/cms/types";

const FALLBACK_BOX = "/kodavent/box-hires.webp";
const FALLBACK_EXPLODED = "/kodavent/exploded-hires.webp";
const FALLBACK_INSTALLED = "/kodavent/installed-wall.jpg";

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
    installed: {
      ...base.installed,
      ...raw.installed,
      visible: raw.installed?.visible ?? base.installed.visible,
    },
    installation: {
      ...base.installation,
      ...raw.installation,
      methods: raw.installation?.methods ?? base.installation.methods,
    },
    cta: {
      ...base.cta,
      ...raw.cta,
      retailers: raw.cta?.retailers ?? base.cta.retailers,
    },
    seo: { ...base.seo, ...raw.seo },
    updated_at: raw.updated_at,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { seo, ogImage, snapshot } = await loadSeoContext();
  const page = mergePage(snapshot?.page_kodavent);
  const pageSeo = page.seo;
  const heroOg = mediaUrlFromMap(
    snapshot?.media ?? {},
    page.hero.image_media_id,
  );
  const pageOg = resolvePageOgImage(
    snapshot?.media,
    pageSeo,
    heroOg,
    ogImage,
  );
  return applyPageSeoMetadata(seo, pageOg, pageSeo, {
    fallbackTitle: DEFAULT_PAGE_KODAVENT.seo.title,
    fallbackDescription: DEFAULT_PAGE_KODAVENT.seo.description,
    fallbackOgTitle: DEFAULT_PAGE_KODAVENT.seo.og_title,
    fallbackOgDescription: DEFAULT_PAGE_KODAVENT.seo.og_description,
    fallbackPath: "/kodavent",
  });
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

  const heroVisual = FALLBACK_BOX;
  const explodedImage = FALLBACK_EXPLODED;
  const installedImage = FALLBACK_INSTALLED;

  // Benefit-first story copy (override stale snapshot slogans).
  const heroSection = {
    ...page.hero,
    ...DEFAULT_PAGE_KODAVENT.hero,
    image_media_id: page.hero.image_media_id,
    visible: page.hero.visible !== false,
  };

  const designSection = {
    ...page.product_design,
    ...DEFAULT_PAGE_KODAVENT.product_design,
    image_media_id: page.product_design.image_media_id,
    exploded_image_media_id: page.product_design.exploded_image_media_id,
    annotations: DEFAULT_PAGE_KODAVENT.product_design.annotations,
    visible: page.product_design.visible !== false,
  };

  const installedSection = {
    ...page.installed,
    ...DEFAULT_PAGE_KODAVENT.installed,
    image_media_id: page.installed.image_media_id,
    visible: true,
  };

  // Bare store homepages are placeholders, not product links; show them as "coming soon".
  const cmsRetailers = (page.cta.retailers ?? [])
    .filter((r) => r.visible && r.label.trim())
    .map((r) => {
      const href = (r.href || "").trim().toLowerCase().replace(/\/+$/, "");
      const placeholder =
        href === "https://www.amazon.com" || href === "https://amazon.com";
      return placeholder ? { ...r, href: "" } : r;
    });

  const ctaSection = {
    ...page.cta,
    ...DEFAULT_PAGE_KODAVENT.cta,
    retailers: cmsRetailers.length
      ? cmsRetailers
      : DEFAULT_PAGE_KODAVENT.cta.retailers,
    visible: page.cta.visible !== false,
  };

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
          DEFAULT_PAGE_KODAVENT.seo.description ||
          heroSection.description ||
          "4-inch exhaust vent cover from KODA Siding."
        }
        imageUrl={heroVisual}
        path="/kodavent"
      />
      <div className="flex min-h-full flex-col bg-bg-primary">
        <SiteHeader nav={nav} forceSolid />
        <main id="main" className="flex-1">
          <KodaVentHeroSection
            hero={heroSection}
            imageUrl={explodedImage}
            imageAlt="KodaVent exhaust vent cover with the cover lifted off the flange"
          />
          <KodaVentProductDesignSection
            section={designSection}
            imageUrl={heroVisual}
            imageAlt={heroSection.image_alt || "KodaVent retail packaging"}
            caption="The packaging"
          />
          <KodaVentInstalledSection
            section={installedSection}
            imageUrl={installedImage}
          />
          <KodaVentInstallationSection
            section={page.installation}
            media={media}
            documents={documents}
          />
          <KodaVentCtaSection cta={ctaSection} />
        </main>
        <SiteFooter footer={footer} logoAlt={nav.logo_alt} />
      </div>
    </QuoteProvider>
  );
}
