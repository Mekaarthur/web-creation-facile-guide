import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  message?: string;
}

export const useRateLimit = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkLimit = async (
    identifier: string,
    action: string,
    maxAttempts: number = 5,
    windowMinutes: number = 60
  ): Promise<RateLimitResult> => {
    setIsChecking(true);

    try {
      const { data, error } = await supabase.functions.invoke('rate-limit-check', {
        body: {
          identifier,
          action,
          maxAttempts,
          windowMinutes
        }
      });

      if (error) throw error;

      return data as RateLimitResult;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true };
    } finally {
      setIsChecking(false);
    }
  };

  return { checkLimit, isChecking };
};
