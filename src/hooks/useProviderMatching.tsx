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

  // Fonction de matching automatique avec filtres
  const findMatchingProviders = async (filters: MatchingFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = (supabase as any)
        .from('providers')
        .select(`
          *,
          profiles(first_name, last_name, avatar_url),
          provider_services(service_id, price_override),
          provider_availability(day_of_week, start_time, end_time, is_available),
          provider_documents(document_type, file_name, is_verified)
        `)
        .eq('is_verified', true);

      // Filtrer par rating minimum
      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      const { data, error } = await query.order('rating', { ascending: false });
      
      if (error) throw error;

      let filteredProviders = data || [];

      // Filtrage côté client pour les relations complexes
      if (filters.serviceId) {
        filteredProviders = filteredProviders.filter((provider: any) => 
          provider.provider_services && provider.provider_services.some((ps: any) => ps.service_id === filters.serviceId)
        );
      }

      // Filtrage par prix maximum
      if (filters.maxPrice && filters.serviceId) {
        const selectedService = services.find(s => s.id === filters.serviceId);
        if (selectedService) {
          filteredProviders = filteredProviders.filter((provider: any) => {
            const providerService = provider.provider_services?.find((ps: any) => ps.service_id === filters.serviceId);
            const price = providerService?.price_override || selectedService.price_per_hour;
            return price <= (filters.maxPrice || Infinity);
          });
        }
      }

      // Filtrage par disponibilité si date/heure spécifiée
      if (filters.dateTime) {
        const dayOfWeek = filters.dateTime.getDay();
        const timeString = filters.dateTime.toTimeString().slice(0, 5);
        
        filteredProviders = filteredProviders.filter((provider: any) => 
          provider.provider_availability && provider.provider_availability.some((avail: any) => 
            avail.day_of_week === dayOfWeek &&
            avail.is_available &&
            avail.start_time <= timeString &&
            avail.end_time >= timeString
          )
        );
      }

      // Tri par score de matching (rating + disponibilité + prix)
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

  // Calcul du score de matching
  const calculateMatchingScore = (provider: any, filters: MatchingFilters): number => {
    let score = 0;

    // Score basé sur le rating (0-50 points)
    if (provider.rating) {
      score += provider.rating * 10;
    }

    // Bonus si le prestataire est vérifié (10 points)
    if (provider.is_verified) {
      score += 10;
    }

    // Bonus si prix compétitif (0-20 points)
    if (filters.serviceId) {
      const selectedService = services.find(s => s.id === filters.serviceId);
      const providerService = provider.provider_services?.find((ps: any) => ps.service_id === filters.serviceId);
      const price = providerService?.price_override || selectedService?.price_per_hour || 0;
      
      // Plus le prix est bas par rapport à la moyenne, plus le score est élevé
      const avgPrice = selectedService?.price_per_hour || 0;
      if (price <= avgPrice) {
        score += Math.max(0, (avgPrice - price) / avgPrice * 20);
      }
    }

    // Bonus si disponible au moment demandé (20 points)
    if (filters.dateTime) {
      const dayOfWeek = filters.dateTime.getDay();
      const timeString = filters.dateTime.toTimeString().slice(0, 5);
      
      const isAvailable = provider.provider_availability?.some((avail: any) => 
        avail.day_of_week === dayOfWeek &&
        avail.is_available &&
        avail.start_time <= timeString &&
        avail.end_time >= timeString
      );
      
      if (isAvailable) {
        score += 20;
      }
    }

    return score;
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