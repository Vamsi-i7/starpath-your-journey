import { useEffect, useRef, useState } from 'react';
import { performanceMonitor } from '@/lib/performanceMonitoring';

/**
 * Hook to track performance metrics for a component or operation
 */
export function usePerformanceMonitor(metricName: string) {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();

    return () => {
      const duration = performance.now() - startTimeRef.current;
      performanceMonitor.trackRender(metricName, duration);
    };
  }, [metricName]);

  return {
    start: () => {
      startTimeRef.current = performance.now();
    },
    end: () => {
      const duration = performance.now() - startTimeRef.current;
      performanceMonitor.trackRender(metricName, duration);
      return duration;
    },
  };
}

/**
 * Hook to track API call performance
 */
export function useApiPerformance() {
  return {
    trackApiCall: async <T,>(
      name: string,
      apiCall: () => Promise<T>,
      metadata?: Record<string, any>
    ) => {
      return performanceMonitor.trackApiCall(name, apiCall, metadata);
    },
  };
}

/**
 * Hook to get performance summary
 */
export function usePerformanceSummary() {
  const [summary, setSummary] = useState(performanceMonitor.getSummary());
  const [coreWebVitals, setCoreWebVitals] = useState(performanceMonitor.getCoreWebVitals());

  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary());
      setCoreWebVitals(performanceMonitor.getCoreWebVitals());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { summary, coreWebVitals };
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const startTimeRef = useRef<number>(0);

  return {
    startInteraction: () => {
      startTimeRef.current = performance.now();
    },
    endInteraction: (interactionName: string, metadata?: Record<string, any>) => {
      const duration = performance.now() - startTimeRef.current;
      performanceMonitor.trackInteraction(interactionName, duration, metadata);
    },
  };
}
