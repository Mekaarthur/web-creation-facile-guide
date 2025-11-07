import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { universeServices } from '@/utils/universeServices';

interface ProviderSubService {
  id?: string;
  provider_id: string;
  universe_id: string;
  sub_service_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
    description: 'Services de préparation culinaire / batch cooking',
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
  const [providerSubServices, setProviderSubServices] = useState<ProviderSubService[]>([]);
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
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Load provider's selected sub-services
        const { data: providerSubServicesData } = await supabase
          .from('provider_sub_services' as any)
          .select('*')
          .eq('provider_id', providerData.id);

        setProviderSubServices((providerSubServicesData as any) || []);
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

  const toggleSubService = async (universeId: string, subServiceId: string, isActive: boolean) => {
    if (!provider) return;

    try {
      if (isActive) {
        const { error } = await supabase
          .from('provider_sub_services' as any)
          .insert({
            provider_id: provider.id,
            universe_id: universeId,
            sub_service_id: subServiceId,
            is_active: true
          });

        if (error) throw error;

        toast({
          title: "Service activé",
          description: "Le service a été ajouté à vos prestations",
        });
      } else {
        const { error } = await supabase
          .from('provider_sub_services' as any)
          .delete()
          .eq('provider_id', provider.id)
          .eq('universe_id', universeId)
          .eq('sub_service_id', subServiceId);

        if (error) throw error;

        toast({
          title: "Service désactivé",
          description: "Le service a été retiré de vos prestations",
        });
      }

      loadData();
    } catch (error) {
      console.error('Error toggling sub-service:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le service",
        variant: "destructive",
      });
    }
  };

  const isSubServiceActive = (universeId: string, subServiceId: string) => {
    return providerSubServices.some(
      ps => ps.universe_id === universeId && ps.sub_service_id === subServiceId && ps.is_active
    );
  };

  const getActiveServicesCount = (universeId: string) => {
    return providerSubServices.filter(
      ps => ps.universe_id === universeId && ps.is_active
    ).length;
  };

  const getTotalActiveServices = () => {
    return providerSubServices.filter(ps => ps.is_active).length;
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
            Configuration de mes prestations
          </h2>
          <p className="text-muted-foreground">
            Sélectionnez les univers puis activez les services que vous souhaitez proposer
          </p>
        </div>
        
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          {getTotalActiveServices()} services actifs
        </Badge>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Tarifs prestataires</p>
              <p>Les tarifs affichés sont fixes et calculés automatiquement :</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Service à 25€/h → Vous gagnez 18€/h</li>
                <li>Service à 30€/h → Vous gagnez 22€/h</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Universe Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {serviceCategories.map((category) => {
          const universe = universeServices.find(u => u.id === category.id);
          const activeCount = getActiveServicesCount(category.id);
          const totalCount = universe?.subServices.length || 0;
          
          return (
            <Card 
              key={category.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg border-2",
                selectedUniverse === category.id ? "ring-2 ring-primary border-primary" : "border-transparent",
                category.bgColor
              )}
              onClick={() => setSelectedUniverse(selectedUniverse === category.id ? null : category.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br", category.color)}>
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {activeCount}/{totalCount} actifs
                      </p>
                    </div>
                  </div>
                  {selectedUniverse === category.id && (
                    <div className="flex items-center justify-center text-primary">
                      <ChevronRight className="h-4 w-4 rotate-90" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sub-Services List */}
      {selectedUniverse && (
        <div className="space-y-4 animate-fade-in">
          {universeServices
            .filter(universe => universe.id === selectedUniverse)
            .map(universe => {
              const category = serviceCategories.find(c => c.id === universe.id);
              
              return (
                <div key={universe.id}>
                  <div className="flex items-center gap-3 mb-4">
                    {category && (
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", category.color)}>
                        <category.icon className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{universe.name}</h3>
                      <p className="text-sm text-muted-foreground">{universe.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {universe.subServices.map(subService => {
                      const isActive = isSubServiceActive(universe.id, subService.id);
                      
                      return (
                        <Card 
                          key={subService.id}
                          className={cn(
                            "transition-all duration-300",
                            isActive && "ring-2 ring-green-200 bg-green-50/30"
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              {/* Service Info */}
                              <div className="flex-1">
                                <h4 className="font-semibold text-base mb-1">
                                  {subService.name}
                                </h4>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">
                                    Client : <span className="font-semibold text-foreground">{subService.clientPrice}€/h</span>
                                  </span>
                                  <span className="text-green-600">
                                    → Vous gagnez : <span className="font-bold">{subService.providerPrice}€/h</span>
                                  </span>
                                </div>
                              </div>

                              {/* Toggle Switch */}
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`sub-service-${subService.id}`} className="text-sm font-medium">
                                  {isActive ? 'Actif' : 'Inactif'}
                                </Label>
                                <Switch
                                  id={`sub-service-${subService.id}`}
                                  checked={isActive}
                                  onCheckedChange={(checked) => toggleSubService(universe.id, subService.id, checked)}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Empty state when no universe selected */}
      {!selectedUniverse && (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ChevronRight className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Sélectionnez un univers</h3>
                <p className="text-muted-foreground">
                  Cliquez sur une catégorie ci-dessus pour voir et activer ses services
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
              <Info className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Comment ça marche ?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Sélectionnez uniquement les services que vous maîtrisez</li>
                <li>• Vous ne recevrez que les missions correspondant à vos services actifs</li>
                <li>• Les tarifs affichés sont fixes et calculés automatiquement</li>
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