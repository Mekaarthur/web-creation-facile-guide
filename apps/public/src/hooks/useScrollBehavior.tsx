import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll to top on route change
export const useScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
};

// Smooth scroll to element
export const useSmoothScrollTo = () => {
  const scrollTo = (elementId: string, offset: number = 80) => {
    const element = document.getElementById(elementId);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return scrollTo;
};

// Hook for scroll direction detection
export const useScrollDirection = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      
      // Add data attribute to body for CSS targeting
      document.body.dataset.scrollDirection = direction;
      document.body.dataset.scrolled = scrollY > 50 ? 'true' : 'false';
      
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);
};
