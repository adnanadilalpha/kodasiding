import type { Metadata } from "next";
import { getSiteContent } from "@/lib/cms/queries";
import { mediaUrlFromMap } from "@/lib/cms/urls";
import type { SiteSeo } from "@/lib/cms/types";

export const DEFAULT_SEO: SiteSeo = {
  title: "Koda Siding",
  title_template: "%s | Koda Siding",
  description:
    "Engineered fiberglass siding with the appearance of wood and performance that lasts a lifetime.",
  site_url: "",
  og_image_media_id: null,
};

export type PageSeoInput = {
  /** Segment title for child pages (uses title template). Omit for home. */
  title?: string;
  description?: string;
  path?: string;
  /** When true, this page is the site root (sets title.default + template). */
  isHome?: boolean;
  noIndex?: boolean;
};

export function parseSiteUrl(siteUrl: string | null | undefined): URL | undefined {
  const raw = siteUrl?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

/** Prefer CMS site URL; fall back to public env / Vercel production host. */
export function resolveSiteUrl(cmsSiteUrl: string | null | undefined): URL | undefined {
  const fromCms = parseSiteUrl(cmsSiteUrl);
  if (fromCms) return fromCms;

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return parseSiteUrl(fromEnv);

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelHost) {
    return parseSiteUrl(
      vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`,
    );
  }

  return undefined;
}

export function absoluteUrl(base: URL | undefined, path = "/") {
  if (!base) return path;
  return new URL(path, base).toString();
}

/** Load CMS SEO + OG image URL from the live snapshot. */
export async function loadSeoContext() {
  const snapshot = await getSiteContent();
  const seo: SiteSeo = {
    ...DEFAULT_SEO,
    ...snapshot?.settings.seo,
  };
  const resolved = resolveSiteUrl(seo.site_url);
  if (resolved) {
    seo.site_url = resolved.origin;
  }
  const ogImage = snapshot
    ? mediaUrlFromMap(snapshot.media, seo.og_image_media_id)
    : null;
  const showFindDealer = snapshot?.settings.nav.show_find_dealer === true;
  return { snapshot, seo, ogImage, showFindDealer };
}

export function buildPageMetadata(
  seo: SiteSeo,
  ogImage: string | null | undefined,
  page: PageSeoInput = {},
): Metadata {
  const metadataBase = parseSiteUrl(seo.site_url);
  const siteName = seo.title || DEFAULT_SEO.title;
  const description =
    page.description?.trim() ||
    seo.description ||
    DEFAULT_SEO.description;
  const path = page.path || "/";
  const canonical = absoluteUrl(metadataBase, path);
  const ogTitle = page.isHome
    ? siteName
    : page.title
      ? `${page.title} | ${siteName}`
      : siteName;

  const images = ogImage
    ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ]
    : undefined;

  const robots = page.noIndex
    ? { index: false, follow: false }
    : { index: true, follow: true };

  const title = page.isHome
    ? {
        default: siteName,
        template: seo.title_template || DEFAULT_SEO.title_template,
      }
    : page.title || siteName;

  return {
    metadataBase,
    title,
    description,
    applicationName: siteName,
    robots,
    alternates: page.noIndex
      ? undefined
      : {
          canonical,
        },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName,
      url: canonical,
      title: ogTitle,
      description,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: ogTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/** Root layout defaults from CMS (title template applies to all child pages). */
export async function buildRootMetadata(): Promise<Metadata> {
  const { seo, ogImage } = await loadSeoContext();
  return buildPageMetadata(seo, ogImage, { isHome: true, path: "/" });
}
