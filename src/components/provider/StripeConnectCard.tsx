import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, CheckCircle, Loader2, ExternalLink, CalendarClock } from "lucide-react";
import { toast } from "sonner";

interface StripeStatus {
  connected: boolean;
  onboarding_complete: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}

export const StripeConnectCard = () => {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [payoutFrequency, setPayoutFrequency] = useState<string>("weekly");
  const [savingFrequency, setSavingFrequency] = useState(false);

  useEffect(() => {
    checkStatus();
    loadPayoutFrequency();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "success") {
      checkStatus();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const loadPayoutFrequency = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("providers")
      .select("payout_frequency")
      .eq("user_id", user.id)
      .single();

    if (data?.payout_frequency) {
      setPayoutFrequency(data.payout_frequency);
    }
  };

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
        body: { action: "check_status" },
      });
      if (error) throw error;
      setStatus(data);
    } catch (error: any) {
      console.error("Error checking Stripe status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
        body: { action: "create_account" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion Stripe");
      setConnecting(false);
    }
  };

  const handleFrequencyChange = async (value: string) => {
    setSavingFrequency(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("providers")
        .update({ payout_frequency: value })
        .eq("user_id", user.id);

      if (error) throw error;

      setPayoutFrequency(value);
      toast.success(value === "weekly" 
        ? "Fréquence de paiement : hebdomadaire" 
        : "Fréquence de paiement : mensuelle"
      );
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSavingFrequency(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stripe Connect Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Compte de paiement - Stripe Connect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {status?.onboarding_complete ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Compte connecté</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Vos paiements seront automatiquement versés sur votre compte bancaire.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default">
                  {status.payouts_enabled ? "Virements actifs" : "En cours d'activation"}
                </Badge>
              </div>
            </>
          ) : status?.connected ? (
            <>
              <p className="text-sm text-muted-foreground">
                Votre compte Stripe est créé mais l'inscription n'est pas terminée.
              </p>
              <Button onClick={handleConnect} disabled={connecting} size="sm">
                {connecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Finaliser l'inscription
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Connectez votre compte bancaire via Stripe pour recevoir vos paiements automatiquement après chaque mission.
              </p>
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Configurer mes paiements
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payout Frequency Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="w-5 h-5" />
            Fréquence de versement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choisissez la fréquence à laquelle vous souhaitez recevoir vos paiements.
          </p>
          <Select 
            value={payoutFrequency} 
            onValueChange={handleFrequencyChange}
            disabled={savingFrequency}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">
                <div className="flex flex-col">
                  <span>Hebdomadaire</span>
                  <span className="text-xs text-muted-foreground">Versement chaque semaine</span>
                </div>
              </SelectItem>
              <SelectItem value="monthly">
                <div className="flex flex-col">
                  <span>Mensuel</span>
                  <span className="text-xs text-muted-foreground">Versement en fin de mois</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {savingFrequency && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Enregistrement...
            </div>
          )}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {payoutFrequency === "weekly" 
              ? "📅 Vos gains sont versés chaque semaine (avec un délai de 2 à 5 jours pour la transmission)."
              : "📅 Vos gains sont cumulés et versés en fin de mois (avec un délai de 2 à 5 jours pour la transmission)."
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
