import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { exportPerformanceRewardsToExcel } from '@/utils/exportPerformanceRewards';
import { Users, Euro, TrendingUp, Award, Star, BarChart3, Download, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { DashboardTab } from './referral/DashboardTab';
import { ReferralsTab } from './referral/ReferralsTab';
import { RewardsTab } from './referral/RewardsTab';
import { PerformanceTab } from './referral/PerformanceTab';
import { AmbassadorsTab } from './referral/AmbassadorsTab';
import { ToolsTab } from './referral/ToolsTab';
import { RewardDialogs } from './referral/RewardDialogs';
import {
  ReferralReward, Referral, SuperAmbassador, PerformanceReward, EligibleProvider, ReferralStats,
} from './referral/types';
import { getRewardTypeLabel } from './referral/utils';

const QUERY_KEY = ['admin-referral-data'] as const;

const DEFAULT_STATS: ReferralStats = {
  totalReferrals: 0, activeReferrals: 0, pendingRewards: 0, pendingAmount: 0,
  paidAmount: 0, totalAmbassadors: 0, validatedReferrals: 0, loyaltyReferrals: 0,
  pendingPerformanceRewards: 0, pendingPerformanceAmount: 0, paidPerformanceAmount: 0,
  bronzeCount: 0, silverCount: 0, goldCount: 0,
};

async function loadAllReferralData() {
  const { data: rewardsData } = await supabase
    .from('provider_referral_rewards')
    .select(`*, referrer:providers!referrer_provider_id(business_name, profiles(first_name, last_name)), referred:providers!referred_provider_id(business_name)`)
    .order('created_at', { ascending: false });

  const { data: referralsData } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_type', 'provider')
    .order('created_at', { ascending: false });

  let enrichedReferrals: any[] = [];
  if (referralsData && referralsData.length > 0) {
    const userIds = [...new Set([
      ...referralsData.map((r: any) => r.referrer_id).filter(Boolean),
      ...referralsData.map((r: any) => r.referred_id).filter(Boolean),
    ])];
    const { data: provs } = await supabase
      .from('providers')
      .select('user_id, business_name, profiles(first_name, last_name)')
      .in('user_id', userIds);
    const provMap: Record<string, any> = {};
    (provs || []).forEach((p: any) => { provMap[p.user_id] = p; });
    enrichedReferrals = referralsData.map((r: any) => ({
      ...r,
      referrer: provMap[r.referrer_id] || null,
      referred: provMap[r.referred_id] || null,
    }));
  }

  const { data: ambassadorsData } = await supabase
    .from('providers')
    .select('*, profiles(*)')
    .eq('is_super_ambassador', true)
    .order('ambassador_badge_earned_at', { ascending: false });

  const { data: performanceData } = await supabase
    .from('provider_rewards')
    .select(`*, provider:providers!provider_id(business_name, profiles(first_name, last_name))`)
    .order('earned_date', { ascending: false });

  return {
    rewards: (rewardsData || []) as any[],
    referrals: enrichedReferrals,
    ambassadors: (ambassadorsData || []) as any[],
    performanceRewards: (performanceData || []) as any[],
  };
}

function computeStats(rewards: any[], referrals: any[], ambassadors: any[], perf: any[]): ReferralStats {
  const pending     = rewards.filter(r => r.status === 'pending');
  const paid        = rewards.filter(r => r.status === 'paid');
  const pendingPerf = perf.filter(r => r.status === 'pending');
  const paidPerf    = perf.filter(r => r.status === 'paid');
  return {
    totalReferrals: referrals.length,
    activeReferrals: referrals.filter(r => r.status === 'completed').length,
    pendingRewards: pending.length,
    pendingAmount: pending.reduce((s, r) => s + Number(r.amount), 0),
    paidAmount: paid.reduce((s, r) => s + Number(r.amount), 0),
    totalAmbassadors: ambassadors.length,
    validatedReferrals: referrals.filter(r => r.first_reward_paid).length,
    loyaltyReferrals: referrals.filter(r => r.loyalty_bonus_paid).length,
    pendingPerformanceRewards: pendingPerf.length,
    pendingPerformanceAmount: pendingPerf.reduce((s, r) => s + Number(r.amount), 0),
    paidPerformanceAmount: paidPerf.reduce((s, r) => s + Number(r.amount), 0),
    bronzeCount: perf.filter(r => r.reward_tier === 'bronze').length,
    silverCount: perf.filter(r => r.reward_tier === 'silver').length,
    goldCount: perf.filter(r => r.reward_tier === 'gold').length,
  };
}

const AdminReferralManagement = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [searchTerm, setSearchTerm]           = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [rewardTypeFilter, setRewardTypeFilter] = useState('all');

  const [perfSearchTerm, setPerfSearchTerm]   = useState('');
  const [perfStatusFilter, setPerfStatusFilter] = useState('all');
  const [perfTierFilter, setPerfTierFilter]   = useState('all');
  const [perfYearFilter, setPerfYearFilter]   = useState('all');

  const [showCalculateConfirm, setShowCalculateConfirm] = useState(false);
  const [calculating, setCalculating]         = useState(false);
  const [eligibleProviders, setEligibleProviders] = useState<EligibleProvider[]>([]);

  const [selectedReward, setSelectedReward]   = useState<ReferralReward | null>(null);
  const [showPayDialog, setShowPayDialog]     = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data, isLoading: loading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: loadAllReferralData,
  });

  const rewards           = data?.rewards           || [];
  const referrals         = data?.referrals         || [];
  const ambassadors       = data?.ambassadors       || [];
  const performanceRewards = data?.performanceRewards || [];

  const stats = useMemo(
    () => computeStats(rewards, referrals, ambassadors, performanceRewards),
    [rewards, referrals, ambassadors, performanceRewards]
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

  const markRewardAsPaid = async (rewardId: string) => {
    try {
      const { error } = await supabase
        .from('provider_referral_rewards')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', rewardId);
      if (error) throw error;
      toast({ title: 'Récompense payée', description: 'La récompense a été marquée comme payée' });
      invalidate();
      setShowPayDialog(false);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de marquer la récompense comme payée', variant: 'destructive' });
    }
  };

  const rejectReward = async (rewardId: string) => {
    try {
      const { error } = await supabase.from('provider_referral_rewards').update({ status: 'rejected' }).eq('id', rewardId);
      if (error) throw error;
      toast({ title: 'Récompense rejetée', description: 'La récompense a été rejetée' });
      invalidate();
      setShowRejectDialog(false);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de rejeter la récompense', variant: 'destructive' });
    }
  };

  const bulkPayRewards = async () => {
    try {
      const pendingList = rewards.filter(r => r.status === 'pending');
      const { error } = await supabase
        .from('provider_referral_rewards')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .in('id', pendingList.map(r => r.id));
      if (error) throw error;
      toast({ title: 'Paiement en masse effectué', description: `${pendingList.length} récompenses ont été payées` });
      invalidate();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de payer les récompenses en masse', variant: 'destructive' });
    }
  };

  const removeAmbassadorBadge = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ is_super_ambassador: false, ambassador_badge_earned_at: null })
        .eq('id', providerId);
      if (error) throw error;
      toast({ title: 'Badge retiré', description: 'Le badge Super Ambassadeur a été retiré' });
      invalidate();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de retirer le badge', variant: 'destructive' });
    }
  };

  const exportToCSV = () => {
    const csvData = rewards.map(r => ({
      'Date': format(new Date(r.created_at), 'dd/MM/yyyy', { locale: fr }),
      'Parrain': r.referrer?.business_name || 'N/A',
      'Filleul': r.referred?.business_name || 'N/A',
      'Type': getRewardTypeLabel(r.reward_type),
      'Montant': `${r.amount}€`,
      'Statut': r.status === 'paid' ? 'Payé' : r.status === 'pending' ? 'En attente' : 'Rejeté',
      'Date paiement': r.paid_at ? format(new Date(r.paid_at), 'dd/MM/yyyy', { locale: fr }) : 'N/A',
    }));
    if (!csvData.length) return;
    const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cooptation-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast({ title: 'Export réussi', description: 'Le fichier CSV a été téléchargé' });
  };

  const recalculateRewards = async () => {
    try {
      const { data: result, error } = await supabase.rpc('recalculate_referral_rewards');
      if (error) throw error;
      const total = (result as any[])?.reduce((s: number, r: any) => s + (r.rewards_created || 0), 0) || 0;
      toast({ title: 'Recalcul terminé', description: `${total} nouvelles récompenses générées` });
      invalidate();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de recalculer les récompenses', variant: 'destructive' });
    }
  };

  const calculatePerformanceRewards = async () => {
    try {
      setCalculating(true);
      const { data: result, error } = await supabase.rpc('calculate_all_provider_rewards');
      if (error) throw error;
      setEligibleProviders(result || []);
      setShowCalculateConfirm(true);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de calculer les récompenses performance', variant: 'destructive' });
    } finally {
      setCalculating(false);
    }
  };

  const confirmCalculateRewards = async () => {
    try {
      setCalculating(true);
      const newRewards = eligibleProviders.filter(p => p.reward_created);
      const n = newRewards.length;
      toast({ title: 'Récompenses créées', description: `${n} nouvelle${n > 1 ? 's' : ''} récompense${n > 1 ? 's' : ''} créée${n > 1 ? 's' : ''}` });
      await invalidate();
      setShowCalculateConfirm(false);
      setEligibleProviders([]);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de confirmer les récompenses', variant: 'destructive' });
    } finally {
      setCalculating(false);
    }
  };

  const markPerformanceRewardAsPaid = async (rewardId: string) => {
    try {
      const { error } = await supabase.from('provider_rewards').update({ status: 'paid', paid_date: new Date().toISOString() }).eq('id', rewardId);
      if (error) throw error;
      toast({ title: 'Récompense payée', description: 'La récompense de performance a été marquée comme payée' });
      invalidate();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de marquer la récompense comme payée', variant: 'destructive' });
    }
  };

  const savePerformanceRewardNotes = async (rewardId: string, notes: string) => {
    try {
      const { error } = await supabase.from('provider_rewards').update({ notes }).eq('id', rewardId);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Note enregistrée' });
      invalidate();
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer la note", variant: 'destructive' });
    }
  };

  const getFilteredPerformanceRewards = () =>
    performanceRewards.filter(reward => {
      const matchesSearch = !perfSearchTerm ||
        reward.provider?.business_name?.toLowerCase().includes(perfSearchTerm.toLowerCase()) ||
        reward.provider?.profiles?.first_name?.toLowerCase().includes(perfSearchTerm.toLowerCase()) ||
        reward.provider?.profiles?.last_name?.toLowerCase().includes(perfSearchTerm.toLowerCase());
      return matchesSearch &&
        (perfStatusFilter === 'all' || reward.status === perfStatusFilter) &&
        (perfTierFilter   === 'all' || reward.reward_tier === perfTierFilter) &&
        (perfYearFilter   === 'all' || reward.year.toString() === perfYearFilter);
    });

  const exportPerformanceRewards = async () => {
    const filtered = getFilteredPerformanceRewards();
    await exportPerformanceRewardsToExcel(filtered);
    const n = filtered.length;
    toast({ title: 'Export réussi', description: `${n} récompense${n > 1 ? 's' : ''} exportée${n > 1 ? 's' : ''}` });
  };

  const availableYears = Array.from(new Set(performanceRewards.map(r => r.year))).sort((a, b) => b - a);

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = searchTerm === '' ||
      reward.referrer?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.referred?.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch &&
      (statusFilter     === 'all' || reward.status       === statusFilter) &&
      (rewardTypeFilter === 'all' || reward.reward_type  === rewardTypeFilter);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestion de la Cooptation</h2>
          <p className="text-muted-foreground mt-1">Gérez les parrainages et récompenses</p>
        </div>
        <Button onClick={exportToCSV} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>
      </div>

      {stats.totalReferrals > 0 && rewards.length === 0 && (
        <Card className="border-info/20 bg-info/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-info" />
              <div>
                <p className="font-medium text-info">Système de récompenses en attente</p>
                <p className="text-sm text-muted-foreground">
                  {stats.totalReferrals} parrainages détectés mais aucune récompense générée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
          <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2"><Users className="h-4 w-4" />Parrainages</TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Euro className="h-4 w-4" />Récompenses
            {stats.pendingRewards > 0 && <Badge variant="destructive" className="ml-2">{stats.pendingRewards}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Award className="h-4 w-4" />Performance
            {stats.pendingPerformanceRewards > 0 && <Badge variant="destructive" className="ml-2">{stats.pendingPerformanceRewards}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ambassadors" className="gap-2"><Star className="h-4 w-4" />Ambassadeurs</TabsTrigger>
          <TabsTrigger value="tools" className="gap-2"><TrendingUp className="h-4 w-4" />Outils</TabsTrigger>
        </TabsList>

        <DashboardTab stats={stats} rewards={rewards} />
        <ReferralsTab referrals={referrals} totalReferrals={stats.totalReferrals} />
        <RewardsTab
          filteredRewards={filteredRewards} stats={stats}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          rewardTypeFilter={rewardTypeFilter} setRewardTypeFilter={setRewardTypeFilter}
          bulkPayRewards={bulkPayRewards}
          setSelectedReward={setSelectedReward} setShowPayDialog={setShowPayDialog} setShowRejectDialog={setShowRejectDialog}
        />
        <PerformanceTab
          stats={stats} performanceRewards={performanceRewards} eligibleProviders={eligibleProviders}
          perfSearchTerm={perfSearchTerm} setPerfSearchTerm={setPerfSearchTerm}
          perfStatusFilter={perfStatusFilter} setPerfStatusFilter={setPerfStatusFilter}
          perfTierFilter={perfTierFilter} setPerfTierFilter={setPerfTierFilter}
          perfYearFilter={perfYearFilter} setPerfYearFilter={setPerfYearFilter}
          availableYears={availableYears}
          calculatePerformanceRewards={calculatePerformanceRewards} calculating={calculating}
          showCalculateConfirm={showCalculateConfirm} setShowCalculateConfirm={setShowCalculateConfirm}
          confirmCalculateRewards={confirmCalculateRewards}
          markPerformanceRewardAsPaid={markPerformanceRewardAsPaid}
          savePerformanceRewardNotes={savePerformanceRewardNotes}
          exportPerformanceRewards={exportPerformanceRewards}
          getFilteredPerformanceRewards={getFilteredPerformanceRewards}
        />
        <AmbassadorsTab ambassadors={ambassadors} totalAmbassadors={stats.totalAmbassadors} removeAmbassadorBadge={removeAmbassadorBadge} />
        <ToolsTab stats={stats} exportToCSV={exportToCSV} recalculateRewards={recalculateRewards} />
      </Tabs>

      <RewardDialogs
        showPayDialog={showPayDialog} setShowPayDialog={setShowPayDialog}
        showRejectDialog={showRejectDialog} setShowRejectDialog={setShowRejectDialog}
        selectedReward={selectedReward} markRewardAsPaid={markRewardAsPaid} rejectReward={rejectReward}
      />
    </div>
  );
};

export default AdminReferralManagement;
