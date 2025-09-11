import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Provider } from '@/types/provider';
import debounce from 'lodash-es/debounce';

interface Mission {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  address: string;
  total_price: number;
  client_notes?: string;
  provider_notes?: string;
  services?: { name: string; category: string } | null;
  profiles?: { first_name: string; last_name: string; avatar_url?: string } | null;
}

interface Opportunity {
  id: string;
  booking_date: string;
  start_time: string;
  address: string;
  total_price: number;
  urgency: string;
  services?: { name: string; category: string } | null;
  distance?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: { first_name: string; last_name: string } | null;
}

interface ProviderStats {
  monthlyEarnings: number;
  totalEarnings: number;
  activeMissions: number;
  completedMissions: number;
  averageRating: number;
  acceptanceRate: number;
  totalReviews: number;
  responseTime: number; // in minutes
}

interface ProviderDashboardData {
  provider: Provider | null;
  missions: Mission[];
  opportunities: Opportunity[];
  reviews: Review[];
  stats: ProviderStats;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

export const useProviderDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ProviderDashboardData>({
    provider: null,
    missions: [],
    opportunities: [],
    reviews: [],
    stats: {
      monthlyEarnings: 0,
      totalEarnings: 0,
      activeMissions: 0,
      completedMissions: 0,
      averageRating: 0,
      acceptanceRate: 0,
      totalReviews: 0,
      responseTime: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache management
  const getCachedData = useCallback((key: string) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() });
  }, []);

  // Load provider profile with caching
  const loadProviderProfile = useCallback(async (): Promise<Provider | null> => {
    if (!user) return null;

    const cacheKey = `provider_${user.id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Récupérer le profil prestataire
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select(`
          *,
          provider_services(
            service_id,
            price_override,
            services(name, category, price_per_hour)
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (providerError) throw providerError;

      // Récupérer le profil utilisateur séparément
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      // Combine les données (même si le profil n'existe pas)
      const combinedData = {
        ...providerData,
        profiles: profileData || null
      };

      setCachedData(cacheKey, combinedData);
      return combinedData as Provider;
    } catch (error: any) {
      console.error('Error loading provider:', error);
      throw error;
    }
  }, [user, getCachedData, setCachedData]);

