import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MatchingMetrics {
  totalRequests: number;
  pendingMatches: number;
  successRate: number;
  averageResponseTime: number;
  activeProviders: number;
  backupProviders: number;
}

export interface MatchingStatus {
  id: string;
  clientRequestId: string;
  providerName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout' | 'backup';
  score: number;
  assignedAt: string;
  expiresAt: string;
  priority: number;
}

const METRICS_KEY = ['admin-matching-metrics'] as const;
const MATCHES_KEY = ['admin-active-matches'] as const;

const DEFAULT_METRICS: MatchingMetrics = {
  totalRequests: 0, pendingMatches: 0, successRate: 0,
  averageResponseTime: 0, activeProviders: 0, backupProviders: 0,
};

async function fetchMetrics(): Promise<MatchingMetrics> {
  const today = new Date().toISOString().split('T')[0];
  const [
    { count: totalCount },
    { count: pendingCount },
    { count: assignedCount },
    { count: activeCount },
  ] = await Promise.all([
    supabase.from('client_requests').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('client_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('client_requests').select('*', { count: 'exact', head: true }).eq('status', 'assigned').gte('created_at', today),
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('is_verified', true).eq('status', 'active'),
  ]);
  return {
    totalRequests: totalCount || 0,
    pendingMatches: pendingCount || 0,
    successRate: totalCount ? Math.round(((assignedCount || 0) / totalCount) * 100) : 0,
    averageResponseTime: 15,
    activeProviders: activeCount || 0,
    backupProviders: 0,
  };
}

async function fetchActiveMatches(): Promise<MatchingStatus[]> {
  const { data, error } = await supabase
    .from('missions')
    .select(`
      id, client_request_id, assigned_provider_id, status,
      priority, match_score, assigned_at, expires_at,
      providers(business_name),
      client_requests(service_type, location)
    `)
    .in('status', ['pending', 'backup'])
    .order('priority', { ascending: true })
    .order('assigned_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map(m => ({
    id: m.id,
    clientRequestId: m.client_request_id,
    providerName: (m.providers as any)?.business_name || 'En attente',
    status: m.status as MatchingStatus['status'],
    score: m.match_score || 0,
    assignedAt: m.assigned_at || '',
    expiresAt: m.expires_at || new Date(new Date(m.assigned_at ?? '').getTime() + 30 * 60 * 1000).toISOString(),
    priority: m.priority,
  }));
}

export const useAdminMatching = () => {
  const qc = useQueryClient();

  const { data: metrics = DEFAULT_METRICS, isLoading: metricsLoading } = useQuery({
    queryKey: METRICS_KEY,
    queryFn: fetchMetrics,
    refetchInterval: 30_000,
  });

  const { data: activeMatches = [], isLoading: matchesLoading } = useQuery({
    queryKey: MATCHES_KEY,
    queryFn: fetchActiveMatches,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-matching-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_requests' }, () => {
        qc.invalidateQueries({ queryKey: METRICS_KEY });
        qc.invalidateQueries({ queryKey: MATCHES_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const triggerMatching = async (requestId: string) => {
    try {
      const { data: request, error: requestError } = await supabase
        .from('client_requests').select('*').eq('id', requestId).single();
      if (requestError) throw requestError;

      const { data, error } = await supabase.functions.invoke('intelligent-matching', {
        body: {
          clientRequestId: requestId,
          serviceType: request.service_type,
          location: request.location,
          urgency: request.urgency_level || 'normal',
          budget: parseFloat(request.budget_range ?? '') || undefined,
          preferredDate: request.preferred_date,
        },
      });
      if (error) throw error;

      if (data?.success) {
        toast.success(`✅ ${data.message}`);
        qc.invalidateQueries({ queryKey: METRICS_KEY });
        qc.invalidateQueries({ queryKey: MATCHES_KEY });
        return data;
      }
      toast.error(data?.message || 'Erreur lors du matching');
      return null;
    } catch (error: any) {
      console.error('Matching error:', error);
      toast.error('Erreur lors du matching intelligent');
      return null;
    }
  };

  const checkTimeouts = async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: oldRequests } = await supabase
      .from('client_requests').select('id').eq('status', 'new').lt('created_at', yesterday);
    if (oldRequests?.length)
      toast.warning(`${oldRequests.length} demande(s) en attente depuis plus de 24h`);
  };

  return {
    metrics,
    activeMatches,
    loading: metricsLoading || matchesLoading,
    triggerMatching,
    checkTimeouts,
    refreshData: () => {
      qc.invalidateQueries({ queryKey: METRICS_KEY });
      qc.invalidateQueries({ queryKey: MATCHES_KEY });
    },
  };
};
