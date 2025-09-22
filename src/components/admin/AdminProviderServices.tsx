import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Euro } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceOffered {
  id: string;
  service_id: string;
  price_override?: number;
  is_active: boolean;
  services: {
    id: string;
    name: string;
    category: string;
    price_per_hour: number;
    description?: string;
  };
}

interface AdminProviderServicesProps {
  providerId: string;
}

const AdminProviderServices = ({ providerId }: AdminProviderServicesProps) => {
  const [providerServices, setProviderServices] = useState<ServiceOffered[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<ServiceOffered | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadProviderServices = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('provider_services')
        .select(`
          *,
          services:service_id(*)
        `)
        .eq('provider_id', providerId);

      if (error) throw error;
      setProviderServices(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setAllServices(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des services disponibles:', error);
    }
  };

  const handleToggleService = async (serviceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .update({ is_active: isActive })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service mis à jour",
        description: `Service ${isActive ? 'activé' : 'désactivé'} avec succès`,
      });

      loadProviderServices();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le service",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePrice = async (serviceId: string, newPrice?: number) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .update({ price_override: newPrice })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Prix mis à jour",
        description: "Le prix personnalisé a été enregistré",
      });

      setEditingService(null);
      loadProviderServices();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prix:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prix",
        variant: "destructive"
      });
    }
  };

  const handleAddService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .insert({
          provider_id: providerId,
          service_id: serviceId,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Service ajouté",
        description: "Le service a été ajouté au prestataire",
      });

      setIsAddDialogOpen(false);
      loadProviderServices();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du service:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le service",
        variant: "destructive"
      });
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service retiré",
        description: "Le service a été retiré du prestataire",
      });

      loadProviderServices();
    } catch (error) {
      console.error('Erreur lors de la suppression du service:', error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer le service",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadProviderServices();
    loadAllServices();
  }, [providerId]);

  const availableServices = allServices.filter(service => 
    !providerServices.some(ps => ps.service_id === service.id)
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Services proposés</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableServices.map(service => (
                <Card key={service.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.category}</p>
                      <p className="text-sm font-semibold">{service.price_per_hour}€/h</p>
                    </div>
                    <Button size="sm" onClick={() => handleAddService(service.id)}>
                      Ajouter
                    </Button>
                  </div>
                </Card>
              ))}
              {availableServices.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Tous les services disponibles sont déjà proposés
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {providerServices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucun service configuré</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {providerServices.map((providerService) => (
            <Card key={providerService.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{providerService.services.name}</h3>
                      <Badge variant="outline">{providerService.services.category}</Badge>
                      <Badge variant={providerService.is_active ? "default" : "secondary"}>
                        {providerService.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    
                    {providerService.services.description && (
                      <p className="text-sm text-muted-foreground">
                        {providerService.services.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4" />
                        <span className="text-sm">
                          Prix: {providerService.price_override || providerService.services.price_per_hour}€/h
                          {providerService.price_override && (
                            <span className="text-muted-foreground ml-1">
                              (base: {providerService.services.price_per_hour}€/h)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={providerService.is_active}
                      onCheckedChange={(checked) => handleToggleService(providerService.id, checked)}
                    />
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Prix
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier le prix</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Prix personnalisé (€/h)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              defaultValue={providerService.price_override || providerService.services.price_per_hour}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                setEditingService({
                                  ...providerService,
                                  price_override: value || undefined
                                });
                              }}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Prix de base: {providerService.services.price_per_hour}€/h
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => editingService && handleUpdatePrice(
                                providerService.id, 
                                editingService.price_override
                              )}
                            >
                              Enregistrer
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleUpdatePrice(providerService.id, undefined)}
                            >
                              Réinitialiser
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRemoveService(providerService.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProviderServices;