// Debounce pour optimiser les recherches
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle pour limiter les appels fréquents
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Batch des appels API
export class APIBatcher {
  private batches: Map<string, any[]> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(private delay: number = 100) {}

  add<T>(key: string, item: T, processor: (items: T[]) => Promise<void>) {
    if (!this.batches.has(key)) {
      this.batches.set(key, []);
    }

    this.batches.get(key)!.push(item);

    // Clear timeout existant
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Nouveau timeout
    const timeout = setTimeout(async () => {
      const items = this.batches.get(key) || [];
      this.batches.delete(key);
      this.timeouts.delete(key);

      if (items.length > 0) {
        await processor(items);
      }
    }, this.delay);

    this.timeouts.set(key, timeout);
  }

  flush(key?: string) {
    if (key) {
      const timeout = this.timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
        this.timeouts.delete(key);
        this.batches.delete(key);
      }
    } else {
      // Flush all
      this.timeouts.forEach(timeout => clearTimeout(timeout));
      this.timeouts.clear();
      this.batches.clear();
    }
  }
}

// Optimiseur d'images
export const optimizeImageUrl = (
  url: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
) => {
  if (!url) return url;

  const { width, height, quality = 80, format = 'webp' } = options;
  
  // Si c'est une URL Supabase Storage
  if (url.includes('supabase.co') && url.includes('storage')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    params.set('format', format);
    
    return `${url}?${params.toString()}`;
  }

  return url;
};

// Préchargement intelligent
export const preloadResource = (url: string, type: 'image' | 'script' | 'style') => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;

  switch (type) {
    case 'image':
      link.as = 'image';
      break;
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
  }

  document.head.appendChild(link);
};

// Mesure de performance
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Map<string, number> = new Map();

  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  start(name: string) {
    this.marks.set(name, performance.now());
  }

  end(name: string, log: boolean = true) {
    const startTime = this.marks.get(name);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    if (log && process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  measure(name: string, fn: () => any) {
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  }

  async measureAsync(name: string, fn: () => Promise<any>) {
    this.start(name);
    const result = await fn();
    this.end(name);
    return result;
  }
}

export const perf = PerformanceMonitor.getInstance();