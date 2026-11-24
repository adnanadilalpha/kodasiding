import type {
  FindDealerPageCopy,
  PageSeo,
  PagesSeoBag,
} from "@/lib/cms/types";

export const DEFAULT_FIND_DEALER_PAGE_COPY: FindDealerPageCopy = {
  search_placeholder: "Search U.S. city or ZIP",
  search_button_label: "Search",
  quick_search_label: "Quick Search",
  call_label: "Call",
  directions_label: "Directions",
  empty_results: "No dealers near that location yet.",
};

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
  title: "Install it yourself | Koda Siding",
  description:
    "DIY installation guide for Koda fiberglass siding — full manual, profiles, and install videos.",
  og_title: "Install it yourself | Koda Siding",
  og_description:
    "Follow the full Koda installation manual — components, profiles, and step-by-step details.",
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

export function mergeFindDealerPageCopy(
  raw?: Partial<FindDealerPageCopy> | null,
): FindDealerPageCopy {
  return {
    ...DEFAULT_FIND_DEALER_PAGE_COPY,
    ...raw,
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
    find_dealer_copy: mergeFindDealerPageCopy(raw?.find_dealer_copy),
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
