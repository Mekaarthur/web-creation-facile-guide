import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, TrendingUp, Share2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import referralProgramImage from "@/assets/referral-program.jpg";

const ReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      // Déterminer le type d'utilisateur (client ou prestataire)
      const { data: providerData } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const userType = providerData ? 'provider' : 'client';

      // Charger le code de parrainage principal
      const { data: referralData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .eq('referrer_type', userType)
        .is('referred_id', null) // Code principal sans référé spécifique
        .maybeSingle();

      if (referralData) {
        setReferralCode(referralData.referral_code);
      } else {
        // Générer un nouveau code
        const { data: newCode } = await supabase.rpc('generate_referral_code');
        if (newCode) {
          const { error } = await supabase
            .from('referrals')
            .insert({
              referrer_id: user.id,
              referral_code: newCode,
              referrer_type: userType,
              reward_amount: userType === 'provider' ? 30.00 : 20.00
            });
          
          if (!error) {
            setReferralCode(newCode);
          }
        }
      }

      // Charger tous les parrainages (y compris ceux avec referred_id)
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .eq('referrer_type', userType);

      if (referralsData) {
        setReferrals(referralsData);
        setTotalEarnings(referralsData
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + (r.reward_amount || 0), 0)
        );
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de parrainage:', error);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Code copié",
        description: "Votre code de parrainage a été copié dans le presse-papiers",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code",
        variant: "destructive",
      });
    }
  };

  const shareReferralCode = async () => {
    const shareData = {
      title: 'Rejoignez notre plateforme de services',
      text: `Utilisez mon code de parrainage ${referralCode} et recevez des avantages spéciaux !`,
      url: `${window.location.origin}?ref=${referralCode}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyReferralCode();
      }
    } else {
      copyReferralCode();
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Gift className="w-4 h-4" />
            <span>Programme de parrainage</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Parrainez et 
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              Gagnez ensemble
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Parrainez vos proches et offrez-leur des services de qualité tout en gagnant des avantages exclusifs
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 items-center mb-16">
          <div className="space-y-8">
            {/* Code de parrainage */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Votre code de parrainage
                </CardTitle>
                <CardDescription>
                  Partagez ce code unique avec vos contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input 
                    value={referralCode} 
                    readOnly 
                    className="font-mono font-bold text-lg bg-background text-center"
                  />
                  <Button 
                    size="sm"
                    onClick={copyReferralCode}
                    className="min-w-[80px]"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copié" : "Copier"}
                  </Button>
                </div>
                <Button 
                  onClick={shareReferralCode} 
                  className="w-full"
                  variant="outline"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager le code
                </Button>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{referrals.length}</p>
                  <p className="text-sm text-muted-foreground">Parrainages</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{totalEarnings}€</p>
                  <p className="text-sm text-muted-foreground">Gains totaux</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Gift className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">2h</p>
                  <p className="text-sm text-muted-foreground">Service offert</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="relative">
            <img 
              src={referralProgramImage} 
              alt="Programme de parrainage" 
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl" />
          </div>
        </div>

        {/* Comment ça marche */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-center">Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  1
                </div>
                <h3 className="text-xl font-semibold">Partagez votre code</h3>
                <p className="text-muted-foreground">
                  Envoyez votre code de parrainage unique à vos contacts via les réseaux sociaux ou par message
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  2
                </div>
                <h3 className="text-xl font-semibold">Ils s'inscrivent</h3>
                <p className="text-muted-foreground">
                  Vos contacts utilisent votre code lors de leur inscription sur notre plateforme
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  3
                </div>
                <h3 className="text-xl font-semibold">Vous recevez votre récompense</h3>
                <p className="text-muted-foreground">
                  Gagnez <strong>2 heures d'un service de votre choix</strong> lorsque votre filleul a validé <strong>10 heures de service</strong> chez nous
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historique des parrainages */}
        {referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vos parrainages</CardTitle>
              <CardDescription>
                Suivez le statut de vos parrainages et vos gains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {referral.referred_user_email ? `Filleul: ${referral.referred_user_email}` : `Code: ${referral.referral_code}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Créé le {new Date(referral.created_at).toLocaleDateString()}
                        {referral.missions_completed > 0 && (
                          <span> • {referral.missions_completed} mission(s)</span>
                        )}
                        {referral.first_mission_duration > 0 && (
                          <span> • {referral.first_mission_duration.toFixed(1)}h</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={
                        referral.status === 'completed' ? 'default' :
                        referral.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {referral.status === 'completed' ? 'Complété' :
                         referral.status === 'pending' ? 'En attente' :
                         'Expiré'}
                      </Badge>
                      {referral.status === 'completed' && (
                        <p className="text-sm font-semibold text-green-600">
                          +{referral.reward_amount}€
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default ReferralProgram;