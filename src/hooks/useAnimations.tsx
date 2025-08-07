import { useEffect, useState } from "react";

export const useAnimations = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const staggeredAnimation = (index: number, delay: number = 100) => ({
    style: { animationDelay: `${index * delay}ms` },
    className: isVisible ? 'animate-fade-in-up' : 'opacity-0'
  });

  const fadeInUp = (delay: number = 0) => ({
    style: { animationDelay: `${delay}ms` },
    className: isVisible ? 'animate-fade-in-up' : 'opacity-0'
  });

  const scaleIn = (delay: number = 0) => ({
    style: { animationDelay: `${delay}ms` },
    className: isVisible ? 'animate-scale-in' : 'opacity-0'
  });

  return {
    isVisible,
    staggeredAnimation,
    fadeInUp,
    scaleIn
  };
};

export const useScrollAnimation = () => {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(ref);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return { setRef, isInView };
};