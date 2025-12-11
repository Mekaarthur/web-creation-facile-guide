import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ChevronRight, ChevronLeft, Home, Calendar, CreditCard, MessageCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: "Bienvenue sur Bikawo ! 👋",
    description: "Votre assistant personnel au quotidien. Découvrez comment réserver facilement vos services à domicile.",
    icon: <Home className="w-8 h-8" />,
  },
  {
    id: 2,
    title: "Choisissez votre service",
    description: "Ménage, garde d'enfants, aide aux seniors... Explorez nos services et sélectionnez celui qui vous convient.",
    icon: <Star className="w-8 h-8" />,
    highlight: "services",
  },
  {
    id: 3,
    title: "Réservez en quelques clics",
    description: "Sélectionnez la date, l'heure et la durée. Ajoutez vos préférences et validez votre réservation.",
    icon: <Calendar className="w-8 h-8" />,
  },
  {
    id: 4,
    title: "50% de crédit d'impôt",
    description: "Bénéficiez de l'avance immédiate URSSAF. Payez seulement la moitié du prix affiché !",
    icon: <CreditCard className="w-8 h-8" />,
  },
  {
    id: 5,
    title: "Communiquez facilement",
    description: "Échangez avec votre prestataire via notre messagerie intégrée avant et pendant la mission.",
    icon: <MessageCircle className="w-8 h-8" />,
  },
];

export const ClientOnboarding = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('bikawo_onboarding_completed');
    const visitCount = parseInt(localStorage.getItem('bikawo_visit_count') || '0', 10);
    
    // Show onboarding on first visit or if not completed
    if (!hasCompletedOnboarding && visitCount <= 1) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('bikawo_onboarding_completed', 'true');
    setIsVisible(false);
  };

  const handleSkip = () => {
    localStorage.setItem('bikawo_onboarding_completed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="relative w-full max-w-md overflow-hidden border-primary/20 shadow-2xl">
        {/* Header gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 rounded-full hover:bg-background/50"
          onClick={handleSkip}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Progress bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {currentStep + 1} / {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className={cn(
          "px-6 py-8 text-center transition-all duration-200",
          isAnimating && "opacity-0 translate-x-4"
        )}>
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
            {step.icon}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentStep 
                  ? "w-6 bg-primary" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </Button>

          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Passer
          </Button>

          <Button
            onClick={handleNext}
            className="gap-1"
          >
            {currentStep === steps.length - 1 ? "Commencer" : "Suivant"}
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ClientOnboarding;
