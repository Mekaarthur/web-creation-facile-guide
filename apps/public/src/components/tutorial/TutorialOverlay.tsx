import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { TutorialStep } from '@/hooks/useTutorial';

interface TutorialOverlayProps {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  progress: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const TutorialOverlay = ({
  step,
  stepIndex,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
}: TutorialOverlayProps) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.querySelector(step.target);
    if (!target) return;

    const updatePosition = () => {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      // Calculate tooltip position
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      const padding = 16;
      
      let top = 0;
      let left = 0;

      switch (step.position || 'bottom') {
        case 'top':
          top = rect.top - tooltipHeight - padding;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case 'left':
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.left - tooltipWidth - padding;
          break;
        case 'right':
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.right + padding;
          break;
      }

      // Keep tooltip in viewport
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

      setTooltipPosition({ top, left });
    };

    updatePosition();

    // Scroll target into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [step]);

  if (!targetRect) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop with spotlight */}
      <div className="absolute inset-0">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Highlight border around target */}
      <div
        className="absolute border-2 border-primary rounded-lg pointer-events-none animate-pulse"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />

      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        className="absolute w-80 shadow-2xl border-primary/20 animate-fade-in"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {step.title}
                </h3>
                <span className="text-xs text-muted-foreground">
                  Étape {stepIndex + 1} sur {totalSteps}
                </span>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Fermer le tutoriel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-muted-foreground mb-4">
            {step.content}
          </p>

          {/* Progress */}
          <Progress value={progress} className="h-1 mb-4" />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Passer le tutoriel
            </Button>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNext}
              >
                {stepIndex === totalSteps - 1 ? 'Terminer' : 'Suivant'}
                {stepIndex < totalSteps - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
};
