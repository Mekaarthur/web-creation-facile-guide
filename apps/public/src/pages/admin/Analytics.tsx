import { AdvancedAnalytics } from "@/components/admin/analytics/AdvancedAnalytics";
import { WeeklyDashboard } from "@/components/admin/WeeklyDashboard";
import KpiExportPanel from "@/components/admin/analytics/KpiExportPanel";
import PlatformHealthWidget from "@/components/admin/analytics/PlatformHealthWidget";

const Analytics = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyDashboard />
        </div>
        <div className="lg:col-span-1">
          <PlatformHealthWidget />
        </div>
      </div>
      <KpiExportPanel />
      <AdvancedAnalytics />
    </div>
  );
};

export default Analytics;
