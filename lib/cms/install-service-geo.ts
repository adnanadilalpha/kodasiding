/** Omaha metro install coverage — used by the /installation hero map. */

export const OMAHA_CENTER = { lat: 41.2565, lng: -95.9345 } as const;

/** Convert miles → meters for Leaflet Circle radius. */
export function installRadiusMeters(miles: number) {
  const n = Number.isFinite(miles) && miles > 0 ? miles : 60;
  return n * 1609.344;
}

/** @deprecated use installRadiusMeters(miles) */
export const INSTALL_RADIUS_METERS = installRadiusMeters(60);

export const INSTALL_SERVICE_TOWNS: Record<
  string,
  { lat: number; lng: number; label: string }
> = {
  omaha: { lat: 41.2565, lng: -95.9345, label: "Omaha" },
  elkhorn: { lat: 41.2806, lng: -96.2342, label: "Elkhorn" },
  millard: { lat: 41.2103, lng: -96.155, label: "Millard" },
  bellevue: { lat: 41.1544, lng: -95.8908, label: "Bellevue" },
  papillion: { lat: 41.1544, lng: -96.0422, label: "Papillion" },
  "la vista": { lat: 41.1836, lng: -96.0397, label: "La Vista" },
  lavista: { lat: 41.1836, lng: -96.0397, label: "La Vista" },
  gretna: { lat: 41.1408, lng: -96.245, label: "Gretna" },
  "council bluffs, ia": {
    lat: 41.2619,
    lng: -95.8608,
    label: "Council Bluffs, IA",
  },
  "council bluffs": {
    lat: 41.2619,
    lng: -95.8608,
    label: "Council Bluffs, IA",
  },
  fremont: { lat: 41.4333, lng: -96.4981, label: "Fremont" },
  lincoln: { lat: 40.8136, lng: -96.7026, label: "Lincoln" },
};

export type InstallTownPoint = {
  name: string;
  lat: number;
  lng: number;
};

function normalizeTownKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveInstallTownPoints(
  cityNames: string[],
): InstallTownPoint[] {
  const seen = new Set<string>();
  const points: InstallTownPoint[] = [];

  for (const name of cityNames) {
    const key = normalizeTownKey(name);
    const hit =
      INSTALL_SERVICE_TOWNS[key] ??
      INSTALL_SERVICE_TOWNS[key.replace(/,/g, "")];
    if (!hit) continue;
    const dedupe = `${hit.lat},${hit.lng}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    points.push({ name: hit.label, lat: hit.lat, lng: hit.lng });
  }

  return points;
}

export function matchInstallTownPoint(
  cityNames: string[],
  query: string,
): InstallTownPoint | null {
  const q = normalizeTownKey(query);
  if (!q) return null;
  const points = resolveInstallTownPoints(cityNames);
  return (
    points.find((p) => normalizeTownKey(p.name) === q) ??
    points.find((p) => normalizeTownKey(p.name).includes(q)) ??
    null
  );
}
