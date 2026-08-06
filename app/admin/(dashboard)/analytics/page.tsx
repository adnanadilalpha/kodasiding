import { AnalyticsSection } from "@/components/admin/dashboard/AnalyticsSection";
import { getTimeGreeting } from "@/lib/admin/format";
import { fetchAnalyticsDashboard } from "@/lib/admin/fetch-analytics";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AnalyticsPage() {
  const admin = await requireAdmin();
  const analytics = await fetchAnalyticsDashboard();
  const name = admin.email.split("@")[0] || "there";

  return (
    <div className="flex w-full flex-col gap-8">
      <header>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {getTimeGreeting()}, {name}. Here&apos;s what&apos;s happening.
        </p>
      </header>
      <AnalyticsSection initialAnalytics={analytics} />
    </div>
  );
}
