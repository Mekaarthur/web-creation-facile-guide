import { useState, useEffect } from 'react';
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

export const useAdminMatching = () => {
  const [metrics, setMetrics] = useState<MatchingMetrics>({
    totalRequests: 0,
    pendingMatches: 0,
    successRate: 0,
    averageResponseTime: 0,
    activeProviders: 0,
    backupProviders: 0,
  });

  const [activeMatches, setActiveMatches] = useState<MatchingStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les métriques
  const loadMetrics = async () => {
    try {
      // Requêtes totales aujourd'hui
      const { count: totalCount } = await supabase
        .from('client_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      // Demandes en attente d'attribution
      const { count: pendingCount } = await supabase
        .from('client_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      // Demandes assignées (taux de succès)
      const { count: assignedCount } = await supabase
        .from('client_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'assigned')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      // Providers actifs
      const { count: activeCount } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)
        .eq('status', 'active');

      setMetrics({
        totalRequests: totalCount || 0,
        pendingMatches: pendingCount || 0,
        successRate: totalCount ? Math.round(((assignedCount || 0) / totalCount) * 100) : 0,
        averageResponseTime: 15,
        activeProviders: activeCount || 0,
        backupProviders: 0,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  // Charger les matchs actifs depuis la table missions
  const loadActiveMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select(`
          id,
          client_request_id,
          assigned_provider_id,
          status,
          priority,
          match_score,
          assigned_at,
          expires_at,
          providers (
            business_name
          ),
          client_requests (
            service_type,
            location
          )
        `)
        .in('status', ['pending', 'backup'])
        .order('priority', { ascending: true })
        .order('assigned_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const matches = data?.map(m => ({
        id: m.id,
        clientRequestId: m.client_request_id,
        providerName: m.providers?.business_name || 'En attente',
        status: m.status as any,
        score: m.match_score || 0,
        assignedAt: m.assigned_at || '',
        expiresAt: m.expires_at || new Date(new Date(m.assigned_at).getTime() + 30 * 60 * 1000).toISOString(),
        priority: m.priority,
      })) || [];

      setActiveMatches(matches);
    } catch (error) {
      console.error('Error loading active matches:', error);
    }
  };

  // Déclencher un matching intelligent
  const triggerMatching = async (requestId: string) => {
    try {
      setLoading(true);

      // Récupérer les détails de la demande
      const { data: request, error: requestError } = await supabase
        .from('client_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      const { data, error } = await supabase.functions.invoke('intelligent-matching', {
        body: {
          clientRequestId: requestId,
          serviceType: request.service_type,
          location: request.location,
          urgency: request.urgency_level || 'normal',
          budget: parseFloat(request.budget_range) || undefined,
          preferredDate: request.preferred_date,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`✅ ${data.message}`);
        await loadMetrics();
        await loadActiveMatches();
        return data;
      } else {
        toast.error(data?.message || 'Erreur lors du matching');
        return null;
      }
    } catch (error: any) {
      console.error('Matching error:', error);
      toast.error('Erreur lors du matching intelligent');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Gérer les timeouts automatiques (simplifié)
  const checkTimeouts = async () => {
    try {
      // Vérifier les demandes qui traînent depuis plus de 24h
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: oldRequests } = await supabase
        .from('client_requests')
        .select('id')
        .eq('status', 'new')
        .lt('created_at', yesterday);

      if (oldRequests && oldRequests.length > 0) {
        console.log(`⏱️ Found ${oldRequests.length} old unprocessed requests`);
        toast.warning(`${oldRequests.length} demande(s) en attente depuis plus de 24h`);
      }
    } catch (error) {
      console.error('Error checking timeouts:', error);
    }
  };

  // Surveillance en temps réel
  useEffect(() => {
    loadMetrics();
    loadActiveMatches();
    setLoading(false);

    // Refresh toutes les 30 secondes
    const interval = setInterval(() => {
      loadMetrics();
      loadActiveMatches();
      checkTimeouts();
    }, 30000);

    // Realtime subscriptions
    const requestsChannel = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_requests' },
        () => {
          loadMetrics();
          loadActiveMatches();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  return {
    metrics,
    activeMatches,
    loading,
    triggerMatching,
    refreshData: () => {
      loadMetrics();
      loadActiveMatches();
    }
  };
};