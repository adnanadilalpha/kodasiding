import type { Metadata } from "next";
import { HomeHeroSection } from "@/components/site/home-hero";
import { HomePartnersSection } from "@/components/site/home-partners";
import { HomeProfilesSection } from "@/components/site/home-profiles";
import { HomeStartProject } from "@/components/site/home-start-project";
import { HomeVideosSectionBlock } from "@/components/site/home-videos";
import { HomeWhyKodaSection } from "@/components/site/home-why-koda";
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
import { mediaUrlFromMap, publicMediaUrl } from "@/lib/cms/urls";
import type { SiteSnapshotPayload } from "@/lib/cms/types";

const JEWEL_FALLBACKS = [
  "/landing/jewel-h4.webp",
  "/landing/jewel-h6.webp",
  "/landing/jewel-h8.webp",
  "/landing/jewel-v4.webp",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getSiteContent();
  if (!snapshot) {
    return {
      title: {
        default: "Koda Siding",
        template: "%s | Koda Siding",
      },
      description: "Engineered fiberglass siding",
    };
  }
  const { seo } = snapshot.settings;
  const og = mediaUrlFromMap(snapshot.media, seo.og_image_media_id);
  return {
    title: {
      default: seo.title || "Koda Siding",
      template: seo.title_template || "%s | Koda Siding",
    },
    description: seo.description,
    metadataBase: seo.site_url ? new URL(seo.site_url) : undefined,
    openGraph: og
      ? {
          title: seo.title || "Koda Siding",
          description: seo.description,
          images: [{ url: og }],
        }
      : {
          title: seo.title || "Koda Siding",
          description: seo.description,
        },
  };
}

export default async function HomePage() {
  const snapshot = await getSiteContent();

  if (!snapshot) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-bg-primary px-6 py-24 text-center">
        <p className="font-display text-4xl font-bold tracking-wide text-brand-primary uppercase">
          Koda Siding
        </p>
        <p className="mt-4 max-w-md text-base text-text-primary/80">
          Content is not synced yet. Save any section in admin to go live.
        </p>
      </main>
    );
  }

  return <LandingPage snapshot={snapshot} />;
}

function LandingPage({ snapshot }: { snapshot: SiteSnapshotPayload }) {
  const {
    settings,
    home,
    partners,
    home_profile_jewels,
    videos,
    documents,
    media,
  } = snapshot;

  const nav = {
    ...settings.nav,
    links: syncLinksToSlots(NAV_LINK_SLOTS, settings.nav.links),
    show_find_dealer: settings.nav.show_find_dealer === true,
  };
  const footer = {
    ...settings.footer,
    links: syncLinksToSlots(FOOTER_LINK_SLOTS, settings.footer.links),
  };
  const ctas = {
    ...home.ctas,
    show_dealer: home.ctas.show_dealer === true,
  };
  const showPartners = settings.show_partners !== false;

  const heroImage =
    mediaUrlFromMap(media, home.hero.image_media_id, "/landing/hero.webp")!;
  const whyImage =
    mediaUrlFromMap(
      media,
      home.why_koda.image_media_id,
      "/landing/why-koda.webp",
    )!;
  const quoteImage =
    mediaUrlFromMap(
      media,
      home.ctas.quote.image_media_id,
      "/landing/cta-quote.webp",
    )!;
  const dealerImage =
    mediaUrlFromMap(
      media,
      home.ctas.dealer.image_media_id,
      "/landing/cta-dealer.webp",
    )!;

  const partnerLogos: Record<string, string | null> = {};
  for (const p of partners) {
    if (p.logo_media_id) {
      partnerLogos[p.logo_media_id] = mediaUrlFromMap(media, p.logo_media_id);
    }
  }

  const jewelImages: Record<string, string> = {};
  home_profile_jewels.forEach((jewel, i) => {
    const fallback = JEWEL_FALLBACKS[i % JEWEL_FALLBACKS.length];
    if (jewel.image_media_id) {
      jewelImages[jewel.image_media_id] =
        mediaUrlFromMap(media, jewel.image_media_id, fallback) ?? fallback;
    }
    jewelImages[jewel.id] = fallback;
  });

  const videoThumbs: Record<string, string | null> = {};
  for (const v of videos) {
    if (v.thumbnail_media_id) {
      videoThumbs[v.thumbnail_media_id] = mediaUrlFromMap(
        media,
        v.thumbnail_media_id,
      );
    }
  }

  const manual = documents.find(
    (d) => d.key === home.videos_section.manual_document_key,
  );
  const manualUrl = manual
    ? publicMediaUrl(manual.storage_path, manual.bucket)
    : null;

  return (
    <QuoteProvider form={normalizeQuoteFormSettings(settings.quote_form)}>
      <div className="flex min-h-full flex-col bg-bg-primary">
        <SiteHeader nav={nav} />
        <main className="flex-1">
          <HomeHeroSection hero={home.hero} imageUrl={heroImage} />
          {showPartners ? (
            <HomePartnersSection
              title={settings.partners_title}
              partners={partners}
              logos={partnerLogos}
            />
          ) : null}
          <HomeWhyKodaSection why={home.why_koda} imageUrl={whyImage} />
          <HomeProfilesSection
            teaser={home.profiles_teaser}
            jewels={home_profile_jewels}
            images={jewelImages}
          />
          <HomeVideosSectionBlock
            section={home.videos_section}
            videos={videos}
            thumbs={videoThumbs}
            manualUrl={manualUrl}
          />
          <HomeStartProject
            ctas={ctas}
            quoteImage={quoteImage}
            dealerImage={dealerImage}
          />
        </main>
        <SiteFooter footer={footer} logoAlt={nav.logo_alt} />
      </div>
    </QuoteProvider>
  );
}
