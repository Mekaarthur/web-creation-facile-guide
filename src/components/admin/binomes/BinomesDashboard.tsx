import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Star, TrendingUp, Users, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const binomesData = [
  {
    id: 1,
    client: "Marie Dubois",
    prestataire: "Sophie Martin",
    status: "excellent",
    missions: 15,
    satisfaction: 4.9,
    prochaineMission: "2024-01-20",
    dureeRelation: "8 mois"
  },
  {
    id: 2,
    client: "Pierre Lefebvre",
    prestataire: "Julie Bernard",
    status: "etabli",
    missions: 8,
    satisfaction: 4.6,
    prochaineMission: "2024-01-18",
    dureeRelation: "4 mois"
  },
  {
    id: 3,
    client: "Anne Moreau",
    prestataire: "Claire Rousseau",
    status: "nouveau",
    missions: 2,
    satisfaction: 4.2,
    prochaineMission: "2024-01-22",
    dureeRelation: "3 semaines"
  },
  {
    id: 4,
    client: "Jean Petit",
    prestataire: "Emma Leroy",
    status: "a_surveiller",
    missions: 12,
    satisfaction: 3.8,
    prochaineMission: null,
    dureeRelation: "6 mois"
  }
];

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
  const excellentBinomes = binomesData.filter(b => b.status === "excellent").length;
  const etablisBinomes = binomesData.filter(b => b.status === "etabli").length;
  const nouveauBinomes = binomesData.filter(b => b.status === "nouveau").length;
  const aSurveillerBinomes = binomesData.filter(b => b.status === "a_surveiller").length;

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
            {binomesData.map((binome) => (
              <div key={binome.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{binome.client}</p>
                      <p className="text-sm text-muted-foreground">avec {binome.prestataire}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">{binome.missions}</p>
                    <p className="text-xs text-muted-foreground">missions</p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{binome.satisfaction}</span>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium">{binome.dureeRelation}</p>
                    <p className="text-xs text-muted-foreground">de relation</p>
                  </div>

                  {getStatusBadge(binome.status)}

                  <div className="text-center">
                    {binome.prochaineMission ? (
                      <>
                        <p className="text-sm font-medium">{new Date(binome.prochaineMission).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">prochaine mission</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune mission</p>
                    )}
                  </div>

                  <Button variant="outline" size="sm">
                    Détails
                  </Button>
                </div>
              </div>
            ))}
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