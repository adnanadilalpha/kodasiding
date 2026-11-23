"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  deleteOrphanedMediaAssets,
  releasedMediaIds,
} from "@/lib/cms/delete-orphaned-media";
import {
  FIND_DEALER_HREF,
  FOOTER_LINK_SLOTS,
  NAV_LINK_SLOTS,
  PROFILES_HREF,
  linksFromLabelFields,
} from "@/lib/cms/nav-slots";
import { isSocialIconId } from "@/lib/cms/social-icons";
import { externalHref } from "@/lib/cms/safe-href";
import { syncPublicSite } from "@/lib/cms/sync-public";
import { sanitizeRichText } from "@/lib/cms/sanitize-rich-text";
import type {
  KodaVentAnnotation,
  KodaVentInstallMethod,
  KodaVentInstallStep,
  PageKodaVent,
  QuoteEmailSettings,
  QuoteFormSettings,
  SocialLink,
} from "@/lib/cms/types";
import { collectKodaVentMediaIds } from "@/lib/cms/kodavent-defaults";
import { parsePageSeoFromForm } from "@/lib/cms/page-seo-defaults";
import { revalidatePath } from "next/cache";

/** After CMS write: rebuild public snapshot + refresh admin + marketing paths. */
async function afterPublicChange(
  userId: string,
  ...adminPaths: string[]
) {
  await syncPublicSite(userId);
  for (const path of adminPaths) revalidatePath(path);
  revalidatePath("/");
  revalidatePath("/profiles");
  revalidatePath("/installation");
  revalidatePath("/find-dealer");
  revalidatePath("/kodavent");
}

export async function saveHomeHero(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("page_home")
    .select("hero")
    .eq("id", 1)
    .maybeSingle();
  const prevHero = previous?.hero as { image_media_id?: string | null } | null;
  const hero = {
    headline: String(formData.get("hero_headline") ?? ""),
    subheadline: String(formData.get("hero_subheadline") ?? ""),
    cta_label: String(formData.get("hero_cta_label") ?? ""),
    // Internal routes are fixed in code — not editable in CMS.
    cta_href: PROFILES_HREF,
    image_media_id: emptyToNull(formData.get("hero_image_media_id")),
  };
  const { error } = await supabase.from("page_home").update({ hero }).eq("id", 1);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds([prevHero?.image_media_id], [hero.image_media_id]),
  );
  await afterPublicChange(admin.user_id, "/admin/home");
}

export async function saveHomePartnersTitle(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      partners_title: String(formData.get("partners_title") ?? ""),
      show_partners: formData.get("show_partners") === "on",
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/home");
}

type WhyFeatureLayoutValue =
  | "image-right"
  | "image-left"
  | "image-top"
  | "image-bottom";

const WHY_FEATURE_LAYOUTS = new Set<WhyFeatureLayoutValue>([
  "image-right",
  "image-left",
  "image-top",
  "image-bottom",
]);

type WhyFactStored = {
  value?: string;
  label?: string;
  body?: string;
};

type WhyKodaStored = {
  headline?: string;
  body?: string;
  highlights?: string;
  facts?: WhyFactStored[];
  image_media_id?: string | null;
  features?: {
    number?: string;
    title?: string;
    body?: string;
    image_media_id?: string | null;
    layout?: string | null;
  }[];
};

function normalizeStoredFacts(prevWhy: WhyKodaStored) {
  return (prevWhy.facts ?? []).map((fact) => ({
    value: String(fact?.value ?? "").trim(),
    label: String(fact?.label ?? "").trim(),
    body: String(fact?.body ?? "").trim(),
  }));
}

function parseWhyFeatureLayout(value: unknown): WhyFeatureLayoutValue {
  const raw = String(value ?? "").trim();
  if (WHY_FEATURE_LAYOUTS.has(raw as WhyFeatureLayoutValue)) {
    return raw as WhyFeatureLayoutValue;
  }
  return "image-right";
}

function emptyWhyFeature(index: number) {
  return {
    number: String(index + 1).padStart(2, "0"),
    title: "",
    body: "",
    image_media_id: null as string | null,
    layout: (index % 2 === 1
      ? "image-left"
      : "image-right") as WhyFeatureLayoutValue,
  };
}

function normalizeStoredFeatures(prevWhy: WhyKodaStored) {
  return [...(prevWhy.features ?? [])].map((f, i) => ({
    number: f.number ?? String(i + 1).padStart(2, "0"),
    title: f.title ?? "",
    body: f.body ?? "",
    image_media_id: f.image_media_id ?? null,
    layout: parseWhyFeatureLayout(
      f.layout ?? (i % 2 === 1 ? "image-left" : "image-right"),
    ),
  }));
}

/** Auto-saves a single Why Koda card image (no form Save needed). */
export async function saveHomeWhyKodaFeatureImage(
  index: number,
  imageMediaId: string | null,
  /** Current layouts from the admin UI — kept so image saves don't reset them. */
  layouts?: string[],
) {
  const admin = await requireAdmin();
  if (!Number.isInteger(index) || index < 0 || index > 23) {
    throw new Error("Invalid card index.");
  }
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("page_home")
    .select("why_koda")
    .eq("id", 1)
    .maybeSingle();
  const prevWhy = (previous?.why_koda ?? {}) as WhyKodaStored;
  const features = normalizeStoredFeatures(prevWhy);
  const targetLength = Math.max(
    index + 1,
    features.length,
    Array.isArray(layouts) ? layouts.length : 0,
  );
  while (features.length < targetLength) {
    features.push(emptyWhyFeature(features.length));
  }
  if (Array.isArray(layouts)) {
    layouts.forEach((layout, i) => {
      if (i >= features.length) return;
      features[i] = {
        ...features[i],
        layout: parseWhyFeatureLayout(
          layout || features[i].layout || emptyWhyFeature(i).layout,
        ),
      };
    });
  }
  const prevImage = features[index]?.image_media_id ?? null;
  features[index] = {
    ...features[index],
    image_media_id: imageMediaId,
  };
  const why_koda = {
    headline: prevWhy.headline ?? "",
    body: prevWhy.body ?? "",
    highlights: prevWhy.highlights ?? "",
    facts: normalizeStoredFacts(prevWhy),
    image_media_id: null as string | null,
    features,
  };
  const { error } = await supabase
    .from("page_home")
    .update({ why_koda })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds(
      [prevWhy.image_media_id, prevImage],
      [imageMediaId],
    ),
  );
  await afterPublicChange(admin.user_id, "/admin/home");
}

