import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  PlayCircle,
  StopCircle,
  Camera,
  MapPin,
  Clock,
  Calendar,
  User,
  Euro,
  FileText
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Mission {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string;
  total_price: number;
  status: string;
  notes?: string;
  assigned_at?: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  check_in_location?: string;
  check_out_location?: string;
  before_photos?: string[];
  after_photos?: string[];
  provider_notes?: string;
  service: {
    name: string;
    description: string;
  };
  client_id: string;
}

export const ProviderMissionInterface = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [checkOutLocation, setCheckOutLocation] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadMissions();
    setupRealtimeListener();
  }, []);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer l'ID du prestataire
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!provider) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, description)
        `)
        .eq('provider_id', provider.id)
        .in('status', ['assigned', 'confirmed', 'in_progress'])
        .order('booking_date', { ascending: true });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les missions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) return;

    const channel = supabase
      .channel('provider-mission-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${provider.id}`
        },
        () => {
          loadMissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const confirmMission = async (missionId: string, accept: boolean) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('confirm_booking', {
        booking_id: missionId,
        provider_confirms: accept
      });

      if (error) throw error;

      toast({
        title: accept ? "Mission confirmée" : "Mission refusée",
        description: accept 
          ? "Vous avez confirmé votre disponibilité pour cette mission"
          : "La mission a été refusée et sera réassignée",
      });

      loadMissions();
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre réponse",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const startMission = async (missionId: string) => {
    setActionLoading(true);
    try {
      const location = checkInNotes.trim() || 'Localisation non spécifiée';
      
      const { error } = await supabase.rpc('mission_checkin', {
        booking_id: missionId,
        location_info: location,
        photos: [] // Pour l'instant sans photos
      });

      if (error) throw error;

      toast({
        title: "Mission commencée",
        description: "Le client a été notifié du début de votre intervention",
      });

      setCheckInNotes('');
      setSelectedMission(null);
      loadMissions();
    } catch (error) {
      console.error('Erreur lors du début de mission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de commencer la mission",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const completeMission = async (missionId: string) => {
    setActionLoading(true);
    try {
      const location = checkOutLocation.trim() || 'Localisation non spécifiée';
      const notes = checkOutNotes.trim();
      
      const { error } = await supabase.rpc('mission_checkout', {
        booking_id: missionId,
        location_info: location,
        photos: [], // Pour l'instant sans photos
        notes: notes
      });

      if (error) throw error;

      toast({
        title: "Mission terminée",
        description: "Le client a été notifié et peut maintenant laisser un avis",
      });

      setCheckOutNotes('');
      setCheckOutLocation('');
      setSelectedMission(null);
      loadMissions();
    } catch (error) {
      console.error('Erreur lors de la fin de mission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer la mission",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      assigned: { variant: 'secondary' as const, text: 'Nouvelle', icon: User },
      confirmed: { variant: 'default' as const, text: 'Confirmée', icon: CheckCircle },
      in_progress: { variant: 'default' as const, text: 'En cours', icon: PlayCircle }
    };
    
    const config = configs[status as keyof typeof configs] || configs.assigned;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getClientName = () => {
    return "Client";
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mes missions</h2>
        <p className="text-muted-foreground">Gérez vos missions en cours et confirmez vos disponibilités</p>
      </div>

      {/* Liste des missions */}
      {missions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune mission en cours</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <Card key={mission.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      {mission.service?.name}
                      {getStatusBadge(mission.status)}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {getClientName()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(mission.booking_date), 'dd MMMM yyyy', { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {mission.start_time} - {mission.end_time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{mission.total_price}€</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Adresse */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{mission.address}</span>
                </div>

                {/* Notes du client */}
                {mission.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <FileText className="w-4 h-4" />
                      <span>Notes du client:</span>
                    </div>
                    <p className="text-sm">{mission.notes}</p>
                  </div>
                )}

                {/* Actions selon le statut */}
                <div className="flex gap-2 pt-4 border-t">
                  {mission.status === 'assigned' && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => confirmMission(mission.id, false)}
                        disabled={actionLoading}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Refuser
                      </Button>
                      <Button 
                        onClick={() => confirmMission(mission.id, true)}
                        disabled={actionLoading}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmer
                      </Button>
                    </>
                  )}

                  {mission.status === 'confirmed' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" onClick={() => setSelectedMission(mission)}>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Commencer la mission
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Commencer la mission</DialogTitle>
                          <DialogDescription>
                            Confirmez le début de votre intervention. Le client sera notifié.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="checkin-notes">Localisation (optionnel)</Label>
                            <Input
                              id="checkin-notes"
                              placeholder="Ex: Arrivé sur place, client présent"
                              value={checkInNotes}
                              onChange={(e) => setCheckInNotes(e.target.value)}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedMission(null)}>
                            Annuler
                          </Button>
                          <Button 
                            onClick={() => selectedMission && startMission(selectedMission.id)}
                            disabled={actionLoading}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Commencer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {mission.status === 'in_progress' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" onClick={() => setSelectedMission(mission)}>
                          <StopCircle className="w-4 h-4 mr-2" />
                          Terminer la mission
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Terminer la mission</DialogTitle>
                          <DialogDescription>
                            Confirmez la fin de votre intervention. Le client sera notifié et pourra laisser un avis.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="checkout-location">Localisation finale</Label>
                            <Input
                              id="checkout-location"
                              placeholder="Ex: Mission terminée, lieux nettoyés"
                              value={checkOutLocation}
                              onChange={(e) => setCheckOutLocation(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="checkout-notes">Notes de fin de mission</Label>
                            <Textarea
                              id="checkout-notes"
                              placeholder="Décrivez le travail effectué, les détails importants..."
                              value={checkOutNotes}
                              onChange={(e) => setCheckOutNotes(e.target.value)}
                              rows={4}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedMission(null)}>
                            Annuler
                          </Button>
                          <Button 
                            onClick={() => selectedMission && completeMission(selectedMission.id)}
                            disabled={actionLoading}
                          >
                            <StopCircle className="w-4 h-4 mr-2" />
                            Terminer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};