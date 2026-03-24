import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, CheckCircle, Loader2, ExternalLink } from "lucide-react";
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

  useEffect(() => {
    checkStatus();
  }, []);

  // Check on return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "success") {
      checkStatus();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion Stripe");
      setConnecting(false);
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Paiements - Stripe Connect
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
  );
};
