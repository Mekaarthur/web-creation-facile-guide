import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Clock, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface EmergencyAlert {
  id: string;
  original_booking_id: string;
  replacement_provider_id: string;
  reason: string;
  status: string;
  auto_assigned: boolean;
  accepted_at: string | null;
  created_at: string;
  booking: {
    service_id: string;
    address: string;
    booking_date: string;
    start_time: string;
  };
}

export const EmergencyDashboard = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [backupProviders, setBackupProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmergencyData();
    setupRealtimeSubscription();
  }, []);

  const loadEmergencyData = async () => {
    try {
      // Charger les alertes urgentes
      const { data: emergencyData, error: emergencyError } = await supabase
        .from("emergency_assignments")
        .select(`
          *,
          booking:bookings!emergency_assignments_original_booking_id_fkey(
            service_id,
            address,
            booking_date,
            start_time
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (emergencyError) throw emergencyError;
      setAlerts(emergencyData || []);

      // Charger les prestataires backup disponibles
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("*")
        .eq("is_verified", true)
        .gte("rating", 4.0)
        .order("rating", { ascending: false })
        .limit(10);

      if (providersError) throw providersError;
      setBackupProviders(providersData || []);
    } catch (error: any) {
      console.error("Erreur chargement données urgence:", error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("emergency-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emergency_assignments",
        },
        (payload) => {
          toast.error("🚨 NOUVELLE URGENCE!", {
            description: payload.new.reason,
            duration: 10000,
          });
          loadEmergencyData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAssignBackup = async (alertId: string, providerId: string) => {
    try {
      const { error } = await supabase
        .from("emergency_assignments")
        .update({
          replacement_provider_id: providerId,
          status: "assigned",
          auto_assigned: true,
        })
        .eq("id", alertId);

      if (error) throw error;

      toast.success("Prestataire backup assigné");
      loadEmergencyData();
    } catch (error: any) {
      console.error("Erreur assignation backup:", error);
      toast.error("Erreur d'assignation");
    }
  };

  const handleEscalate = async (alertId: string) => {
    try {
      // Notifier tous les admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins) {
        for (const admin of admins) {
          await supabase.from("realtime_notifications").insert({
            user_id: admin.user_id,
            type: "emergency_escalated",
            title: "🚨 URGENCE ESCALADÉE",
            message: "Une situation urgente nécessite votre attention immédiate",
            priority: "urgent",
          });
        }
      }

      toast.success("Urgence escaladée aux administrateurs");
    } catch (error: any) {
      console.error("Erreur escalade:", error);
      toast.error("Erreur d'escalade");
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pool Backup</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupProviders.length}</div>
            <p className="text-xs text-muted-foreground">
              Prestataires disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 min</div>
            <p className="text-xs text-muted-foreground">
              Résolution moyenne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des alertes */}
      <Card>
        <CardHeader>
          <CardTitle>🚨 Alertes Urgentes en Temps Réel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune alerte urgente pour le moment
              </p>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            URGENCE
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString("fr-FR")}
                          </span>
                        </div>
                        <h4 className="font-semibold">{alert.reason}</h4>
                        <div className="text-sm text-muted-foreground">
                          <p>📍 {alert.booking.address}</p>
                          <p>
                            📅 {alert.booking.booking_date} à{" "}
                            {alert.booking.start_time}
                          </p>
                        </div>

                        <div className="pt-4 space-y-2">
                          <p className="text-sm font-medium">
                            Prestataires Backup Disponibles:
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {backupProviders.slice(0, 3).map((provider) => (
                              <Button
                                key={provider.id}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAssignBackup(alert.id, provider.id)
                                }
                              >
                                {provider.business_name}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEscalate(alert.id)}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Escalader
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pool de backup */}
      <Card>
        <CardHeader>
          <CardTitle>Pool Prestataires Backup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {backupProviders.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{provider.business_name}</p>
                  <p className="text-sm text-muted-foreground">
                    ⭐ {provider.rating} • {provider.missions_completed} missions
                  </p>
                </div>
                <Badge variant="secondary">Disponible</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
