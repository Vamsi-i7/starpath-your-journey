import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

export function useErrorRecovery() {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options: RetryOptions = {}
    ): Promise<T | null> => {
      const {
        maxAttempts = 3,
        delayMs = 1000,
        backoffMultiplier = 2,
      } = options;

      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        setRetryCount(attempt);
        
        try {
          const result = await fn();
          setRetryCount(0);
          setIsRetrying(false);
          return result;
        } catch (error: any) {
          lastError = error;
          
          // Check if it's a rate limit error
          if (error.message?.includes('rate limit') || error.status === 429) {
            const waitTime = Math.min(delayMs * Math.pow(backoffMultiplier, attempt - 1), 30000);
            
            if (attempt < maxAttempts) {
              setIsRetrying(true);
              toast.warning(`Rate limited. Retrying in ${Math.round(waitTime / 1000)}s...`, {
                duration: waitTime,
              });
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            } else {
              toast.error('Rate limit exceeded. Please try again later.');
              break;
            }
          }
          
          // Check if it's a network error
          if (error.message?.includes('network') || error.message?.includes('fetch')) {
            if (attempt < maxAttempts) {
              setIsRetrying(true);
              const waitTime = delayMs * attempt;
              toast.warning(`Network error. Retrying (${attempt}/${maxAttempts})...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            } else {
              toast.error('Network error. Please check your connection.');
              break;
            }
          }
          
          // For other errors, don't retry
          if (attempt === 1) {
            toast.error(error.message || 'An error occurred');
          }
          break;
        }
      }
      
      setRetryCount(0);
      setIsRetrying(false);
      return null;
    },
    []
  );

  return {
    executeWithRetry,
    retryCount,
    isRetrying,
  };
}
