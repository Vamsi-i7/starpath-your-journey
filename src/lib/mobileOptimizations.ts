/**
 * Mobile-specific performance optimizations
 */

// Detect mobile device
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Detect iOS
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Detect Android
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

// Get device pixel ratio
export const getDevicePixelRatio = (): number => {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
};

// Check if device is in low power mode (iOS)
export const isLowPowerMode = async (): Promise<boolean> => {
  if (!isIOS()) return false;
  
  try {
    // Request a high-refresh-rate animation and measure actual frame rate
    let frameCount = 0;
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const measureFrameRate = () => {
        frameCount++;
        if (frameCount >= 60) {
          const duration = performance.now() - startTime;
          const fps = (frameCount / duration) * 1000;
          // If FPS is significantly lower than 60, likely in low power mode
          resolve(fps < 40);
        } else {
          requestAnimationFrame(measureFrameRate);
        }
      };
      
      requestAnimationFrame(measureFrameRate);
    });
  } catch {
    return false;
  }
};

// Optimize images for mobile
export const getOptimizedImageUrl = (
  url: string,
  width: number,
  quality: number = 75
): string => {
  // If using a CDN that supports image optimization, modify URL
  // Example for Supabase storage or Cloudinary
  const dpr = getDevicePixelRatio();
  const targetWidth = Math.round(width * dpr);
  
  // This is a placeholder - adjust based on your image CDN
  if (url.includes('supabase.co/storage')) {
    return `${url}?width=${targetWidth}&quality=${quality}`;
  }
  
  return url;
};

// Debounce scroll events for better mobile performance
export function debounceScroll(callback: () => void, delay: number = 100) {
  let timeoutId: NodeJS.Timeout;
  let rafId: number;
  
  return () => {
    clearTimeout(timeoutId);
    cancelAnimationFrame(rafId);
    
    timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(callback);
    }, delay);
  };
}

// Throttle expensive operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout;
  
  return function (...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - (now - lastCall));
    }
  };
}

// Passive event listener options for better scroll performance
export const passiveEventOptions = {
  passive: true,
  capture: false,
};

// Reduce motion preference
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Connection quality detection
export const getConnectionQuality = (): 'slow' | 'medium' | 'fast' => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'medium';
  }
  
  const connection = (navigator as any).connection;
  
  if (!connection) return 'medium';
  
  const effectiveType = connection.effectiveType;
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  } else if (effectiveType === '3g') {
    return 'medium';
  } else {
    return 'fast';
  }
};

// Check if user is on mobile data (not WiFi)
export const isOnMobileData = (): boolean => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }
  
  const connection = (navigator as any).connection;
  return connection?.type === 'cellular';
};

// Adaptive loading strategy based on connection
export const shouldLoadHeavyResources = (): boolean => {
  const quality = getConnectionQuality();
  const onMobileData = isOnMobileData();
  
  // Don't load heavy resources on slow connections or mobile data
  return quality === 'fast' && !onMobileData;
};

// Touch optimization utilities
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Prevent default touch behavior for better custom interactions
export const preventDefaultTouch = (e: TouchEvent) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
};

// Get touch coordinates
export const getTouchCoordinates = (e: TouchEvent) => {
  const touch = e.touches[0] || e.changedTouches[0];
  return {
    x: touch.clientX,
    y: touch.clientY,
  };
};

// Haptic feedback (for supported devices)
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  
  const patterns = {
    light: 10,
    medium: 20,
    heavy: 30,
  };
  
  navigator.vibrate(patterns[type]);
};

// Request Idle Callback with fallback
export const requestIdleCallbackPolyfill = (callback: () => void, timeout = 1000) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  } else {
    return setTimeout(callback, 1) as any;
  }
};

// Cancel Idle Callback
export const cancelIdleCallbackPolyfill = (id: number) => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

// Battery status (experimental)
export const getBatteryLevel = async (): Promise<number | null> => {
  if (!('getBattery' in navigator)) return null;
  
  try {
    const battery = await (navigator as any).getBattery();
    return battery.level;
  } catch {
    return null;
  }
};

// Check if battery is charging
export const isBatteryCharging = async (): Promise<boolean> => {
  if (!('getBattery' in navigator)) return true;
  
  try {
    const battery = await (navigator as any).getBattery();
    return battery.charging;
  } catch {
    return true;
  }
};

// Adaptive performance based on battery
export const shouldReducePerformance = async (): Promise<boolean> => {
  const battery = await getBatteryLevel();
  const charging = await isBatteryCharging();
  
  // Reduce performance if battery is low and not charging
  return battery !== null && battery < 0.2 && !charging;
};

// Memory detection (experimental)
export const getDeviceMemory = (): number => {
  if (typeof navigator === 'undefined' || !('deviceMemory' in navigator)) {
    return 4; // Default assumption
  }
  return (navigator as any).deviceMemory || 4;
};

// Check if device has limited memory
export const isLowMemoryDevice = (): boolean => {
  return getDeviceMemory() <= 2;
};

// Adaptive configuration based on device capabilities
export const getAdaptiveConfig = () => {
  const mobile = isMobile();
  const lowMemory = isLowMemoryDevice();
  const slowConnection = getConnectionQuality() === 'slow';
  const touchDevice = isTouchDevice();
  
  return {
    // Reduce animation complexity on low-end devices
    enableAnimations: !prefersReducedMotion() && !lowMemory,
    
    // Reduce quality on slow connections
    imageQuality: slowConnection ? 60 : 85,
    
    // Enable virtualization for lists on low memory devices
    useVirtualization: lowMemory || mobile,
    
    // Prefetch data on fast connections only
    enablePrefetch: !slowConnection && !isOnMobileData(),
    
    // Reduce polling frequency on mobile
    pollingInterval: mobile ? 30000 : 15000, // 30s vs 15s
    
    // Touch-optimized UI
    touchOptimized: touchDevice,
    
    // Lazy load images
    lazyLoadImages: mobile || slowConnection,
    
    // Reduce cache size on low memory
    cacheSize: lowMemory ? 50 : 200,
  };
};

// Export all utilities
export const MobileOptimizations = {
  isMobile,
  isIOS,
  isAndroid,
  getDevicePixelRatio,
  isLowPowerMode,
  getOptimizedImageUrl,
  debounceScroll,
  throttle,
  passiveEventOptions,
  prefersReducedMotion,
  getConnectionQuality,
  isOnMobileData,
  shouldLoadHeavyResources,
  isTouchDevice,
  preventDefaultTouch,
  getTouchCoordinates,
  hapticFeedback,
  requestIdleCallbackPolyfill,
  cancelIdleCallbackPolyfill,
  getBatteryLevel,
  isBatteryCharging,
  shouldReducePerformance,
  getDeviceMemory,
  isLowMemoryDevice,
  getAdaptiveConfig,
};
