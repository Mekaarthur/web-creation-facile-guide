import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Mail, Phone, MapPin, Calendar, Star, 
  CheckCircle, XCircle, AlertCircle, Ban, PlayCircle,
  FileText, Briefcase, DollarSign
} from "lucide-react";
import { universeServices } from "@/utils/universeServices";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProviderDetailsModalProps {
  providerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onProviderUpdated: () => void;
}

interface ProviderDetail {
  id: string;
  business_name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  average_rating?: number;
  total_missions?: number;
  total_earned?: number;
  services: any[];
  missions: any[];
  payments: any[];
}

export const ProviderDetailsModal = ({
  providerId,
  isOpen,
  onClose,
  onProviderUpdated,
}: ProviderDetailsModalProps) => {
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'activate'>('approve');
  const { toast } = useToast();

  useEffect(() => {
    if (providerId && isOpen) {
      loadProviderDetails();
    }
  }, [providerId, isOpen]);

  const loadProviderDetails = async () => {
    if (!providerId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: {
          action: 'get_provider_details',
          providerId,
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.provider) {
        throw new Error('Réponse invalide du serveur');
      }

      const p = data.provider;
      const profile = p.profiles || {};
      const bookings = p.bookings || [];

      const missions = bookings.map((b: any) => ({
        id: b.id,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        total_price: b.total_price,
        status: b.status,
        services: b.services,
      }));

      setProvider({
        id: p.id,
        business_name: p.business_name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        status: p.status,
        is_verified: p.is_verified,
        created_at: p.created_at,
        average_rating: p.rating || 0,
        total_missions: p.missions_completed || 0,
        total_earned: p.total_earnings || 0,
        services: [],
        missions,
        payments: [],
      });
    } catch (error: any) {
      console.error('Erreur chargement détails:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'afficher les détails",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!provider) return;

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          status: 'active',
          is_verified: true
        })
        .eq('id', provider.id);

      if (error) throw error;

      // Send notification
      await supabase
        .from('communications')
        .insert({
          type: 'email',
          destinataire_id: providerId,
          sujet: 'Dossier approuvé - Bienvenue sur Bikawo !',
          contenu: `Félicitations ! Votre dossier a été approuvé. Vous pouvez maintenant commencer à recevoir des missions.`,
          status: 'en_attente'
        });

      toast({
        title: "Succès",
        description: "Le prestataire a été approuvé",
      });

      onProviderUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!provider) return;

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          status: 'inactive',
          is_verified: false
        })
        .eq('id', provider.id);

      if (error) throw error;

      // Send notification
      await supabase
        .from('communications')
        .insert({
          type: 'email',
          destinataire_id: providerId,
          sujet: 'Dossier rejeté',
          contenu: `Nous sommes désolés de vous informer que votre dossier a été rejeté. Contactez l'équipe pour plus d'informations.`,
          status: 'en_attente'
        });

      toast({
        title: "Succès",
        description: "Le prestataire a été rejeté",
      });

      onProviderUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSuspend = async () => {
    if (!provider) return;

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          status: 'inactive'
        })
        .eq('id', provider.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le prestataire a été suspendu",
      });

      onProviderUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleActivate = async () => {
    if (!provider) return;

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          status: 'active'
        })
        .eq('id', provider.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le prestataire a été réactivé",
      });

      onProviderUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const executeAction = () => {
    setActionDialogOpen(false);
    switch (actionType) {
      case 'approve':
        handleApprove();
        break;
      case 'reject':
        handleReject();
        break;
      case 'suspend':
        handleSuspend();
        break;
      case 'activate':
        handleActivate();
        break;
    }
  };

  const openActionDialog = (type: typeof actionType) => {
    setActionType(type);
    setActionDialogOpen(true);
  };

  if (!provider && !loading) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du prestataire</DialogTitle>
            <DialogDescription>
              Informations complètes et gestion du compte
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : provider ? (
            <div className="space-y-6">
              {/* Header Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{provider.business_name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {provider.status === 'active' && provider.is_verified ? (
                          <Badge variant="default">Actif</Badge>
                        ) : provider.status === 'inactive' ? (
                          <Badge variant="destructive">Suspendu</Badge>
                        ) : (
                          <Badge variant="secondary">En attente</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {provider.status !== 'active' && (
                        <Button size="sm" onClick={() => openActionDialog('approve')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                      )}
                      {provider.status !== 'inactive' && (
                        <Button size="sm" variant="destructive" onClick={() => openActionDialog('suspend')}>
                          <Ban className="h-4 w-4 mr-2" />
                          Suspendre
                        </Button>
                      )}
                      {provider.status === 'inactive' && (
                        <Button size="sm" onClick={() => openActionDialog('activate')}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Réactiver
                        </Button>
                      )}
                      {provider.status !== 'active' && (
                        <Button size="sm" variant="outline" onClick={() => openActionDialog('reject')}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Inscrit le {new Date(provider.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="services" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="missions">Missions</TabsTrigger>
                  <TabsTrigger value="paiements">Paiements</TabsTrigger>
                  <TabsTrigger value="stats">Statistiques</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Services activés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {provider.services.length > 0 ? (
                        <div className="space-y-3">
                          {provider.services.map((service: any) => (
                            <div key={service.id} className="flex justify-between items-center border-b pb-2">
                              <span>{service.services?.name || 'Service'}</span>
                              <span className="text-muted-foreground">
                                {service.services?.category || 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucun service activé</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="missions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historique des missions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {provider.missions.length > 0 ? (
                        <div className="space-y-3">
                          {provider.missions.map((mission: any) => (
                            <div key={mission.id} className="flex justify-between items-center border-b pb-2">
                              <div>
                                <p className="font-medium">{mission.services?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(mission.booking_date).toLocaleDateString('fr-FR')} - {mission.start_time}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{mission.total_price}€</p>
                                <Badge variant={mission.status === 'completed' ? 'default' : 'secondary'}>
                                  {mission.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucune mission</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="paiements" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historique des paiements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {provider.payments.length > 0 ? (
                        <div className="space-y-3">
                          {provider.payments.map((payment: any) => (
                            <div key={payment.id} className="flex justify-between items-center border-b pb-2">
                              <div>
                                <p className="font-medium">{payment.service_category}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{payment.provider_payment}€</p>
                                <Badge variant={payment.payment_status === 'paid' ? 'default' : 'secondary'}>
                                  {payment.payment_status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucun paiement</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Missions effectuées</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{provider.total_missions || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Total gagné</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{(provider.total_earned || 0).toFixed(2)}€</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Note moyenne</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold flex items-center gap-1">
                          {(provider.average_rating || 0).toFixed(1)}
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Services activés</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{provider.services.length}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' && 'Approuver le prestataire'}
              {actionType === 'reject' && 'Rejeter le prestataire'}
              {actionType === 'suspend' && 'Suspendre le prestataire'}
              {actionType === 'activate' && 'Réactiver le prestataire'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' && 'Le prestataire sera approuvé et pourra commencer à recevoir des missions.'}
              {actionType === 'reject' && 'Le prestataire sera rejeté et ne pourra pas accéder à la plateforme.'}
              {actionType === 'suspend' && 'Le prestataire sera suspendu et ne pourra plus recevoir de missions.'}
              {actionType === 'activate' && 'Le prestataire sera réactivé et pourra à nouveau recevoir des missions.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
