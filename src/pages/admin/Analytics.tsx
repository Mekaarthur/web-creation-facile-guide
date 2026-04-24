import { AdvancedAnalytics } from "@/components/admin/analytics/AdvancedAnalytics";
import { WeeklyDashboard } from "@/components/admin/WeeklyDashboard";
import KpiExportPanel from "@/components/admin/analytics/KpiExportPanel";

const Analytics = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <WeeklyDashboard />
      <KpiExportPanel />
      <AdvancedAnalytics />
    </div>
  );
};

export default Analytics;