/** Auto-saves a single Why Koda card layout (image left/right/top/bottom). */
export async function saveHomeWhyKodaFeatureLayout(
  index: number,
  layout: string,
) {
  const admin = await requireAdmin();
  if (!Number.isInteger(index) || index < 0 || index > 23) {
    throw new Error("Invalid card index.");
  }
  const nextLayout = parseWhyFeatureLayout(layout);
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("page_home")
    .select("why_koda")
    .eq("id", 1)
    .maybeSingle();
  const prevWhy = (previous?.why_koda ?? {}) as WhyKodaStored;
  const features = normalizeStoredFeatures(prevWhy);
  while (features.length <= index) {
    features.push(emptyWhyFeature(features.length));
  }
  features[index] = {
    ...features[index],
    layout: nextLayout,
  };
  const why_koda = {
    headline: prevWhy.headline ?? "",
    body: prevWhy.body ?? "",
    highlights: prevWhy.highlights ?? "",
    facts: normalizeStoredFacts(prevWhy),
    image_media_id: null as string | null,
    features,
  };
  const { error } = await supabase
    .from("page_home")
    .update({ why_koda })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/home");
}

/** Saves Why Koda copy/text + layouts — card images are auto-saved on upload. */
export async function saveHomeWhyKoda(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("page_home")
    .select("why_koda")
    .eq("id", 1)
    .maybeSingle();
  const prevWhy = (previous?.why_koda ?? {}) as WhyKodaStored;
  const prevFeatures = prevWhy.features ?? [];
  const count = Math.max(
    0,
    Math.min(24, Number(formData.get("feature_count") ?? 8) || 8),
  );
  const features = Array.from({ length: count }, (_, i) => ({
    number: String(formData.get(`feature_${i}_number`) ?? ""),
    title: sanitizeRichText(String(formData.get(`feature_${i}_title`) ?? "")),
    body: sanitizeRichText(String(formData.get(`feature_${i}_body`) ?? "")),
    // Images are persisted immediately on upload — never wipe them here.
    image_media_id: prevFeatures[i]?.image_media_id ?? null,
    layout: parseWhyFeatureLayout(
      formData.get(`feature_${i}_layout`) ??
        prevFeatures[i]?.layout ??
        (i % 2 === 1 ? "image-left" : "image-right"),
    ),
  }));
  const factCount = Math.max(
    0,
    Math.min(6, Number(formData.get("fact_count") ?? 4) || 4),
  );
  const facts = Array.from({ length: factCount }, (_, i) => ({
    value: String(formData.get(`fact_${i}_value`) ?? "").trim(),
    label: String(formData.get(`fact_${i}_label`) ?? "").trim(),
    body: String(formData.get(`fact_${i}_body`) ?? "").trim(),
  })).filter((fact) => fact.value || fact.label || fact.body);
  const why_koda = {
    headline: sanitizeRichText(String(formData.get("why_headline") ?? "")),
    body: sanitizeRichText(String(formData.get("why_body") ?? "")),
    highlights: prevWhy.highlights ?? "",
    facts,
    image_media_id: null as string | null,
    features,
  };
  const { error } = await supabase
    .from("page_home")
    .update({ why_koda })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds(
      [
        prevWhy.image_media_id,
        ...prevFeatures.map((f) => f.image_media_id ?? null),
      ],
      features.map((f) => f.image_media_id),
    ),
  );
  await afterPublicChange(admin.user_id, "/admin/home");
}

export async function saveHomeProfilesTeaser(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const profiles_teaser = {
    headline: String(formData.get("profiles_headline") ?? ""),
    body: String(formData.get("profiles_body") ?? ""),
    cta_label: String(formData.get("profiles_cta_label") ?? ""),
    // Internal routes are fixed in code — not editable in CMS.
    cta_href: PROFILES_HREF,
  };
  const { error } = await supabase
    .from("page_home")
    .update({ profiles_teaser })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/home");
}

export async function saveHomeVideosSection(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("page_home")
    .select("videos_section")
    .eq("id", 1)
    .maybeSingle();
  const prevSection = (previous?.videos_section ?? {}) as Record<
    string,
    unknown
  > & {
    hero_image_media_id?: string | null;
    services_image_media_id?: string | null;
    manual_document_key?: string;
  };

  const section = String(formData.get("install_section") ?? "all");
  const videos_section: Record<string, unknown> = {
    ...prevSection,
    manual_document_key:
      String(
        formData.get("manual_document_key") ??
          prevSection.manual_document_key ??
          "installation_manual",
      ) || "installation_manual",
  };

  if (section === "hero" || section === "all") {
    const nextImageId = String(
      formData.get("hero_image_media_id") ?? "",
    ).trim();
    videos_section.headline = String(formData.get("videos_headline") ?? "");
    videos_section.body = String(formData.get("videos_body") ?? "");
    videos_section.hero_service_label = String(
      formData.get("hero_service_label") ?? "",
    );
    videos_section.hero_image_media_id = nextImageId || null;
  }

  if (section === "coverage" || section === "all") {
    const radiusRaw = Number(formData.get("install_radius_miles") ?? 60);
    videos_section.install_radius_miles =
      Number.isFinite(radiusRaw) && radiusRaw > 0
        ? Math.min(200, Math.max(5, Math.round(radiusRaw)))
        : 60;
    videos_section.cities_intro = String(formData.get("cities_intro") ?? "");
    videos_section.cities = String(formData.get("cities") ?? "");
  }

  if (section === "manual" || section === "all") {
    videos_section.manual_label = String(formData.get("manual_label") ?? "");
  }

  if (section === "home-teaser" || section === "all") {
    videos_section.services_headline = String(
      formData.get("services_headline") ?? "",
    );
    videos_section.services_body = String(formData.get("services_body") ?? "");
    videos_section.service_area = String(
      formData.get("service_area") ?? "Nebraska",
    );
    videos_section.services_cta_label = String(
      formData.get("services_cta_label") ?? "",
    );
    videos_section.diy_link_label = String(
      formData.get("diy_link_label") ?? "",
    );
  }

  const nextHeroId =
    typeof videos_section.hero_image_media_id === "string"
      ? videos_section.hero_image_media_id
      : null;

  const { error } = await supabase
    .from("page_home")
    .update({ videos_section })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  if (section === "hero" || section === "all") {
    await deleteOrphanedMediaAssets(
      releasedMediaIds(
        [
          prevSection.hero_image_media_id ?? null,
          prevSection.services_image_media_id ?? null,
        ],
        [nextHeroId],
      ),
    );
  }

  await afterPublicChange(admin.user_id, "/admin/installation", "/admin/home");
}

