import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook pour signaler l'absence d'un prestataire (no-show)
 * Utilisable côté client après 15 min de retard
 */
export const useNoShowReport = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reportNoShow = async (params: {
    bookingId: string;
    reportedBy: string;
    notes?: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("report-no-show", {
        body: params,
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Signalement impossible",
          description: data.message || data.error,
          variant: "destructive",
        });
        return { success: false };
      }

      toast({
        title: "Signalement enregistré",
        description: "Nous cherchons un prestataire de remplacement en urgence.",
      });

      return { success: true, data };
    } catch (error) {
      console.error("Erreur report no-show:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le signalement",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { loading, reportNoShow };
};
