import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Optimized query hook with automatic stale time and caching
 */
export function useOptimizedQuery<TData, TError = unknown>(
  options: UseQueryOptions<TData, TError> & { queryKey: any[] }
): UseQueryResult<TData, TError> {
  // Memoize query options to prevent unnecessary re-fetches
  const memoizedOptions = useMemo(
    () => ({
      ...options,
      staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
      gcTime: options.gcTime ?? 10 * 60 * 1000, // 10 minutes default
      refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
      retry: options.retry ?? 1,
    }),
    [options]
  );

  return useQuery(memoizedOptions);
}

/**
 * Prefetch data for better perceived performance
 */
export function usePrefetchQuery<TData>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  enabled = true
) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
