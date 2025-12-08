import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  initialData: T[];
  pageSize?: number;
  loadDelay?: number;
}

interface UseInfiniteScrollReturn<T> {
  displayedItems: T[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
  reset: () => void;
}

export function useInfiniteScroll<T>({
  initialData,
  pageSize = 6,
  loadDelay = 300
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const totalItems = initialData.length;
  const hasMore = displayedItems.length < totalItems;

  // Initialize with first page
  useEffect(() => {
    setDisplayedItems(initialData.slice(0, pageSize));
    setCurrentPage(1);
  }, [initialData, pageSize]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate network delay for smooth UX
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const endIndex = nextPage * pageSize;
      setDisplayedItems(initialData.slice(0, endIndex));
      setCurrentPage(nextPage);
      setIsLoading(false);
    }, loadDelay);
  }, [currentPage, hasMore, initialData, isLoading, loadDelay, pageSize]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { 
        root: null,
        rootMargin: '100px',
        threshold: 0.1 
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  const reset = useCallback(() => {
    setDisplayedItems(initialData.slice(0, pageSize));
    setCurrentPage(1);
    setIsLoading(false);
  }, [initialData, pageSize]);

  return {
    displayedItems,
    isLoading,
    hasMore,
    loadMore,
    sentinelRef,
    reset
  };
}