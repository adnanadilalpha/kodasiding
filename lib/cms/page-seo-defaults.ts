import type {
  AboutPageCopy,
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

export const DEFAULT_ABOUT_PAGE_SEO: PageSeo = {
  title: "Contact | Koda Siding",
  description:
    "Contact Koda Siding about fiberglass siding projects, product questions, or how to specify Koda.",
  og_title: "Contact Koda Siding",
  og_description:
    "Write to Koda Siding about a project, a product question, or how to specify Koda.",
  og_image_media_id: null,
  canonical_path: "/about",
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

export const DEFAULT_ABOUT_PAGE: AboutPageCopy = {
  eyebrow: "About us",
  heading: "Koda Siding",
  body: "Koda designs and manufactures engineered fiberglass siding, and our own crews install it. Write to us about a project, a product question, or how to specify Koda.",
  address: "123 Example Street\nOmaha, NE 68102",
  phone: "(402) 555-0100",
  email: "info@kodasiding.com",
  form_heading: "Contact us",
  name_label: "Name",
  email_label: "Email",
  message_label: "Message",
  submit_label: "Send message",
  success_message: "Message sent. We will write back.",
};

export function mergeAboutPage(
  raw?: Partial<AboutPageCopy> | null,
): AboutPageCopy {
  const merged = { ...DEFAULT_ABOUT_PAGE, ...raw };
  return {
    ...merged,
    eyebrow: merged.eyebrow?.trim() || DEFAULT_ABOUT_PAGE.eyebrow,
    heading: merged.heading?.trim() || DEFAULT_ABOUT_PAGE.heading,
    body: merged.body?.trim() || DEFAULT_ABOUT_PAGE.body,
    form_heading: merged.form_heading?.trim() || DEFAULT_ABOUT_PAGE.form_heading,
    name_label: merged.name_label?.trim() || DEFAULT_ABOUT_PAGE.name_label,
    email_label: merged.email_label?.trim() || DEFAULT_ABOUT_PAGE.email_label,
    message_label:
      merged.message_label?.trim() || DEFAULT_ABOUT_PAGE.message_label,
    submit_label: merged.submit_label?.trim() || DEFAULT_ABOUT_PAGE.submit_label,
    success_message:
      merged.success_message?.trim() || DEFAULT_ABOUT_PAGE.success_message,
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
    about: mergeAboutPage(raw?.about),
    about_seo: mergePageSeo(DEFAULT_ABOUT_PAGE_SEO, raw?.about_seo),
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
