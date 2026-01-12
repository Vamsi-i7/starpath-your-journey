import { useState, useEffect } from 'react';
import { MobileOptimizations } from '@/lib/mobileOptimizations';

/**
 * Hook to get adaptive configuration based on device capabilities
 */
export function useAdaptiveConfig() {
  const [config, setConfig] = useState(() => MobileOptimizations.getAdaptiveConfig());

  useEffect(() => {
    // Update config on network changes
    const updateConfig = () => {
      setConfig(MobileOptimizations.getAdaptiveConfig());
    };

    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateConfig);

      return () => {
        connection?.removeEventListener('change', updateConfig);
      };
    }
  }, []);

  return config;
}

/**
 * Hook to detect mobile device
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => MobileOptimizations.isMobile());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(MobileOptimizations.isMobile() || window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

/**
 * Hook to detect connection quality
 */
export function useConnectionQuality() {
  const [quality, setQuality] = useState(() => MobileOptimizations.getConnectionQuality());

  useEffect(() => {
    const updateQuality = () => {
      setQuality(MobileOptimizations.getConnectionQuality());
    };

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateQuality);

      return () => {
        connection?.removeEventListener('change', updateQuality);
      };
    }
  }, []);

  return quality;
}

/**
 * Hook for battery-aware performance optimization
 */
export function useBatteryOptimization() {
  const [shouldReduce, setShouldReduce] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    const checkBattery = async () => {
      const reduce = await MobileOptimizations.shouldReducePerformance();
      const level = await MobileOptimizations.getBatteryLevel();
      setShouldReduce(reduce);
      setBatteryLevel(level);
    };

    checkBattery();

    // Check every minute
    const interval = setInterval(checkBattery, 60000);

    return () => clearInterval(interval);
  }, []);

  return { shouldReduce, batteryLevel };
}

/**
 * Hook for haptic feedback
 */
export function useHapticFeedback() {
  return {
    light: () => MobileOptimizations.hapticFeedback('light'),
    medium: () => MobileOptimizations.hapticFeedback('medium'),
    heavy: () => MobileOptimizations.hapticFeedback('heavy'),
  };
}
