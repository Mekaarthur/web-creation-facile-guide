import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Euro,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PrestationRealisee {
  id: string;
  service_type: string;
  duree_heures: number;
  taux_horaire: number;
  montant_total: number;
  statut_paiement: string;
  date_prestation: string;
  location: string;
  notes: string | null;
  validated_at: string | null;
  paid_at: string | null;
  client_requests?: {
    client_name: string;
    client_email: string;
  };
  bookings?: {
    client_id: string;
  };
}

export const PrestationsRealisees = () => {
  const [prestations, setPrestations] = useState<PrestationRealisee[]>([]);
  const [loading, setLoading] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadProviderData();
  }, []);

  useEffect(() => {
    if (providerId) {
      loadPrestations();
    }
  }, [providerId]);

  const loadProviderData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: provider } = await supabase
        .from('providers')
        .select('id, total_earnings, monthly_earnings')
        .eq('user_id', user.id)
        .single();

      if (provider) {
        setProviderId(provider.id);
        setTotalEarnings(provider.total_earnings || 0);
        setMonthlyEarnings(provider.monthly_earnings || 0);
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
    }
  };

  const loadPrestations = async () => {
    if (!providerId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prestations_realisees')
        .select(`
          *,
          client_requests (
            client_name,
            client_email
          ),
          bookings (
            client_id
          )
        `)
        .eq('provider_id', providerId)
        .order('date_prestation', { ascending: false });

      if (error) throw error;

      setPrestations(data || []);
    } catch (error) {
      console.error('Error loading prestations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (prestationId: string, newStatus: string) => {
    try {
      const updateData: any = {
        statut_paiement: newStatus
      };

      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('prestations_realisees')
        .update(updateData)
        .eq('id', prestationId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Paiement marqué comme ${newStatus === 'paid' ? 'payé' : 'en attente'}`,
      });

      loadPrestations();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'en_attente': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'en_attente': return 'En attente';
      case 'processing': return 'En cours';
      default: return status;
    }
  };

  if (!providerId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Veuillez créer votre profil prestataire pour voir vos prestations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé des gains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gains totaux
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEarnings.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">
              Depuis le début
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gains ce mois
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyEarnings.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">
              Mois en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des prestations */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Prestations réalisées</h2>
        <Badge variant="secondary">
          {prestations.length} prestation{prestations.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : prestations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Aucune prestation réalisée pour le moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Vos prestations terminées apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prestations.map((prestation) => (
            <Card key={prestation.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {prestation.service_type}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(prestation.statut_paiement)} text-white`}
                    >
                      {getStatusText(prestation.statut_paiement)}
                    </Badge>
                    <Badge variant="outline">
                      {prestation.montant_total.toFixed(2)}€
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(prestation.date_prestation), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{prestation.duree_heures}h à {prestation.taux_horaire}€/h</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{prestation.location}</span>
                  </div>
                </div>

                {prestation.client_requests?.client_name && (
                  <div>
                    <h4 className="font-medium mb-1">Client :</h4>
                    <p className="text-sm text-muted-foreground">
                      {prestation.client_requests.client_name}
                    </p>
                  </div>
                )}

                {prestation.notes && (
                  <div>
                    <h4 className="font-medium mb-1">Notes :</h4>
                    <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                      {prestation.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {prestation.validated_at && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">
                        Validé le {format(new Date(prestation.validated_at), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                  )}
                  
                  {prestation.paid_at && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Euro className="w-4 h-4" />
                      <span className="text-sm">
                        Payé le {format(new Date(prestation.paid_at), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions admin (temporaire pour test) */}
                {prestation.statut_paiement === 'en_attente' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => updatePaymentStatus(prestation.id, 'paid')}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Marquer comme payé
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};