/** Site geo access — US + CA allowed by default; optional extras. */

export type GeoAccessSettings = {
  /** When true, visitors outside allowed_countries see the unavailable page. */
  enabled: boolean;
  /** ISO 3166-1 alpha-2 country codes. */
  allowed_countries: string[];
};

export const DEFAULT_GEO_ACCESS: GeoAccessSettings = {
  enabled: true,
  allowed_countries: ["US", "CA"],
};

/** Locked defaults — always included when geo restriction is enabled. */
export const CORE_ALLOWED_COUNTRIES = ["US", "CA"] as const;

export type CountryOption = {
  code: string;
  name: string;
  hint?: string;
};

/** Optional extras beyond US/CA. Keep lean — PK is for local/dev testing. */
export const OPTIONAL_COUNTRY_OPTIONS: CountryOption[] = [
  {
    code: "PK",
    name: "Dev only country",
    hint: "Pakistan — enable while testing from this region",
  },
];

export function normalizeGeoAccess(raw: unknown): GeoAccessSettings {
  const base =
    raw && typeof raw === "object"
      ? (raw as Partial<GeoAccessSettings>)
      : {};

  const enabled = base.enabled !== false;
  const fromCms = Array.isArray(base.allowed_countries)
    ? base.allowed_countries
        .map((code) => String(code).trim().toUpperCase())
        .filter((code) => /^[A-Z]{2}$/.test(code))
    : [];

  // Only keep core + known optional codes (drops stale MX/GB/etc. from older saves)
  const optionalCodes = new Set(
    OPTIONAL_COUNTRY_OPTIONS.map((c) => c.code),
  );
  const extras = fromCms.filter((code) => optionalCodes.has(code));

  const allowed = new Set<string>([
    ...CORE_ALLOWED_COUNTRIES,
    ...extras,
  ]);

  return {
    enabled,
    allowed_countries: [...allowed].sort(),
  };
}

/**
 * @param isLocalDev — true for localhost / private IP. Always allowed so
 *   local `next dev` keeps working. Production uses real geo.
 */
export function isCountryAllowed(
  countryCode: string | null | undefined,
  settings: GeoAccessSettings,
  options: { isLocalDev?: boolean } = {},
): boolean {
  if (!settings.enabled) return true;
  if (options.isLocalDev) return true;

  if (!countryCode) {
    // Fail closed once we're past local-dev: unknown country is blocked.
    return false;
  }

  const code = countryCode.trim().toUpperCase();
  return settings.allowed_countries.includes(code);
}
