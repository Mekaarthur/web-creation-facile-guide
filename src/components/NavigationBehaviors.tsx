import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollToTopOnNavigate, useScrollDirection } from '@/hooks/useScrollBehavior';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

// Component that handles all navigation-related behaviors
export const NavigationBehaviors = () => {
  useScrollToTopOnNavigate();
  useScrollDirection();

  return <ScrollToTop />;
};
