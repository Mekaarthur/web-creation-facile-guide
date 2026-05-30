import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  MapPin, 
  User, 
  ArrowRight,
  Users,
  AlertCircle,
  CheckCircle,
  Play,
  Square,
  MoreHorizontal
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Mission {
  id: string;
  client_name: string;
  service_type: string;
  service_display_name: string;
  location: string;
  status: string;
  created_at: string;
  preferred_date?: string;
  preferred_time?: string;
  assigned_provider_id?: string;
  urgency_level?: string;
  provider?: {
    business_name: string;
  };
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string[];
  color: string;
  icon: React.ReactNode;
  missions: Mission[];
}

export const AdminKanbanBoard = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const { toast } = useToast();

  const kanbanColumns: Omit<KanbanColumn, 'missions'>[] = [
    {
      id: 'new',
      title: 'Nouvelles demandes',
      status: ['new'],
      color: 'blue',
      icon: <Square className="w-4 h-4" />
    },
    {
      id: 'assigned',
      title: 'Assignées',
      status: ['assigned'],
      color: 'orange',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'confirmed',
      title: 'Confirmées',
      status: ['confirmee', 'confirmed'],
      color: 'green',
      icon: <CheckCircle className="w-4 h-4" />
    },
    {
      id: 'in_progress',
      title: 'En cours',
      status: ['en_cours'],
      color: 'purple',
      icon: <Play className="w-4 h-4" />
    },
    {
      id: 'completed',
      title: 'Terminées',
      status: ['terminee'],
      color: 'gray',
      icon: <CheckCircle className="w-4 h-4" />
    },
    {
      id: 'issues',
      title: 'Problèmes',
      status: ['unmatched', 'cancelled'],
      color: 'red',
      icon: <AlertCircle className="w-4 h-4" />
    }
  ];

  useEffect(() => {
    loadMissions();
    
    // Écouter les changements en temps réel
    const channel = supabase
      .channel('kanban-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_requests'
        },
        () => {
          loadMissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mappe le service brut vers nos catégories BIKA visibles
  const getServiceDisplayName = (serviceTypeRaw: string, descriptionRaw?: string): string => {
    const normalize = (s: string) => s
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const source = normalize(`${serviceTypeRaw || ''} ${descriptionRaw || ''}`);
    const hasAny = (keywords: string[]) => keywords.some(k => source.includes(k));

    if (hasAny(['kid', 'enfant', 'babysit', 'garde enfant', 'devoir', 'sortie ecole'])) return '🧸 BIKA KIDS';
    if (hasAny(['maison', 'home', 'menage', 'nettoyage', 'logistique', 'course', 'repassage', 'bricolage', 'reparation'])) return '🏠 BIKA MAISON';
    if (hasAny(['animal', 'animaux', 'pet', 'chien', 'chat', 'promenade', 'garde animal', 'petsit'])) return '🐾 BIKA ANIMALS';
    if (hasAny(['senior', 'age', 'personne agee', 'autonomie', 'accompagnement senior'])) return '👴 BIKA SENIORS';
    if (hasAny(['travel', 'voyage', 'aeroport', 'gare', 'navette', 'transport', 'deplacement'])) return '✈️ BIKA TRAVEL';
    if (hasAny(['vie', 'agenda', 'calendar', 'organisation', 'evenement', 'events', 'planning'])) return '📅 BIKA VIE';
    if (hasAny(['pro', 'professionnel', 'business', 'entreprise', 'bureautique', 'admin', 'assistance admin'])) return '💼 BIKA PRO';
    if (hasAny(['plus', 'premium', 'concierge', 'conciergerie', 'vip'])) return '⭐ BIKA PLUS';

    // variantes deja prefixees
    if (source.includes('bika kid')) return '🧸 BIKA KIDS';
    if (source.includes('bika maison') || source.includes('bika home')) return '🏠 BIKA MAISON';
    if (source.includes('bika animal')) return '🐾 BIKA ANIMALS';
    if (source.includes('bika senior')) return '👴 BIKA SENIORS';
    if (source.includes('bika travel') || source.includes('bika voyage')) return '✈️ BIKA TRAVEL';
    if (source.includes('bika vie') || source.includes('bika life')) return '📅 BIKA VIE';
    if (source.includes('bika pro') || source.includes('bika business')) return '💼 BIKA PRO';
    if (source.includes('bika plus') || source.includes('bika premium')) return '⭐ BIKA PLUS';

    return serviceTypeRaw || 'Service non spécifié';
  };

  const loadMissions = async () => {
    setLoading(true);
    try {
      const { data: missions, error } = await supabase
        .from('client_requests')
        .select(`
          *,
          provider:providers!assigned_provider_id (
            business_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the raw data to Mission objects with proper service display names
      const transformedMissions: Mission[] = missions?.map((mission: any) => ({
        ...mission,
        service_display_name: getServiceDisplayName(mission.service_type || '', mission.service_description || '')
      })) || [];

      // Organiser les missions par colonnes
      const updatedColumns = kanbanColumns.map(column => ({
        ...column,
        missions: transformedMissions.filter(mission => 
          column.status.includes(mission.status)
        )
      }));

      setColumns(updatedColumns);
    } catch (error) {
      console.error('Error loading missions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les missions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;

    const mission = sourceColumn.missions.find(m => m.id === draggableId);
    if (!mission) return;

    // Déterminer le nouveau statut
    const newMissionStatus = destColumn.status[0]; // Premier statut de la colonne de destination

    try {
      // Mettre à jour la base de données
      const { error } = await supabase
        .from('client_requests')
        .update({ 
          status: newMissionStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggableId);

      if (error) throw error;

      toast({
        title: "Mission mise à jour",
        description: `Statut changé vers "${destColumn.title}"`,
      });

      // La mise à jour sera automatique grâce au temps réel
    } catch (error: any) {
      console.error('Error updating mission status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (missionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('client_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', missionId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: "Le statut de la mission a été modifié",
      });

      setSelectedMission(null);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const getUrgencyBadge = (urgency: string = 'normal') => {
    switch (urgency) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">🔥 Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs">⚡ Priorité</Badge>;
      default:
        return null;
    }
  };

  const MissionCard = ({ mission, index }: { mission: Mission; index: number }) => (
    <Draggable draggableId={mission.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-all ${
            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm line-clamp-2">{mission.service_display_name}</h4>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setSelectedMission(mission)}
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Détails de la mission</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium">Client</label>
                        <p>{mission.client_name}</p>
                      </div>
                      <div>
                        <label className="font-medium">Service</label>
                        <p>{mission.service_display_name}</p>
                      </div>
                      <div>
                        <label className="font-medium">Lieu</label>
                        <p>{mission.location}</p>
                      </div>
                      <div>
                        <label className="font-medium">Date création</label>
                        <p>{format(new Date(mission.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="font-medium text-sm">Changer le statut</label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Nouvelle</SelectItem>
                          <SelectItem value="assigned">Assignée</SelectItem>
                          <SelectItem value="confirmee">Confirmée</SelectItem>
                          <SelectItem value="en_cours">En cours</SelectItem>
                          <SelectItem value="terminee">Terminée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                          <SelectItem value="unmatched">Non pourvue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedMission(null)}
                      >
                        Fermer
                      </Button>
                      <Button
                        onClick={() => mission && handleStatusChange(mission.id, newStatus)}
                        disabled={!newStatus}
                      >
                        Mettre à jour
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="truncate">{mission.client_name}</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{mission.location}</span>
            </div>
            
            {mission.preferred_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {format(new Date(mission.preferred_date), 'dd/MM', { locale: fr })}
                  {mission.preferred_time && ` à ${mission.preferred_time}`}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              {getUrgencyBadge(mission.urgency_level)}
              <span className="text-xs text-muted-foreground">
                {format(new Date(mission.created_at), 'dd/MM', { locale: fr })}
              </span>
            </div>
            
            {mission.provider?.business_name && (
              <div className="text-xs bg-green-50 text-green-700 p-1 rounded">
                👤 {mission.provider.business_name}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-24 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📋 Tableau Kanban - Suivi des missions
          <Badge variant="secondary" className="ml-auto">
            {columns.reduce((total, col) => total + col.missions.length, 0)} missions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 min-h-[600px]">
            {columns.map(column => (
              <div key={column.id} className="flex flex-col">
                <div className={`flex items-center gap-2 p-3 rounded-t-lg bg-${column.color}-100 border-${column.color}-200 border`}>
                  {column.icon}
                  <h3 className="font-medium text-sm">{column.title}</h3>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {column.missions.length}
                  </Badge>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 bg-gray-50 border-l border-r border-b border-gray-200 rounded-b-lg min-h-[500px] ${
                        snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                    >
                      {column.missions.map((mission, index) => (
                        <MissionCard key={mission.id} mission={mission} index={index} />
                      ))}
                      {provided.placeholder}
                      
                      {column.missions.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
                          Aucune mission
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            💡 <strong>Astuce :</strong> Glissez-déposez les missions entre les colonnes pour changer leur statut rapidement !
          </p>
        </div>
      </CardContent>
    </Card>
  );
};