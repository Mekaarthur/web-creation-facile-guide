import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Star, TrendingUp, Users, Clock, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Binome {
  id: string;
  client_id: string;
  primary_provider_id: string;
  backup_provider_id: string;
  status: string;
  missions_count: number;
  compatibility_score: number;
  last_mission_date: string | null;
  created_at: string;
  client_profile?: any;
  primary_provider?: any;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "excellent":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
    case "etabli":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Établi</Badge>;
    case "nouveau":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Nouveau</Badge>;
    case "a_surveiller":
      return <Badge className="bg-red-100 text-red-800 border-red-200">À surveiller</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const BinomesDashboard = () => {
  const [binomesData, setBinomesData] = useState<Binome[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBinomes();
  }, []);

  const loadBinomes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('binomes')
        .select(`
          *,
          client_profile:profiles!binomes_client_id_fkey(first_name, last_name),
          primary_provider:providers!binomes_primary_provider_id_fkey(
            business_name,
            profiles(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBinomesData(data || []);
    } catch (error) {
      console.error('Erreur chargement binômes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les binômes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusFromScore = (score: number | null): string => {
    if (!score) return 'nouveau';
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'etabli';
    if (score >= 0.4) return 'nouveau';
    return 'a_surveiller';
  };

  const excellentBinomes = binomesData.filter(b => getStatusFromScore(b.compatibility_score) === "excellent").length;
  const etablisBinomes = binomesData.filter(b => getStatusFromScore(b.compatibility_score) === "etabli").length;
  const nouveauBinomes = binomesData.filter(b => getStatusFromScore(b.compatibility_score) === "nouveau").length;
  const aSurveillerBinomes = binomesData.filter(b => getStatusFromScore(b.compatibility_score) === "a_surveiller").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Binômes Excellents</CardTitle>
            <Heart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{excellentBinomes}</div>
            <p className="text-xs text-muted-foreground">+2 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Binômes Établis</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{etablisBinomes}</div>
            <p className="text-xs text-muted-foreground">Stables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Binômes</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{nouveauBinomes}</div>
            <p className="text-xs text-muted-foreground">En développement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À Surveiller</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{aSurveillerBinomes}</div>
            <p className="text-xs text-muted-foreground">Nécessite attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des binômes */}
      <Card>
        <CardHeader>
          <CardTitle>Binômes Actifs</CardTitle>
          <CardDescription>
            Liste des relations client-prestataire avec leur statut et performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {binomesData.map((binome) => {
              const clientName = binome.client_profile 
                ? `${binome.client_profile.first_name} ${binome.client_profile.last_name}`
                : 'Client inconnu';
              const providerName = binome.primary_provider?.business_name || 
                (binome.primary_provider?.profiles 
                  ? `${binome.primary_provider.profiles.first_name} ${binome.primary_provider.profiles.last_name}`
                  : 'Prestataire inconnu');
              const status = getStatusFromScore(binome.compatibility_score);
              const satisfaction = binome.compatibility_score ? (binome.compatibility_score * 5).toFixed(1) : '0.0';
              
              return (
                <div key={binome.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex flex-col">
                      <span className="font-medium">{clientName}</span>
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {providerName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm font-medium">{binome.missions_count || 0}</div>
                      <div className="text-xs text-muted-foreground">missions</div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{satisfaction}</span>
                    </div>
                    
                    {getStatusBadge(status)}
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Détails
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Évolution des binômes */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Relations</CardTitle>
          <CardDescription>
            Progression des binômes vers l'excellence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Nouveau → Établi</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Établi → Excellent</span>
                <span>60%</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Taux de rétention global</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};