import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash-es';

interface SearchResult {
  id: string;
  type: 'service' | 'booking' | 'provider' | 'invoice';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  score: number;
}

interface SearchFilters {
  types?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  status?: string[];
}

export const useSmartSearch = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Debounced search function
  const debouncedSetQuery = useMemo(
    () => debounce((searchQuery: string) => {
      setQuery(searchQuery);
      if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    }, 300),
    [recentSearches]
  );

  // Recherche intelligente
  const { data: results, isLoading, error } = useQuery({
    queryKey: ['smart-search', query, filters],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query.trim()) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const searchResults: SearchResult[] = [];

      // Recherche dans les services
      if (!filters.types || filters.types.includes('service')) {
        const { data: services } = await supabase
          .from('services')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(5);

        services?.forEach(service => {
          searchResults.push({
            id: service.id,
            type: 'service',
            title: service.name,
            subtitle: service.category,
            description: service.description,
            metadata: { price: service.price_per_hour },
            score: calculateRelevanceScore(query, service.name, service.description),
          });
        });
      }

      // Recherche dans les réservations
      if (!filters.types || filters.types.includes('booking')) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            *,
            services(name, category),
            providers(business_name)
          `)
          .eq('client_id', user.id)
          .limit(5);

        bookings?.forEach(booking => {
          const serviceName = booking.services?.name || '';
          const providerName = booking.providers?.business_name || '';
          
          if (
            serviceName.toLowerCase().includes(query.toLowerCase()) ||
            providerName.toLowerCase().includes(query.toLowerCase()) ||
            booking.address?.toLowerCase().includes(query.toLowerCase())
          ) {
            searchResults.push({
              id: booking.id,
              type: 'booking',
              title: serviceName,
              subtitle: `${booking.booking_date} - ${booking.start_time}`,
              description: `Prestataire: ${providerName}`,
              metadata: { 
                status: booking.status,
                price: booking.total_price,
                date: booking.booking_date 
              },
              score: calculateRelevanceScore(query, serviceName, providerName),
            });
          }
        });
      }

      // Recherche dans les factures
      if (!filters.types || filters.types.includes('invoice')) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('client_id', user.id)
          .limit(5);

        invoices?.forEach(invoice => {
          if (
            invoice.invoice_number?.toLowerCase().includes(query.toLowerCase()) ||
            invoice.service_description?.toLowerCase().includes(query.toLowerCase())
          ) {
            searchResults.push({
              id: invoice.id,
              type: 'invoice',
              title: `Facture ${invoice.invoice_number}`,
              subtitle: `${invoice.amount}€ - ${invoice.status}`,
              description: invoice.service_description,
              metadata: { 
                amount: invoice.amount,
                status: invoice.status,
                date: invoice.issued_date 
              },
              score: calculateRelevanceScore(query, invoice.invoice_number || '', invoice.service_description || ''),
            });
          }
        });
      }

      // Appliquer les filtres
      let filteredResults = searchResults;

      if (filters.dateRange) {
        filteredResults = filteredResults.filter(result => {
          const date = result.metadata?.date;
          if (!date) return true;
          const resultDate = new Date(date);
          return resultDate >= filters.dateRange!.start && resultDate <= filters.dateRange!.end;
        });
      }

      if (filters.priceRange) {
        filteredResults = filteredResults.filter(result => {
          const price = result.metadata?.price;
          if (!price) return true;
          return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
        });
      }

      if (filters.status?.length) {
        filteredResults = filteredResults.filter(result => {
          const status = result.metadata?.status;
          return !status || filters.status!.includes(status);
        });
      }

      // Trier par score de pertinence
      return filteredResults.sort((a, b) => b.score - a.score);
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000, // Cache pendant 30 secondes
  });

  // Suggestions basées sur l'historique
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async (): Promise<string[]> => {
      if (query.length < 2) return recentSearches;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Récupérer les services populaires
      const { data: services } = await supabase
        .from('services')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(5);

      const serviceSuggestions = services?.map(s => s.name) || [];
      
      // Combiner avec les recherches récentes
      const combined = [...serviceSuggestions, ...recentSearches.filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
      )];

      // Supprimer les doublons
      return Array.from(new Set(combined)).slice(0, 8);
    },
    enabled: true,
    staleTime: 60 * 1000,
  });

  const clearSearch = useCallback(() => {
    setQuery('');
    debouncedSetQuery.cancel();
  }, [debouncedSetQuery]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    query,
    setQuery: debouncedSetQuery,
    results: results || [],
    suggestions: suggestions || [],
    recentSearches,
    filters,
    setFilters,
    isLoading,
    error,
    clearSearch,
    clearRecentSearches,
  };
};

// Fonction pour calculer le score de pertinence
function calculateRelevanceScore(query: string, ...texts: string[]): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  texts.forEach(text => {
    if (!text) return;
    const textLower = text.toLowerCase();
    
    // Correspondance exacte
    if (textLower === queryLower) {
      score += 100;
    }
    // Commence par la requête
    else if (textLower.startsWith(queryLower)) {
      score += 80;
    }
    // Contient la requête
    else if (textLower.includes(queryLower)) {
      score += 60;
    }
    // Correspondance partielle des mots
    else {
      const queryWords = queryLower.split(' ');
      const textWords = textLower.split(' ');
      
      queryWords.forEach(queryWord => {
        textWords.forEach(textWord => {
          if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
            score += 20;
          }
        });
      });
    }
  });

  return score;
}