/** Extract H1 / V4 / U2 style catalog code from name or slug for stable ordering. */
export function profileCatalogCode(nameOrSlug: string): {
  orientation: "horizontal" | "vertical" | "universal" | null;
  number: number;
} | null {
  const match = nameOrSlug.trim().match(/\b([hvu])(\d{1,2})\b/i);
  if (!match) return null;
  const letter = match[1]!.toLowerCase();
  const number = Number(match[2]);
  if (!Number.isFinite(number)) return null;
  const orientation =
    letter === "h" ? "horizontal" : letter === "v" ? "vertical" : "universal";
  return { orientation, number };
}

/** Sort H1–H10 / V1–V5 / U1–U6 by catalog code, then sort_order, then name. */
export function compareProfiles<
  T extends { name: string; slug?: string; sort_order?: number },
>(a: T, b: T) {
  const codeA = profileCatalogCode(a.slug ?? "") ?? profileCatalogCode(a.name);
  const codeB = profileCatalogCode(b.slug ?? "") ?? profileCatalogCode(b.name);

  if (codeA && codeB && codeA.orientation === codeB.orientation) {
    if (codeA.number !== codeB.number) return codeA.number - codeB.number;
  } else if (codeA && !codeB) {
    return -1;
  } else if (!codeA && codeB) {
    return 1;
  }

  const sortA = a.sort_order ?? 0;
  const sortB = b.sort_order ?? 0;
  if (sortA !== sortB) return sortA - sortB;
  return a.name.localeCompare(b.name);
}
