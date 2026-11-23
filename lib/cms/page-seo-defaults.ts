import type { PageSeo, PagesSeoBag } from "@/lib/cms/types";

export const DEFAULT_HOME_PAGE_SEO: PageSeo = {
  title: "Koda Siding | Engineered Fiberglass Siding",
  description:
    "Engineered fiberglass siding with the appearance of wood and performance that lasts a lifetime.",
  og_title: "Koda Siding",
  og_description:
    "Engineered fiberglass siding with the appearance of wood and performance that lasts a lifetime.",
  og_image_media_id: null,
  canonical_path: "/",
};

export const DEFAULT_PROFILES_PAGE_SEO: PageSeo = {
  title: "Profiles | Koda Siding",
  description:
    "Explore Koda horizontal, vertical, universal, and soffit and fascia fiberglass siding profiles.",
  og_title: "Koda Siding Profiles",
  og_description:
    "Explore Koda horizontal, vertical, universal, and soffit and fascia fiberglass siding profiles.",
  og_image_media_id: null,
  canonical_path: "/profiles",
};

export const DEFAULT_INSTALLATION_PAGE_SEO: PageSeo = {
  title: "Installation | Koda Siding",
  description:
    "Siding installation in Omaha and surrounding areas — Koda crews, full replacement, and the online installation manual.",
  og_title: "Siding Installation | Koda Siding",
  og_description:
    "Local Koda crews install fiberglass siding in Omaha and surrounding areas — or download the DIY manual.",
  og_image_media_id: null,
  canonical_path: "/installation",
};

export const DEFAULT_FIND_DEALER_PAGE_SEO: PageSeo = {
  title: "Find a dealer | Koda Siding",
  description:
    "Search for a Koda Siding dealer near you by U.S. city or ZIP.",
  og_title: "Find a Koda Siding dealer",
  og_description:
    "Search for a Koda Siding dealer near you by U.S. city or ZIP.",
  og_image_media_id: null,
  canonical_path: "/find-dealer",
};

export function mergePageSeo(
  defaults: PageSeo,
  raw?: Partial<PageSeo> | null,
): PageSeo {
  return {
    ...defaults,
    ...raw,
    og_image_media_id: raw?.og_image_media_id ?? defaults.og_image_media_id,
    canonical_path:
      raw?.canonical_path?.trim() || defaults.canonical_path,
  };
}

export function mergePagesSeoBag(
  raw?: PagesSeoBag | null,
): PagesSeoBag {
  return {
    installation: mergePageSeo(
      DEFAULT_INSTALLATION_PAGE_SEO,
      raw?.installation,
    ),
    find_dealer: mergePageSeo(DEFAULT_FIND_DEALER_PAGE_SEO, raw?.find_dealer),
  };
}

export function parsePageSeoFromForm(
  formData: FormData,
  fallbackPath: string,
): PageSeo {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    og_title: String(formData.get("og_title") ?? ""),
    og_description: String(formData.get("og_description") ?? ""),
    og_image_media_id: (() => {
      const raw = String(formData.get("og_image_media_id") ?? "").trim();
      return raw || null;
    })(),
    canonical_path:
      String(formData.get("canonical_path") ?? fallbackPath).trim() ||
      fallbackPath,
  };
}
