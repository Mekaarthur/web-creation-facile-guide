import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, Clock, Target, BarChart3, AlertCircle, Eye, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AssignmentStats {
  pendingMissions: number;
  todayAssignments: number;
  activeProviders: number;
  successRate: string;
}

interface PendingMission {
  id: string;
  service: string;
  location: string;
  priority: string;
  timeWaiting: string;
  clientEmail: string;
}

interface AvailableProvider {
  id: string;
  name: string;
  location: string;
  rating: number;
  hourlyRate: string | number;
  performanceScore: number;
}

const DEFAULT_STATS: AssignmentStats = {
  pendingMissions: 0,
  todayAssignments: 0,
  activeProviders: 0,
  successRate: "0%",
};

async function fetchAssignmentStats(): Promise<AssignmentStats> {
  const { data, error } = await supabase.functions.invoke('admin-assignment', {
    body: { action: 'get_stats' },
  });
  if (error) throw error;
  if (data?.success) return data.data;
  return DEFAULT_STATS;
}

async function fetchPendingMissions(): Promise<PendingMission[]> {
  const { data, error } = await supabase.functions.invoke('admin-assignment', {
    body: { action: 'get_pending_missions' },
  });
  if (error) throw error;
  if (data?.success) return data.data;
  return [];
}

async function fetchAvailableProviders(mission: PendingMission): Promise<AvailableProvider[]> {
  const { data, error } = await supabase.functions.invoke('admin-assignment', {
    body: {
      action: 'get_available_providers',
      serviceType: mission.service,
      location: mission.location,
    },
  });
  if (error) throw error;
  if (data?.success) return data.data;
  return [];
}

