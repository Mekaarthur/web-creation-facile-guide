import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ClientReward {
  id: string;
  client_id: string;
  reward_type: string;
  status: string;
  earned_date: string;
  valid_until: string;
  expires_at: string;
  used_date?: string;
  booking_id?: string;
}

export interface ProviderReward {
  id: string;
  provider_id: string;
  reward_tier: string;
  amount: number;
  year: number;
  status: string;
  earned_date: string;
  paid_date?: string;
  missions_count: number;
  hours_worked: number;
  average_rating: number;
}

export interface MonthlyActivity {
  id: string;
  client_id: string;
  year: number;
  month: number;
  total_hours: number;
  consecutive_months: number;
}

export const useRewards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const clientRewardsKey = ['client-rewards', user?.id] as const;
  const providerRewardsKey = ['provider-rewards', user?.id] as const;
  const monthlyActivityKey = ['monthly-activity', user?.id] as const;

  const { data: clientRewards = [], isLoading: clientLoading, error: clientError } = useQuery({
    queryKey: clientRewardsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_rewards')
        .select('*')
        .eq('client_id', user!.id)
        .order('earned_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientReward[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: providerRewards = [], isLoading: providerLoading } = useQuery({
    queryKey: providerRewardsKey,
    queryFn: async () => {
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (!providerData) return [] as ProviderReward[];

      const { data, error } = await supabase
        .from('provider_rewards')
        .select('*')
        .eq('provider_id', providerData.id)
        .order('earned_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProviderReward[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: monthlyActivity = [] } = useQuery({
    queryKey: monthlyActivityKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_monthly_activity')
        .select('*')
        .eq('client_id', user!.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MonthlyActivity[];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const checkClientEligibility = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.rpc('check_client_reward_eligibility', { p_client_id: user.id });
      if (error) throw error;
      return data || false;
    } catch (err: any) {
      console.error('Error checking eligibility:', err);
      return false;
    }
  };

  const calculateProviderTier = async (providerId: string): Promise<string | null> => {
    try {
      const { data: provider } = await supabase.from('providers').select('*').eq('id', providerId).single();
      if (!provider) return null;

      const createdAt = new Date(provider.created_at);
      const monthsActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));

      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('provider_id', providerId)
        .eq('status', 'completed');

      const totalHours = bookings?.reduce((sum, booking) => {
        const start = new Date(`2000-01-01T${booking.start_time}`);
        const end = new Date(`2000-01-01T${booking.end_time}`);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0) || 0;

      const { data, error } = await supabase.rpc('calculate_provider_reward_tier', {
        p_provider_id: providerId,
        p_missions_count: provider.missions_completed || 0,
        p_hours_worked: totalHours,
        p_average_rating: provider.rating || 0,
        p_months_active: monthsActive,
      });
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error calculating tier:', err);
      return null;
    }
  };

  const awardClientRewardMutation = useMutation({
    mutationFn: async (rewardType: string = 'wellness_voucher') => {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const { error } = await supabase.from('client_rewards').insert({
        client_id: user!.id,
        reward_type: rewardType,
        earned_date: now.toISOString(),
        valid_until: expiresAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Félicitations !', description: 'Vous avez gagné un accompagnement anti-charge mentale !' });
      qc.invalidateQueries({ queryKey: clientRewardsKey });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Impossible d'attribuer la récompense", variant: 'destructive' });
    },
  });

  const useClientRewardMutation = useMutation({
    mutationFn: async ({ rewardId, bookingId }: { rewardId: string; bookingId: string }) => {
      const { error } = await supabase
        .from('client_rewards')
        .update({ status: 'used', used_date: new Date().toISOString(), booking_id: bookingId })
        .eq('id', rewardId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Accompagnement utilisé', description: 'Votre accompagnement anti-charge mentale a été utilisé avec succès' });
      qc.invalidateQueries({ queryKey: clientRewardsKey });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Impossible d'utiliser le bon", variant: 'destructive' });
    },
  });

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-600';
      case 'silver': return 'bg-slate-400';
      case 'gold': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      default: return '🎁';
    }
  };

  const formatTierName = (tier: string) => tier.charAt(0).toUpperCase() + tier.slice(1);

  return {
    clientRewards,
    providerRewards,
    monthlyActivity,
    loading: clientLoading || providerLoading,
    error: clientError?.message ?? null,
    loadClientRewards: () => qc.invalidateQueries({ queryKey: clientRewardsKey }),
    loadProviderRewards: () => qc.invalidateQueries({ queryKey: providerRewardsKey }),
    loadMonthlyActivity: () => qc.invalidateQueries({ queryKey: monthlyActivityKey }),
    checkClientEligibility,
    calculateProviderTier,
    awardClientReward: (rewardType?: string) => awardClientRewardMutation.mutateAsync(rewardType),
    useClientReward: (rewardId: string, bookingId: string) => useClientRewardMutation.mutateAsync({ rewardId, bookingId }),
    getTierBadgeColor,
    getTierEmoji,
    formatTierName,
  };
};
