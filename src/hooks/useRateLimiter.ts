import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function useRateLimiter() {
  const { profile } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [resetTime, setResetTime] = useState<Date | null>(null);
  const [isLimited, setIsLimited] = useState(false);

  // Configure limits based on subscription tier
  const config: RateLimitConfig = {
    maxRequests: profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'lifetime' 
      ? 100 // Premium: 100 requests per hour
      : 20,  // Free: 20 requests per hour
    windowMs: 60 * 60 * 1000, // 1 hour
  };

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('ai_rate_limit');
    if (stored) {
      const data = JSON.parse(stored);
      const resetDate = new Date(data.resetTime);
      
      if (resetDate > new Date()) {
        setRequestCount(data.count);
        setResetTime(resetDate);
        setIsLimited(data.count >= config.maxRequests);
      } else {
        // Reset if window expired
        localStorage.removeItem('ai_rate_limit');
      }
    }
  }, [config.maxRequests]);

  const checkLimit = useCallback((): boolean => {
    if (!resetTime || resetTime < new Date()) {
      // Start new window
      const newResetTime = new Date(Date.now() + config.windowMs);
      setRequestCount(0);
      setResetTime(newResetTime);
      setIsLimited(false);
      
      localStorage.setItem('ai_rate_limit', JSON.stringify({
        count: 0,
        resetTime: newResetTime.toISOString(),
      }));
      
      return true;
    }

    if (requestCount >= config.maxRequests) {
      setIsLimited(true);
      return false;
    }

    return true;
  }, [requestCount, resetTime, config]);

  const incrementCount = useCallback(() => {
    const newCount = requestCount + 1;
    setRequestCount(newCount);
    setIsLimited(newCount >= config.maxRequests);
    
    if (resetTime) {
      localStorage.setItem('ai_rate_limit', JSON.stringify({
        count: newCount,
        resetTime: resetTime.toISOString(),
      }));
    }
  }, [requestCount, resetTime, config.maxRequests]);

  const getRemainingRequests = useCallback((): number => {
    return Math.max(0, config.maxRequests - requestCount);
  }, [requestCount, config.maxRequests]);

  const getTimeUntilReset = useCallback((): number => {
    if (!resetTime) return 0;
    return Math.max(0, resetTime.getTime() - Date.now());
  }, [resetTime]);

  return {
    checkLimit,
    incrementCount,
    isLimited,
    remainingRequests: getRemainingRequests(),
    timeUntilReset: getTimeUntilReset(),
    maxRequests: config.maxRequests,
  };
}
