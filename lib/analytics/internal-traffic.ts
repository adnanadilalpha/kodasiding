/** Operator / QA traffic segregation. */

export function getInternalVisitorKeys(): Set<string> {
  const raw = process.env.ANALYTICS_INTERNAL_VISITOR_KEYS ?? "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function isInternalVisitorKey(
  visitorKey: string | null | undefined,
): boolean {
  if (!visitorKey) return false;
  return getInternalVisitorKeys().has(visitorKey);
}

export function isInternalAnalyticsRequest(
  visitorKey: string,
  request?: Request,
): boolean {
  if (isInternalVisitorKey(visitorKey)) return true;

  const header = request?.headers.get("x-koda-internal-analytics")?.trim();
  return header === "1" || header === "true";
}
