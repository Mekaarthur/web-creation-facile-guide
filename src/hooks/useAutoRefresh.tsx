import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAutoRefresh = (refreshCallback: () => void, intervalMs: number = 30000) => {
  const { toast } = useToast();

  const refresh = useCallback(() => {
    refreshCallback();
  }, [refreshCallback]);

  useEffect(() => {
    // Actualisation automatique
    const interval = setInterval(refresh, intervalMs);
    
    return () => {
      clearInterval(interval);
    };
  }, [refresh, intervalMs]);

  return { refresh };
};

export const useGlobalRefresh = () => {
  const { toast } = useToast();

  const refreshAll = useCallback(() => {
    // Émettre un événement global pour rafraîchir tous les composants
    window.dispatchEvent(new CustomEvent('admin-refresh-all'));
    
    toast({
      title: "Actualisation globale",
      description: "Toutes les données ont été actualisées",
    });
  }, [toast]);

  const listenForGlobalRefresh = useCallback((callback: () => void) => {
    const handleRefresh = () => callback();
    window.addEventListener('admin-refresh-all', handleRefresh);
    
    return () => {
      window.removeEventListener('admin-refresh-all', handleRefresh);
    };
  }, []);

  return { refreshAll, listenForGlobalRefresh };
};