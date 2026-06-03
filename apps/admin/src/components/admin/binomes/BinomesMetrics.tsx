import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Heart, Clock, Star, Users, Calendar } from "lucide-react";

const metriquesData = {
  tauxFidelite: {
    global: 85,
    excellent: 95,
    etabli: 80,
    nouveau: 65,
    evolution: "+12%"
  },
  tempsStabilisation: {
    moyenne: 45,
    median: 35,
    min: 14,
    max: 120,
    unite: "jours"
  },
  satisfactionDuree: [
    { duree: "< 1 mois", satisfaction: 4.1, binomes: 12 },
    { duree: "1-3 mois", satisfaction: 4.3, binomes: 28 },
    { duree: "3-6 mois", satisfaction: 4.6, binomes: 35 },
    { duree: "6-12 mois", satisfaction: 4.8, binomes: 42 },
    { duree: "> 12 mois", satisfaction: 4.9, binomes: 18 }
  ],
  performanceGlobale: {
    binomesActifs: 135,
    satisfaction: 4.6,
    retention: 87,
    croissance: "+23%"
  }
};

export const BinomesMetrics = () => {
  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Fidélité</CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metriquesData.tauxFidelite.global}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {metriquesData.tauxFidelite.evolution} ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Stabilisation</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metriquesData.tempsStabilisation.moyenne}</div>
            <p className="text-xs text-muted-foreground">jours en moyenne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Moyenne</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metriquesData.performanceGlobale.satisfaction}</div>
            <p className="text-xs text-muted-foreground">sur 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Binômes Actifs</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metriquesData.performanceGlobale.binomesActifs}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {metriquesData.performanceGlobale.croissance} ce trimestre
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Taux de fidélité par statut */}
      <Card>
        <CardHeader>
          <CardTitle>Taux de Fidélité par Statut de Binôme</CardTitle>
          <CardDescription>
            Analyse de la rétention selon le niveau de maturité de la relation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
                <span className="text-sm text-muted-foreground">Binômes matures (12+ mois)</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={metriquesData.tauxFidelite.excellent} className="w-24 h-2" />
                <span className="text-sm font-medium">{metriquesData.tauxFidelite.excellent}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">Établi</Badge>
                <span className="text-sm text-muted-foreground">Relations stables (3-12 mois)</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={metriquesData.tauxFidelite.etabli} className="w-24 h-2" />
                <span className="text-sm font-medium">{metriquesData.tauxFidelite.etabli}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Nouveau</Badge>
                <span className="text-sm text-muted-foreground">Débuts de relation (&lt; 3 mois)</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={metriquesData.tauxFidelite.nouveau} className="w-24 h-2" />
                <span className="text-sm font-medium">{metriquesData.tauxFidelite.nouveau}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temps de stabilisation détaillé */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Temps de Stabilisation</CardTitle>
            <CardDescription>
              Délai moyen avant qu'un binôme devienne stable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">{metriquesData.tempsStabilisation.moyenne}</div>
                <p className="text-muted-foreground">jours en moyenne</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">{metriquesData.tempsStabilisation.min}</div>
                  <p className="text-xs text-muted-foreground">Minimum</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">{metriquesData.tempsStabilisation.median}</div>
                  <p className="text-xs text-muted-foreground">Médiane</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">{metriquesData.tempsStabilisation.max}</div>
                  <p className="text-xs text-muted-foreground">Maximum</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Globale</CardTitle>
            <CardDescription>
              Indicateurs clés du système de binômes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Taux de rétention</span>
                <div className="flex items-center gap-2">
                  <Progress value={metriquesData.performanceGlobale.retention} className="w-16 h-2" />
                  <span className="text-sm font-medium">{metriquesData.performanceGlobale.retention}%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Satisfaction générale</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{metriquesData.performanceGlobale.satisfaction}/5</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Croissance trimestre</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">{metriquesData.performanceGlobale.croissance}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction par durée de relation */}
      <Card>
        <CardHeader>
          <CardTitle>Satisfaction par Durée de Relation</CardTitle>
          <CardDescription>
            Comment la satisfaction évolue avec le temps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metriquesData.satisfactionDuree.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium w-20">{item.duree}</div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{item.satisfaction}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Progress 
                    value={(item.satisfaction / 5) * 100} 
                    className="w-24 h-2" 
                  />
                  <div className="text-sm text-muted-foreground min-w-[60px]">
                    {item.binomes} binômes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tendances et prédictions */}
      <Card>
        <CardHeader>
          <CardTitle>Tendances & Prédictions</CardTitle>
          <CardDescription>
            Analyses prédictives basées sur les données historiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium text-green-800">Croissance Saine</h4>
              <p className="text-sm text-green-600 mt-1">
                +15 nouveaux binômes prévus ce mois
              </p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium text-blue-800">Stabilisation</h4>
              <p className="text-sm text-blue-600 mt-1">
                12 binômes passeront en "Établi" cette semaine
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <Heart className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium text-purple-800">Excellence</h4>
              <p className="text-sm text-purple-600 mt-1">
                5 binômes candidats au statut "Excellent"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};