import type { HomeInstallServices, HomeVideosSection } from "@/lib/cms/types";

export const FALLBACK_INSTALLATION_MANUAL =
  "/installation/koda-siding-manual.pdf";

export const DEFAULT_HOME_INSTALL_SERVICES: HomeInstallServices = {
  headline: "Siding Installation in Omaha and Surrounding Areas",
  body: "Koda Siding installs its own fiberglass siding with our own trained crews.",
  service_area: "Omaha & surrounding areas",
  primary_cta_label: "Request install quote",
  diy_cta_label: "Install it yourself",
  diy_cta_href: "/installation",
};

export const DEFAULT_INSTALLATION_PAGE: HomeVideosSection = {
  headline: "Siding Installation in Omaha and Surrounding Areas",
  body: [
    "Koda Siding installs its own fiberglass siding with our own trained crews, so every job is done the way the product was designed. We handle complete siding replacement, from tear-off of old vinyl, wood, LP, or fiber cement siding through new housewrap, flashing, trim, and soffit, as well as new construction siding installation for builders and homeowners.",
    "Because we make the siding and install it ourselves, you get one company responsible for the product and the workmanship. No finger-pointing between a manufacturer and a contractor.",
  ].join("\n\n"),
  hero_service_label: "Omaha & surrounding areas",
  install_radius_miles: 60,
  cities_intro:
    "Green circle = where Koda crews install. Tap a pin or type your town.",
  cities:
    "Omaha · Elkhorn · Millard · Bellevue · Papillion · La Vista · Gretna · Council Bluffs, IA · Fremont · Lincoln",
  hero_image_media_id: null,
  hero_image_alt: "Koda Siding crew installing fiberglass siding",
  eyebrow_prefix: "Local install",
  coverage_heading: "Do we install near you?",
  town_search_placeholder: "Type a town, or tap a pin…",
  services_cta_label: "Request install quote",
  diy_link_label: "Install it yourself",
  manual_label: "Download PDF manual",
  manual_document_key: "installation_manual",
  diy_eyebrow: "DIY guide",
  diy_headline: "Install it yourself",
  diy_body:
    "Follow the full Koda installation manual — components, horizontal and vertical profiles, and the details that keep water out.",
  videos_eyebrow: "Videos",
  videos_heading: "Watch the install",
  local_crews_eyebrow: "Local crews",
  local_crews_heading: "Prefer we install it?",
  local_crews_link_label: "See local install",
  local_crews_cta_label: "Request install quote",
};

export type ManualChapterId = "overview" | "components" | "horizontal" | "vertical";

export type ManualPage = {
  id: string;
  page: number;
  src: string;
  section: string;
  title: string;
  chapter: ManualChapterId;
  notes: string[];
};

export type ManualChapter = {
  id: ManualChapterId;
  label: string;
};

export const MANUAL_CHAPTERS: ManualChapter[] = [
  { id: "overview", label: "Overview" },
  { id: "components", label: "1 · Components" },
  { id: "horizontal", label: "2 · Horizontal siding" },
  { id: "vertical", label: "Vertical siding" },
];

const COMMON_NOTES = [
  "Windows and doors must be properly secured and flashed prior to siding installation.",
  "Water resistive barrier should be stapled on instead of cap nails.",
  "Fasteners should be 1 1/2\" or longer.",
];