export async function saveHomeCtas(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("page_home")
    .select("ctas")
    .eq("id", 1)
    .maybeSingle();
  const prevCtas = previous?.ctas as {
    quote?: { image_media_id?: string | null };
    dealer?: { image_media_id?: string | null };
  } | null;
  const ctas = {
    show_dealer: formData.get("show_dealer") === "on",
    quote: {
      headline: String(formData.get("quote_headline") ?? ""),
      body: String(formData.get("quote_body") ?? ""),
      cta_label: String(formData.get("quote_cta_label") ?? ""),
      image_media_id: emptyToNull(formData.get("quote_image_media_id")),
    },
    dealer: {
      headline: String(formData.get("dealer_headline") ?? ""),
      body: String(formData.get("dealer_body") ?? ""),
      cta_label: String(formData.get("dealer_cta_label") ?? ""),
      // Internal routes are fixed in code — not editable in CMS.
      cta_href: FIND_DEALER_HREF,
      image_media_id: emptyToNull(formData.get("dealer_image_media_id")),
    },
  };
  const { error } = await supabase.from("page_home").update({ ctas }).eq("id", 1);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds(
      [prevCtas?.quote?.image_media_id, prevCtas?.dealer?.image_media_id],
      [ctas.quote.image_media_id, ctas.dealer.image_media_id],
    ),
  );
  await afterPublicChange(admin.user_id, "/admin/home", "/admin/dealer");
}

/** Toggle find-dealer landing visibility from the Dealers admin page. */
export async function saveFindDealerVisibility(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const show_find_dealer = formData.get("show_find_dealer") === "on";
  const show_dealer = formData.get("show_dealer") === "on";

  const [{ data: settings, error: settingsErr }, { data: home, error: homeErr }] =
    await Promise.all([
      supabase.from("site_settings").select("nav").eq("id", 1).single(),
      supabase.from("page_home").select("ctas").eq("id", 1).single(),
    ]);
  if (settingsErr) throw new Error(settingsErr.message);
  if (homeErr) throw new Error(homeErr.message);

  const nav = { ...settings.nav, show_find_dealer };
  const ctas = { ...home.ctas, show_dealer };

  const [navRes, ctaRes] = await Promise.all([
    supabase.from("site_settings").update({ nav }).eq("id", 1),
    supabase.from("page_home").update({ ctas }).eq("id", 1),
  ]);
  if (navRes.error) throw new Error(navRes.error.message);
  if (ctaRes.error) throw new Error(ctaRes.error.message);

  await afterPublicChange(
    admin.user_id,
    "/admin/dealer",
    "/admin/home",
    "/admin/settings",
  );
}

export async function saveNavSettings(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const nav = {
    logo_alt: String(formData.get("logo_alt") ?? ""),
    find_dealer_label: String(formData.get("find_dealer_label") ?? ""),
    find_dealer_href: FIND_DEALER_HREF,
    show_find_dealer: formData.get("show_find_dealer") === "on",
    quote_label: String(formData.get("quote_label") ?? ""),
    links: linksFromLabelFields(formData, "nav_label", NAV_LINK_SLOTS),
  };
  const { error } = await supabase
    .from("site_settings")
    .update({ nav })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/settings");
}

export async function saveFooterSettings(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const footer = {
    tagline: String(formData.get("footer_tagline") ?? ""),
    copyright: String(formData.get("footer_copyright") ?? ""),
    links: linksFromLabelFields(formData, "footer_label", FOOTER_LINK_SLOTS),
    social: parseSocialLinks(String(formData.get("footer_social") ?? "[]")),
  };
  const { error } = await supabase
    .from("site_settings")
    .update({ footer })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/settings");
}

export async function saveSeoSettings(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const rawSiteUrl = String(formData.get("seo_site_url") ?? "")
    .trim()
    .replace(/\/$/, "");
  let site_url = "";
  if (rawSiteUrl) {
    try {
      const withScheme = /^https?:\/\//i.test(rawSiteUrl)
        ? rawSiteUrl
        : `https://${rawSiteUrl}`;
      const parsed = new URL(withScheme);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        site_url = parsed.origin;
      }
    } catch {
      site_url = "";
    }
  }
  const { data: previous } = await supabase
    .from("site_settings")
    .select("seo")
    .eq("id", 1)
    .maybeSingle();
  const prevSeo = previous?.seo as { og_image_media_id?: string | null } | null;
  const seo = {
    title: String(formData.get("seo_title") ?? ""),
    title_template: String(formData.get("seo_title_template") ?? ""),
    description: String(formData.get("seo_description") ?? ""),
    site_url,
    og_image_media_id: emptyToNull(formData.get("seo_og_image_media_id")),
  };
  const { error } = await supabase
    .from("site_settings")
    .update({ seo })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds([prevSeo?.og_image_media_id], [seo.og_image_media_id]),
  );
  await afterPublicChange(admin.user_id, "/admin/settings");
}

