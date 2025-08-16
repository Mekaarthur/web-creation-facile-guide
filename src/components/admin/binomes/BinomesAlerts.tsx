import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, TrendingDown, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const alertes = [
  {
    id: 1,
    type: "binome_risque",
    title: "Binôme à risque",
    description: "Marie Dubois & Sophie Martin - Satisfaction en baisse",
    details: "Dernière note: 3.2/5 (était 4.8/5 le mois dernier)",
    priority: "high",
    date: "2024-01-15",
    actions: ["Médiation", "Analyse détaillée"]
  },
  {
    id: 2,
    type: "client_sans_prestataire",
    title: "Nouveau client sans prestataire",
    description: "Jean Durand - Inscrit depuis 3 jours",
    details: "Zone: Paris 15ème, Service: Bika Kids",
    priority: "medium",
    date: "2024-01-16",
    actions: ["Lancer matching", "Contact commercial"]
  },
  {
    id: 3,
    type: "prestataire_surcharge",
    title: "Prestataire surchargé",
    description: "Claire Rousseau - 8 familles assignées",
    details: "Limite recommandée: 6 familles",
    priority: "medium",
    date: "2024-01-14",
    actions: ["Redistribuer", "Recruter backup"]
  },
  {
    id: 4,
    type: "satisfaction_baisse",
    title: "Satisfaction en baisse",
    description: "Thomas Blanc & Emma Leroy",
    details: "3 dernières missions notées < 4/5",
    priority: "high",
    date: "2024-01-13",
    actions: ["Formation prestataire", "Médiation"]
  }
];

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Urgent</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Modéré</Badge>;
    case "low":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Faible</Badge>;
    default:
      return <Badge variant="secondary">{priority}</Badge>;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "binome_risque":
    case "satisfaction_baisse":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "client_sans_prestataire":
      return <UserPlus className="h-5 w-5 text-blue-500" />;
    case "prestataire_surcharge":
      return <Users className="h-5 w-5 text-yellow-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-gray-500" />;
  }
};

export const BinomesAlerts = () => {
  const alertesUrgentes = alertes.filter(a => a.priority === "high").length;
  const alertesModerees = alertes.filter(a => a.priority === "medium").length;

  return (
    <div className="space-y-6">
      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Alertes Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertesUrgentes}</div>
            <p className="text-xs text-red-600">Nécessitent intervention immédiate</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Alertes Modérées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertesModerees}</div>
            <p className="text-xs text-yellow-600">À traiter dans les 48h</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Système Sain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">87%</div>
            <p className="text-xs text-green-600">Binômes sans problème</p>
          </CardContent>
        </Card>
      </div>

      {/* Types d'alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Alert className="border-red-200 bg-red-50">
          <TrendingDown className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <strong>Binômes à risque</strong><br />
            Satisfaction en baisse détectée
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50">
          <UserPlus className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <strong>Nouveaux clients</strong><br />
            Sans prestataire attitré
          </AlertDescription>
        </Alert>

        <Alert className="border-yellow-200 bg-yellow-50">
          <Users className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700">
            <strong>Prestataires surchargés</strong><br />
            Trop de familles assignées
          </AlertDescription>
        </Alert>

        <Alert className="border-purple-200 bg-purple-50">
          <AlertTriangle className="h-4 w-4 text-purple-500" />
          <AlertDescription className="text-purple-700">
            <strong>Incidents répétés</strong><br />
            Même binôme signalé
          </AlertDescription>
        </Alert>
      </div>

      {/* Liste détaillée des alertes */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes Actives</CardTitle>
          <CardDescription>
            Situations nécessitant votre attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alertes.map((alerte) => (
              <div key={alerte.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(alerte.type)}
                    <div>
                      <h3 className="font-medium">{alerte.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alerte.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alerte.details}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(alerte.priority)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(alerte.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {alerte.actions.map((action, index) => (
                    <Button key={index} variant="outline" size="sm">
                      {action}
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Marquer comme traité
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration des alertes */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des Alertes</CardTitle>
          <CardDescription>
            Personnalisez les seuils et notifications automatiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Seuils de Satisfaction</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Alerte binôme à risque</span>
                  <span className="font-medium">&lt; 4.0/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Alerte critique</span>
                  <span className="font-medium">&lt; 3.5/5</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Limites Prestataires</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nombre max de familles</span>
                  <span className="font-medium">6 familles</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Délai sans mission</span>
                  <span className="font-medium">7 jours</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};