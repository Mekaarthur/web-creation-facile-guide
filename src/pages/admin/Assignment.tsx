import { useState, useEffect } from "react";
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

const AdminAssignment = () => {
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [priorityMode, setPriorityMode] = useState("performance");
  const [stats, setStats] = useState<AssignmentStats>({
    pendingMissions: 0,
    todayAssignments: 0,
    activeProviders: 0,
    successRate: "0%"
  });
  const [pendingMissions, setPendingMissions] = useState<PendingMission[]>([]);
  const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
  const [loading, setLoading] = useState({
    stats: false,
    missions: false,
    toggle: false,
    priority: false,
    providers: false,
    bulkAssign: false,
    resetQueue: false
  });
  const [selectedMission, setSelectedMission] = useState<PendingMission | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadStats(),
      loadPendingMissions()
    ]);
  };

  const loadStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const { data, error } = await supabase.functions.invoke('admin-assignment', {
        body: { action: 'get_stats' }
      });

      if (error) throw error;

      if (data?.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const loadPendingMissions = async () => {
    setLoading(prev => ({ ...prev, missions: true }));
    try {
      const { data, error } = await supabase.functions.invoke('admin-assignment', {
        body: { action: 'get_pending_missions' }
      });

      if (error) throw error;

      if (data?.success) {
        setPendingMissions(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les missions en attente",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, missions: false }));
    }
  };

  const handleToggleAutoAssign = async () => {
    const newValue = !autoAssignEnabled;
    setLoading(prev => ({ ...prev, toggle: true }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('admin-assignment', {
        body: { 
          action: 'toggle_auto_assign', 
          enabled: newValue,
          adminUserId: user?.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAutoAssignEnabled(newValue);
        toast({
          title: newValue ? "Assignation automatique activée" : "Assignation automatique désactivée",
          description: data.message
        });
      }
    } catch (error) {
      console.error('Erreur lors du toggle:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'assignation automatique",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, toggle: false }));
    }
  };

  const handlePriorityModeChange = async (mode: string) => {
    setLoading(prev => ({ ...prev, priority: true }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('admin-assignment', {
        body: { 
          action: 'update_priority_mode', 
          mode,
          adminUserId: user?.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setPriorityMode(mode);
        toast({
          title: "Mode de priorité mis à jour",
          description: data.message
        });
      }
    } catch (error) {
      console.error('Erreur lors du changement de mode:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le mode de priorité",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, priority: false }));
    }
  };

  const handleViewMission = async (mission: PendingMission) => {
    setSelectedMission(mission);
    setLoading(prev => ({ ...prev, providers: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-assignment', {
        body: { 
          action: 'get_available_providers',
          serviceType: mission.service,
          location: mission.location
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAvailableProviders(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestataires disponibles",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, providers: false }));
    }
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
          adminUserId: user?.id
        }
      });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw new Error('Erreur de communication avec le serveur');
      }

      if (data?.success) {
        toast({
          title: "Mission assignée",
          description: data.message || "Mission assignée avec succès"
        });
        setSelectedMission(null);
        setAvailableProviders([]);
        loadInitialData(); // Recharger les données
      } else {
        throw new Error(data?.error || 'Erreur lors de l\'assignation');
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'assigner la mission",
        variant: "destructive"
      });
    }
  };

  const handleBulkAssign = async () => {
    if (pendingMissions.length === 0) return;
    
    setLoading(prev => ({ ...prev, bulkAssign: true }));
    
    try {
      const missionIds = pendingMissions.slice(0, 5).map(m => m.id); // Max 5 missions
      
      const { data, error } = await supabase.rpc('bulk_assign_missions', {
        p_mission_ids: missionIds
      });

      if (error) throw error;

      const successCount = data?.filter((r: any) => r.success).length || 0;
      const failCount = data?.filter((r: any) => !r.success).length || 0;

      if (successCount > 0) {
        toast({
          title: "Assignation en lot réussie",
          description: `${successCount} missions assignées avec succès${failCount > 0 ? `, ${failCount} échecs` : ''}`
        });
      } else {
        throw new Error('Aucune mission n\'a pu être assignée');
      }

      loadInitialData(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de l\'assignation en lot:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'effectuer l'assignation en lot",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, bulkAssign: false }));
    }
  };

  const handleResetQueue = async () => {
    setLoading(prev => ({ ...prev, resetQueue: true }));
    
    try {
      const { data, error } = await supabase.rpc('reset_mission_queue');

      if (error) throw error;

      toast({
        title: "Queue réinitialisée",
        description: `${data || 0} missions réinitialisées avec succès`
      });
      loadInitialData(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser la queue",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, resetQueue: false }));
    }
  };

  const assignmentStats = [
    { label: "Missions en attente", value: loading.stats ? "..." : stats.pendingMissions, icon: Clock, color: "text-orange-600" },
    { label: "Assignées aujourd'hui", value: loading.stats ? "..." : stats.todayAssignments, icon: Target, color: "text-green-600" },
    { label: "Prestataires actifs", value: loading.stats ? "..." : stats.activeProviders, icon: Users, color: "text-blue-600" },
    { label: "Taux de succès", value: loading.stats ? "..." : stats.successRate, icon: BarChart3, color: "text-purple-600" }
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

      {/* Stats */}
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
                disabled={loading.toggle}
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
                    disabled={loading.priority}
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
                    disabled={loading.priority}
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
                    disabled={loading.priority}
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
              {loading.missions ? (
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
              
              <Button className="w-full" variant="outline" onClick={loadPendingMissions} disabled={loading.missions}>
                {loading.missions ? (
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
                    disabled={loading.bulkAssign}
                    size="sm"
                  >
                    {loading.bulkAssign ? (
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
                    disabled={loading.resetQueue}
                    size="sm"
                  >
                    {loading.resetQueue ? (
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

      {/* Modal pour l'assignation de prestataires */}
      {selectedMission && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Assigner un prestataire</CardTitle>
            <CardDescription>
              Mission: {selectedMission.service} à {selectedMission.location}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading.providers ? (
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