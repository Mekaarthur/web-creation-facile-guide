import { AdminAlertsPanel } from "@/components/AdminAlertsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const AdminAlerts = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold">Gestion des Alertes</h1>
      </div>
      
      <AdminAlertsPanel />
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des alertes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Les alertes sont mises à jour automatiquement toutes les 30 secondes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAlerts;
