import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Baby,
  Home,
  Heart,
  Plane,
  Users,
  PawPrint,
  Briefcase,
  Crown,
  Check,
  X,
  Euro,
  Star,
  Search,
  Plus,
  Edit,
  Save,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_hour: number;
  is_active: boolean;
}

interface ProviderService {
  id: string;
  service_id: string;
  price_override: number | null;
  is_active: boolean;
  services?: Service;
}

const serviceCategories = [
  {
    id: 'bika_kids',
    name: 'Bika Kids',
    description: 'Garde d\'enfants et activités éducatives',
    icon: Baby,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50'
  },
  {
    id: 'bika_maison',
    name: 'Bika Maison',
    description: 'Services ménagers et entretien du domicile',
    icon: Home,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'bika_vie',
    name: 'Bika Vie',
    description: 'Conciergerie et assistance quotidienne',
    icon: Heart,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50'
  },
  {
    id: 'bika_travel',
    name: 'Bika Travel',
    description: 'Organisation de voyages et accompagnement',
    icon: Plane,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50'
  },
  {
    id: 'bika_seniors',
    name: 'Bika Seniors',
    description: 'Accompagnement des personnes âgées',
    icon: Users,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'bika_animals',
    name: 'Bika Animals',
    description: 'Soins et garde d\'animaux',
    icon: PawPrint,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'bika_pro',
    name: 'Bika Pro',
    description: 'Services aux entreprises',
    icon: Briefcase,
    color: 'from-gray-500 to-slate-500',
    bgColor: 'bg-gray-50'
  },
  {
    id: 'bika_plus',
    name: 'Bika Plus',
    description: 'Services premium et conciergerie de luxe',
    icon: Crown,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50'
  }
];

const ProviderServices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Get provider data
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Load all services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        setServices(servicesData || []);

        // Load provider's selected services
        const { data: providerServicesData } = await supabase
          .from('provider_services')
          .select(`
            *,
            services(*)
          `)
          .eq('provider_id', providerData.id);

        setProviderServices(providerServicesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleService = async (serviceId: string, isActive: boolean) => {
    if (!provider) return;

    try {
      if (isActive) {
        // Add service
        const service = services.find(s => s.id === serviceId);
        const { error } = await supabase
          .from('provider_services')
          .insert({
            provider_id: provider.id,
            service_id: serviceId,
            price_override: null,
            is_active: true
          });

        if (error) throw error;

        toast({
          title: "Service ajouté",
          description: `${service?.name} a été ajouté à vos prestations`,
        });
      } else {
        // Remove service
        const { error } = await supabase
          .from('provider_services')
          .delete()
          .eq('provider_id', provider.id)
          .eq('service_id', serviceId);

        if (error) throw error;

        toast({
          title: "Service retiré",
          description: "Le service a été retiré de vos prestations",
        });
      }

      loadData();
    } catch (error) {
      console.error('Error toggling service:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le service",
        variant: "destructive",
      });
    }
  };

  const updatePrice = async (serviceId: string, price: number) => {
    if (!provider) return;

    try {
      const { error } = await supabase
        .from('provider_services')
        .update({ price_override: price })
        .eq('provider_id', provider.id)
        .eq('service_id', serviceId);

      if (error) throw error;

      toast({
        title: "Prix mis à jour",
        description: "Votre tarif personnalisé a été enregistré",
      });

      setEditingPrices(prev => {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      });

      loadData();
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prix",
        variant: "destructive",
      });
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = searchTerm === '' ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' ||
      service.category.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const isServiceActive = (serviceId: string) => {
    return providerServices.some(ps => ps.service_id === serviceId && ps.is_active);
  };

  const getServicePrice = (serviceId: string) => {
    const providerService = providerServices.find(ps => ps.service_id === serviceId);
    const service = services.find(s => s.id === serviceId);
    return providerService?.price_override || service?.price_per_hour || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mes Prestations
          </h2>
          <p className="text-muted-foreground">
            Sélectionnez les services que vous souhaitez proposer
          </p>
        </div>
        
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          {providerServices.filter(ps => ps.is_active).length} services actifs
        </Badge>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="bg-white shadow-sm border">
            <TabsTrigger value="all">Tous</TabsTrigger>
            {serviceCategories.slice(0, 3).map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Service categories overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {serviceCategories.map((category) => {
          const categoryServices = services.filter(s => 
            s.category.toLowerCase().includes(category.id.toLowerCase())
          );
          const activeServices = categoryServices.filter(s => isServiceActive(s.id));
          
          return (
            <Card 
              key={category.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg border-0 shadow-md",
                selectedCategory === category.id && "ring-2 ring-primary",
                category.bgColor
              )}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? 'all' : category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", category.color)}>
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeServices.length}/{categoryServices.length} actifs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Services list */}
      <div className="grid gap-4">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const isActive = isServiceActive(service.id);
            const currentPrice = getServicePrice(service.id);
            const isEditingPrice = editingPrices.hasOwnProperty(service.id);
            const category = serviceCategories.find(c => 
              service.category.toLowerCase().includes(c.id.toLowerCase())
            );
            
            return (
              <Card 
                key={service.id} 
                className={cn(
                  "group hover:shadow-lg transition-all duration-300 border-0 shadow-md",
                  isActive && "ring-2 ring-green-200 bg-green-50/30"
                )}
              >
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                    {/* Service info */}
                    <div className="lg:col-span-2 flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br",
                        category?.color || "from-gray-500 to-slate-500"
                      )}>
                        {category?.icon && <category.icon className="h-6 w-6 text-white" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {category?.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Prix de base: {formatCurrency(service.price_per_hour)}/h
                        </p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center gap-3">
                      {isActive && (
                        <div className="flex items-center gap-2">
                          {isEditingPrice ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editingPrices[service.id]}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  [service.id]: Number(e.target.value)
                                }))}
                                className="w-20 text-sm"
                                min="0"
                                step="0.5"
                              />
                              <span className="text-sm text-muted-foreground">€/h</span>
                              <Button
                                size="sm"
                                onClick={() => updatePrice(service.id, editingPrices[service.id])}
                                className="h-8 w-8 p-0"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="font-bold text-lg text-primary">
                                  {formatCurrency(currentPrice)}/h
                                </p>
                                {currentPrice !== service.price_per_hour && (
                                  <p className="text-xs text-green-600">Tarif personnalisé</p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPrices(prev => ({
                                  ...prev,
                                  [service.id]: currentPrice
                                }))}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`service-${service.id}`} className="text-sm font-medium">
                          {isActive ? 'Actif' : 'Inactif'}
                        </Label>
                        <Switch
                          id={`service-${service.id}`}
                          checked={isActive}
                          onCheckedChange={(checked) => toggleService(service.id, checked)}
                        />
                      </div>
                      
                      {isActive && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          Éligible
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucun service trouvé</h3>
              <p className="text-muted-foreground">
                Modifiez vos critères de recherche pour voir plus de services
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Comment ça marche ?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Sélectionnez uniquement les services que vous maîtrisez</li>
                <li>• Vous ne recevrez que les missions correspondant à vos services actifs</li>
                <li>• Personnalisez vos tarifs selon votre expertise</li>
                <li>• Plus vous avez de services actifs, plus vous recevez d'opportunités</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderServices;