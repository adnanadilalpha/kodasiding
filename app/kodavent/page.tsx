import type { Metadata } from "next";
import { KodaVentCtaSection } from "@/components/site/kodavent-cta";
import { KodaVentHeroSection } from "@/components/site/kodavent-hero";
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
import { plainTextFromRich } from "@/lib/cms/sanitize-rich-text";

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
      parts: raw.product_design?.parts?.length
        ? raw.product_design.parts
        : base.product_design.parts,
    },
    installed: {
      ...base.installed,
      ...raw.installed,
      eyebrow: raw.installed?.eyebrow || base.installed.eyebrow,
      badge_label: raw.installed?.badge_label || base.installed.badge_label,
      figure_title: raw.installed?.figure_title || base.installed.figure_title,
      traits: raw.installed?.traits?.length
        ? raw.installed.traits
        : base.installed.traits,
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

  const packagingImage =
    mediaUrlFromMap(media, page.product_design.image_media_id, FALLBACK_BOX) ??
    FALLBACK_BOX;
  const explodedImage =
    mediaUrlFromMap(
      media,
      page.product_design.exploded_image_media_id ?? page.hero.image_media_id,
      FALLBACK_EXPLODED,
    ) ?? FALLBACK_EXPLODED;
  const installedImage =
    mediaUrlFromMap(
      media,
      page.installed.image_media_id,
      FALLBACK_INSTALLED,
    ) ?? FALLBACK_INSTALLED;

  const heroSection = {
    ...DEFAULT_PAGE_KODAVENT.hero,
    ...page.hero,
    visible: page.hero.visible !== false,
  };

  const designSection = {
    ...DEFAULT_PAGE_KODAVENT.product_design,
    ...page.product_design,
    annotations: page.product_design.annotations?.length
      ? page.product_design.annotations
      : DEFAULT_PAGE_KODAVENT.product_design.annotations,
    parts: page.product_design.parts?.length
      ? page.product_design.parts
      : DEFAULT_PAGE_KODAVENT.product_design.parts,
    visible: page.product_design.visible !== false,
  };

  const installedSection = {
    ...DEFAULT_PAGE_KODAVENT.installed,
    ...page.installed,
    traits: page.installed.traits?.length
      ? page.installed.traits
      : DEFAULT_PAGE_KODAVENT.installed.traits,
    visible: page.installed.visible !== false,
  };

  // Bare store homepages are placeholders, not product links; show them as "coming soon".
  const cmsRetailers = (page.cta.retailers ?? [])
    .filter((r) => r.visible && r.label.trim())
    .map((r) => {
      const href = (r.href || "").trim().toLowerCase().replace(/\/+$/, "");
      const placeholder =
        href === "https://www.amazon.com" || href === "https://amazon.com";
      return {
        ...(placeholder ? { ...r, href: "" } : r),
        logoUrl: r.logo_media_id
          ? mediaUrlFromMap(media, r.logo_media_id)
          : null,
      };
    });

  const ctaSection = {
    ...DEFAULT_PAGE_KODAVENT.cta,
    ...page.cta,
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
          plainTextFromRich(heroSection.description) ||
          "4-inch exhaust vent cover from KODA Siding."
        }
        imageUrl={packagingImage}
        path="/kodavent"
      />
      <div className="flex min-h-full flex-col bg-bg-primary">
        <SiteHeader nav={nav} forceSolid />
        <main id="main" className="flex-1">
          <KodaVentHeroSection
            hero={heroSection}
            imageUrl={explodedImage}
            imageAlt={
              heroSection.image_alt ||
              "KodaVent exhaust vent cover with the cover lifted off the flange"
            }
          />
          <KodaVentProductDesignSection
            section={designSection}
            imageUrl={installedImage}
            imageAlt={
              installedSection.image_alt ||
              "KodaVent installed on finished siding"
            }
            badgeLabel={installedSection.badge_label}
            caption={installedSection.caption}
            figureTitle={installedSection.figure_title}
            documents={documents}
          />
          <KodaVentInstallationSection
            section={page.installation}
            media={media}
            documents={documents}
          />
          <KodaVentCtaSection
            cta={ctaSection}
            imageUrl={packagingImage}
            imageAlt={
              designSection.image_alt || "KodaVent retail packaging"
            }
            imageCaption={designSection.image_caption}
          />
        </main>
        <SiteFooter footer={footer} logoAlt={nav.logo_alt} tone="dark" />
      </div>
    </QuoteProvider>
  );
}
