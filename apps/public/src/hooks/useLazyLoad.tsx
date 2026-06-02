import { useState, useCallback, useRef, useEffect } from "react";

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useLazyLoad = (options: LazyLoadOptions = {}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    threshold = 0.1,
    rootMargin = "50px",
    triggerOnce = true
  } = options;

  const setRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (element) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const inView = entry.isIntersecting;
          setIsInView(inView);

          if (inView && !hasLoaded) {
            setHasLoaded(true);
            if (triggerOnce) {
              observerRef.current?.disconnect();
            }
          }
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(element);
    }
  }, [threshold, rootMargin, triggerOnce, hasLoaded]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    setRef,
    isInView,
    hasLoaded,
    shouldLoad: isInView || hasLoaded
  };
};

// Hook pour le lazy loading de composants React
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  deps: any[] = []
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    setError(null);

    try {
      const module = await importFunc();
      setComponent(() => module.default);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [Component, loading, importFunc, ...deps]);

  return {
    Component,
    loading,
    error,
    loadComponent
  };
};

// Hook pour lazy loading des images
export const useLazyImage = (src: string, options: LazyLoadOptions = {}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { setRef, shouldLoad } = useLazyLoad(options);

  useEffect(() => {
    if (shouldLoad && src && !imageLoaded && !imageError) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setImageLoaded(true);
      };

      img.onerror = () => {
        setImageError(true);
      };

      img.src = src;
    }
  }, [shouldLoad, src, imageLoaded, imageError]);

  return {
    setRef,
    imageSrc,
    imageLoaded,
    imageError,
    shouldLoad
  };
};