const AdminAssignment = () => {
  const qc = useQueryClient();
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [priorityMode, setPriorityMode] = useState("performance");
  const [selectedMission, setSelectedMission] = useState<PendingMission | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [resetQueueLoading, setResetQueueLoading] = useState(false);
  const { toast } = useToast();

  const { data: stats = DEFAULT_STATS, isLoading: statsLoading } = useQuery<AssignmentStats>({
    queryKey: ['admin-assignment-stats'],
    queryFn: fetchAssignmentStats,
  });

  const { data: pendingMissions = [], isLoading: missionsLoading, refetch: refetchMissions } = useQuery<PendingMission[]>({
    queryKey: ['admin-assignment-pending'],
    queryFn: fetchPendingMissions,
  });

  const { data: availableProviders = [], isFetching: providersFetching } = useQuery<AvailableProvider[]>({
    queryKey: ['admin-assignment-providers', selectedMission?.id],
    queryFn: () => fetchAvailableProviders(selectedMission!),
    enabled: !!selectedMission,
  });

  const refreshData = () => {
    qc.invalidateQueries({ queryKey: ['admin-assignment-stats'] });
    qc.invalidateQueries({ queryKey: ['admin-assignment-pending'] });
  };

  const handleToggleAutoAssign = async () => {
    const newValue = !autoAssignEnabled;
    setToggleLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('admin-assignment', {
        body: { action: 'toggle_auto_assign', enabled: newValue, adminUserId: user?.id },
      });
      if (error) throw error;
      if (data?.success) {
        setAutoAssignEnabled(newValue);
        toast({
          title: newValue ? "Assignation automatique activée" : "Assignation automatique désactivée",
          description: data.message,
        });
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier l'assignation automatique", variant: "destructive" });
    } finally {
      setToggleLoading(false);
    }
  };

  const handlePriorityModeChange = async (mode: string) => {
    setPriorityLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('admin-assignment', {
        body: { action: 'update_priority_mode', mode, adminUserId: user?.id },
      });
      if (error) throw error;
      if (data?.success) {
        setPriorityMode(mode);
        toast({ title: "Mode de priorité mis à jour", description: data.message });
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier le mode de priorité", variant: "destructive" });
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleViewMission = (mission: PendingMission) => {
    setSelectedMission(mission);
  };

  const handleAssignMission = async (providerId: string) => {
    if (!selectedMission) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('admin-assignment', {
        body: {
          action: 'assign_mission_manually',
          missionId: selectedMission.id,
          providerId,
          adminUserId: user?.id,
        },
      });
      if (error) throw new Error('Erreur de communication avec le serveur');
      if (data?.success) {
        toast({ title: "Mission assignée", description: data.message || "Mission assignée avec succès" });
        setSelectedMission(null);
        refreshData();
      } else {
        throw new Error(data?.error || "Erreur lors de l'assignation");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'assigner la mission",
        variant: "destructive",
      });
    }
  };

  const handleBulkAssign = async () => {
    if (pendingMissions.length === 0) return;
    setBulkAssignLoading(true);
    try {
      const missionIds = pendingMissions.slice(0, 5).map(m => m.id);
      const { data, error } = await supabase.rpc('bulk_assign_missions', { p_mission_ids: missionIds });
      if (error) throw error;
      const successCount = data?.filter((r: any) => r.success).length || 0;
      const failCount = data?.filter((r: any) => !r.success).length || 0;
      if (successCount > 0) {
        toast({
          title: "Assignation en lot réussie",
          description: `${successCount} missions assignées avec succès${failCount > 0 ? `, ${failCount} échecs` : ''}`,
        });
      } else {
        throw new Error("Aucune mission n'a pu être assignée");
      }
      refreshData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'effectuer l'assignation en lot",
        variant: "destructive",
      });
    } finally {
      setBulkAssignLoading(false);
    }
  };

  const handleResetQueue = async () => {
    setResetQueueLoading(true);
    try {
      const { data, error } = await supabase.rpc('reset_mission_queue');
      if (error) throw error;
      toast({ title: "Queue réinitialisée", description: `${data || 0} missions réinitialisées avec succès` });
      refreshData();
    } catch {
      toast({ title: "Erreur", description: "Impossible de réinitialiser la queue", variant: "destructive" });
    } finally {
      setResetQueueLoading(false);
    }
  };

  const assignmentStats = [
    { label: "Missions en attente", value: statsLoading ? "..." : stats.pendingMissions, icon: Clock, color: "text-orange-600" },
    { label: "Assignées aujourd'hui", value: statsLoading ? "..." : stats.todayAssignments, icon: Target, color: "text-green-600" },
    { label: "Prestataires actifs", value: statsLoading ? "..." : stats.activeProviders, icon: Users, color: "text-blue-600" },
    { label: "Taux de succès", value: statsLoading ? "..." : stats.successRate, icon: BarChart3, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Assignation automatique</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Gestion des règles d'assignation des missions</p>
        </div>
        <Badge variant={autoAssignEnabled ? "default" : "secondary"}>
          {autoAssignEnabled ? "Actif" : "Inactif"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {assignmentStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 ml-2 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="auto-assign">Assignation automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Assigner automatiquement les missions aux prestataires
                </p>
              </div>
              <Switch
                id="auto-assign"
                checked={autoAssignEnabled}
                onCheckedChange={handleToggleAutoAssign}
                disabled={toggleLoading}
                className="flex-shrink-0"
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
                    onChange={(e) => handlePriorityModeChange(e.target.value)}
                    disabled={priorityLoading}
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
                    onChange={(e) => handlePriorityModeChange(e.target.value)}
                    disabled={priorityLoading}
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
                    onChange={(e) => handlePriorityModeChange(e.target.value)}
                    disabled={priorityLoading}
                  />
                  <Label htmlFor="proximity">Proximité géographique</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              {missionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Chargement des missions...</span>
                </div>
              ) : pendingMissions.length > 0 ? (
                pendingMissions.map((mission) => (
                  <div key={mission.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{mission.service}</p>
                      <p className="text-sm text-muted-foreground truncate">{mission.location}</p>
                    </div>
                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <Badge variant={mission.priority === "Haute" ? "destructive" : mission.priority === "Normale" ? "default" : "outline"} className="mb-1">
                          {mission.priority}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{mission.timeWaiting}</p>
                      </div>
                      <Button size="sm" onClick={() => handleViewMission(mission)} className="flex-shrink-0">
                        <Eye className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Voir</span>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune mission en attente
                </div>
              )}

              <Button className="w-full" variant="outline" onClick={() => refetchMissions()} disabled={missionsLoading}>
                {missionsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Actualisation...
                  </>
                ) : (
                  "Actualiser les missions"
                )}
              </Button>

              {pendingMissions.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button
                    className="flex-1 w-full"
                    onClick={handleBulkAssign}
                    disabled={bulkAssignLoading}
                    size="sm"
                  >
                    {bulkAssignLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Assignation...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Assigner 5 missions
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleResetQueue}
                    disabled={resetQueueLoading}
                    size="sm"
                  >
                    {resetQueueLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Reset...
                      </>
                    ) : (
                      "Reset Queue"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedMission && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Assigner un prestataire</CardTitle>
            <CardDescription>
              Mission: {selectedMission.service} à {selectedMission.location}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {providersFetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Recherche des prestataires...</span>
              </div>
            ) : availableProviders.length > 0 ? (
              <div className="space-y-3">
                {availableProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">{provider.location}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Note: {provider.rating}/5</span>
                        <span>Tarif: {typeof provider.hourlyRate === 'number' ? `${provider.hourlyRate}€/h` : provider.hourlyRate}</span>
                        <span>Performance: {provider.performanceScore}</span>
                      </div>
                    </div>
                    <Button onClick={() => handleAssignMission(provider.id)}>
                      <UserCheck className="w-4 h-4 mr-1" />
                      Assigner
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => setSelectedMission(null)}>
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Aucun prestataire disponible pour cette mission</p>
                <Button variant="outline" onClick={() => setSelectedMission(null)}>
                  Fermer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAssignment;
