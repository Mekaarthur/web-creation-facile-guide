import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Check,
  Info,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateProviderEarnings, formatCurrency, UNIVERSE_CATEGORIES } from '@/utils/providerPricing';

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
  is_active: boolean;
  services?: Service;
}

const ProviderUniverseServices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Charger les données prestataire
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Charger tous les services actifs
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('category, name');

        setServices(servicesData || []);

        // Charger les services sélectionnés par le prestataire
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
      console.error('Erreur chargement données:', error);
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
        // Ajouter le service
        const service = services.find(s => s.id === serviceId);
        const { error } = await supabase
          .from('provider_services')
          .insert({
            provider_id: provider.id,
            service_id: serviceId,
            is_active: true,
            price_override: null // Pas de tarif personnalisé, uniquement les tarifs fixes
          });

        if (error) throw error;

        toast({
          title: "Service activé",
          description: `${service?.name} a été ajouté à vos prestations`,
        });
      } else {
        // Retirer le service
        const { error } = await supabase
          .from('provider_services')
          .delete()
          .eq('provider_id', provider.id)
          .eq('service_id', serviceId);

        if (error) throw error;

        toast({
          title: "Service désactivé",
          description: "Le service a été retiré de vos prestations",
        });
      }

      loadData();
    } catch (error) {
      console.error('Erreur toggle service:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le service",
        variant: "destructive",
      });
    }
  };

  const isServiceActive = (serviceId: string): boolean => {
    return providerServices.some(ps => ps.service_id === serviceId && ps.is_active);
  };

  const getServicesByCategory = (categoryId: string): Service[] => {
    return services.filter(s => 
      s.category.toLowerCase().includes(categoryId.toLowerCase())
    );
  };

  const getActiveServicesCount = (categoryId: string): number => {
    const categoryServices = getServicesByCategory(categoryId);
    return categoryServices.filter(s => isServiceActive(s.id)).length;
  };

  const getTotalActiveServices = (): number => {
    return providerServices.filter(ps => ps.is_active).length;
  };

  const getEstimatedMonthlyEarnings = (): number => {
    const averageHoursPerMonth = 80; // Estimation moyenne
    const activeServices = providerServices.filter(ps => ps.is_active);
    if (activeServices.length === 0) return 0;
    
    const averageClientPrice = activeServices.reduce((sum, ps) => {
      const service = services.find(s => s.id === ps.service_id);
      return sum + (service?.price_per_hour || 0);
    }, 0) / activeServices.length;
    
    const providerRate = calculateProviderEarnings(averageClientPrice);
    return Math.round(providerRate * averageHoursPerMonth);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Mes Univers & Services
          </h2>
          <p className="text-muted-foreground mt-1">
            Sélectionnez vos univers et les services que vous proposez
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-4 py-2">
            <Check className="h-4 w-4 mr-2" />
            {getTotalActiveServices()} services actifs
          </Badge>
          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 px-4 py-2">
            <TrendingUp className="h-4 w-4 mr-2" />
            ~{formatCurrency(getEstimatedMonthlyEarnings())}/mois
          </Badge>
        </div>
      </div>

      {/* Grille des univers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {UNIVERSE_CATEGORIES.map((universe) => {
          const categoryServices = getServicesByCategory(universe.id);
          const activeCount = getActiveServicesCount(universe.id);
          const isSelected = selectedUniverse === universe.id;
          
          return (
            <Card 
              key={universe.id}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md",
                isSelected && "ring-2 ring-primary ring-offset-2",
                universe.bgColor
              )}
              onClick={() => setSelectedUniverse(isSelected ? null : universe.id)}
            >
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <div className={cn(
                    "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br shadow-lg",
                    universe.color
                  )}>
                    {universe.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{universe.shortName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {categoryServices.length} services
                    </p>
                  </div>
                  {activeCount > 0 && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {activeCount} actif{activeCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Services par univers */}
      {selectedUniverse && (
        <Card className="border-0 shadow-lg animate-fade-in">
          <CardHeader className={cn(
            "bg-gradient-to-r",
            UNIVERSE_CATEGORIES.find(u => u.id === selectedUniverse)?.color
          )}>
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {UNIVERSE_CATEGORIES.find(u => u.id === selectedUniverse)?.icon}
              </div>
              <div className="text-white">
                <CardTitle className="text-2xl">
                  {UNIVERSE_CATEGORIES.find(u => u.id === selectedUniverse)?.name}
                </CardTitle>
                <CardDescription className="text-white/90">
                  {UNIVERSE_CATEGORIES.find(u => u.id === selectedUniverse)?.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {getServicesByCategory(selectedUniverse).map((service) => {
                const isActive = isServiceActive(service.id);
                const clientPrice = service.price_per_hour;
                const providerEarnings = calculateProviderEarnings(clientPrice);
                
                return (
                  <div 
                    key={service.id}
                    className={cn(
                      "p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-md",
                      isActive 
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" 
                        : "bg-white border-gray-200 hover:border-primary/30"
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Info du service */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tarifs */}
                      <div className="flex items-center gap-6 lg:gap-8">
                        <div className="text-center min-w-[120px]">
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Prix client
                          </Label>
                          <div className="text-xl font-bold text-gray-700">
                            {formatCurrency(clientPrice)}/h
                          </div>
                        </div>

                        <div className="text-2xl text-muted-foreground">→</div>

                        <div className="text-center min-w-[120px]">
                          <Label className="text-xs text-green-600 font-semibold mb-1 block">
                            Vous gagnez
                          </Label>
                          <div className="text-xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-lg">
                            {formatCurrency(providerEarnings)}/h
                          </div>
                        </div>

                        {/* Switch */}
                        <div className="flex flex-col items-center gap-2 min-w-[80px]">
                          <Switch
                            id={`service-${service.id}`}
                            checked={isActive}
                            onCheckedChange={(checked) => toggleService(service.id, checked)}
                            className="data-[state=checked]:bg-green-500"
                          />
                          <Label 
                            htmlFor={`service-${service.id}`} 
                            className={cn(
                              "text-xs font-medium cursor-pointer",
                              isActive ? "text-green-600" : "text-gray-500"
                            )}
                          >
                            {isActive ? 'Actif' : 'Inactif'}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Panel d'informations */}
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Info className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                📋 Informations importantes
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Tarifs fixes et transparents :</strong> Les revenus affichés sont garantis et non modifiables
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Grille tarifaire Bikawo :</strong> 25€/h client = 18€/h pour vous • 30€/h client = 22€/h pour vous
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Activation des services :</strong> Activez uniquement les services que vous maîtrisez vraiment
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Opportunités :</strong> Plus vous activez de services, plus vous recevez de missions
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Mise à jour automatique :</strong> En cas d'évolution des tarifs Bikawo, vos revenus seront automatiquement ajustés
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderUniverseServices;
