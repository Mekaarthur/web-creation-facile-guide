import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyBookings {
  count: number;
  previous_count: number;
}

interface WeeklyRating {
  avg_rating: number;
  review_count: number;
  previous_avg: number;
}

interface RecurringClients {
  total_clients: number;
  recurring_clients: number;
  rate: number;
}

interface ActiveProviders {
  active: number;
  total: number;
  rate: number;
}

interface AcquisitionChannel {
  channel: string;
  total_cost: number;
  conversions: number;
  cac: number;
}

export const useWeeklyCompletedBookings = () => {
  return useQuery({
    queryKey: ['weekly-completed-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_weekly_completed_bookings');
      if (error) throw error;
      return data as unknown as WeeklyBookings;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

export const useWeeklyAvgRating = () => {
  return useQuery({
    queryKey: ['weekly-avg-rating'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_weekly_avg_rating');
      if (error) throw error;
      return data as unknown as WeeklyRating;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

export const useRecurringClientsRate = () => {
  return useQuery({
    queryKey: ['recurring-clients-rate'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recurring_clients_rate');
      if (error) throw error;
      return data as unknown as RecurringClients;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

export const useActiveProvidersRatio = () => {
  return useQuery({
    queryKey: ['active-providers-ratio'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_providers_ratio');
      if (error) throw error;
      return data as unknown as ActiveProviders;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

export const useAcquisitionCostByChannel = () => {
  return useQuery({
    queryKey: ['acquisition-cost-by-channel'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_acquisition_cost_by_channel');
      if (error) throw error;
      return (data as unknown as AcquisitionChannel[]) || [];
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};
