import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminCounts {
  alerts: number;
  demandes: number;
  candidatures: number;
  prestatairesPending: number;
  moderation: number;
  messages: number;
  missionsPending: number;
}

export const useAdminCounts = () => {
  return useQuery({
    queryKey: ['admin-counts'],
    queryFn: async () => {
      const urgentCutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const waitingCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const blockedCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const inactiveDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        urgentReq,
        waitingClients,
        blockedMissions,
        inactiveProviders,
        demandesTotal,
        candidaturesPending,
        prestatairesPending,
        moderationPending,
        messagesUnread,
        missionsPending
      ] = await Promise.all([
        supabase.from('client_requests').select('id', { count: 'exact', head: true }).in('status', ['new', 'unmatched']).lt('created_at', urgentCutoff),
        supabase.from('client_requests').select('id', { count: 'exact', head: true }).eq('status', 'assigned').lt('updated_at', waitingCutoff),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'in_progress').lt('started_at', blockedCutoff),
        supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'active').or(`last_mission_date.is.null,last_mission_date.lt.${inactiveDate}`),
        supabase.from('client_requests').select('id', { count: 'exact', head: true }),
        supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('providers').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_validation']),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('internal_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const alertsTotal = (urgentReq.count || 0) + (waitingClients.count || 0) + (blockedMissions.count || 0) + (inactiveProviders.count || 0);

      return {
        alerts: alertsTotal,
        demandes: demandesTotal.count || 0,
        candidatures: candidaturesPending.count || 0,
        prestatairesPending: prestatairesPending.count || 0,
        moderation: moderationPending.count || 0,
        messages: messagesUnread.count || 0,
        missionsPending: missionsPending.count || 0,
      } as AdminCounts;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Rafraîchir toutes les 5 minutes
  });
};
