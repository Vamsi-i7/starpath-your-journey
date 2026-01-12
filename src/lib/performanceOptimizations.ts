/**
 * Performance Optimization Utilities
 * Additional optimizations beyond what's already implemented
 */

/**
 * Debounce function to limit execution rate
 * Useful for search inputs, resize handlers, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function to limit execution frequency
 * Useful for scroll handlers, mouse move, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Intersection Observer for lazy loading
 * Useful for images, infinite scroll, etc.
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Memoize function results
 * Cache expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Check if device prefers reduced motion
 * Respect user accessibility preferences
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user is on slow connection
 * Adjust features based on connection speed
 */
export function isSlowConnection(): boolean {
  const connection = (navigator as any).connection;
  if (!connection) return false;

  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
}

/**
 * Preload critical resources
 * Improve initial load time
 */
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Request idle callback wrapper
 * Execute non-critical tasks during idle time
 */
export function runWhenIdle(callback: () => void, options?: IdleRequestOptions) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 1);
  }
}

/**
 * Batch DOM updates
 * Reduce layout thrashing
 */
export function batchDOMUpdates(updates: (() => void)[]) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Virtual scroll helper
 * Calculate visible items in a list
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
}

/**
 * Check if element is in viewport
 * Useful for lazy loading
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Prefetch route data
 * Preload data for next likely navigation
 */
export async function prefetchRoute(
  route: string,
  dataLoader?: () => Promise<any>
) {
  // Prefetch the route's code
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  document.head.appendChild(link);

  // Optionally prefetch data
  if (dataLoader) {
    runWhenIdle(() => {
      dataLoader().catch(() => {
        // Silently fail, it's just a prefetch
      });
    });
  }
}

/**
 * Image loading optimization
 * Lazy load images with placeholder
 */
export function optimizeImage(
  src: string,
  placeholder?: string
): {
  src: string;
  loading: 'lazy' | 'eager';
  decoding: 'async';
} {
  return {
    src: placeholder || src,
    loading: 'lazy',
    decoding: 'async',
  };
}
