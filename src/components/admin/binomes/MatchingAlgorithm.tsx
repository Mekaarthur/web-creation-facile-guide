import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { MapPin, Star, Clock, Heart, Zap, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const matchingSuggestions = [
  {
    client: "Laura Martins",
    prestataire: "Camille Durand",
    score: 95,
    criteres: {
      zone: 100,
      services: 95,
      disponibilites: 90,
      personnalite: 85,
      historique: 100
    },
    services: ["Bika Kids"],
    zone: "Paris 16ème",
    distance: "1.2 km"
  },
  {
    client: "Thomas Blanc",
    prestataire: "Mathilde Leroux",
    score: 88,
    criteres: {
      zone: 95,
      services: 85,
      disponibilites: 95,
      personnalite: 80,
      historique: 85
    },
    services: ["Bika Maison"],
    zone: "Neuilly-sur-Seine",
    distance: "2.1 km"
  },
  {
    client: "Sophie Chen",
    prestataire: "Alice Moreau",
    score: 82,
    criteres: {
      zone: 85,
      services: 90,
      disponibilites: 80,
      personnalite: 90,
      historique: 75
    },
    services: ["Bika Seniors"],
    zone: "Boulogne-Billancourt",
    distance: "3.5 km"
  }
];

const getCritereBadge = (score: number) => {
  if (score >= 90) return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
  if (score >= 80) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Bon</Badge>;
  if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Moyen</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200">Faible</Badge>;
};

export const MatchingAlgorithm = () => {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState("");
  const [searchResults, setSearchResults] = useState(matchingSuggestions);

  const handleRunMatching = async () => {
    if (!selectedClient) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client",
        variant: "destructive"
      });
      return;
    }

    try {
      // Récupérer l'UUID du client sélectionné (simulé pour l'instant)
      const { data: clientProfile, error: clientError } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('first_name', `%${selectedClient}%`)
        .single();

      if (clientError) throw clientError;

      const { data, error } = await supabase.rpc('match_providers_for_client', {
        p_client_id: clientProfile.user_id,
        p_service_type: null,
        p_location: null
      });

      if (error) throw error;

      if (data && data.length > 0) {
        toast({
          title: "Matching réussi",
          description: `Score: ${data[0].compatibility_score} | ${data[0].reasoning}`,
        });
      } else {
        toast({
          title: "Aucun match trouvé",
          description: "Aucun prestataire compatible pour ce client",
        });
      }
    } catch (error: any) {
      console.error('Erreur matching:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du matching",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration du matching */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Algorithme de Matching Intelligent
          </CardTitle>
          <CardDescription>
            Trouvez le prestataire idéal selon nos critères automatiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">Client à matcher</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laura">Laura Martins</SelectItem>
                  <SelectItem value="thomas">Thomas Blanc</SelectItem>
                  <SelectItem value="sophie">Sophie Chen</SelectItem>
                  <SelectItem value="pierre">Pierre Dubois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service-type">Type de service</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kids">Bika Kids</SelectItem>
                  <SelectItem value="maison">Bika Maison</SelectItem>
                  <SelectItem value="seniors">Bika Seniors</SelectItem>
                  <SelectItem value="vie">Bika Vie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleRunMatching} className="w-full">
            <Target className="h-4 w-4 mr-2" />
            Lancer le Matching
          </Button>
        </CardContent>
      </Card>

      {/* Critères de matching */}
      <Card>
        <CardHeader>
          <CardTitle>Critères de Compatibilité</CardTitle>
          <CardDescription>
            Pondération des facteurs pour le matching automatique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Zone Géographique</h3>
              <p className="text-2xl font-bold text-primary">30%</p>
              <p className="text-xs text-muted-foreground">Priorité 1</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Star className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">Services Compatibles</h3>
              <p className="text-2xl font-bold text-blue-600">25%</p>
              <p className="text-xs text-muted-foreground">Expertise</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">Disponibilités</h3>
              <p className="text-2xl font-bold text-green-600">20%</p>
              <p className="text-xs text-muted-foreground">Croisées</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Heart className="h-8 w-8 mx-auto mb-2 text-pink-600" />
              <h3 className="font-medium">Personnalités</h3>
              <p className="text-2xl font-bold text-pink-600">15%</p>
              <p className="text-xs text-muted-foreground">Compatible</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium">Historique</h3>
              <p className="text-2xl font-bold text-purple-600">10%</p>
              <p className="text-xs text-muted-foreground">Si existant</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats du matching */}
      <Card>
        <CardHeader>
          <CardTitle>Suggestions de Matching</CardTitle>
          <CardDescription>
            Prestataires recommandés avec score de compatibilité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {searchResults.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg">{suggestion.client} → {suggestion.prestataire}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{suggestion.services[0]}</Badge>
                      <span className="text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {suggestion.zone} ({suggestion.distance})
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{suggestion.score}%</div>
                    <p className="text-xs text-muted-foreground">Compatibilité</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Zone géographique</p>
                    <div className="flex items-center gap-2">
                      <Progress value={suggestion.criteres.zone} className="h-2 flex-1" />
                      <span className="text-xs">{suggestion.criteres.zone}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Services</p>
                    <div className="flex items-center gap-2">
                      <Progress value={suggestion.criteres.services} className="h-2 flex-1" />
                      <span className="text-xs">{suggestion.criteres.services}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Disponibilités</p>
                    <div className="flex items-center gap-2">
                      <Progress value={suggestion.criteres.disponibilites} className="h-2 flex-1" />
                      <span className="text-xs">{suggestion.criteres.disponibilites}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Personnalité</p>
                    <div className="flex items-center gap-2">
                      <Progress value={suggestion.criteres.personnalite} className="h-2 flex-1" />
                      <span className="text-xs">{suggestion.criteres.personnalite}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Historique</p>
                    <div className="flex items-center gap-2">
                      <Progress value={suggestion.criteres.historique} className="h-2 flex-1" />
                      <span className="text-xs">{suggestion.criteres.historique}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  {getCritereBadge(suggestion.score)}
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">Analyser</Button>
                    <Button size="sm">Créer le Binôme</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};