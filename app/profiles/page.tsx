import type { Metadata } from "next";
import { ProfilesCatalog } from "@/components/site/profiles-catalog";
import { BreadcrumbJsonLd } from "@/components/site/json-ld";
import { QuoteProvider } from "@/components/site/quote-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  FOOTER_LINK_SLOTS,
  NAV_LINK_SLOTS,
  syncLinksToSlots,
} from "@/lib/cms/nav-slots";
import { compareProfiles } from "@/lib/cms/profile-sort";
import { getSiteContent } from "@/lib/cms/queries";
import { normalizeQuoteFormSettings } from "@/lib/cms/quote-form";
import {
  DEFAULT_PROFILES_PAGE_SEO,
  mergePageSeo,
} from "@/lib/cms/page-seo-defaults";
import {
  applyPageSeoMetadata,
  loadSeoContext,
  resolvePageOgImage,
} from "@/lib/cms/seo-metadata";
import { mediaUrlFromMap } from "@/lib/cms/urls";
import type { PageProfiles, Profile } from "@/lib/cms/types";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, ogImage, snapshot } = await loadSeoContext();
  const pageSeo = mergePageSeo(
    DEFAULT_PROFILES_PAGE_SEO,
    snapshot?.page_profiles?.seo,
  );
  const pageOg = resolvePageOgImage(snapshot?.media, pageSeo, ogImage);
  return applyPageSeoMetadata(seo, pageOg, pageSeo, {
    fallbackTitle: DEFAULT_PROFILES_PAGE_SEO.title,
    fallbackDescription: DEFAULT_PROFILES_PAGE_SEO.description,
    fallbackOgTitle: DEFAULT_PROFILES_PAGE_SEO.og_title,
    fallbackOgDescription: DEFAULT_PROFILES_PAGE_SEO.og_description,
    fallbackPath: "/profiles",
  });
}

const defaultPage: PageProfiles = {
  id: 1,
  horizontal: {
    headline: "Horizontal profiles",
    helper: "Hover on profile to learn more",
  },
  vertical: {
    headline: "Vertical profiles",
    helper: "Hover on profile to learn more",
  },
  universal: {
    headline: "Universal profiles",
    helper: "Hover on profile to learn more",
  },
  soffit: {
    headline: "Soffit and fascia",
    helper: "Hover on profile to learn more",
  },
  quote_cta_label: "Request a quote",
  manual_cta_label: "",
};

export default async function ProfilesPage() {
  const snapshot = await getSiteContent();

  if (!snapshot) {
    return (
      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center bg-bg-primary px-6 py-24 text-center"
      >
        <h1 className="font-display text-4xl font-bold tracking-wide text-brand-primary uppercase">
          Koda Siding
        </h1>
        <p className="mt-4 max-w-md text-base text-text-primary/80">
          Content is not synced yet. Save any section in admin to go live.
        </p>
      </main>
    );
  }

  const { settings, page_profiles, profiles, media } = snapshot;
  const page: PageProfiles = {
    ...defaultPage,
    ...page_profiles,
    universal: page_profiles?.universal ?? defaultPage.universal,
    soffit: page_profiles?.soffit ?? defaultPage.soffit,
  };
  const nav = {
    ...settings.nav,
    links: syncLinksToSlots(NAV_LINK_SLOTS, settings.nav.links),
  };
  const footer = {
    ...settings.footer,
    links: syncLinksToSlots(FOOTER_LINK_SLOTS, settings.footer.links),
  };

  const withMedia = (list: Profile[]) =>
    list.map((profile) => ({
      ...profile,
      exposure: profile.exposure ?? "",
      face_width: profile.face_width ?? "",
      depth: profile.depth ?? "",
      install: profile.install ?? "",
      imageUrl: mediaUrlFromMap(media, profile.image_media_id),
      diagramUrl: mediaUrlFromMap(media, profile.diagram_media_id),
    }));

  const catalog = [...(profiles ?? [])].sort(compareProfiles);
  const horizontal = withMedia(
    catalog.filter((p) => p.orientation === "horizontal"),
  );
  const vertical = withMedia(
    catalog.filter((p) => p.orientation === "vertical"),
  );
  const universal = withMedia(
    catalog.filter((p) => p.orientation === "universal"),
  );
  const soffit = withMedia(
    catalog.filter((p) => p.orientation === "soffit"),
  );

  return (
    <QuoteProvider form={normalizeQuoteFormSettings(settings.quote_form)}>
      <BreadcrumbJsonLd
        seo={settings.seo}
        items={[
          { name: "Home", path: "/" },
          { name: "Profiles", path: "/profiles" },
        ]}
      />
      <div className="flex min-h-full flex-col bg-bg-primary">
        <SiteHeader nav={nav} forceSolid />
        <main id="main" className="flex-1">
          <ProfilesCatalog
            page={page}
            horizontal={horizontal}
            vertical={vertical}
            universal={universal}
            soffit={soffit}
          />
        </main>
        <SiteFooter footer={footer} logoAlt={nav.logo_alt} />
      </div>
    </QuoteProvider>
  );
}
