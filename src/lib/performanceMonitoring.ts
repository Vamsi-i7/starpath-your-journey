/**
 * Performance Monitoring and Alerting System
 * Tracks page load times, API calls, and user interactions
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceAlert {
  type: 'warning' | 'error';
  metric: string;
  threshold: number;
  actual: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  
  // Thresholds (in milliseconds)
  private readonly thresholds = {
    pageLoad: 3000,      // 3 seconds
    apiCall: 2000,       // 2 seconds
    render: 1000,        // 1 second
    interaction: 100,    // 100ms (for interactions to feel instant)
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  /**
   * Initialize Performance Observers for automatic tracking
   */
  private initializeObservers() {
    // Track navigation timing (page loads)
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page_load', navEntry.loadEventEnd - navEntry.fetchStart, {
                type: 'navigation',
                url: window.location.pathname,
              });
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (e) {
        console.warn('Navigation timing not supported:', e);
      }

      // Track resource loading
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              // Only track slow resources
              if (resourceEntry.duration > 500) {
                this.recordMetric('resource_load', resourceEntry.duration, {
                  name: resourceEntry.name,
                  type: resourceEntry.initiatorType,
                });
              }
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (e) {
        console.warn('Resource timing not supported:', e);
      }

      // Track Long Tasks (> 50ms)
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('long_task', entry.duration, {
              startTime: entry.startTime,
            });
            
            // Alert on very long tasks
            if (entry.duration > 200) {
              this.createAlert('error', 'long_task', 200, entry.duration);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        console.warn('Long task timing not supported:', e);
      }

      // Track Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.recordMetric('lcp', lastEntry.renderTime || lastEntry.loadTime, {
            element: lastEntry.element?.tagName,
            url: lastEntry.url,
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP not supported:', e);
      }

      // Track First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as any;
            this.recordMetric('fid', fidEntry.processingStart - fidEntry.startTime, {
              eventType: fidEntry.name,
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID not supported:', e);
      }

      // Track Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const clsEntry = entry as any;
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value;
              this.recordMetric('cls', clsValue, {
                sources: clsEntry.sources?.map((s: any) => s.node?.tagName),
              });
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS not supported:', e);
      }
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, duration: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Check against thresholds
    const threshold = this.getThreshold(name);
    if (threshold && duration > threshold) {
      this.createAlert('warning', name, threshold, duration);
    }

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log in development
    if (import.meta.env.DEV && duration > threshold) {
      console.warn(`⚠️ Performance: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`, metadata);
    }
  }

  /**
   * Track API call performance
   */
  async trackApiCall<T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.recordMetric(`api_${name}`, duration, {
        ...metadata,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(`api_${name}`, duration, {
        ...metadata,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  /**
   * Track React component render time
   */
  trackRender(componentName: string, duration: number) {
    this.recordMetric(`render_${componentName}`, duration);
  }

  /**
   * Track user interaction
   */
  trackInteraction(interactionName: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric(`interaction_${interactionName}`, duration, metadata);
  }

  /**
   * Get threshold for a metric type
   */
  private getThreshold(name: string): number {
    if (name.includes('page_load')) return this.thresholds.pageLoad;
    if (name.includes('api_')) return this.thresholds.apiCall;
    if (name.includes('render_')) return this.thresholds.render;
    if (name.includes('interaction_')) return this.thresholds.interaction;
    return 1000; // Default 1 second
  }

  /**
   * Create a performance alert
   */
  private createAlert(
    type: 'warning' | 'error',
    metric: string,
    threshold: number,
    actual: number
  ) {
    const alert: PerformanceAlert = {
      type,
      metric,
      threshold,
      actual,
      timestamp: Date.now(),
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // In production, send to monitoring service (Sentry, etc.)
    if (import.meta.env.PROD && window.Sentry) {
      window.Sentry.captureMessage(`Performance ${type}: ${metric}`, {
        level: type === 'error' ? 'error' : 'warning',
        extra: { threshold, actual },
      });
    }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const summary: Record<string, { count: number; avg: number; max: number; min: number }> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          max: 0,
          min: Infinity,
        };
      }

      const s = summary[metric.name];
      s.count++;
      s.avg = (s.avg * (s.count - 1) + metric.duration) / s.count;
      s.max = Math.max(s.max, metric.duration);
      s.min = Math.min(s.min, metric.duration);
    }

    return summary;
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals() {
    const lcp = this.metrics.filter(m => m.name === 'lcp').pop();
    const fid = this.metrics.filter(m => m.name === 'fid').pop();
    const cls = this.metrics.filter(m => m.name === 'cls').pop();

    return {
      lcp: lcp?.duration,
      fid: fid?.duration,
      cls: cls?.duration,
    };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 10) {
    return this.alerts.slice(-limit);
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      summary: this.getSummary(),
      coreWebVitals: this.getCoreWebVitals(),
      timestamp: Date.now(),
    };
  }

  /**
   * Clear all metrics and alerts
   */
  clear() {
    this.metrics = [];
    this.alerts = [];
  }

  /**
   * Cleanup observers
   */
  destroy() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for debugging in console
if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = performanceMonitor;
}

/**
 * React hook for tracking component render performance
 */
export function usePerformanceTracking(componentName: string) {
  if (import.meta.env.DEV) {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackRender(componentName, duration);
    };
  }
  
  return () => {}; // No-op in production
}

/**
 * HOC for tracking component performance
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'Unknown';
  
  return function PerformanceTrackedComponent(props: P) {
    const trackEnd = usePerformanceTracking(name);
    
    React.useEffect(() => {
      trackEnd();
    }, [trackEnd]);
    
    return React.createElement(Component, props);
  };
}

declare global {
  interface Window {
    __performanceMonitor: PerformanceMonitor;
    Sentry?: any;
  }
}
