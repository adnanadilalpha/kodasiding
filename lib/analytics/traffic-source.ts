/** Normalize referrers into GA-style traffic sources. */

export type TrafficSource = {
  key: string;
  label: string;
  channel: "Direct" | "Organic Search" | "Referral" | "Social";
};

const SEARCH_HOSTS = [
  "google.",
  "bing.",
  "yahoo.",
  "duckduckgo.",
  "baidu.",
  "yandex.",
  "ecosia.",
];

const SOCIAL_HOSTS = [
  "facebook.",
  "fb.",
  "instagram.",
  "twitter.",
  "x.com",
  "t.co",
  "linkedin.",
  "pinterest.",
  "tiktok.",
  "reddit.",
  "youtube.",
  "youtu.be",
];

function hostFromReferrer(referrer: string | null | undefined): string | null {
  const raw = referrer?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    return url.hostname.replace(/^www\./i, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

export function classifyTrafficSource(
  referrer: string | null | undefined,
): TrafficSource {
  const host = hostFromReferrer(referrer);
  if (!host) {
    return { key: "(direct)", label: "Direct", channel: "Direct" };
  }

  // Same-site / localhost navigations count as Direct (not a marketing source)
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.includes("kodasiding")
  ) {
    return { key: "(direct)", label: "Direct", channel: "Direct" };
  }

  if (SEARCH_HOSTS.some((part) => host.includes(part))) {
    return {
      key: `organic:${host}`,
      label: host,
      channel: "Organic Search",
    };
  }

  if (SOCIAL_HOSTS.some((part) => host.includes(part))) {
    return {
      key: `social:${host}`,
      label: host,
      channel: "Social",
    };
  }

  return {
    key: `referral:${host}`,
    label: host,
    channel: "Referral",
  };
}
