export const ANALYTICS_EVENTS = {
  CTA_CLICK: "cta_click",
  NAV_CLICK: "nav_click",
  QUOTE_OPEN: "quote_open",
  QUOTE_SUBMIT: "quote_submit",
  DEALER_SEARCH: "dealer_search",
  DEALER_CALL: "dealer_call",
  MANUAL_DOWNLOAD: "manual_download",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export const ANALYTICS_EVENT_LABELS: Record<AnalyticsEventName, string> = {
  cta_click: "CTA click",
  nav_click: "Navigation click",
  quote_open: "Quote opened",
  quote_submit: "Quote submitted",
  dealer_search: "Dealer search",
  dealer_call: "Dealer call",
  manual_download: "Manual download",
};
