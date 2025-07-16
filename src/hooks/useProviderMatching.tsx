import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Provider, Service, MatchingFilters } from '@/types/provider';

export const useProviderMatching = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les services disponibles
  const loadServices = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des services:', err);
      setError('Impossible de charger les services');
    }
  };

  // Fonction de matching automatique avec filtres améliorée
  const findMatchingProviders = async (filters: MatchingFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Utiliser la fonction edge pour un matching plus sophistiqué
      if (filters.serviceType && filters.location) {
        const { data: matchResult, error: matchError } = await supabase.functions.invoke('match-providers', {
          body: {
            serviceType: filters.serviceType,
            location: filters.location,
            urgency: filters.urgency || 'normal'
          }
        });

        if (matchError) throw matchError;
        
        let providers = matchResult?.providers || [];
        
        // Appliquer des filtres supplémentaires côté client
        if (filters.minRating) {
          providers = providers.filter((p: any) => p.rating >= filters.minRating);
        }
        
        if (filters.maxPrice) {
          providers = providers.filter((p: any) => {
            const price = getProviderPrice(p, filters.serviceId || '');
            return price <= filters.maxPrice!;
          });
        }
        
        if (filters.dateTime) {
          providers = providers.filter((p: any) => isProviderAvailable(p, filters.dateTime!));
        }

        setProviders(providers);
        return;
      }

      // Fallback vers la méthode classique
      let query = (supabase as any)
        .from('providers')
        .select(`
          *,
          provider_availability(*),
          provider_services(*, services(*))
        `)
        .eq('is_verified', true);

      // Filtrer par rating minimum
      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      // Filtrer par localisation approximative
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      const { data, error } = await query.order('rating', { ascending: false });
      
      if (error) throw error;

      let filteredProviders = data || [];

      // Filtrage par service
      if (filters.serviceId) {
        filteredProviders = filteredProviders.filter((provider: any) => 
          provider.provider_services && provider.provider_services.some((ps: any) => ps.service_id === filters.serviceId)
        );
      }

      // Filtrage par prix maximum
      if (filters.maxPrice && filters.serviceId) {
        filteredProviders = filteredProviders.filter((provider: any) => {
          const price = getProviderPrice(provider, filters.serviceId!);
          return price <= filters.maxPrice!;
        });
      }

      // Filtrage par disponibilité
      if (filters.dateTime) {
        filteredProviders = filteredProviders.filter((provider: any) => 
          isProviderAvailable(provider, filters.dateTime!)
        );
      }

      // Tri par score de matching amélioré
      filteredProviders.sort((a, b) => {
        const scoreA = calculateMatchingScore(a, filters);
        const scoreB = calculateMatchingScore(b, filters);
        return scoreB - scoreA;
      });

      setProviders(filteredProviders);
    } catch (err) {
      console.error('Erreur lors du matching:', err);
      setError('Erreur lors de la recherche de prestataires');
    } finally {
      setLoading(false);
    }
  };

  // Calcul du score de matching amélioré avec plus de critères
  const calculateMatchingScore = (provider: any, filters: MatchingFilters): number => {
    let score = 0;

    // Score basé sur le rating (0-40 points)
    if (provider.rating) {
      score += provider.rating * 8;
    }

    // Bonus si le prestataire est vérifié (15 points)
    if (provider.is_verified) {
      score += 15;
    }

    // Score basé sur l'expérience (missions complétées) (0-20 points)
    if (provider.missions_completed) {
      score += Math.min(20, provider.missions_completed * 0.5);
    }

    // Score basé sur le taux d'acceptation (0-15 points)
    if (provider.acceptance_rate) {
      score += provider.acceptance_rate * 0.15;
    }

    // Bonus pour la réactivité récente (0-10 points)
    if (provider.last_activity_at) {
      const lastActivity = new Date(provider.last_activity_at);
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity <= 7) {
        score += 10 - daysSinceActivity;
      }
    }

    // Bonus si prix compétitif (0-15 points)
    if (filters.serviceId) {
      const price = getProviderPrice(provider, filters.serviceId);
      const avgPrice = services.find(s => s.id === filters.serviceId)?.price_per_hour || 0;
      
      if (price && avgPrice && price <= avgPrice) {
        score += Math.max(0, ((avgPrice - price) / avgPrice) * 15);
      }
    }

    // Bonus localisation exacte vs approximative (0-15 points)
    if (filters.location && provider.location) {
      const location = filters.location.toLowerCase();
      const providerLocation = provider.location.toLowerCase();
      
      if (providerLocation === location) {
        score += 15; // Correspondance exacte
      } else if (providerLocation.includes(location) || location.includes(providerLocation)) {
        score += 10; // Correspondance partielle
      }
    }

    // Bonus si disponible au moment demandé (0-25 points)
    if (filters.dateTime) {
      const isAvailable = isProviderAvailable(provider, filters.dateTime);
      if (isAvailable) {
        score += 25;
      }
    }

    // Bonus pour les prestataires premium/avec profil complet (0-10 points)
    if (provider.business_name && provider.description && provider.hourly_rate) {
      score += 10;
    }

    // Malus pour les prestataires inactifs ou avec de mauvaises stats
    if (provider.acceptance_rate && provider.acceptance_rate < 70) {
      score -= 10;
    }

    return Math.max(0, score); // S'assurer que le score ne soit pas négatif
  };

  // Obtenir le prix final pour un prestataire et un service
  const getProviderPrice = (provider: any, serviceId: string): number => {
    const providerService = provider.provider_services?.find((ps: any) => ps.service_id === serviceId);
    const selectedService = services.find(s => s.id === serviceId);
    
    return providerService?.price_override || selectedService?.price_per_hour || 0;
  };

  // Vérifier la disponibilité d'un prestataire à une date/heure
  const isProviderAvailable = (provider: any, dateTime: Date): boolean => {
    const dayOfWeek = dateTime.getDay();
    const timeString = dateTime.toTimeString().slice(0, 5);
    
    return provider.provider_availability?.some((avail: any) => 
      avail.day_of_week === dayOfWeek &&
      avail.is_available &&
      avail.start_time <= timeString &&
      avail.end_time >= timeString
    );
  };

  useEffect(() => {
    loadServices();
  }, []);

  return {
    providers,
    services,
    loading,
    error,
    findMatchingProviders,
    getProviderPrice,
    isProviderAvailable,
    calculateMatchingScore
  };
};