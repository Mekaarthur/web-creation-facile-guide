import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, Clock, Target, BarChart3, AlertCircle } from "lucide-react";

const AdminAssignment = () => {
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [priorityMode, setPriorityMode] = useState("performance");
  const { toast } = useToast();

  const handleToggleAutoAssign = () => {
    setAutoAssignEnabled(!autoAssignEnabled);
    toast({
      title: autoAssignEnabled ? "Assignation automatique désactivée" : "Assignation automatique activée",
      description: autoAssignEnabled ? "Les missions devront être assignées manuellement" : "Les missions seront assignées automatiquement"
    });
  };

  const assignmentStats = [
    { label: "Missions en attente", value: 12, icon: Clock, color: "text-orange-600" },
    { label: "Assignées aujourd'hui", value: 47, icon: Target, color: "text-green-600" },
    { label: "Prestataires actifs", value: 156, icon: Users, color: "text-blue-600" },
    { label: "Taux de succès", value: "94%", icon: BarChart3, color: "text-purple-600" }
  ];

  const pendingAssignments = [
    { id: 1, service: "Ménage", location: "Paris 15e", priority: "Haute", timeWaiting: "15 min" },
    { id: 2, service: "Garde d'enfants", location: "Neuilly", priority: "Normale", timeWaiting: "8 min" },
    { id: 3, service: "Jardinage", location: "Boulogne", priority: "Basse", timeWaiting: "32 min" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignation automatique</h1>
          <p className="text-muted-foreground">Gestion des règles d'assignation des missions</p>
        </div>
        <Badge variant={autoAssignEnabled ? "default" : "secondary"}>
          {autoAssignEnabled ? "Actif" : "Inactif"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {assignmentStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Configuration
            </CardTitle>
            <CardDescription>
              Paramétrez les règles d'assignation automatique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-assign">Assignation automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Assigner automatiquement les missions aux prestataires
                </p>
              </div>
              <Switch
                id="auto-assign"
                checked={autoAssignEnabled}
                onCheckedChange={handleToggleAutoAssign}
              />
            </div>

            <div className="space-y-3">
              <Label>Mode de priorité</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="performance"
                    name="priority"
                    value="performance"
                    checked={priorityMode === "performance"}
                    onChange={(e) => setPriorityMode(e.target.value)}
                  />
                  <Label htmlFor="performance">Performance (rating + taux d'acceptation)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="rotation"
                    name="priority"
                    value="rotation"
                    checked={priorityMode === "rotation"}
                    onChange={(e) => setPriorityMode(e.target.value)}
                  />
                  <Label htmlFor="rotation">Rotation équitable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="proximity"
                    name="priority"
                    value="proximity"
                    checked={priorityMode === "proximity"}
                    onChange={(e) => setPriorityMode(e.target.value)}
                  />
                  <Label htmlFor="proximity">Proximité géographique</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missions en attente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Missions en attente
            </CardTitle>
            <CardDescription>
              Missions qui attendent une assignation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingAssignments.map((mission) => (
                <div key={mission.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{mission.service}</p>
                    <p className="text-sm text-muted-foreground">{mission.location}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={mission.priority === "Haute" ? "destructive" : mission.priority === "Normale" ? "default" : "outline"} className="mb-1">
                      {mission.priority}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{mission.timeWaiting}</p>
                  </div>
                </div>
              ))}
              <Button className="w-full" variant="outline">
                Voir toutes les missions en attente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAssignment;