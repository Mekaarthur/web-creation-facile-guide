import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mail, Phone, MapPin, Calendar, DollarSign, ShoppingCart, 
  Star, User, Edit, Save, X, Ban, CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

interface ClientDetailsModalProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated: () => void;
}

export const ClientDetailsModal = ({ clientId, isOpen, onClose, onClientUpdated }: ClientDetailsModalProps) => {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (clientId && isOpen) {
      loadClientDetails();
    }
  }, [clientId, isOpen]);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-clients', {
        body: { action: 'get_client_details', clientId }
      });

      if (error) throw error;

      if (data?.success) {
        setClientData(data.client);
        setFormData({
          first_name: data.client.first_name || '',
          last_name: data.client.last_name || '',
          email: data.client.email || '',
          phone: data.client.phone || '',
          address: data.client.address || ''
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-clients', {
        body: { 
          action: 'update_client', 
          clientId: clientData.user_id,
          updates: formData
        }
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client mis à jour avec succès",
      });
      
      setEditing(false);
      await loadClientDetails();
      onClientUpdated();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le client",
        variant: "destructive",
      });
    }
  };

  const handleBlock = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-clients', {
        body: { 
          action: 'block_client', 
          clientId: clientData.user_id,
          reason: blockReason
        }
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client bloqué avec succès",
      });
      
      setBlockDialogOpen(false);
      await loadClientDetails();
      onClientUpdated();
    } catch (error) {
      console.error('Erreur lors du blocage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de bloquer le client",
        variant: "destructive",
      });
    }
  };

  const handleUnblock = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-clients', {
        body: { 
          action: 'unblock_client', 
          clientId: clientData.user_id
        }
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client débloqué avec succès",
      });
      
      await loadClientDetails();
      onClientUpdated();
    } catch (error) {
      console.error('Erreur lors du déblocage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de débloquer le client",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      active: { variant: 'default' as const, label: 'Actif' },
      inactive: { variant: 'secondary' as const, label: 'Inactif' },
      blocked: { variant: 'destructive' as const, label: 'Bloqué' }
    };

    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (!isOpen || !clientId) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du client</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center">Chargement...</div>
          ) : clientData ? (
            <div className="space-y-6">
              {/* Header with avatar and status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={clientData.avatar_url} />
                    <AvatarFallback className="text-xl">
                      {getInitials(clientData.first_name, clientData.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-semibold">
                      {clientData.first_name} {clientData.last_name}
                    </h3>
                    <p className="text-muted-foreground">{clientData.email}</p>
                    <div className="mt-2">
                      {getStatusBadge(clientData.account_status || 'active')}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!editing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      {clientData.account_status === 'blocked' ? (
                        <Button variant="default" size="sm" onClick={handleUnblock}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Débloquer
                        </Button>
                      ) : (
                        <Button variant="destructive" size="sm" onClick={() => setBlockDialogOpen(true)}>
                          <Ban className="h-4 w-4 mr-2" />
                          Bloquer
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Informations</TabsTrigger>
                  <TabsTrigger value="bookings">Réservations</TabsTrigger>
                  <TabsTrigger value="payments">Paiements</TabsTrigger>
                  <TabsTrigger value="stats">Statistiques</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations personnelles</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      {editing ? (
                        <>
                          <div>
                            <Label>Prénom</Label>
                            <Input
                              value={formData.first_name}
                              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Nom</Label>
                            <Input
                              value={formData.last_name}
                              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Téléphone</Label>
                            <Input
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Adresse</Label>
                            <Textarea
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium">{clientData.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Téléphone</p>
                              <p className="font-medium">{clientData.phone || 'Non renseigné'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Adresse</p>
                              <p className="font-medium">{clientData.address || 'Non renseignée'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Inscrit le</p>
                              <p className="font-medium">
                                {format(new Date(clientData.created_at), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bookings" className="space-y-4">
                  {clientData.bookings && clientData.bookings.length > 0 ? (
                    clientData.bookings.map((booking: any) => (
                      <Card key={booking.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{booking.services?.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {booking.start_time} - {booking.end_time}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{booking.status}</Badge>
                              <p className="text-lg font-semibold mt-2">{booking.total_price}€</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune réservation
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  {clientData.payments && clientData.payments.length > 0 ? (
                    clientData.payments.map((payment: any) => (
                      <Card key={payment.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{payment.description || 'Paiement'}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(payment.created_at), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={payment.status === 'payé' ? 'default' : 'secondary'}>
                                {payment.status}
                              </Badge>
                              <p className="text-lg font-semibold mt-2">{payment.amount}€</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun paiement
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stats">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Total réservations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{clientData.stats?.total_bookings || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Réservations complétées</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{clientData.stats?.completed_bookings || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Total dépensé</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{clientData.stats?.total_spent?.toFixed(2) || 0}€</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{clientData.stats?.completion_rate || 0}%</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Impossible de charger les données du client
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquer le client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action bloquera le compte du client et annulera toutes ses réservations futures.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Raison du blocage</Label>
            <Textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Indiquez la raison du blocage..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} disabled={!blockReason.trim()}>
              Bloquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};