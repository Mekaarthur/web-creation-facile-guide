import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SuperAdminCompliance {
  r_sa_01: boolean;
  r_sa_02: boolean;
  r_sa_03: boolean;
  r_sa_04: boolean;
  r_sa_05: boolean;
  r_sa_06: boolean;
}

export interface SuperAdminStatus {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  promotedAt: string;
  mfaEnrolled: boolean;
  lastReviewAt: string | null;
  daysSinceReview: number | null;
  lastPwChangeAt: string | null;
  daysSincePwChange: number | null;
  compliance: SuperAdminCompliance;
}

export function useSuperAdmin() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-super-admin', {
        body: { action: 'get_status' },
      });
      if (error) throw error;
      return data as { superAdmin: SuperAdminStatus | null };
    },
  });

  const superAdmin = data?.superAdmin ?? null;
  const isCurrentUserSuperAdmin = !!currentUserId && superAdmin?.userId === currentUserId;

  const invoke = async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('admin-super-admin', {
      body: { action, ...extra },
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error ?? 'Erreur inconnue');
    qc.invalidateQueries({ queryKey: ['super-admin-status'] });
  };

  const markReview = useMutation({
    mutationFn: () => invoke('update_review'),
    onSuccess: () => toast({ title: 'Révision mensuelle enregistrée ✓' }),
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const markPwChange = useMutation({
    mutationFn: () => invoke('update_pw_change'),
    onSuccess: () => toast({ title: 'Changement de mot de passe enregistré ✓' }),
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const promote = useMutation({
    mutationFn: (targetEmail: string) => invoke('promote', { targetEmail }),
    onSuccess: () => toast({ title: 'Super Admin désigné avec succès' }),
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return { superAdmin, isLoading, isCurrentUserSuperAdmin, markReview, markPwChange, promote };
}