export async function saveGeoAccessSettings(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { normalizeGeoAccess } = await import("@/lib/cms/geo-access");
  const { invalidateGeoAccessCache } = await import(
    "@/lib/cms/geo-access-server"
  );

  let countries: string[] = [];
  try {
    const parsed = JSON.parse(
      String(formData.get("geo_allowed_countries") ?? "[]"),
    );
    if (Array.isArray(parsed)) {
      countries = parsed.map((c) => String(c));
    }
  } catch {
    countries = [];
  }

  const geo_access = normalizeGeoAccess({
    enabled: String(formData.get("geo_enabled") ?? "1") === "1",
    allowed_countries: countries,
  });

  const { error } = await supabase
    .from("site_settings")
    .update({ geo_access })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  invalidateGeoAccessCache();
  await afterPublicChange(admin.user_id, "/admin/settings");
}

export async function saveQuoteFormSettings(input: QuoteFormSettings) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Not authorized." };
  }

  const { normalizeQuoteFormSettings } = await import("@/lib/cms/quote-form");
  const quote_form = normalizeQuoteFormSettings(input);

  if (!quote_form.fields.some((f) => f.kind === "full_name")) {
    return { error: "Full name field is required." };
  }
  if (!quote_form.fields.some((f) => f.kind === "email")) {
    return { error: "Email field is required." };
  }
  if (quote_form.allowed_file_types.length === 0) {
    return { error: "Select at least one attachment file type." };
  }

  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ quote_form })
    .eq("id", 1);
  if (error) return { error: error.message };
  await afterPublicChange(admin.user_id, "/admin/quotes");
  return { success: true };
}

export async function upsertPartner(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const logo_media_id = emptyToNull(formData.get("logo_media_id"));
  const sort_order = Number(formData.get("sort_order") ?? 0);
  const is_published = formData.get("is_published") === "on";

  let previousLogo: string | null = null;
  if (id) {
    const { data: previous } = await supabase
      .from("partners")
      .select("logo_media_id")
      .eq("id", id)
      .maybeSingle();
    previousLogo = previous?.logo_media_id ?? null;
    const { error } = await supabase
      .from("partners")
      .update({ logo_media_id, sort_order, is_published })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("partners").insert({
      name: `Partner ${sort_order + 1}`,
      logo_media_id,
      sort_order,
      is_published,
    });
    if (error) throw new Error(error.message);
  }
  await deleteOrphanedMediaAssets(
    releasedMediaIds([previousLogo], [logo_media_id]),
  );
  await afterPublicChange(admin.user_id, "/admin/home");
}

export async function deletePartner(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { data: previous } = await supabase
    .from("partners")
    .select("logo_media_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds([previous?.logo_media_id], []),
  );
  await afterPublicChange(admin.user_id, "/admin/home");
}

/** Saves sheet copy (and CTAs when present) for one Profiles section. */
export async function saveProfilesSection(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const sheet = String(formData.get("sheet") ?? "horizontal");
  const payload = {
    headline: String(formData.get("headline") ?? ""),
    helper: String(formData.get("helper") ?? ""),
  };
  const patch: Record<string, unknown> =
    sheet === "vertical"
      ? { vertical: payload }
      : sheet === "universal"
        ? { universal: payload }
        : sheet === "soffit"
          ? { soffit: payload }
          : { horizontal: payload };

  if (formData.has("quote_cta_label")) {
    patch.quote_cta_label = String(formData.get("quote_cta_label") ?? "");
  }

  const { error } = await supabase
    .from("page_profiles")
    .update(patch)
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/profiles");
}

export async function upsertHomeProfileJewel(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const row = {
    name: String(formData.get("name") ?? ""),
    reveal: String(formData.get("reveal") ?? ""),
    image_media_id: emptyToNull(formData.get("image_media_id")),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_published: formData.get("is_published") === "on",
  };

  let previousImage: string | null = null;
  if (id) {
    const { data: previous } = await supabase
      .from("home_profile_jewels")
      .select("image_media_id")
      .eq("id", id)
      .maybeSingle();
    previousImage = previous?.image_media_id ?? null;
    const { error } = await supabase
      .from("home_profile_jewels")
      .update(row)
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("home_profile_jewels").insert(row);
    if (error) throw new Error(error.message);
  }
  await deleteOrphanedMediaAssets(
    releasedMediaIds([previousImage], [row.image_media_id]),
  );
  await afterPublicChange(admin.user_id, "/admin/home");
}

export async function deleteHomeProfileJewel(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { data: previous } = await supabase
    .from("home_profile_jewels")
    .select("image_media_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase
    .from("home_profile_jewels")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds([previous?.image_media_id], []),
  );
  await afterPublicChange(admin.user_id, "/admin/home");
}

export async function upsertProfile(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const slug =
    String(formData.get("slug") ?? "") ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const row = {
    name,
    slug,
    reveal: String(formData.get("reveal") ?? ""),
    orientation: String(formData.get("orientation") ?? "horizontal"),
    description: String(formData.get("description") ?? ""),
    hover_copy: String(formData.get("hover_copy") ?? ""),
    exposure: String(formData.get("exposure") ?? ""),
    face_width: String(formData.get("face_width") ?? ""),
    depth: String(formData.get("depth") ?? ""),
    install: String(formData.get("install") ?? ""),
    image_media_id: emptyToNull(formData.get("image_media_id")),
    diagram_media_id: emptyToNull(formData.get("diagram_media_id")),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_published: formData.get("is_published") === "on",
  };

  let previousImage: string | null = null;
  let previousDiagram: string | null = null;
  if (id) {
    const { data: previous } = await supabase
      .from("profiles")
      .select("image_media_id, diagram_media_id")
      .eq("id", id)
      .maybeSingle();
    previousImage = previous?.image_media_id ?? null;
    previousDiagram = previous?.diagram_media_id ?? null;
    const { error } = await supabase.from("profiles").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("profiles").insert(row);
    if (error) throw new Error(error.message);
  }
  await deleteOrphanedMediaAssets(
    releasedMediaIds(
      [previousImage, previousDiagram],
      [row.image_media_id, row.diagram_media_id],
    ),
  );
  await afterPublicChange(admin.user_id, "/admin/profiles");
}

