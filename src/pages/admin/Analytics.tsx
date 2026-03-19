import { AdvancedAnalytics } from "@/components/admin/analytics/AdvancedAnalytics";
import { WeeklyDashboard } from "@/components/admin/WeeklyDashboard";

const Analytics = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <WeeklyDashboard />
      <AdvancedAnalytics />
    </div>
  );
};

export default Analytics;
