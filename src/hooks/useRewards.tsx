import { useState, useEffect } from 'react';
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
  
  const [clientRewards, setClientRewards] = useState<ClientReward[]>([]);
  const [providerRewards, setProviderRewards] = useState<ProviderReward[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load client rewards
  const loadClientRewards = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_rewards')
        .select('*')
        .eq('client_id', user.id)
        .order('earned_date', { ascending: false });

      if (error) throw error;
      setClientRewards(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos récompenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load provider rewards
  const loadProviderRewards = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!providerData) return;

      const { data, error } = await supabase
        .from('provider_rewards')
        .select('*')
        .eq('provider_id', providerData.id)
        .order('earned_date', { ascending: false });

      if (error) throw error;
      setProviderRewards(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos récompenses prestataire",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load monthly activity
  const loadMonthlyActivity = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('client_monthly_activity')
        .select('*')
        .eq('client_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setMonthlyActivity(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Check if client is eligible for reward
  const checkClientEligibility = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_client_reward_eligibility', {
        p_client_id: user.id
      });

      if (error) throw error;
      return data || false;
    } catch (err: any) {
      console.error('Error checking eligibility:', err);
      return false;
    }
  };

  // Calculate provider reward tier
  const calculateProviderTier = async (providerId: string): Promise<string | null> => {
    try {
      // Get provider stats
      const { data: provider } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (!provider) return null;

      // Calculate months active
      const createdAt = new Date(provider.created_at);
      const now = new Date();
      const monthsActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));

      // Get total hours worked from bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('provider_id', providerId)
        .eq('status', 'completed');

      const totalHours = bookings?.reduce((sum, booking) => {
        const start = new Date(`2000-01-01T${booking.start_time}`);
        const end = new Date(`2000-01-01T${booking.end_time}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) || 0;

      const { data, error } = await supabase.rpc('calculate_provider_reward_tier', {
        p_provider_id: providerId,
        p_missions_count: provider.missions_completed || 0,
        p_hours_worked: totalHours,
        p_average_rating: provider.rating || 0,
        p_months_active: monthsActive
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error calculating tier:', err);
      return null;
    }
  };

  // Award client reward
  const awardClientReward = async (rewardType: string = 'psychologist_voucher') => {
    if (!user) return;

    try {
      // The trigger will automatically set valid_until and expires_at
      const { error } = await supabase
        .from('client_rewards')
        .insert({
          client_id: user.id,
          reward_type: rewardType,
          valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months
          expires_at: new Date(new Date().getFullYear(), 11, 31).toISOString() // Dec 31st
        });

      if (error) throw error;
      
      toast({
        title: "Félicitations !",
        description: "Vous avez gagné un bon psychologue !",
      });
      
      await loadClientRewards();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'attribuer la récompense",
        variant: "destructive",
      });
    }
  };

  // Use client reward
  const useClientReward = async (rewardId: string, bookingId: string) => {
    try {
      const { error } = await supabase
        .from('client_rewards')
        .update({
          status: 'used',
          used_date: new Date().toISOString(),
          booking_id: bookingId
        })
        .eq('id', rewardId);

      if (error) throw error;
      
      toast({
        title: "Bon utilisé",
        description: "Votre bon psychologue a été utilisé avec succès",
      });
      
      await loadClientRewards();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'utiliser le bon",
        variant: "destructive",
      });
    }
  };

  // Get reward tier badge color
  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-600';
      case 'silver': return 'bg-slate-400';
      case 'gold': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  // Get reward tier emoji
  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      default: return '🎁';
    }
  };

  // Format tier name
  const formatTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  useEffect(() => {
    if (user) {
      loadClientRewards();
      loadProviderRewards();
      loadMonthlyActivity();
    }
  }, [user]);

  return {
    clientRewards,
    providerRewards,
    monthlyActivity,
    loading,
    error,
    loadClientRewards,
    loadProviderRewards,
    loadMonthlyActivity,
    checkClientEligibility,
    calculateProviderTier,
    awardClientReward,
    useClientReward,
    getTierBadgeColor,
    getTierEmoji,
    formatTierName,
  };
};