/** Full online manual — one entry per page of Paul’s PDF. */
export const MANUAL_PAGES: ManualPage[] = [
  {
    id: "cover",
    page: 1,
    src: "/installation/pages/p01.webp",
    section: "Cover",
    title: "Koda Siding System — Installation Manual",
    chapter: "overview",
    notes: [],
  },
  {
    id: "toc",
    page: 2,
    src: "/installation/pages/p02.webp",
    section: "Contents",
    title: "1 · Components and detail index",
    chapter: "overview",
    notes: [],
  },
  {
    id: "h-profiles",
    page: 3,
    src: "/installation/pages/p03.webp",
    section: "1.1",
    title: "Horizontal profiles",
    chapter: "components",
    notes: [
      "Includes H1 starter, H2 finish trim, H3 rainscreen spacer, and H4 3\" double lap.",
    ],
  },
  {
    id: "v-profiles",
    page: 4,
    src: "/installation/pages/p04.webp",
    section: "1.2",
    title: "Vertical profiles",
    chapter: "components",
    notes: [
      "Includes V1 starter, V2/V3 finish trim, V4 7\" V groove, and V5 groove support.",
    ],
  },
  {
    id: "u-profiles",
    page: 5,
    src: "/installation/pages/p05.webp",
    section: "1.3",
    title: "Universal profiles",
    chapter: "components",
    notes: [
      "Edge trim, J channel, drip cap, angle, brickmould, and casing used across installs.",
    ],
  },
  {
    id: "h-window-1",
    page: 6,
    src: "/installation/pages/p06.webp",
    section: "2.1",
    title: "Window and door junction — Option #1",
    chapter: "horizontal",
    notes: COMMON_NOTES,
  },
  {
    id: "h-window-2",
    page: 7,
    src: "/installation/pages/p07.webp",
    section: "2.2",
    title: "Window and door junction — Option #2",
    chapter: "horizontal",
    notes: COMMON_NOTES,
  },
  {
    id: "h-window-3",
    page: 8,
    src: "/installation/pages/p08.webp",
    section: "2.3",
    title: "Window and door junction — Option #3",
    chapter: "horizontal",
    notes: COMMON_NOTES,
  },
  {
    id: "h-corners",
    page: 9,
    src: "/installation/pages/p09.webp",
    section: "2.4",
    title: "Inside and outside corner details",
    chapter: "horizontal",
    notes: COMMON_NOTES,
  },
  {
    id: "h-starter",
    page: 10,
    src: "/installation/pages/p10.webp",
    section: "2.5",
    title: "Horizontal starter and finish trim",
    chapter: "horizontal",
    notes: [
      ...COMMON_NOTES,
      "Horizontal starter and finish trim should be installed on top of rainscreen clip, J channel, finish trim, and corners.",
    ],
  },
  {
    id: "h-vertical-start",
    page: 11,
    src: "/installation/pages/p11.webp",
    section: "2.6",
    title: "Vertical starting details",
    chapter: "horizontal",
    notes: COMMON_NOTES,
  },
  {
    id: "h-j-channel",
    page: 12,
    src: "/installation/pages/p12.webp",
    section: "2.7",
    title: "J channel detail",
    chapter: "horizontal",
    notes: COMMON_NOTES,
  },
  {
    id: "v-window-1",
    page: 13,
    src: "/installation/pages/p13.webp",
    section: "2.8",
    title: "Vertical siding — window junction Option #1",
    chapter: "vertical",
    notes: COMMON_NOTES,
  },
  {
    id: "v-window-2",
    page: 14,
    src: "/installation/pages/p14.webp",
    section: "2.9",
    title: "Vertical siding — window junction Option #2",
    chapter: "vertical",
    notes: COMMON_NOTES,
  },
  {
    id: "v-starting",
    page: 15,
    src: "/installation/pages/p15.webp",
    section: "2.10",
    title: "Vertical siding — starting details",
    chapter: "vertical",
    notes: COMMON_NOTES,
  },
  {
    id: "v-corners",
    page: 16,
    src: "/installation/pages/p16.webp",
    section: "2.11",
    title: "Vertical siding — corner details",
    chapter: "vertical",
    notes: COMMON_NOTES,
  },
];

export function mergeHomeInstallServices(
  section: HomeVideosSection | null | undefined,
): HomeInstallServices {
  const s = section ?? DEFAULT_INSTALLATION_PAGE;
  return {
    headline:
      s.services_headline?.trim() || DEFAULT_HOME_INSTALL_SERVICES.headline,
    body: s.services_body?.trim() || DEFAULT_HOME_INSTALL_SERVICES.body,
    service_area:
      s.service_area?.trim() || DEFAULT_HOME_INSTALL_SERVICES.service_area,
    primary_cta_label:
      s.services_cta_label?.trim() ||
      DEFAULT_HOME_INSTALL_SERVICES.primary_cta_label,
    diy_cta_label:
      s.diy_link_label?.trim() || DEFAULT_HOME_INSTALL_SERVICES.diy_cta_label,
    diy_cta_href: DEFAULT_HOME_INSTALL_SERVICES.diy_cta_href,
  };
}

export function resolveInstallRadiusMiles(
  raw: number | string | null | undefined,
) {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return DEFAULT_INSTALLATION_PAGE.install_radius_miles ?? 60;
  }
  return Math.min(200, Math.max(5, Math.round(n)));
}

/** Prefer CMS copy unless it is still the old “Installation Manual” stub. */
function installationHeroHeadline(raw: string | undefined) {
  const value = raw?.trim() ?? "";
  if (!value) return DEFAULT_INSTALLATION_PAGE.headline;
  if (/^installation manual$/i.test(value)) {
    return DEFAULT_INSTALLATION_PAGE.headline;
  }
  return value;
}

function installationHeroBody(raw: string | undefined) {
  const value = raw?.trim() ?? "";
  if (!value) return DEFAULT_INSTALLATION_PAGE.body;
  if (/view our installation manual/i.test(value)) {
    return DEFAULT_INSTALLATION_PAGE.body;
  }
  return value;
}

export function mergeInstallationPage(
  section: HomeVideosSection | null | undefined,
): HomeVideosSection {
  const s = section ?? DEFAULT_INSTALLATION_PAGE;
  return {
    headline: installationHeroHeadline(s.headline),
    body: installationHeroBody(s.body),
    hero_service_label:
      s.hero_service_label?.trim() ||
      DEFAULT_INSTALLATION_PAGE.hero_service_label,
    install_radius_miles: resolveInstallRadiusMiles(s.install_radius_miles),
    cities_intro:
      s.cities_intro?.trim() || DEFAULT_INSTALLATION_PAGE.cities_intro,
    cities: s.cities?.trim() || DEFAULT_INSTALLATION_PAGE.cities,
    hero_image_media_id: s.hero_image_media_id ?? null,
    manual_label:
      s.manual_label?.trim() || DEFAULT_INSTALLATION_PAGE.manual_label,
    manual_document_key:
      s.manual_document_key?.trim() ||
      DEFAULT_INSTALLATION_PAGE.manual_document_key,
    services_headline: s.services_headline,
    services_body: s.services_body,
    service_area: s.service_area,
    services_cta_label: s.services_cta_label,
    diy_link_label: s.diy_link_label,
  };
}
