import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const TIMEOUT_MS = 8 * 60 * 60 * 1000; // R-AO-06: 8h
const LS_KEY = 'bikawo_last_activity';

export function useInactivityTimeout(enabled: boolean) {
  const { signOut } = useAuth();

  useEffect(() => {
    if (!enabled) return;

    const touch = () => localStorage.setItem(LS_KEY, Date.now().toString());
    const check = () => {
      const last = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
      if (Date.now() - last > TIMEOUT_MS) {
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
  }, [enabled, signOut]);
}
