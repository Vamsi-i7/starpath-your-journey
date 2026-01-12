import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

/**
 * Hook for automatic retry logic with exponential backoff
 * Improves reliability for network operations
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number) => void;
}

export function useErrorRetry() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const retryWithBackoff = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options: RetryOptions = {}
    ): Promise<T> => {
      const {
        maxAttempts = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffMultiplier = 2,
        onRetry,
      } = options;

      let lastError: Error | null = null;
      let attempt = 0;

      while (attempt < maxAttempts) {
        try {
          if (attempt > 0) {
            setIsRetrying(true);
            const delay = Math.min(
              initialDelay * Math.pow(backoffMultiplier, attempt - 1),
              maxDelay
            );
            
            toast({
              title: `Retrying... (Attempt ${attempt + 1}/${maxAttempts})`,
              description: `Waiting ${delay / 1000} seconds before retry`,
            });

            await new Promise((resolve) => setTimeout(resolve, delay));
            
            if (onRetry) {
              onRetry(attempt);
            }
          }

          setRetryCount(attempt);
          const result = await operation();
          
          if (attempt > 0) {
            toast({
              title: 'Success!',
              description: 'Operation completed successfully',
            });
          }
          
          setIsRetrying(false);
          setRetryCount(0);
          return result;
        } catch (error) {
          lastError = error as Error;
          attempt++;

          if (attempt >= maxAttempts) {
            setIsRetrying(false);
            setRetryCount(0);
            
            toast({
              title: 'Operation failed',
              description: `Failed after ${maxAttempts} attempts. Please try again later.`,
              variant: 'destructive',
            });
            
            throw lastError;
          }
        }
      }

      throw lastError;
    },
    [toast]
  );

  return {
    retryWithBackoff,
    isRetrying,
    retryCount,
  };
}

// Specific retry hooks for common operations

export function useAPIRetry() {
  const { retryWithBackoff } = useErrorRetry();

  const fetchWithRetry = async <T,>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {
    return retryWithBackoff(async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    });
  };

  return { fetchWithRetry };
}

export function useSupabaseRetry() {
  const { retryWithBackoff } = useErrorRetry();

  const queryWithRetry = async <T,>(
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<T> => {
    return retryWithBackoff(async () => {
      const { data, error } = await queryFn();
      
      if (error) {
        throw new Error(error.message || 'Database query failed');
      }
      
      if (!data) {
        throw new Error('No data returned');
      }
      
      return data;
    }, {
      maxAttempts: 2, // Supabase usually doesn't need as many retries
    });
  };

  return { queryWithRetry };
}