export async function deleteProfile(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { data: previous } = await supabase
    .from("profiles")
    .select("image_media_id, diagram_media_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds(
      [previous?.image_media_id, previous?.diagram_media_id],
      [],
    ),
  );
  await afterPublicChange(admin.user_id, "/admin/profiles");
}

export async function upsertDealer(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const latRaw = String(formData.get("lat") ?? "").trim();
  const lngRaw = String(formData.get("lng") ?? "").trim();

  function parseCoord(raw: string, min: number, max: number): number | null {
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return n;
  }

  const lat = parseCoord(latRaw, -90, 90);
  const lng = parseCoord(lngRaw, -180, 180);
  // Require both or neither — a single coord is useless; reject Null Island
  const coordsValid =
    lat != null && lng != null && !(lat === 0 && lng === 0);

  const websiteRaw = String(formData.get("website") ?? "").trim();
  const website = externalHref(websiteRaw, "");
  if (websiteRaw && !website) {
    throw new Error(
      "Website must be a full external URL (https://…). Internal paths are not allowed.",
    );
  }

  const row = {
    name: String(formData.get("name") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    region: String(formData.get("region") ?? ""),
    postal: String(formData.get("postal") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    website,
    lat: coordsValid ? lat : null,
    lng: coordsValid ? lng : null,
    is_published: formData.get("is_published") === "on",
  };

  if (id) {
    const { error } = await supabase.from("dealers").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("dealers").insert(row);
    if (error) throw new Error(error.message);
  }
  await afterPublicChange(admin.user_id, "/admin/dealer");
}

export async function deleteDealer(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("dealers")
    .delete()
    .eq("id", String(formData.get("id") ?? ""));
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/dealer");
}

export async function upsertVideo(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const row = {
    title: String(formData.get("title") ?? ""),
    orientation: String(formData.get("orientation") ?? "horizontal"),
    thumbnail_media_id: emptyToNull(formData.get("thumbnail_media_id")),
    video_url: String(formData.get("video_url") ?? ""),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_published: formData.get("is_published") === "on",
  };

  let previousThumb: string | null = null;
  if (id) {
    const { data: previous } = await supabase
      .from("videos")
      .select("thumbnail_media_id")
      .eq("id", id)
      .maybeSingle();
    previousThumb = previous?.thumbnail_media_id ?? null;
    const { error } = await supabase.from("videos").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("videos").insert(row);
    if (error) throw new Error(error.message);
  }
  await deleteOrphanedMediaAssets(
    releasedMediaIds([previousThumb], [row.thumbnail_media_id]),
  );
  await afterPublicChange(admin.user_id, "/admin/installation");
}

export async function deleteVideo(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { data: previous } = await supabase
    .from("videos")
    .select("thumbnail_media_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds([previous?.thumbnail_media_id], []),
  );
  await afterPublicChange(admin.user_id, "/admin/installation");
}

export async function saveDocument(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const key = String(formData.get("key") ?? "installation_manual");
  const bucket = String(formData.get("bucket") ?? "documents");
  if (bucket !== "documents") {
    throw new Error("Invalid document bucket.");
  }
  const { error } = await supabase.from("documents").upsert(
    {
      key,
      title: String(formData.get("title") ?? ""),
      storage_path: String(formData.get("storage_path") ?? ""),
      bucket,
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/installation", "/admin/kodavent");
}

export async function registerMediaAsset(input: {
  path: string;
  bucket: string;
  alt: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  mime_type: string | null;
}) {
  const admin = await requireAdmin();
  const allowedBuckets = new Set(["media", "documents", "videos"]);
  if (!allowedBuckets.has(input.bucket)) {
    throw new Error("Invalid media bucket.");
  }
  const path = input.path.trim();
  if (
    !path ||
    path.includes("..") ||
    path.includes("/") ||
    path.includes("\\") ||
    !/^[0-9A-Za-z._-]+$/.test(path)
  ) {
    throw new Error("Invalid media path.");
  }

  if (
    input.mime_type === "image/svg+xml" ||
    path.toLowerCase().endsWith(".svg")
  ) {
    const supabaseProbe = await createClient();
    const { data: blob, error: downloadError } = await supabaseProbe.storage
      .from(input.bucket)
      .download(path);
    if (downloadError || !blob) {
      throw new Error("Could not verify SVG upload.");
    }
    const raw = await blob.text();
    if (
      /<script[\s>]/i.test(raw) ||
      /\bon\w+\s*=/i.test(raw) ||
      /javascript:/i.test(raw) ||
      /<foreignObject[\s>]/i.test(raw)
    ) {
      await supabaseProbe.storage.from(input.bucket).remove([path]);
      throw new Error("SVG contains scripts or unsafe content — upload blocked.");
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      ...input,
      path,
      created_by: admin.user_id,
    })
    .select("id, bucket, path, alt, width, height, bytes, mime_type, created_at")
    .single();
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/home", "/admin/profiles");
  return data;
}

/** Best-effort cleanup for media no longer referenced after replace/clear. */
export async function cleanupUnreferencedMedia(ids: string[]) {
  await requireAdmin();
  await deleteOrphanedMediaAssets(ids);
}

export async function createAdminAccount(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Only owners can add admins");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) {
    throw new Error("Email and a password of at least 8 characters are required");
  }

  const { createServiceClient } = await import("@/lib/supabase/admin");
  const service = createServiceClient();

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Failed to create admin user");

  const role = parseAdminRole(formData.get("role"));

  const { error: rowError } = await service.from("admin_users").upsert({
    user_id: data.user.id,
    email,
    role,
  });
  if (rowError) {
    await service.auth.admin.deleteUser(data.user.id);
    throw new Error(rowError.message);
  }

  await service.from("admin_allowlist").upsert({ email, role });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/admins");
}

export async function updateAdminRole(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Only owners can change roles");

  const userId = String(formData.get("user_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = parseAdminRole(formData.get("role"));
  if (!userId) throw new Error("Missing admin id");
  if (userId === admin.user_id && role !== "owner") {
    throw new Error("You cannot demote your own owner account");
  }

  const { createServiceClient } = await import("@/lib/supabase/admin");
  const service = createServiceClient();

  const { data: target } = await service
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (target?.role === "owner" && role !== "owner") {
    const { count, error: countError } = await service
      .from("admin_users")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "owner");
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) <= 1) {
      throw new Error("Cannot demote the last owner account");
    }
  }

  const { error } = await service
    .from("admin_users")
    .update({ role })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  if (email) {
    await service.from("admin_allowlist").upsert({ email, role });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/admins");
}

export async function updateAdminPassword(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") {
    throw new Error("Only owners can change admin passwords");
  }

  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId || password.length < 8) {
    throw new Error("A password of at least 8 characters is required");
  }

  const { createServiceClient } = await import("@/lib/supabase/admin");
  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(userId, {
    password,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

export async function deleteAdminAccount(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Only owners can remove admins");

  const userId = String(formData.get("user_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!userId) throw new Error("Missing admin id");
  if (userId === admin.user_id) {
    throw new Error("You cannot remove your own account");
  }

  const { createServiceClient } = await import("@/lib/supabase/admin");
  const service = createServiceClient();

  const { data: target } = await service
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (target?.role === "owner") {
    const { count, error: countError } = await service
      .from("admin_users")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "owner");
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) <= 1) {
      throw new Error("Cannot remove the last owner account");
    }
  }

  const { error: rowError } = await service
    .from("admin_users")
    .delete()
    .eq("user_id", userId);
  if (rowError) throw new Error(rowError.message);

  if (email) {
    await service.from("admin_allowlist").delete().eq("email", email);
  }

  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/admins");
}

function emptyToNull(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function formFlag(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function parseAnnotationsJson(raw: string): KodaVentAnnotation[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item, index) => ({
        id: String(item.id ?? `ann-${index + 1}`),
        title: String(item.title ?? ""),
        description: String(item.description ?? ""),
        x: Number.isFinite(Number(item.x)) ? Number(item.x) : 50,
        y: Number.isFinite(Number(item.y)) ? Number(item.y) : 50,
        visible: item.visible !== false,
      }));
  } catch {
    return [];
  }
}

function parseMethodsJson(raw: string): KodaVentInstallMethod[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item, methodIndex) => {
        const stepsRaw = Array.isArray(item.steps) ? item.steps : [];
        const steps: KodaVentInstallStep[] = stepsRaw
          .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
          .map((s, stepIndex) => ({
            id: String(s.id ?? `step-${methodIndex + 1}-${stepIndex + 1}`),
            number: String(s.number ?? String(stepIndex + 1).padStart(2, "0")),
            title: String(s.title ?? ""),
            description: String(s.description ?? ""),
            image_media_id: emptyToNull(
              (s.image_media_id as FormDataEntryValue | null) ?? null,
            ),
            image_alt: String(s.image_alt ?? ""),
            visible: s.visible !== false,
          }));
        return {
          id: String(item.id ?? `method-${methodIndex + 1}`),
          tab_label: String(item.tab_label ?? ""),
          heading: String(item.heading ?? ""),
          intro: String(item.intro ?? ""),
          pdf_document_key: String(item.pdf_document_key ?? ""),
          steps,
          visible: item.visible !== false,
        };
      });
  } catch {
    return [];
  }
}

