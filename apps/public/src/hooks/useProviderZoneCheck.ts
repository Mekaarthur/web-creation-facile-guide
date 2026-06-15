import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ZoneCheckResult {
  count: number;
  available: boolean;
}

export function useProviderZoneCheck(postalCode: string) {
  return useQuery<ZoneCheckResult>({
    queryKey: ['provider-zone-check', postalCode],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('providers')
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', true)
        .contains('postal_codes', [postalCode]);
      if (error) throw error;
      const n = count ?? 0;
      return { count: n, available: n > 0 };
    },
    enabled: /^\d{5}$/.test(postalCode),
    staleTime: 5 * 60_000,
  });
}
