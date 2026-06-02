import { useState, useEffect, useCallback } from 'react';

export interface TutorialStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'scroll';
}

interface TutorialState {
  hasSeenTutorial: boolean;
  currentStep: number;
  isActive: boolean;
  completedSteps: string[];
}

const STORAGE_KEY = 'bikawo-tutorial-state';

const defaultState: TutorialState = {
  hasSeenTutorial: false,
  currentStep: 0,
  isActive: false,
  completedSteps: [],
};

export const useTutorial = (tutorialId: string, steps: TutorialStep[]) => {
  const [state, setState] = useState<TutorialState>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${tutorialId}`);
      return saved ? JSON.parse(saved) : defaultState;
    } catch {
      return defaultState;
    }
  });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-${tutorialId}`, JSON.stringify(state));
  }, [state, tutorialId]);

  const startTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      const newStep = prev.currentStep + 1;
      if (newStep >= steps.length) {
        return {
          ...prev,
          isActive: false,
          hasSeenTutorial: true,
          completedSteps: steps.map(s => s.id),
        };
      }
      return {
        ...prev,
        currentStep: newStep,
        completedSteps: [...prev.completedSteps, steps[prev.currentStep].id],
      };
    });
  }, [steps]);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      hasSeenTutorial: true,
    }));
  }, []);

  const resetTutorial = useCallback(() => {
    setState(defaultState);
  }, []);

  const currentStep = state.isActive ? steps[state.currentStep] : null;
  const progress = steps.length > 0 ? ((state.currentStep + 1) / steps.length) * 100 : 0;

  return {
    isActive: state.isActive,
    hasSeenTutorial: state.hasSeenTutorial,
    currentStep,
    currentStepIndex: state.currentStep,
    totalSteps: steps.length,
    progress,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    resetTutorial,
  };
};
