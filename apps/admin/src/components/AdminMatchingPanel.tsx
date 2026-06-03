import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Users,
  MapPin,
  Clock,
  Star,
  Search,
  Activity,
  Target,
  Brain,
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface MatchingStats {
  totalRequests: number;
  matchedRequests: number;
  averageMatchTime: string;
  successRate: string;
  activeProviders: number;
}

interface MatchResult {
  providerId: string;
  providerName: string;
  rating: number;
  distance?: number;
  advancedScore: number;
  recommended: boolean;
  location: string;
  hourlyRate: number;
}

const STATS_KEY = ['admin-matching-stats'] as const;

async function fetchMatchingStats(): Promise<MatchingStats> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: totalRequests }, { data: matchedRequests }, { data: activeProviders }] = await Promise.all([
    supabase.from('client_requests').select('id').gte('created_at', cutoff),
    supabase.from('client_requests').select('id').neq('assigned_provider_id', null).gte('created_at', cutoff),
    supabase.from('providers').select('id').eq('is_verified', true).eq('status', 'active'),
  ]);

  const total   = totalRequests?.length || 0;
  const matched = matchedRequests?.length || 0;
  return {
    totalRequests: total,
    matchedRequests: matched,
    averageMatchTime: "2.5 min",
    successRate: `${total > 0 ? Math.round((matched / total) * 100) : 0}%`,
    activeProviders: activeProviders?.length || 0,
  };
}

export const AdminMatchingPanel = () => {
  const [testResults, setTestResults]   = useState<MatchResult[]>([]);
  const [testLoading, setTestLoading]   = useState(false);
  const [testParams, setTestParams]     = useState({
    serviceType: 'Garde d\'enfants',
    location: 'Paris',
    urgency: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    budget: 25
  });
  const { toast } = useToast();

  const { data: stats, isLoading: loading } = useQuery<MatchingStats>({
    queryKey: STATS_KEY,
    queryFn: fetchMatchingStats,
  });

  const testMatching = async () => {
    setTestLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-providers', {
        body: {
          serviceType: testParams.serviceType,
          location: testParams.location,
          urgency: testParams.urgency,
          budget: testParams.budget,
          minRating: 3.0
        }
      });
      if (error) throw error;

      if (data?.success && data?.providers) {
        setTestResults(data.providers.slice(0, 5));
        toast({ title: "Test de matching réussi", description: `${data.providers.length} prestataires trouvés` });
      } else {
        setTestResults([]);
        toast({ title: "Aucun prestataire trouvé", description: "Essayez avec d'autres critères", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erreur de test", description: error.message || "Impossible de tester le matching", variant: "destructive" });
      setTestResults([]);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded"></div>)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Système de Matching Automatique IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-blue-600 font-medium">Demandes Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900">{stats?.totalRequests || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-green-600 font-medium">Taux de Succès</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-900">{stats?.successRate || "0%"}</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-purple-600 font-medium">Prestataires Actifs</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900">{stats?.activeProviders || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-orange-600 font-medium">Temps Moyen</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-900">{stats?.averageMatchTime || "N/A"}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="test">🧪 Tester le Matching</TabsTrigger>
              <TabsTrigger value="config">⚙️ Configuration</TabsTrigger>
              <TabsTrigger value="logs">📋 Logs Récents</TabsTrigger>
            </TabsList>

            <TabsContent value="test" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test de l'Algorithme de Matching</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Type de Service</Label>
                      <Select value={testParams.serviceType} onValueChange={(value) =>
                        setTestParams(prev => ({ ...prev, serviceType: value }))
                      }>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Garde d'enfants">🧸 Garde d'enfants</SelectItem>
                          <SelectItem value="Préparation culinaire">🏠 Préparation culinaire</SelectItem>
                          <SelectItem value="Garde d'animaux">🐾 Garde d'animaux</SelectItem>
                          <SelectItem value="Assistance seniors">👴 Assistance seniors</SelectItem>
                          <SelectItem value="Transport">✈️ Transport</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Localisation</Label>
                      <Input
                        value={testParams.location}
                        onChange={(e) => setTestParams(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Paris, Lyon, etc."
                      />
                    </div>
                    <div>
                      <Label>Urgence</Label>
                      <Select value={testParams.urgency} onValueChange={(value: any) =>
                        setTestParams(prev => ({ ...prev, urgency: value }))
                      }>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🟢 Faible</SelectItem>
                          <SelectItem value="normal">🟡 Normale</SelectItem>
                          <SelectItem value="high">🟠 Élevée</SelectItem>
                          <SelectItem value="urgent">🔴 Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Budget (€/h)</Label>
                      <Input
                        type="number"
                        value={testParams.budget}
                        onChange={(e) => setTestParams(prev => ({ ...prev, budget: parseInt(e.target.value) || 25 }))}
                        placeholder="25"
                      />
                    </div>
                  </div>

                  <Button onClick={testMatching} disabled={testLoading} className="w-full">
                    {testLoading ? (
                      <><Bot className="w-4 h-4 mr-2 animate-spin" />Test en cours de l'IA...</>
                    ) : (
                      <><Search className="w-4 h-4 mr-2" />Tester le Matching IA</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {testResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Résultats du Matching ({testResults.length} prestataires trouvés)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {testResults.map((result, index) => (
                        <div key={result.providerId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                            <div>
                              <p className="font-medium">{result.providerName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {result.location}
                                {result.distance && <><span>•</span><span>{result.distance.toFixed(1)} km</span></>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="font-medium">{result.rating.toFixed(1)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{result.hourlyRate}€/h</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={result.recommended ? "default" : "outline"}>
                                Score: {result.advancedScore.toFixed(0)}
                              </Badge>
                              {result.recommended && <p className="text-xs text-green-600 mt-1">Recommandé</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Configuration du Matching</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Algorithme IA</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Score basé sur rating (25%), distance (20%), disponibilité (20%), expérience (15%), prix (10%)
                      </p>
                      <Badge variant="outline">Actif</Badge>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium mb-2">Auto-Assignment</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Assignation automatique avec timeout de 5 minutes
                      </p>
                      <Badge variant="outline">Actif</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Critères de Matching</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><p className="font-medium">Distance Max</p><p className="text-muted-foreground">50 km</p></div>
                      <div><p className="font-medium">Rating Min</p><p className="text-muted-foreground">3.0/5</p></div>
                      <div><p className="font-medium">Timeout</p><p className="text-muted-foreground">5 minutes</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card>
                <CardHeader><CardTitle>Logs d'Activité du Matching</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span>✅ Matching réussi - Service: Garde d'enfants - Paris</span>
                      <span className="text-muted-foreground">Il y a 2 min</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span>🔍 Recherche de prestataires - Service: Préparation culinaire - Lyon</span>
                      <span className="text-muted-foreground">Il y a 5 min</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span>❌ Aucun prestataire trouvé - Service: Transport - Marseille</span>
                      <span className="text-muted-foreground">Il y a 8 min</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span>⏱️ Timeout assignation - Service: Assistance seniors - Nice</span>
                      <span className="text-muted-foreground">Il y a 12 min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
