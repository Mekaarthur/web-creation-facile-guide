import { useEffect, useState } from 'react';
import { useTutorial, TutorialStep } from '@/hooks/useTutorial';
import { TutorialOverlay } from './TutorialOverlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, X, HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const HOME_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    target: 'nav',
    title: 'Bienvenue sur Bikawo !',
    content: 'Découvrez comment réserver facilement des services d\'assistance familiale. Ce guide rapide vous montrera les fonctionnalités principales.',
    position: 'bottom',
  },
  {
    id: 'services',
    target: '[data-tutorial="services"]',
    title: 'Explorez nos services',
    content: 'Parcourez notre gamme complète de services : garde d\'enfants, ménage, aide aux seniors, garde d\'animaux et bien plus.',
    position: 'bottom',
  },
  {
    id: 'search',
    target: '[data-tutorial="search"]',
    title: 'Recherche rapide',
    content: 'Utilisez la recherche (⌘K) pour trouver rapidement un service ou une page. Tapez quelques lettres et les résultats apparaissent instantanément.',
    position: 'bottom',
  },
  {
    id: 'cart',
    target: '[data-tutorial="cart"]',
    title: 'Votre panier',
    content: 'Ajoutez des services à votre panier et finalisez votre réservation en quelques clics. Profitez de 50% d\'avance immédiate sur vos impôts !',
    position: 'left',
  },
];

export const HomeTutorial = () => {
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  
  const {
    isActive,
    hasSeenTutorial,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
  } = useTutorial('home', HOME_TUTORIAL_STEPS);

  // Check if it's a first-time visitor on homepage - wait for cookie consent
  useEffect(() => {
    if (location.pathname === '/' && !hasSeenTutorial) {
      // Check if cookie consent has been given
      const cookieConsent = localStorage.getItem("cookie_consent");
      
      if (cookieConsent) {
        // Cookie consent already given, show after short delay
        const timer = setTimeout(() => {
          setShowWelcome(true);
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        // Listen for cookie consent event
        const handleCookieConsent = () => {
          setTimeout(() => setShowWelcome(true), 1000);
        };
        window.addEventListener('cookieConsentUpdated', handleCookieConsent);
        return () => window.removeEventListener('cookieConsentUpdated', handleCookieConsent);
      }
    }
  }, [location.pathname, hasSeenTutorial]);

  // Hide welcome when tutorial starts
  useEffect(() => {
    if (isActive) {
      setShowWelcome(false);
    }
  }, [isActive]);

  // Welcome modal for first-time visitors
  if (showWelcome && !isActive) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <Card className="w-80 shadow-xl border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img 
                  src="/pwa-icon-192.png" 
                  alt="Bikawo Logo" 
                  className="w-12 h-12 rounded-xl shadow-sm"
                />
                <div>
                  <h3 className="font-semibold text-foreground">
                    Première visite ?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Découvrez Bikawo en 30 secondes
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWelcome(false);
                  skipTutorial();
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Laissez-nous vous guider à travers les fonctionnalités principales de notre plateforme.
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowWelcome(false);
                  skipTutorial();
                }}
              >
                Plus tard
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowWelcome(false);
                  startTutorial();
                }}
              >
                Commencer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tutorial overlay
  if (isActive && currentStep) {
    return (
      <TutorialOverlay
        step={currentStep}
        stepIndex={currentStepIndex}
        totalSteps={totalSteps}
        progress={progress}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTutorial}
      />
    );
  }

  return null;
};

// Floating help button to restart tutorial
export const TutorialHelpButton = () => {
  const { hasSeenTutorial, startTutorial, resetTutorial } = useTutorial('home', HOME_TUTORIAL_STEPS);
  const [isHovered, setIsHovered] = useState(false);

  if (!hasSeenTutorial) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          resetTutorial();
          startTutorial();
        }}
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
      
      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 whitespace-nowrap bg-foreground text-background text-xs px-2 py-1 rounded animate-fade-in">
          Revoir le tutoriel
        </div>
      )}
    </div>
  );
};
