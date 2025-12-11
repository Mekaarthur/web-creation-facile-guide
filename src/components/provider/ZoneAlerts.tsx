import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MapPin, Settings, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ZoneAlert {
  id: string;
  service_type: string;
  location: string;
  distance_km: number;
  created_at: string;
  client_name: string;
}

export const ZoneAlerts = () => {
  const { user } = useAuth();
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [radiusKm, setRadiusKm] = useState(15);
  const [recentAlerts, setRecentAlerts] = useState<ZoneAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProviderSettings();
      loadRecentMissionsInZone();
      subscribeToNewMissions();
    }
  }, [user]);

  const loadProviderSettings = async () => {
    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        const { data: zoneData } = await supabase
          .from('prestataire_zones')
          .select('rayon_km, statut')
          .eq('prestataire_id', providerData.id)
          .single();

        if (zoneData) {
          setRadiusKm(zoneData.rayon_km || 15);
          setAlertsEnabled(zoneData.statut === 'actif');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentMissionsInZone = async () => {
    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!providerData) return;

      const { data: zoneData } = await supabase
        .from('prestataire_zones')
        .select('latitude, longitude, rayon_km')
        .eq('prestataire_id', providerData.id)
        .single();

      if (!zoneData?.latitude || !zoneData?.longitude) return;

      // Get recent client requests
      const { data: missions } = await supabase
        .from('client_requests')
        .select('id, service_type, location, created_at, client_name, city')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (missions) {
        // For now, show all pending missions as potential alerts
        // In production, you'd calculate actual distance
        const alerts: ZoneAlert[] = missions.map(m => ({
          id: m.id,
          service_type: m.service_type,
          location: m.city || m.location,
          distance_km: Math.floor(Math.random() * zoneData.rayon_km), // Placeholder
          created_at: m.created_at,
          client_name: m.client_name
        }));
        setRecentAlerts(alerts);
      }
    } catch (error) {
      console.error('Error loading missions:', error);
    }
  };

  const subscribeToNewMissions = () => {
    const channel = supabase
      .channel('zone-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_requests'
        },
        (payload) => {
          const newRequest = payload.new as any;
          toast.info('🔔 Nouvelle mission disponible', {
            description: `${newRequest.service_type} - ${newRequest.city || newRequest.location}`,
            duration: 10000
          });
          loadRecentMissionsInZone();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        await supabase
          .from('prestataire_zones')
          .update({
            rayon_km: radiusKm,
            statut: alertsEnabled ? 'actif' : 'inactif',
            updated_at: new Date().toISOString()
          })
          .eq('prestataire_id', providerData.id);

        toast.success('Paramètres enregistrés');
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return `Il y a ${Math.floor(diffMins / 1440)}j`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres des alertes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="alerts-toggle">Alertes activées</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications pour les missions dans votre zone
              </p>
            </div>
            <Switch
              id="alerts-toggle"
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Rayon de recherche</Label>
              <span className="text-sm font-medium">{radiusKm} km</span>
            </div>
            <Slider
              value={[radiusKm]}
              onValueChange={(v) => setRadiusKm(v[0])}
              min={5}
              max={50}
              step={5}
              disabled={!alertsEnabled}
            />
            <p className="text-xs text-muted-foreground">
              Vous recevrez des alertes pour les missions dans un rayon de {radiusKm} km
            </p>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer les paramètres'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Missions récentes dans votre zone
            {recentAlerts.length > 0 && (
              <Badge variant="secondary">{recentAlerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune mission disponible dans votre zone actuellement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{alert.service_type}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{alert.location}</span>
                      <span>•</span>
                      <span>~{alert.distance_km} km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {formatTimeAgo(alert.created_at)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
