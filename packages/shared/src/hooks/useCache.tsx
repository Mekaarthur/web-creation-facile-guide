import { useCallback, useRef } from "react";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface UseCacheOptions {
  ttl?: number; // Time to live en minutes
  maxSize?: number; // Taille max du cache
}

export const useCache = <T = any>({ ttl = 5, maxSize = 50 }: UseCacheOptions = {}) => {
  const cache = useRef<Map<string, CacheItem<T>>>(new Map());

  const set = useCallback((key: string, data: T, customTtl?: number) => {
    const now = Date.now();
    const expiry = now + (customTtl || ttl) * 60 * 1000;

    if (cache.current.size >= maxSize) {
      const oldestKey = Array.from(cache.current.keys())[0];
      cache.current.delete(oldestKey);
    }

    cache.current.set(key, {
      data,
      timestamp: now,
      expiry
    });
  }, [ttl, maxSize]);

  const get = useCallback((key: string): T | null => {
    const item = cache.current.get(key);

    if (!item) return null;

    if (Date.now() > item.expiry) {
      cache.current.delete(key);
      return null;
    }

    return item.data;
  }, []);

  const has = useCallback((key: string): boolean => {
    const item = cache.current.get(key);
    return item ? Date.now() <= item.expiry : false;
  }, []);

  const invalidate = useCallback((pattern?: string) => {
    if (!pattern) {
      cache.current.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of cache.current.keys()) {
      if (regex.test(key)) {
        cache.current.delete(key);
      }
    }
  }, []);

  const getStats = useCallback(() => ({
    size: cache.current.size,
    keys: Array.from(cache.current.keys()),
    hitRate: 0
  }), []);

  return { set, get, has, invalidate, getStats };
};
