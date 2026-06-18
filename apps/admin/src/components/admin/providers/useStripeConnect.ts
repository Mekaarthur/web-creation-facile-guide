import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useStripeConnect(providerId: string | null) {
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateLink = async () => {
    if (!providerId) return;
    setIsLoading(true);
    setStripeUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "stripe-connect-onboarding",
        { body: { action: "admin_create_link", provider_id: providerId } }
      );
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Erreur génération lien Stripe");
      setStripeUrl(data.data.url);
      toast({
        title: "Lien Stripe généré",
        description: "Copiez le lien et envoyez-le au prestataire. Il expire dans 24h.",
      });
    } catch (err: any) {
      toast({ title: "Erreur Stripe Connect", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyUrl = () => {
    if (!stripeUrl) return;
    navigator.clipboard.writeText(stripeUrl);
    toast({ title: "Copié !", description: "Lien copié dans le presse-papier." });
  };

  return { generateLink, copyUrl, stripeUrl, isLoading };
}
