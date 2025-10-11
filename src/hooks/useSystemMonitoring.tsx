import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
  resolved: boolean;
  created_at: string;
}

interface DashboardStats {
  bookings_last_30d: number;
  completed_bookings_30d: number;
  active_providers: number;
  active_carts_7d: number;
  revenue_30d: number;
  avg_rating_30d: number;
  open_complaints: number;
}

export const useSystemAlerts = () => {
  return useQuery({
    queryKey: ['system-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as SystemAlert[];
    },
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Rafraîchir chaque minute
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      
      if (error) throw error;
      return data[0] as DashboardStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Rafraîchir toutes les 10 minutes
  });
};

export const useMonitoringMetrics = () => {
  return useQuery({
    queryKey: ['monitoring-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'checkSystemHealth' }
      });
      
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Rafraîchir toutes les 5 minutes
  });
};

export const useAbandonedCartsDetection = () => {
  return useQuery({
    queryKey: ['abandoned-carts-detection'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('detect_abandoned_carts');
      
      if (error) throw error;
      return { count: data as number };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 60 * 1000, // Rafraîchir toutes les 30 minutes
    enabled: false, // Activer manuellement ou via un cron
  });
};

export const usePaymentFailuresDetection = () => {
  return useQuery({
    queryKey: ['payment-failures-detection'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('detect_payment_failures');
      
      if (error) throw error;
      return { count: data as number };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Rafraîchir toutes les 15 minutes
    enabled: false,
  });
};

export const useInactiveProvidersDetection = () => {
  return useQuery({
    queryKey: ['inactive-providers-detection'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('detect_inactive_providers');
      
      if (error) throw error;
      return { count: data as number };
    },
    staleTime: 60 * 60 * 1000, // 1 heure
    refetchInterval: 24 * 60 * 60 * 1000, // Rafraîchir toutes les 24 heures
    enabled: false,
  });
};

export const resolveAlert = async (alertId: string) => {
  const { error } = await supabase
    .from('system_alerts')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', alertId);

  if (error) throw error;
};
