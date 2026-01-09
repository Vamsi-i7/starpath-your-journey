import { useEffect, useRef, useCallback } from 'react';

/**
 * Debounce function - delays execution until after wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait time
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
}

/**
 * Hook for debounced callbacks
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    debounce((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay),
    [delay]
  );
}

/**
 * Hook for throttled callbacks
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    throttle((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay),
    [delay]
  );
}

/**
 * Request Animation Frame wrapper for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  callback: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      callback(...args);
      rafId = null;
    });
  };
}

/**
 * Check if element is in viewport (for lazy loading)
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
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit
) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => callback(entry.isIntersecting),
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [callback, options]);

  return elementRef;
}

/**
 * Preload images for better performance
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch DOM reads and writes
 */
export class DOMBatcher {
  private readQueue: Array<() => void> = [];
  private writeQueue: Array<() => void> = [];
  private rafId: number | null = null;

  read(callback: () => void) {
    this.readQueue.push(callback);
    this.schedule();
  }

  write(callback: () => void) {
    this.writeQueue.push(callback);
    this.schedule();
  }

  private schedule() {
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      // Execute all reads first
      this.readQueue.forEach(cb => cb());
      this.readQueue = [];

      // Then all writes
      this.writeQueue.forEach(cb => cb());
      this.writeQueue = [];

      this.rafId = null;
    });
  }
}

/**
 * Measure component render time (dev only)
 */
export function measureRenderTime(componentName: string, renderFn: () => void) {
  if (import.meta.env.DEV) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    const time = end - start;
    
    if (time > 16.67) { // Slower than 60fps
      console.warn(`⚠️ ${componentName} render took ${time.toFixed(2)}ms (>16.67ms)`);
    }
  } else {
    renderFn();
  }
}

/**
 * Memory-efficient data pagination
 */
export function paginateData<T>(data: T[], page: number, pageSize: number): T[] {
  const start = page * pageSize;
  const end = start + pageSize;
  return data.slice(start, end);
}

/**
 * Optimize array operations with memoization
 */
export function createMemoizedFilter<T>(
  filterFn: (item: T) => boolean
): (items: T[]) => T[] {
  const cache = new WeakMap<T[], T[]>();
  
  return (items: T[]) => {
    if (cache.has(items)) {
      return cache.get(items)!;
    }
    
    const filtered = items.filter(filterFn);
    cache.set(items, filtered);
    return filtered;
  };
}
