import type { NavLink } from "@/lib/cms/types";

/**
 * Fixed public routes — admins may rename labels only.
 * Order and hrefs match Figma landing nav / footer (in-page sections).
 */
export const NAV_LINK_SLOTS = [
  { href: "/#why-koda", defaultLabel: "Why koda" },
  { href: "/profiles", defaultLabel: "Profiles" },
  { href: "/#installation", defaultLabel: "Installation" },
  { href: "/#contact", defaultLabel: "Contact" },
] as const;

export const FOOTER_LINK_SLOTS = [
  { href: "/#why-koda", defaultLabel: "Why Koda" },
  { href: "/profiles", defaultLabel: "Profiles" },
  { href: "/#installation", defaultLabel: "Installations" },
  { href: "/#contact", defaultLabel: "Contact" },
] as const;

export const FIND_DEALER_HREF = "/find-dealer";
export const PROFILES_HREF = "/profiles";

/** Legacy hrefs still present in older snapshots / DB rows. */
const HREF_ALIASES: Record<string, string> = {
  "/#profiles": "/profiles",
  "#profiles": "/profiles",
};

export function normalizeLinkHref(href: string) {
  const trimmed = href.trim();
  return HREF_ALIASES[trimmed] ?? trimmed;
}

export function isProfilesHref(href: string) {
  const normalized = normalizeLinkHref(href);
  return normalized === "/profiles" || normalized === "/#profiles";
}

export function labelsForSlots(
  slots: readonly { href: string; defaultLabel: string }[],
  links: NavLink[] | undefined,
): string[] {
  return slots.map((slot, i) => {
    const match =
      links?.find((l) => normalizeLinkHref(l.href) === slot.href) ??
      links?.[i];
    return match?.label?.trim() || slot.defaultLabel;
  });
}

export function linksFromLabelFields(
  formData: FormData,
  prefix: string,
  slots: readonly { href: string; defaultLabel: string }[],
): NavLink[] {
  return slots.map((slot, i) => {
    const label =
      String(formData.get(`${prefix}_${i}`) ?? "").trim() || slot.defaultLabel;
    return { label, href: slot.href };
  });
}

/** Ensure public nav/footer links use current slot hrefs (labels preserved). */
export function syncLinksToSlots(
  slots: readonly { href: string; defaultLabel: string }[],
  links: NavLink[] | undefined,
): NavLink[] {
  return slots.map((slot, i) => {
    const match =
      links?.find((l) => normalizeLinkHref(l.href) === slot.href) ??
      links?.[i];
    return {
      href: slot.href,
      label: match?.label?.trim() || slot.defaultLabel,
    };
  });
}