async function loadKodaVentDraft() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("page_kodavent")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PageKodaVent | null) ?? null;
}

export async function saveKodaVentHero(formData: FormData) {
  const admin = await requireAdmin();
  const previous = await loadKodaVentDraft();
  const hero = {
    eyebrow: String(formData.get("eyebrow") ?? ""),
    heading: String(formData.get("heading") ?? ""),
    supporting_headline: String(formData.get("supporting_headline") ?? ""),
    description: String(formData.get("description") ?? ""),
    image_media_id: emptyToNull(formData.get("image_media_id")),
    image_alt: String(formData.get("image_alt") ?? ""),
    primary_cta_label: String(formData.get("primary_cta_label") ?? ""),
    primary_cta_href: String(formData.get("primary_cta_href") ?? "#installation"),
    secondary_cta_label: String(formData.get("secondary_cta_label") ?? ""),
    secondary_cta_href: String(formData.get("secondary_cta_href") ?? "#product-design"),
    visible: formFlag(formData, "visible"),
  };
  const supabase = await createClient();
  const { error } = await supabase
    .from("page_kodavent")
    .update({ hero, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds(
      [previous?.hero?.image_media_id],
      [hero.image_media_id],
    ),
  );
  await afterPublicChange(admin.user_id, "/admin/kodavent");
}

export async function saveKodaVentProductDesign(formData: FormData) {
  const admin = await requireAdmin();
  const previous = await loadKodaVentDraft();
  const product_design = {
    heading: String(formData.get("heading") ?? ""),
    description: String(formData.get("description") ?? ""),
    image_media_id: emptyToNull(formData.get("image_media_id")),
    image_alt: String(formData.get("image_alt") ?? ""),
    annotations: parseAnnotationsJson(String(formData.get("annotations_json") ?? "[]")),
    visible: formFlag(formData, "visible"),
  };
  const supabase = await createClient();
  const { error } = await supabase
    .from("page_kodavent")
    .update({ product_design, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds(
      [previous?.product_design?.image_media_id],
      [product_design.image_media_id],
    ),
  );
  await afterPublicChange(admin.user_id, "/admin/kodavent");
}

export async function saveKodaVentInstalled(formData: FormData) {
  const admin = await requireAdmin();
  const previous = await loadKodaVentDraft();
  const image_media_id = emptyToNull(formData.get("image_media_id"));
  const installed = {
    heading: String(formData.get("heading") ?? ""),
    description: String(formData.get("description") ?? ""),
    image_media_id,
    image_alt: String(formData.get("image_alt") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    // Require an image before the section can go live.
    visible: formFlag(formData, "visible") && Boolean(image_media_id),
  };
  const supabase = await createClient();
  const { error } = await supabase
    .from("page_kodavent")
    .update({ installed, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds(
      [previous?.installed?.image_media_id],
      [installed.image_media_id],
    ),
  );
  await afterPublicChange(admin.user_id, "/admin/kodavent");
}

export async function saveKodaVentInstallation(formData: FormData) {
  const admin = await requireAdmin();
  const previous = await loadKodaVentDraft();
  const installation = {
    heading: String(formData.get("heading") ?? ""),
    description: String(formData.get("description") ?? ""),
    methods: parseMethodsJson(String(formData.get("methods_json") ?? "[]")),
    visible: formFlag(formData, "visible"),
  };
  const supabase = await createClient();
  const { error } = await supabase
    .from("page_kodavent")
    .update({ installation, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  const beforeIds = previous ? collectKodaVentMediaIds(previous) : [];
  const afterIds = collectKodaVentMediaIds({
    ...(previous as PageKodaVent),
    installation,
  } as PageKodaVent);
  await deleteOrphanedMediaAssets(releasedMediaIds(beforeIds, afterIds));
  await afterPublicChange(admin.user_id, "/admin/kodavent");
}

export async function saveKodaVentCta(formData: FormData) {
  const admin = await requireAdmin();
  let retailers: Array<{
    id: string;
    label: string;
    href: string;
    visible: boolean;
  }> = [];
  try {
    const parsed = JSON.parse(String(formData.get("retailers_json") ?? "[]"));
    if (Array.isArray(parsed)) {
      retailers = parsed
        .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
        .map((r, index) => ({
          id: String(r.id ?? `retailer-${index + 1}`),
          label: String(r.label ?? ""),
          href: String(r.href ?? ""),
          visible: r.visible !== false,
        }));
    }
  } catch {
    retailers = [];
  }
  const cta = {
    heading: String(formData.get("heading") ?? ""),
    description: String(formData.get("description") ?? ""),
    cta_label: String(formData.get("cta_label") ?? ""),
    cta_href: String(formData.get("cta_href") ?? "#quote"),
    retailers,
    visible: formFlag(formData, "visible"),
  };
  const supabase = await createClient();
  const { error } = await supabase
    .from("page_kodavent")
    .update({ cta, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/kodavent");
}

export async function saveKodaVentSeo(formData: FormData) {
  const admin = await requireAdmin();
  const previous = await loadKodaVentDraft();
  const seo = parsePageSeoFromForm(formData, "/kodavent");
  const supabase = await createClient();
  const { error } = await supabase
    .from("page_kodavent")
    .update({ seo, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  await deleteOrphanedMediaAssets(
    releasedMediaIds(
      [previous?.seo?.og_image_media_id],
      [seo.og_image_media_id],
    ),
  );
  await afterPublicChange(admin.user_id, "/admin/kodavent");
}

export async function saveHomePageSeo(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("page_home")
    .select("seo")
    .eq("id", 1)
    .maybeSingle();
  const seo = parsePageSeoFromForm(formData, "/");
  const { error } = await supabase
    .from("page_home")
    .update({ seo, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  const prevSeo = previous?.seo as { og_image_media_id?: string | null } | null;
  await deleteOrphanedMediaAssets(
    releasedMediaIds([prevSeo?.og_image_media_id], [seo.og_image_media_id]),
  );
  await afterPublicChange(admin.user_id, "/admin/home");
}

export async function saveProfilesPageSeo(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("page_profiles")
    .select("seo")
    .eq("id", 1)
    .maybeSingle();
  const seo = parsePageSeoFromForm(formData, "/profiles");
  const { error } = await supabase
    .from("page_profiles")
    .update({ seo, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  const prevSeo = previous?.seo as { og_image_media_id?: string | null } | null;
  await deleteOrphanedMediaAssets(
    releasedMediaIds([prevSeo?.og_image_media_id], [seo.og_image_media_id]),
  );
  await afterPublicChange(admin.user_id, "/admin/profiles");
}

export async function saveInstallationPageSeo(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("site_settings")
    .select("pages_seo")
    .eq("id", 1)
    .maybeSingle();
  const prevBag = (previous?.pages_seo ?? {}) as Record<string, unknown>;
  const seo = parsePageSeoFromForm(formData, "/installation");
  const pages_seo = { ...prevBag, installation: seo };
  const { error } = await supabase
    .from("site_settings")
    .update({ pages_seo, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  const prevSeo = prevBag.installation as
    | { og_image_media_id?: string | null }
    | undefined;
  await deleteOrphanedMediaAssets(
    releasedMediaIds([prevSeo?.og_image_media_id], [seo.og_image_media_id]),
  );
  await afterPublicChange(admin.user_id, "/admin/installation");
}

export async function saveFindDealerPageSeo(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("site_settings")
    .select("pages_seo")
    .eq("id", 1)
    .maybeSingle();
  const prevBag = (previous?.pages_seo ?? {}) as Record<string, unknown>;
  const seo = parsePageSeoFromForm(formData, "/find-dealer");
  const pages_seo = { ...prevBag, find_dealer: seo };
  const { error } = await supabase
    .from("site_settings")
    .update({ pages_seo, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  const prevSeo = prevBag.find_dealer as
    | { og_image_media_id?: string | null }
    | undefined;
  await deleteOrphanedMediaAssets(
    releasedMediaIds([prevSeo?.og_image_media_id], [seo.og_image_media_id]),
  );
  await afterPublicChange(admin.user_id, "/admin/dealer");
}

/** PDF upload for KodaVent guides — same documents table pattern as install manual. */
export async function saveKodaVentDocument(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const key = String(formData.get("key") ?? "");
  const allowed = new Set([
    "kodavent_new_construction",
    "kodavent_retrofit",
  ]);
  if (!allowed.has(key)) {
    throw new Error("Invalid KodaVent document key.");
  }
  const bucket = String(formData.get("bucket") ?? "documents");
  if (bucket !== "documents") {
    throw new Error("Invalid document bucket.");
  }
  const { error } = await supabase.from("documents").upsert(
    {
      key,
      title: String(formData.get("title") ?? ""),
      storage_path: String(formData.get("storage_path") ?? ""),
      bucket,
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  await afterPublicChange(admin.user_id, "/admin/kodavent");
}

function parseAdminRole(value: FormDataEntryValue | null): "owner" | "editor" {
  return String(value ?? "") === "owner" ? "owner" : "editor";
}

function parseSocialLinks(raw: string): SocialLink[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const links: SocialLink[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const icon = String(row.icon ?? "website");
      const href = externalHref(String(row.href ?? "").trim(), "");
      if (!href) continue;
      links.push({
        label: String(row.label ?? "").trim() || "Social",
        href,
        icon: isSocialIconId(icon) ? icon : "website",
      });
    }
    return links;
  } catch {
    return [];
  }
}

export async function saveQuoteEmailSettings(
  input: QuoteEmailSettings,
  options?: { keepExistingPassword?: boolean },
) {
  try {
    const admin = await requireAdmin();
    if (admin.role !== "owner") {
      return { error: "Only owners can manage email settings." };
    }
  } catch {
    return { error: "Not authorized." };
  }

  const {
    normalizeQuoteEmailSettings,
  } = await import("@/lib/email/quote-notify");
  const supabase = await createClient();
  const next = normalizeQuoteEmailSettings(input);

  const hostCheck = (await import("@/lib/email/smtp-host")).assertSafeSmtpHost(
    next.smtp_host,
  );
  if (next.smtp_host.trim() && !hostCheck.ok) {
    return { error: hostCheck.error };
  }

  const { encryptSmtpPass, isEncryptedSmtpPass } = await import(
    "@/lib/email/smtp-crypto"
  );

  const { data: existing } = await supabase
    .from("quote_email_settings")
    .select("smtp_pass")
    .eq("id", 1)
    .maybeSingle();

  if (
    (options?.keepExistingPassword || !next.smtp_pass.trim()) &&
    existing?.smtp_pass
  ) {
    next.smtp_pass = existing.smtp_pass;
  } else if (next.smtp_pass.trim()) {
    try {
      next.smtp_pass = encryptSmtpPass(next.smtp_pass);
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not save password.",
      };
    }
  }

  // Re-encrypt legacy plaintext if still stored
  if (
    next.smtp_pass &&
    !isEncryptedSmtpPass(next.smtp_pass) &&
    process.env.SMTP_SECRET_KEY
  ) {
    try {
      next.smtp_pass = encryptSmtpPass(next.smtp_pass);
    } catch {
      // leave as-is if key missing in dev
    }
  }

  if (next.enabled) {
    if (!next.from_email.trim()) {
      return { error: "Enter your email address." };
    }
    if (!next.to_email.trim()) {
      return { error: "Enter where quote requests should be delivered." };
    }
    if (!next.smtp_host.trim()) {
      return {
        error: "Choose an email provider (Gmail, Outlook, Yahoo, or Other).",
      };
    }
    if (!next.smtp_pass.trim()) {
      return {
        error:
          "Enter your email password (for Gmail/Yahoo use an App Password).",
      };
    }
  }

  next.smtp_user = next.smtp_user.trim() || next.from_email.trim();
  next.provider = "smtp";
  next.resend_api_key = "";

  // Writable columns only. Do not use upsert: PostgREST POSTs include generated
  // columns (smtp_pass_set) and Postgres rejects them with 428C9.
  const payload = {
    enabled: next.enabled,
    provider: next.provider,
    to_email: next.to_email,
    from_email: next.from_email,
    from_name: next.from_name,
    reply_to_submitter: next.reply_to_submitter,
    send_lead_confirmation: next.send_lead_confirmation,
    resend_api_key: next.resend_api_key,
    smtp_host: next.smtp_host,
    smtp_port: next.smtp_port,
    smtp_secure: next.smtp_secure,
    smtp_user: next.smtp_user,
    smtp_pass: next.smtp_pass,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await supabase
    .from("quote_email_settings")
    .update(payload)
    .eq("id", 1)
    .select("id");

  if (updateError) return { error: updateError.message };

  if (!updated?.length) {
    const { error: insertError } = await supabase
      .from("quote_email_settings")
      .insert({ id: 1, ...payload });
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/admin/email");
  return { success: true };
}

export async function testQuoteEmailSettings(
  input: QuoteEmailSettings,
  options?: { keepExistingPassword?: boolean },
) {
  try {
    const admin = await requireAdmin();
    if (admin.role !== "owner") {
      return { error: "Only owners can manage email settings." };
    }
  } catch {
    return { error: "Not authorized." };
  }

  const {
    normalizeQuoteEmailSettings,
    sendTestQuoteEmail,
  } = await import("@/lib/email/quote-notify");
  const supabase = await createClient();
  let settings = normalizeQuoteEmailSettings({ ...input, enabled: true });

  const { data: existing } = await supabase
    .from("quote_email_settings")
    .select("smtp_pass")
    .eq("id", 1)
    .maybeSingle();

  if (
    (options?.keepExistingPassword || !settings.smtp_pass.trim()) &&
    existing?.smtp_pass
  ) {
    settings = { ...settings, smtp_pass: existing.smtp_pass };
  }

  settings.smtp_user =
    settings.smtp_user.trim() || settings.from_email.trim();

  return sendTestQuoteEmail(settings);
}
