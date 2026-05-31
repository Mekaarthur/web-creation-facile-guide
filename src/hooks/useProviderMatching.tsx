import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Provider, Service, MatchingFilters } from '@/types/provider';
import { sanitizeSearch } from '@/lib/sanitizeSearch';

async function fetchServices(): Promise<Service[]> {
  const { data, error } = await (supabase as any)
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data || [];
}

export const useProviderMatching = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['matching-services'],
    queryFn: fetchServices,
    staleTime: 5 * 60_000,
  });

  const findMatchingProviders = async (filters: MatchingFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      if (filters.serviceType && filters.location) {
        const { data: matchResult, error: matchError } = await supabase.functions.invoke('match-providers', {
          body: { serviceType: filters.serviceType, location: filters.location, urgency: filters.urgency || 'normal' },
        });
        if (matchError) throw matchError;

        let matched = matchResult?.providers || [];
        if (filters.minRating) matched = matched.filter((p: any) => p.rating >= filters.minRating);
        if (filters.maxPrice) matched = matched.filter((p: any) => getProviderPrice(p, filters.serviceId || '') <= filters.maxPrice!);
        if (filters.dateTime) matched = matched.filter((p: any) => isProviderAvailable(p, filters.dateTime!));
        setProviders(matched);
        return;
      }

      let query = (supabase as any)
        .from('providers')
        .select('*, provider_availability(*), provider_services(*, services(*))')
        .eq('is_verified', true);
      if (filters.minRating) query = query.gte('rating', filters.minRating);
      if (filters.location) query = query.ilike('location', `%${sanitizeSearch(filters.location)}%`);

      const { data, error: qErr } = await query.order('rating', { ascending: false });
      if (qErr) throw qErr;

      let filtered: any[] = data || [];
      if (filters.serviceId)
        filtered = filtered.filter((p: any) => p.provider_services?.some((ps: any) => ps.service_id === filters.serviceId));
      if (filters.maxPrice && filters.serviceId)
        filtered = filtered.filter((p: any) => getProviderPrice(p, filters.serviceId!) <= filters.maxPrice!);
      if (filters.dateTime)
        filtered = filtered.filter((p: any) => isProviderAvailable(p, filters.dateTime!));

      filtered.sort((a: any, b: any) => calculateMatchingScore(b, filters, services) - calculateMatchingScore(a, filters, services));
      setProviders(filtered);
    } catch (err) {
      console.error('Erreur lors du matching:', err);
      setError('Erreur lors de la recherche de prestataires');
    } finally {
      setLoading(false);
    }
  };

  const getProviderPrice = (provider: any, serviceId: string): number => {
    const ps = provider.provider_services?.find((s: any) => s.service_id === serviceId);
    const svc = services.find(s => s.id === serviceId);
    return ps?.price_override || svc?.price_per_hour || 0;
  };

  const isProviderAvailable = (provider: any, dateTime: Date): boolean => {
    const day = dateTime.getDay();
    const time = dateTime.toTimeString().slice(0, 5);
    return provider.provider_availability?.some(
      (a: any) => a.day_of_week === day && a.is_available && a.start_time <= time && a.end_time >= time
    );
  };

  return {
    providers,
    services,
    loading,
    error,
    findMatchingProviders,
    getProviderPrice,
    isProviderAvailable,
    calculateMatchingScore: (p: any, f: MatchingFilters) => calculateMatchingScore(p, f, services),
  };
};

function calculateMatchingScore(provider: any, filters: MatchingFilters, services: Service[]): number {
  let score = 0;
  if (provider.rating) score += provider.rating * 8;
  if (provider.is_verified) score += 15;
  if (provider.missions_completed) score += Math.min(20, provider.missions_completed * 0.5);
  if (provider.acceptance_rate) score += provider.acceptance_rate * 0.15;
  if (provider.last_activity_at) {
    const days = (Date.now() - new Date(provider.last_activity_at).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 7) score += 10 - days;
  }
  if (filters.serviceId) {
    const ps = provider.provider_services?.find((s: any) => s.service_id === filters.serviceId);
    const svc = services.find(s => s.id === filters.serviceId);
    const price = ps?.price_override || svc?.price_per_hour || 0;
    const avg = svc?.price_per_hour || 0;
    if (price && avg && price <= avg) score += Math.max(0, ((avg - price) / avg) * 15);
  }
  if (filters.location && provider.location) {
    const loc = filters.location.toLowerCase();
    const pLoc = provider.location.toLowerCase();
    if (pLoc === loc) score += 15;
    else if (pLoc.includes(loc) || loc.includes(pLoc)) score += 10;
  }
  if (filters.dateTime) {
    const day = filters.dateTime.getDay();
    const time = filters.dateTime.toTimeString().slice(0, 5);
    const avail = provider.provider_availability?.some(
      (a: any) => a.day_of_week === day && a.is_available && a.start_time <= time && a.end_time >= time
    );
    if (avail) score += 25;
  }
  if (provider.business_name && provider.description && provider.hourly_rate) score += 10;
  if (provider.acceptance_rate && provider.acceptance_rate < 70) score -= 10;
  return Math.max(0, score);
}
