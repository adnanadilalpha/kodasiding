export type AnalyticsStatCard = {
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
};

export type AnalyticsRange = "7d" | "30d" | "90d" | "6m";
export type AnalyticsMetric = "users" | "sessions" | "views";

export type AnalyticsTimePoint = {
  key: string;
  label: string;
  value: number;
};

export type PopularPageRow = {
  path: string;
  label: string;
  visitors: number;
  pageLoads: number;
};

export type VisitorLocationRow = {
  key: string;
  label: string;
  detail?: string;
  visitors: number;
  views: number;
  countryCode: string;
  region?: string | null;
  city?: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type AnalyticsEventRow = {
  eventName: string;
  label: string;
  count: number;
  uniqueVisitors: number;
};

export type AnalyticsDashboardData = {
  activeUsers: AnalyticsStatCard;
  totalVisitors: AnalyticsStatCard;
  uniqueSessions: AnalyticsStatCard;
  pageViews: AnalyticsStatCard;
  avgTimeOnSite: AnalyticsStatCard;
  bounceRate: AnalyticsStatCard;
  visitorsOverTime: AnalyticsTimePoint[];
  popularPages: PopularPageRow[];
  visitorLocations: VisitorLocationRow[];
  topEvents: AnalyticsEventRow[];
  range: AnalyticsRange;
  metric: AnalyticsMetric;
  hasData: boolean;
};
