import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from './useGeolocation';
import { debounce } from '@/utils/performanceOptimizer';

interface IntelligentMatchingFilters {
  serviceType: string;
  location: string;
  urgency?: 'low' | 'normal' | 'high' | 'urgent';
  minRating?: number;
  maxPrice?: number;
  dateTime?: Date;
  budget?: number;
  useGeolocation?: boolean;
  requiredCertifications?: string[];
  preferredLanguage?: string;
}

interface MatchingResult {
  providers: any[];
  analytics: {
    search_quality: number;
    avg_distance: number;
    urgent_available: number;
    competition_level: 'low' | 'medium' | 'high';
  };
  recommendations: any[];
  demand_metrics: any;
}

export const useIntelligentMatching = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userLocation, getUserLocation } = useGeolocation({});

  // Fonction de matching intelligente avec debounce
  const findIntelligentMatches = useCallback(
    debounce(async (filters: IntelligentMatchingFilters) => {
      setLoading(true);
      setError(null);

      try {
        const requestBody: any = {
          serviceType: filters.serviceType,
          location: filters.location,
          urgency: filters.urgency || 'normal',
          minRating: filters.minRating,
          maxPrice: filters.maxPrice,
          budget: filters.budget,
          requiredCertifications: filters.requiredCertifications
        };

        // Ajouter la géolocalisation si activée et disponible
        if (filters.useGeolocation && userLocation?.latitude && userLocation?.longitude) {
          requestBody.latitude = userLocation.latitude;
          requestBody.longitude = userLocation.longitude;
        }

        // Ajouter la date/heure si spécifiée
        if (filters.dateTime) {
          requestBody.dateTime = filters.dateTime.toISOString();
        }

        console.log('Intelligent matching request:', requestBody);

        const { data, error: matchError } = await supabase.functions.invoke('match-providers', {
          body: requestBody
        });

        if (matchError) throw matchError;

        if (!data.success) {
          throw new Error(data.error || 'Matching failed');
        }

        setResults({
          providers: data.providers || [],
          analytics: data.analytics || {},
          recommendations: data.recommendations || [],
          demand_metrics: data.demand_metrics || {}
        });

      } catch (err) {
        console.error('Intelligent matching error:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du matching intelligent');
      } finally {
        setLoading(false);
      }
    }, 300),
    [userLocation]
  );

  // Fonction pour obtenir des suggestions basées sur l'historique
  const getSuggestions = useCallback(async (serviceType: string) => {
    try {
      const { data, error } = await supabase
        .from('client_requests')
        .select('service_type, location')
        .ilike('service_type', `%${serviceType}%`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting suggestions:', err);
      return [];
    }
  }, []);

  // Analyse de la qualité du matching
  const matchingQuality = useMemo(() => {
    if (!results) return null;

    const { providers, analytics } = results;
    
    return {
      score: analytics.search_quality || 0,
      providersFound: providers.length,
      hasRecommendations: results.recommendations.length > 0,
      avgDistance: analytics.avg_distance,
      competitionLevel: analytics.competition_level,
      urgentAvailable: analytics.urgent_available > 0
    };
  }, [results]);

  // Filtres intelligents basés sur les résultats
  const getSmartFilters = useCallback(() => {
    if (!results) return [];

    const filters = [];
    
    if (results.analytics.avg_distance > 20) {
      filters.push({
        type: 'distance',
        label: 'Prestataires à proximité',
        action: 'reduce_distance'
      });
    }

    if (results.analytics.competition_level === 'high') {
      filters.push({
        type: 'urgency',
        label: 'Réduire l\'urgence pour plus de choix',
        action: 'reduce_urgency'
      });
    }

    if (results.providers.length < 3) {
      filters.push({
        type: 'expand',
        label: 'Élargir la recherche',
        action: 'expand_search'
      });
    }

    return filters;
  }, [results]);

  return {
    loading,
    results,
    error,
    matchingQuality,
    findIntelligentMatches,
    getSuggestions,
    getSmartFilters,
    hasGeolocation: !!(userLocation?.latitude && userLocation?.longitude)
  };
};