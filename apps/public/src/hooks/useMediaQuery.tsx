import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<Breakpoint, string> = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

export function useMediaQuery(query: string | Breakpoint): boolean {
  const mediaQuery = breakpoints[query as Breakpoint] || query;
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(mediaQuery).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(mediaQuery);
    
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [mediaQuery]);

  return matches;
}

// Convenience hooks
export const useIsMobile = () => !useMediaQuery('md');
export const useIsTablet = () => useMediaQuery('md') && !useMediaQuery('lg');
export const useIsDesktop = () => useMediaQuery('lg');
