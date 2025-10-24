import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PerformanceRewardFilters from './PerformanceRewardFilters';
import PerformanceRewardNotes from './PerformanceRewardNotes';
import ConfirmCalculateRewards from './ConfirmCalculateRewards';
import { exportPerformanceRewardsToExcel } from '@/utils/exportPerformanceRewards';
import {
  Users,
  Euro,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Award,
  Download,
  Search,
  Filter,
  Calendar,
  Eye,
  Check,
  X,
  Edit,
  FileSpreadsheet,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReferralReward {
  id: string;
  referrer_id: string;
  referred_id: string;
  reward_type: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  referrer?: {
    business_name: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
  referred?: {
    business_name: string;
  };
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  hours_completed: number;
  first_reward_paid: boolean;
  loyalty_bonus_paid: boolean;
  created_at: string;
  referrer?: {
    business_name: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
  referred?: {
    business_name: string;
  };
}

interface SuperAmbassador {
  id: string;
  business_name: string;
  is_super_ambassador: boolean;
  ambassador_badge_earned_at: string;
  yearly_referrals_count: number;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface PerformanceReward {
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
  notes?: string;
  provider?: {
    business_name: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

interface EligibleProvider {
  provider_id: string;
  business_name: string;
  tier: string;
  amount: number;
  missions_count: number;
  hours_worked: number;
  average_rating: number;
  months_active: number;
  reward_created: boolean;
}

const AdminReferralManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [ambassadors, setAmbassadors] = useState<SuperAmbassador[]>([]);
  const [performanceRewards, setPerformanceRewards] = useState<PerformanceReward[]>([]);
  const [eligibleProviders, setEligibleProviders] = useState<EligibleProvider[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rewardTypeFilter, setRewardTypeFilter] = useState('all');
  
  // Performance reward filters
  const [perfSearchTerm, setPerfSearchTerm] = useState('');
  const [perfStatusFilter, setPerfStatusFilter] = useState('all');
  const [perfTierFilter, setPerfTierFilter] = useState('all');
  const [perfYearFilter, setPerfYearFilter] = useState('all');
  
  // Calculate rewards confirmation
  const [showCalculateConfirm, setShowCalculateConfirm] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingRewards: 0,
    pendingAmount: 0,
    paidAmount: 0,
    totalAmbassadors: 0,
    validatedReferrals: 0,
    loyaltyReferrals: 0,
    // Performance stats
    pendingPerformanceRewards: 0,
    pendingPerformanceAmount: 0,
    paidPerformanceAmount: 0,
    bronzeCount: 0,
    silverCount: 0,
    goldCount: 0
  });

  // Dialog states
  const [selectedReward, setSelectedReward] = useState<ReferralReward | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load rewards
      // @ts-ignore
      const { data: rewardsData } = await supabase
        .from('provider_referral_rewards')
        .select(`
          *,
          referrer:providers!provider_referral_rewards_referrer_id_fkey(
            business_name,
            profiles(first_name, last_name)
          ),
          referred:providers!provider_referral_rewards_referred_id_fkey(
            business_name
          )
        `)
        .order('created_at', { ascending: false });

      if (rewardsData) {
        setRewards(rewardsData as any);
      }

      // Load referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:providers!referrals_referrer_id_fkey(
            business_name,
            profiles(first_name, last_name)
          ),
          referred:providers!referrals_referred_id_fkey(
            business_name
          )
        `)
        .eq('referrer_type', 'provider')
        .order('created_at', { ascending: false });

      if (referralsData) {
        setReferrals(referralsData as any);
      }

      // Load super ambassadors
      const { data: ambassadorsData } = await supabase
        .from('providers')
        .select('*, profiles(*)')
        .eq('is_super_ambassador', true)
        .order('ambassador_badge_earned_at', { ascending: false });

      if (ambassadorsData) {
        setAmbassadors(ambassadorsData as any);
      }

      // Load performance rewards
      const { data: performanceData } = await supabase
        .from('provider_rewards')
        .select(`
          *,
          provider:providers!provider_rewards_provider_id_fkey(
            business_name,
            profiles(first_name, last_name)
          )
        `)
        .order('earned_date', { ascending: false });

      if (performanceData) {
        setPerformanceRewards(performanceData as any);
      }

      // Calculate stats
      calculateStats(rewardsData || [], referralsData || [], ambassadorsData || [], performanceData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (rewardsData: any[], referralsData: any[], ambassadorsData: any[], performanceData: any[]) => {
    const pending = rewardsData.filter(r => r.status === 'pending');
    const paid = rewardsData.filter(r => r.status === 'paid');
    
    const pendingPerformance = performanceData.filter(r => r.status === 'pending');
    const paidPerformance = performanceData.filter(r => r.status === 'paid');
    
    setStats({
      totalReferrals: referralsData.length,
      activeReferrals: referralsData.filter(r => r.status === 'completed').length,
      pendingRewards: pending.length,
      pendingAmount: pending.reduce((sum, r) => sum + Number(r.amount), 0),
      paidAmount: paid.reduce((sum, r) => sum + Number(r.amount), 0),
      totalAmbassadors: ambassadorsData.length,
      validatedReferrals: referralsData.filter(r => r.first_reward_paid).length,
      loyaltyReferrals: referralsData.filter(r => r.loyalty_bonus_paid).length,
      // Performance stats
      pendingPerformanceRewards: pendingPerformance.length,
      pendingPerformanceAmount: pendingPerformance.reduce((sum, r) => sum + Number(r.amount), 0),
      paidPerformanceAmount: paidPerformance.reduce((sum, r) => sum + Number(r.amount), 0),
      bronzeCount: performanceData.filter(r => r.reward_tier === 'bronze').length,
      silverCount: performanceData.filter(r => r.reward_tier === 'silver').length,
      goldCount: performanceData.filter(r => r.reward_tier === 'gold').length
    });
  };

  const markRewardAsPaid = async (rewardId: string) => {
    try {
      const { error } = await supabase
        .from('provider_referral_rewards')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', rewardId);

      if (error) throw error;

      toast({
        title: 'Récompense payée',
        description: 'La récompense a été marquée comme payée',
      });

      loadData();
      setShowPayDialog(false);
    } catch (error) {
      console.error('Error marking reward as paid:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer la récompense comme payée',
        variant: 'destructive',
      });
    }
  };

  const rejectReward = async (rewardId: string) => {
    try {
      const { error } = await supabase
        .from('provider_referral_rewards')
        .update({ status: 'rejected' })
        .eq('id', rewardId);

      if (error) throw error;

      toast({
        title: 'Récompense rejetée',
        description: 'La récompense a été rejetée',
      });

      loadData();
      setShowRejectDialog(false);
    } catch (error) {
      console.error('Error rejecting reward:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter la récompense',
        variant: 'destructive',
      });
    }
  };

  const bulkPayRewards = async () => {
    try {
      const pendingRewards = rewards.filter(r => r.status === 'pending');
      
      const { error } = await supabase
        .from('provider_referral_rewards')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .in('id', pendingRewards.map(r => r.id));

      if (error) throw error;

      toast({
        title: 'Paiement en masse effectué',
        description: `${pendingRewards.length} récompenses ont été payées`,
      });

      loadData();
    } catch (error) {
      console.error('Error bulk paying rewards:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de payer les récompenses en masse',
        variant: 'destructive',
      });
    }
  };

  const removeAmbassadorBadge = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ 
          is_super_ambassador: false,
          ambassador_badge_earned_at: null
        })
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: 'Badge retiré',
        description: 'Le badge Super Ambassadeur a été retiré',
      });

      loadData();
    } catch (error) {
      console.error('Error removing badge:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le badge',
        variant: 'destructive',
      });
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
      'Date paiement': r.paid_at ? format(new Date(r.paid_at), 'dd/MM/yyyy', { locale: fr }) : 'N/A'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cooptation-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({
      title: 'Export réussi',
      description: 'Le fichier CSV a été téléchargé',
    });
  };

  const recalculateRewards = async () => {
    try {
      const { data, error } = await supabase.rpc('recalculate_referral_rewards');

      if (error) throw error;

      const totalRewardsCreated = data?.reduce((sum: number, row: any) => sum + (row.rewards_created || 0), 0) || 0;

      toast({
        title: 'Recalcul terminé',
        description: `${totalRewardsCreated} nouvelles récompenses générées`,
      });

      loadData();
    } catch (error) {
      console.error('Error recalculating rewards:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de recalculer les récompenses',
        variant: 'destructive',
      });
    }
  };

  const calculatePerformanceRewards = async () => {
    try {
      setCalculating(true);
      const { data, error } = await supabase.rpc('calculate_all_provider_rewards');

      if (error) throw error;

      setEligibleProviders(data || []);
      setShowCalculateConfirm(true);
    } catch (error) {
      console.error('Error calculating performance rewards:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de calculer les récompenses performance',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };
  
  const confirmCalculateRewards = async () => {
    try {
      setCalculating(true);
      const newRewards = eligibleProviders.filter(p => p.reward_created);
      
      toast({
        title: 'Récompenses créées',
        description: `${newRewards.length} nouvelle${newRewards.length > 1 ? 's' : ''} récompense${newRewards.length > 1 ? 's' : ''} créée${newRewards.length > 1 ? 's' : ''}`,
      });
      
      await loadData();
      setShowCalculateConfirm(false);
      setEligibleProviders([]);
    } catch (error) {
      console.error('Error confirming rewards:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de confirmer les récompenses',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const markPerformanceRewardAsPaid = async (rewardId: string) => {
    try {
      const { error } = await supabase
        .from('provider_rewards')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString()
        })
        .eq('id', rewardId);

      if (error) throw error;

      toast({
        title: 'Récompense payée',
        description: 'La récompense de performance a été marquée comme payée',
      });

      loadData();
    } catch (error) {
      console.error('Error marking performance reward as paid:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer la récompense comme payée',
        variant: 'destructive',
      });
    }
  };
  
  const savePerformanceRewardNotes = async (rewardId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('provider_rewards')
        .update({ notes })
        .eq('id', rewardId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Note enregistrée',
      });

      await loadData();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la note',
        variant: 'destructive',
      });
    }
  };
  
  const getFilteredPerformanceRewards = () => {
    return performanceRewards.filter(reward => {
      const matchesSearch = !perfSearchTerm || 
        reward.provider?.business_name?.toLowerCase().includes(perfSearchTerm.toLowerCase()) ||
        reward.provider?.profiles?.first_name?.toLowerCase().includes(perfSearchTerm.toLowerCase()) ||
        reward.provider?.profiles?.last_name?.toLowerCase().includes(perfSearchTerm.toLowerCase());
      
      const matchesStatus = perfStatusFilter === 'all' || reward.status === perfStatusFilter;
      const matchesTier = perfTierFilter === 'all' || reward.reward_tier === perfTierFilter;
      const matchesYear = perfYearFilter === 'all' || reward.year.toString() === perfYearFilter;
      
      return matchesSearch && matchesStatus && matchesTier && matchesYear;
    });
  };
  
  const exportPerformanceRewards = () => {
    const filtered = getFilteredPerformanceRewards();
    exportPerformanceRewardsToExcel(filtered);
    toast({
      title: 'Export réussi',
      description: `${filtered.length} récompense${filtered.length > 1 ? 's' : ''} exportée${filtered.length > 1 ? 's' : ''}`,
    });
  };
  
  const availableYears = Array.from(new Set(performanceRewards.map(r => r.year))).sort((a, b) => b - a);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
      case 'silver': return 'bg-slate-400/10 text-slate-600 border-slate-400/20';
      case 'gold': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'bronze': return '🥉 Bronze - 50€';
      case 'silver': return '🥈 Silver - 100€';
      case 'gold': return '🥇 Gold - 150€';
      default: return tier;
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'validation': return 'Validation (50h)';
      case 'loyalty': return 'Fidélisation (120h)';
      case 'super_ambassador': return 'Super Ambassadeur';
      default: return type;
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'validation': return 'bg-info/10 text-info border-info/20';
      case 'loyalty': return 'bg-primary/10 text-primary border-primary/20';
      case 'super_ambassador': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = searchTerm === '' ||
      reward.referrer?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.referred?.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reward.status === statusFilter;
    const matchesType = rewardTypeFilter === 'all' || reward.reward_type === rewardTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestion de la Cooptation</h2>
          <p className="text-muted-foreground mt-1">
            Gérez les parrainages et récompenses
          </p>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* System Status Alert */}
      {stats.totalReferrals > 0 && rewards.length === 0 && (
        <Card className="border-info/20 bg-info/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-info" />
              <div>
                <p className="font-medium text-info">
                  Système de récompenses en attente
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.totalReferrals} parrainages détectés mais aucune récompense générée. 
                  Les récompenses sont créées automatiquement lorsque les filleuls atteignent 50h ou 120h de missions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2">
            <Users className="h-4 w-4" />
            Parrainages
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Euro className="h-4 w-4" />
            Récompenses
            {stats.pendingRewards > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingRewards}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Award className="h-4 w-4" />
            Performance
            {stats.pendingPerformanceRewards > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingPerformanceRewards}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ambassadors" className="gap-2">
            <Star className="h-4 w-4" />
            Ambassadeurs
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-2">
            <Award className="h-4 w-4" />
            Outils
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Parrainages</p>
                    <p className="text-3xl font-bold">{stats.totalReferrals}</p>
                  </div>
                  <Users className="h-10 w-10 text-primary opacity-20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.activeReferrals} actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-3xl font-bold">{stats.pendingAmount}€</p>
                  </div>
                  <Clock className="h-10 w-10 text-warning/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.pendingRewards} récompenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total versé</p>
                    <p className="text-3xl font-bold">{stats.paidAmount}€</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-success/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Récompenses payées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ambassadeurs</p>
                    <p className="text-3xl font-bold">{stats.totalAmbassadors}</p>
                  </div>
                  <Star className="h-10 w-10 text-warning/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Super Ambassadeurs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Performance en attente</p>
                    <p className="text-3xl font-bold">{stats.pendingPerformanceAmount}€</p>
                  </div>
                  <Award className="h-10 w-10 text-warning/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.pendingPerformanceRewards} récompenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Performance versée</p>
                    <p className="text-3xl font-bold">{stats.paidPerformanceAmount}€</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-success/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.bronzeCount + stats.silverCount + stats.goldCount} récompenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Répartition Tiers</p>
                    <p className="text-lg font-bold">🥉 {stats.bronzeCount} | 🥈 {stats.silverCount} | 🥇 {stats.goldCount}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-primary/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Bronze, Silver, Gold
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Taux de Conversion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Validation (50h)</span>
                    <span className="font-bold">
                      {stats.totalReferrals > 0 
                        ? Math.round((stats.validatedReferrals / stats.totalReferrals) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-info h-2 rounded-full"
                      style={{ 
                        width: `${stats.totalReferrals > 0 
                          ? (stats.validatedReferrals / stats.totalReferrals) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Fidélisation (120h)</span>
                    <span className="font-bold">
                      {stats.totalReferrals > 0 
                        ? Math.round((stats.loyaltyReferrals / stats.totalReferrals) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ 
                        width: `${stats.totalReferrals > 0 
                          ? (stats.loyaltyReferrals / stats.totalReferrals) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Récompenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: 'validation', label: 'Validation (30€)', color: 'bg-info' },
                    { type: 'loyalty', label: 'Fidélisation (50€)', color: 'bg-primary' },
                    { type: 'super_ambassador', label: 'Super Ambassadeur (100€)', color: 'bg-warning' }
                  ].map(({ type, label, color }) => {
                    const count = rewards.filter(r => r.reward_type === type).length;
                    const total = rewards.length;
                    const percentage = total > 0 ? (count / total) * 100 : 0;

                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">{label}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`${color} h-2 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Parrainages</CardTitle>
              <CardDescription>
                {stats.totalReferrals} parrainages au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun parrainage pour le moment</p>
                  </div>
                ) : (
                  referrals.map(referral => (
                    <div key={referral.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {referral.referrer?.profiles?.first_name} {referral.referrer?.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {referral.referrer?.business_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Code</p>
                          <p className="font-mono font-bold">{referral.referral_code}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Filleul</p>
                          <p className="font-medium">{referral.referred?.business_name || 'En attente'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Heures</p>
                          <p className="font-medium">{referral.hours_completed?.toFixed(1) || 0}h</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Statut</p>
                          <div className="flex gap-2">
                            {referral.first_reward_paid && (
                              <Badge className="bg-info/10 text-info border-info/20">
                                Validé
                              </Badge>
                            )}
                            {referral.loyalty_bonus_paid && (
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                Fidélisé
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progression</span>
                          <span>{Math.min((referral.hours_completed / 120) * 100, 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((referral.hours_completed / 120) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Créé le {format(new Date(referral.created_at), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un prestataire..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={rewardTypeFilter} onValueChange={setRewardTypeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="loyalty">Fidélisation</SelectItem>
                    <SelectItem value="super_ambassador">Super Ambassadeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pending Rewards Actions */}
          {stats.pendingRewards > 0 && (
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium">
                        {stats.pendingRewards} récompense{stats.pendingRewards > 1 ? 's' : ''} en attente
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total : {stats.pendingAmount}€
                      </p>
                    </div>
                  </div>
                  <Button onClick={bulkPayRewards} className="gap-2">
                    <Check className="h-4 w-4" />
                    Tout payer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rewards List */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Récompenses</CardTitle>
              <CardDescription>
                {filteredRewards.length} récompense{filteredRewards.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRewards.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune récompense trouvée</p>
                  </div>
                ) : (
                  filteredRewards.map(reward => (
                    <div key={reward.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Award className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">
                                {reward.referrer?.profiles?.first_name} {reward.referrer?.profiles?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {reward.referrer?.business_name}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Type</p>
                              <Badge className={getRewardTypeColor(reward.reward_type)}>
                                {getRewardTypeLabel(reward.reward_type)}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Montant</p>
                              <p className="font-bold text-success">{reward.amount}€</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p className="font-medium">
                                {format(new Date(reward.created_at), 'dd/MM/yyyy', { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(reward.status)}>
                            {reward.status === 'paid' ? 'Payé' : 
                             reward.status === 'pending' ? 'En attente' : 'Rejeté'}
                          </Badge>
                          {reward.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReward(reward);
                                  setShowPayDialog(true);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReward(reward);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">🥉 Bronze</p>
                    <p className="text-3xl font-bold">{stats.bronzeCount}</p>
                  </div>
                  <Award className="h-10 w-10 text-amber-600/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  50€ par récompense
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">🥈 Silver</p>
                    <p className="text-3xl font-bold">{stats.silverCount}</p>
                  </div>
                  <Award className="h-10 w-10 text-slate-400/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  100€ par récompense
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">🥇 Gold</p>
                    <p className="text-3xl font-bold">{stats.goldCount}</p>
                  </div>
                  <Award className="h-10 w-10 text-yellow-500/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  150€ par récompense
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-3xl font-bold">{stats.pendingPerformanceAmount}€</p>
                  </div>
                  <Clock className="h-10 w-10 text-warning/20" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.pendingPerformanceRewards} récompenses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <PerformanceRewardFilters
            searchTerm={perfSearchTerm}
            setSearchTerm={setPerfSearchTerm}
            statusFilter={perfStatusFilter}
            setStatusFilter={setPerfStatusFilter}
            tierFilter={perfTierFilter}
            setTierFilter={setPerfTierFilter}
            yearFilter={perfYearFilter}
            setYearFilter={setPerfYearFilter}
            onExport={exportPerformanceRewards}
            years={availableYears}
          />

          {/* Calculate Button */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Calculer les récompenses de performance</p>
                  <p className="text-sm text-muted-foreground">
                    Analyse tous les prestataires et génère les récompenses éligibles
                  </p>
                </div>
                <Button onClick={calculatePerformanceRewards} disabled={calculating} className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {calculating ? 'Calcul...' : 'Calculer'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <ConfirmCalculateRewards
            open={showCalculateConfirm}
            onOpenChange={setShowCalculateConfirm}
            eligibleProviders={eligibleProviders}
            onConfirm={confirmCalculateRewards}
            loading={calculating}
          />

          {/* Eligible Providers Table */}
          {eligibleProviders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prestataires Éligibles</CardTitle>
                <CardDescription>
                  {eligibleProviders.length} prestataire{eligibleProviders.length > 1 ? 's' : ''} analysé{eligibleProviders.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eligibleProviders.map(provider => (
                    <div key={provider.provider_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{provider.business_name}</p>
                          <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                            <div>
                              <p className="text-muted-foreground">Missions</p>
                              <p className="font-medium">{provider.missions_count}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Heures</p>
                              <p className="font-medium">{provider.hours_worked.toFixed(1)}h</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Note</p>
                              <p className="font-medium">{provider.average_rating.toFixed(1)}/5</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Ancienneté</p>
                              <p className="font-medium">{provider.months_active} mois</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {provider.tier !== 'none' ? (
                            <>
                              <Badge className={getTierColor(provider.tier)}>
                                {getTierLabel(provider.tier)}
                              </Badge>
                              {provider.reward_created && (
                                <Badge variant="default">✓ Créée</Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary">Non éligible</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Rewards List */}
          <Card>
            <CardHeader>
              <CardTitle>Récompenses de Performance</CardTitle>
              <CardDescription>
                {performanceRewards.length} récompense{performanceRewards.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceRewards.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune récompense de performance</p>
                  </div>
                ) : (
                  getFilteredPerformanceRewards().map(reward => (
                    <div key={reward.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Award className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">
                                {reward.provider?.profiles?.first_name} {reward.provider?.profiles?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {reward.provider?.business_name}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Tier</p>
                              <Badge className={getTierColor(reward.reward_tier)}>
                                {getTierLabel(reward.reward_tier)}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Montant</p>
                              <p className="font-bold text-success">{reward.amount}€</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Année</p>
                              <p className="font-medium">{reward.year}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Métriques</p>
                              <p className="font-medium text-xs">
                                {reward.missions_count} missions | {reward.hours_worked.toFixed(0)}h | ⭐ {reward.average_rating.toFixed(1)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(reward.status)}>
                            {reward.status === 'paid' ? 'Payé' : 
                             reward.status === 'pending' ? 'En attente' : 'Rejeté'}
                          </Badge>
                          <PerformanceRewardNotes
                            rewardId={reward.id}
                            currentNotes={reward.notes}
                            providerName={`${reward.provider?.profiles?.first_name} ${reward.provider?.profiles?.last_name}`}
                            onSave={savePerformanceRewardNotes}
                          />
                          {reward.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markPerformanceRewardAsPaid(reward.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ambassadors Tab */}
        <TabsContent value="ambassadors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Super Ambassadeurs
              </CardTitle>
              <CardDescription>
                {stats.totalAmbassadors} ambassadeur{stats.totalAmbassadors > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ambassadors.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun Super Ambassadeur pour le moment</p>
                  </div>
                ) : (
                  ambassadors.map(ambassador => (
                    <div key={ambassador.id} className="border rounded-lg p-4 bg-gradient-to-r from-warning/5 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center">
                            <Star className="h-6 w-6 text-warning-foreground fill-warning-foreground" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">
                              {ambassador.profiles?.first_name} {ambassador.profiles?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {ambassador.business_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Badge obtenu le {format(new Date(ambassador.ambassador_badge_earned_at), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-warning">
                            {ambassador.yearly_referrals_count}
                          </p>
                          <p className="text-sm text-muted-foreground">Filleuls validés</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => removeAmbassadorBadge(ambassador.id)}
                          >
                            Retirer le badge
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Comptable</CardTitle>
                <CardDescription>
                  Téléchargez les données pour la comptabilité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportToCSV} className="w-full gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Exporter en CSV
                </Button>
                <Button 
                  onClick={recalculateRewards} 
                  className="w-full gap-2"
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4" />
                  Recalculer les récompenses
                </Button>
                <p className="text-sm text-muted-foreground">
                  Export complet de toutes les récompenses avec dates, montants et statuts.
                  Le recalcul génère les récompenses manquantes en analysant l'historique.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques Globales</CardTitle>
                <CardDescription>
                  Vue d'ensemble du programme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taux de validation</span>
                    <span className="font-bold">
                      {stats.totalReferrals > 0 
                        ? Math.round((stats.validatedReferrals / stats.totalReferrals) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taux de fidélisation</span>
                    <span className="font-bold">
                      {stats.totalReferrals > 0 
                        ? Math.round((stats.loyaltyReferrals / stats.totalReferrals) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coût moyen par filleul</span>
                    <span className="font-bold">
                      {stats.activeReferrals > 0 
                        ? Math.round(stats.paidAmount / stats.activeReferrals)
                        : 0}€
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pay Dialog */}
      <AlertDialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous marquer cette récompense de {selectedReward?.amount}€ comme payée ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedReward && markRewardAsPaid(selectedReward.id)}>
              Confirmer le paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter la récompense</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment rejeter cette récompense de {selectedReward?.amount}€ ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedReward && rejectReward(selectedReward.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReferralManagement;