  // Load missions with performance optimizations
  const loadMissions = useCallback(async (providerId: string): Promise<Mission[]> => {
    const cacheKey = `missions_${providerId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data: missionsData, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          address,
          total_price,
          client_notes,
          provider_notes,
          client_id,
          services(name, category)
        `)
        .eq('provider_id', providerId)
        .gte('booking_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
        .order('booking_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Récupérer les profils clients séparément
      const clientIds = [...new Set((missionsData || []).map((m: any) => m.client_id).filter(Boolean))];
      const { data: clientProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', clientIds);

      const profilesMap = (clientProfiles || []).reduce((acc: any, profile: any) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {});

      const missions = (missionsData || []).map((mission: any) => ({
        ...mission,
        services: mission.services || null,
        profiles: profilesMap[mission.client_id] || null
      }));

      setCachedData(cacheKey, missions);
      return missions;
    } catch (error: any) {
      console.error('Error loading missions:', error);
      throw error;
    }
  }, [getCachedData, setCachedData]);

  // Load opportunities with intelligent matching
  const loadOpportunities = useCallback(async (providerId: string): Promise<Opportunity[]> => {
    const cacheKey = `opportunities_${providerId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get provider location and services for matching
      const { data: providerData } = await supabase
        .from('providers')
        .select('location, provider_services(service_id)')
        .eq('id', providerId)
        .single();

      const serviceIds = providerData?.provider_services?.map((ps: any) => ps.service_id) || [];

      const { data: opportunitiesData, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          address,
          total_price,
          urgency,
          service_id,
          services(name, category)
        `)
        .is('provider_id', null)
        .eq('status', 'pending')
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .in('service_id', serviceIds.length > 0 ? serviceIds : [])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const opportunities = (opportunitiesData || []).map((opportunity: any) => ({
        ...opportunity,
        services: opportunity.services || null,
        distance: Math.floor(Math.random() * 15) + 1 // Placeholder for actual distance calculation
      }));

      setCachedData(cacheKey, opportunities);
      return opportunities;
    } catch (error: any) {
      console.error('Error loading opportunities:', error);
      throw error;
    }
  }, [getCachedData, setCachedData]);

  // Load reviews with pagination
  const loadReviews = useCallback(async (providerId: string): Promise<Review[]> => {
    const cacheKey = `reviews_${providerId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          client_id
        `)
        .eq('provider_id', providerId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Récupérer les profils clients séparément
      const reviewClientIds = [...new Set((reviewsData || []).map((r: any) => r.client_id).filter(Boolean))];
      const { data: reviewClientProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', reviewClientIds);

      const reviewProfilesMap = (reviewClientProfiles || []).reduce((acc: any, profile: any) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {});

      const reviews = (reviewsData || []).map((review: any) => ({
        ...review,
        profiles: reviewProfilesMap[review.client_id] || null
      }));

      setCachedData(cacheKey, reviews);
      return reviews;
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      throw error;
    }
  }, [getCachedData, setCachedData]);

  // Calculate comprehensive stats
  const calculateStats = useCallback((
    missions: Mission[], 
    reviews: Review[], 
    provider: Provider | null
  ): ProviderStats => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthMissions = missions.filter(m => {
      const missionDate = new Date(m.booking_date);
      return missionDate.getMonth() === currentMonth && missionDate.getFullYear() === currentYear;
    });

    const completedMissions = missions.filter(m => m.status === 'completed');
    const activeMissions = missions.filter(m => ['pending', 'confirmed', 'in_progress'].includes(m.status));

    const monthlyEarnings = thisMonthMissions
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.total_price, 0);

    const totalEarnings = completedMissions.reduce((sum, m) => sum + m.total_price, 0);

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return {
      monthlyEarnings,
      totalEarnings,
      activeMissions: activeMissions.length,
      completedMissions: completedMissions.length,
      averageRating,
      acceptanceRate: provider?.acceptance_rate || 0,
      totalReviews: reviews.length,
      responseTime: Math.floor(Math.random() * 30) + 5 // Placeholder
    };
  }, []);

  // Main data loading function
  const loadDashboardData = useCallback(async (force = false) => {
    if (!user) return;

    const isInitialLoad = !data.provider;
    setLoading(isInitialLoad);
    setRefreshing(!isInitialLoad);
    setError(null);

    try {
      if (force) {
        // Clear all cached data for this user
        const keysToDelete = Array.from(cache.keys()).filter(key => 
          key.includes(user.id) || key.includes('provider_') || key.includes('missions_') || 
          key.includes('opportunities_') || key.includes('reviews_')
        );
        keysToDelete.forEach(key => cache.delete(key));
      }

      const provider = await loadProviderProfile();
      if (!provider) return;

      const [missions, opportunities, reviews] = await Promise.all([
        loadMissions(provider.id),
        loadOpportunities(provider.id),
        loadReviews(provider.id)
      ]);

      const stats = calculateStats(missions, reviews, provider);

      setData({
        provider,
        missions,
        opportunities,
        reviews,
        stats
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Erreur lors du chargement des données');
      
      if (isInitialLoad) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données du dashboard",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, data.provider, loadProviderProfile, loadMissions, loadOpportunities, loadReviews, calculateStats, toast]);

  // Debounced refresh function
  const debouncedRefresh = useMemo(
    () => debounce(() => loadDashboardData(true), 1000),
    [loadDashboardData]
  );

  // Apply to mission with optimistic updates
  const applyToMission = useCallback(async (missionId: string) => {
    if (!data.provider) return;

    try {
      // Optimistic update
      setData(prev => ({
        ...prev,
        opportunities: prev.opportunities.filter(o => o.id !== missionId)
      }));

      const { error } = await supabase
        .from('bookings')
        .update({ 
          provider_id: data.provider.id,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', missionId);

      if (error) throw error;

      toast({
        title: "Candidature envoyée",
        description: "Votre candidature a été envoyée avec succès !",
      });

      // Refresh data after successful application
      setTimeout(() => loadDashboardData(true), 1000);
    } catch (error: any) {
      // Revert optimistic update on error
      loadDashboardData(true);
      
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la candidature",
        variant: "destructive",
      });
    }
  }, [data.provider, toast, loadDashboardData]);

  // Update mission status
  const updateMissionStatus = useCallback(async (missionId: string, status: string, notes?: string) => {
    try {
      const updateData: any = { status };
      if (notes) updateData.provider_notes = notes;
      if (status === 'in_progress') updateData.started_at = new Date().toISOString();
      if (status === 'completed') updateData.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', missionId);

      if (error) throw error;

      toast({
        title: "Mission mise à jour",
        description: `Le statut de la mission a été mis à jour avec succès`,
      });

      // Refresh data
      loadDashboardData(true);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  }, [toast, loadDashboardData]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        debouncedRefresh();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loading, refreshing, debouncedRefresh]);

  return {
    ...data,
    loading,
    refreshing,
    error,
    refresh: () => loadDashboardData(true),
    applyToMission,
    updateMissionStatus
  };
};