import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const LS_KEY = 'bikawo_last_activity';

// R-AO-06: 8h pour AO, R-SC-06: 4h pour SC (passé en paramètre)
export function useInactivityTimeout(enabled: boolean, timeoutMs = 8 * 60 * 60 * 1000) {
  const { signOut } = useAuth();

  useEffect(() => {
    if (!enabled) return;

    const touch = () => localStorage.setItem(LS_KEY, Date.now().toString());
    const check = () => {
      const last = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
      if (Date.now() - last > timeoutMs) {
        localStorage.removeItem(LS_KEY);
        signOut();
      }
    };

    touch();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach(e => document.addEventListener(e, touch, { passive: true }));

    const timer = setInterval(check, 60_000);

    return () => {
      events.forEach(e => document.removeEventListener(e, touch));
      clearInterval(timer);
    };
  }, [enabled, signOut, timeoutMs]);
}
