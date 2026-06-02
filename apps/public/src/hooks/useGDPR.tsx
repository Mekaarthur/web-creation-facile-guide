import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Consent {
  id: string;
  consent_type: string;
  granted: boolean;
  granted_at: string;
  withdrawn_at: string | null;
  version: string;
}

interface GDPRExport {
  id: string;
  export_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url: string | null;
  requested_at: string;
  completed_at: string | null;
  expires_at: string;
}

export const useConsents = () => {
  const queryClient = useQueryClient();

  const { data: consents, isLoading } = useQuery({
    queryKey: ['user-consents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .is('withdrawn_at', null)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      return data as Consent[];
    },
  });

  const recordConsent = useMutation({
    mutationFn: async ({ consentType, granted, version }: { consentType: string; granted: boolean; version: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('record_consent', {
        p_user_id: user.id,
        p_consent_type: consentType,
        p_granted: granted,
        p_version: version,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-consents'] });
      toast({
        title: "Consentement enregistré",
        description: "Votre choix a été enregistré",
      });
    },
  });

  return {
    consents: consents || [],
    isLoading,
    recordConsent,
  };
};

export const useGDPRExport = () => {
  const queryClient = useQueryClient();

  const { data: exports, isLoading } = useQuery({
    queryKey: ['gdpr-exports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gdpr_exports')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as GDPRExport[];
    },
  });

  const requestExport = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('request_gdpr_export', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-exports'] });
      toast({
        title: "Export demandé",
        description: "Votre export de données sera prêt dans quelques minutes. Vous recevrez un email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('get_user_data_for_export', {
      p_user_id: user.id,
    });

    if (error) throw error;
    return data;
  };

  return {
    exports: exports || [],
    isLoading,
    requestExport,
    getUserData,
  };
};
