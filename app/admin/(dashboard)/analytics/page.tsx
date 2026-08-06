import { AnalyticsSection } from "@/components/admin/dashboard/AnalyticsSection";
import { fetchAnalyticsDashboard } from "@/lib/admin/fetch-analytics";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AnalyticsPage() {
  await requireAdmin();
  const analytics = await fetchAnalyticsDashboard();

  return (
    <div className="flex w-full flex-col gap-8">
      <header>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Google Analytics–style reports from your first-party data — live
          visitors only, no estimates or demo fills.
        </p>
      </header>
      <AnalyticsSection initialAnalytics={analytics} />
    </div>
  );
}
