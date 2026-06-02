import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useDeleteAccount = () => {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<{
    id: string;
    scheduledAt: Date;
  } | null>(null);

  const checkExistingRequest = async () => {
    const { data } = await supabase
      .from('account_deletion_requests')
      .select('id, scheduled_at')
      .eq('status', 'pending')
      .maybeSingle();

    if (data) {
      setPendingRequest({ id: data.id, scheduledAt: new Date(data.scheduled_at) });
    }
    return data;
  };

  const requestDeletion = async (reason?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_account_deletion', {
        p_reason: reason || null
      });
      if (error) throw error;
      await checkExistingRequest();
      return { success: true, requestId: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const cancelDeletion = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_account_deletion');
      if (error) throw error;
      if (data) setPendingRequest(null);
      return { success: !!data };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { loading, pendingRequest, checkExistingRequest, requestDeletion, cancelDeletion };
};
