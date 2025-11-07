import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Copy, 
  Share2, 
  Award, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Euro,
  Star,
  Gift
} from 'lucide-react';

interface ReferralReward {
  id: string;
  referrer_id: string;
  referred_id: string;
  reward_type: 'validation' | 'loyalty' | 'super_ambassador';
  amount: number;
  status: 'pending' | 'paid';
  created_at: string;
  referred_provider?: {
    business_name: string;
  } | null;
}

interface Referral {
  id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  hours_completed: number;
  first_reward_paid: boolean;
  loyalty_bonus_paid: boolean;
  created_at: string;
}

const ProviderReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Get provider info
      const { data: providerData } = await supabase
        .from('providers')
        .select('*, profiles(*)')
        .eq('user_id', user?.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Get or create referral code
        const { data: existingReferral } = await supabase
          .from('referrals')
          .select('referral_code')
          .eq('referrer_id', providerData.id)
          .eq('referrer_type', 'provider')
          .single();

        if (existingReferral) {
          setReferralCode(existingReferral.referral_code);
        } else {
          // Generate new code
          const { data: newCode } = await supabase.rpc('generate_referral_code');
          if (newCode) {
            await supabase.from('referrals').insert({
              referrer_id: providerData.id,
              referrer_type: 'provider',
              referral_code: newCode,
              status: 'pending'
            });
            setReferralCode(newCode);
          }
        }

        // Get referrals list
        const { data: referralsData } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', providerData.id)
          .eq('referrer_type', 'provider')
          .order('created_at', { ascending: false });

        if (referralsData) {
          setReferrals(referralsData as Referral[]);
        }

        // Get rewards - disable type checking to avoid recursion issues
        try {
          // @ts-ignore - Supabase type recursion issue
          const rewardsResponse = await supabase
            .from('provider_referral_rewards')
            .select('*')
            .eq('referrer_id', providerData.id)
            .order('created_at', { ascending: false });

          if (rewardsResponse.data) {
            setRewards(rewardsResponse.data as any);
            const total = rewardsResponse.data
              .filter((r: any) => r.status === 'paid')
              .reduce((sum: number, r: any) => sum + Number(r.amount), 0);
            setTotalEarnings(total);
          }
        } catch (rewardError) {
          console.error('Error fetching rewards:', rewardError);
        }
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de cooptation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast({
        title: 'Code copié !',
        description: 'Le code de parrainage a été copié dans le presse-papier',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le code',
        variant: 'destructive',
      });
    }
  };

  const shareReferralCode = async () => {
    const shareData = {
      title: 'Rejoignez notre réseau de prestataires',
      text: `Utilisez mon code de parrainage ${referralCode} et bénéficiez d'avantages exclusifs !`,
      url: `${window.location.origin}?ref=${referralCode}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyReferralCode();
      }
    } catch (error) {
      await copyReferralCode();
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'validation':
        return 'Validation (50h)';
      case 'loyalty':
        return 'Fidélisation (120h)';
      case 'super_ambassador':
        return 'Super Ambassadeur';
      default:
        return type;
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'validation':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'loyalty':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'super_ambassador':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getReferralProgress = (referral: Referral) => {
    const hours = referral.hours_completed || 0;
    if (hours >= 120) return { percentage: 100, label: 'Fidélisation atteinte', color: 'bg-green-500' };
    if (hours >= 50) return { percentage: (hours / 120) * 100, label: 'Validation atteinte', color: 'bg-blue-500' };
    return { percentage: (hours / 50) * 100, label: `${hours.toFixed(1)}h / 50h`, color: 'bg-primary' };
  };

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

  const validatedReferrals = referrals.filter(r => r.hours_completed >= 50).length;
  const pendingRewards = rewards.filter(r => r.status === 'pending');
  const paidRewards = rewards.filter(r => r.status === 'paid');

  return (
    <div className="space-y-6">
      {/* Header avec badge Super Ambassadeur */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Programme de Cooptation
          </h2>
          <p className="text-muted-foreground mt-1">
            Parrainez des prestataires et gagnez jusqu'à 180€ par filleul
          </p>
        </div>
        {provider?.is_super_ambassador && (
          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 text-lg px-4 py-2">
            <Star className="h-5 w-5 mr-2 fill-white" />
            Super Ambassadeur
          </Badge>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filleuls actifs</p>
                <p className="text-3xl font-bold">{referrals.length}</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validés</p>
                <p className="text-3xl font-bold">{validatedReferrals}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gains totaux</p>
                <p className="text-3xl font-bold">{totalEarnings}€</p>
              </div>
              <Euro className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-3xl font-bold">{pendingRewards.reduce((sum, r) => sum + Number(r.amount), 0)}€</p>
              </div>
              <Clock className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code de parrainage - Section mise en évidence */}
      <Card className="border-2 border-primary shadow-xl bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl">Votre code de parrainage unique</CardTitle>
              <CardDescription className="text-base">Partagez ce code avec d'autres prestataires pour gagner des récompenses</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {referralCode ? (
            <>
              <div className="flex gap-3">
                <Input 
                  value={referralCode} 
                  readOnly 
                  className="text-3xl font-bold text-center tracking-wider bg-white border-2 border-primary/20"
                />
                <Button onClick={copyReferralCode} variant="outline" size="icon" className="h-auto">
                  <Copy className="h-5 w-5" />
                </Button>
                <Button onClick={shareReferralCode} size="icon" className="h-auto">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Cliquez sur <Copy className="h-4 w-4 inline" /> pour copier ou <Share2 className="h-4 w-4 inline" /> pour partager
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Génération de votre code en cours...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guide des récompenses */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Comment ça marche ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-blue-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Validation</h4>
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 mt-1">
                    30€
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Quand votre filleul complète <strong>50 heures</strong> de missions
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-purple-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Fidélisation</h4>
                  <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 mt-1">
                    50€
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Quand votre filleul atteint <strong>120 heures</strong> de missions
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-yellow-500/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                  <Star className="h-5 w-5 fill-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Super Ambassadeur</h4>
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 mt-1">
                    100€ + Badge
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Quand <strong>5 filleuls</strong> atteignent la validation dans l'année
              </p>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Limite :</strong> Maximum 5 récompenses de validation payées par an. Total possible par filleul : <strong>80€</strong> (30€ + 50€). Bonus Super Ambassadeur : <strong>100€ supplémentaires</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des filleuls */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Mes filleuls ({referrals.length})</CardTitle>
          <CardDescription>Suivez la progression de vos parrainages</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun filleul pour le moment</p>
              <p className="text-sm text-muted-foreground mt-2">
                Partagez votre code pour commencer à parrainer
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => {
                const progress = getReferralProgress(referral);
                return (
                  <div key={referral.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Filleul</p>
                          <p className="text-sm text-muted-foreground">
                            Inscrit le {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {referral.first_reward_paid && (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Validé
                          </Badge>
                        )}
                        {referral.loyalty_bonus_paid && (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Fidélisé
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{progress.label}</span>
                        <span className="font-medium">{progress.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`${progress.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des récompenses */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Historique des récompenses</CardTitle>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune récompense pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{getRewardTypeLabel(reward.reward_type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(reward.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">+{reward.amount}€</p>
                    <Badge 
                      className={reward.status === 'paid' 
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                      }
                    >
                      {reward.status === 'paid' ? 'Payé' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderReferralProgram;
