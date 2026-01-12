import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { performanceMonitor } from './performanceMonitoring';

/**
 * Optimized React Query Configuration
 * Implements caching strategies, error handling, and performance tracking
 */

// Create query cache with error handling
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Track failed queries
    performanceMonitor.recordMetric('query_error', 0, {
      queryKey: query.queryKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Only show error toasts for user-initiated queries
    if (query.meta?.showErrorToast !== false) {
      toast.error('Failed to load data', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  },
  onSuccess: (data, query) => {
    // Track successful queries
    const duration = query.state.dataUpdatedAt - query.state.fetchStatus === 'fetching' ? Date.now() : 0;
    performanceMonitor.recordMetric('query_success', duration, {
      queryKey: query.queryKey,
    });
  },
});

// Create mutation cache with error handling
const mutationCache = new MutationCache({
  onError: (error, variables, context, mutation) => {
    // Track failed mutations
    performanceMonitor.recordMetric('mutation_error', 0, {
      mutationKey: mutation.options.mutationKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Show error toast unless explicitly disabled
    if (mutation.meta?.showErrorToast !== false) {
      toast.error('Action failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  },
  onSuccess: (data, variables, context, mutation) => {
    // Track successful mutations
    performanceMonitor.recordMetric('mutation_success', 0, {
      mutationKey: mutation.options.mutationKey,
    });
  },
});

// Create optimized query client
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time: Keep unused data for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (can be disabled per query)
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Performance: Use structural sharing for better rendering performance
      structuralSharing: true,
      
      // Network mode: online only (adjust per use case)
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Retry delay
      retryDelay: 1000,
      
      // Network mode
      networkMode: 'online',
    },
  },
});

/**
 * Query key factory for consistent cache keys
 */
export const queryKeys = {
  // Habits
  habits: {
    all: ['habits'] as const,
    lists: () => [...queryKeys.habits.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.habits.lists(), userId] as const,
    detail: (id: string) => [...queryKeys.habits.all, 'detail', id] as const,
    completions: (userId: string, habitId?: string) => 
      [...queryKeys.habits.all, 'completions', userId, habitId] as const,
  },
  
  // Goals
  goals: {
    all: ['goals'] as const,
    lists: () => [...queryKeys.goals.all, 'list'] as const,
    list: (userId: string, status?: string) => 
      [...queryKeys.goals.lists(), userId, status] as const,
    detail: (id: string) => [...queryKeys.goals.all, 'detail', id] as const,
    tasks: (goalId: string) => [...queryKeys.goals.all, 'tasks', goalId] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    summary: (userId: string) => [...queryKeys.analytics.all, 'summary', userId] as const,
    daily: (userId: string, startDate: string, endDate: string) => 
      [...queryKeys.analytics.all, 'daily', userId, startDate, endDate] as const,
    weekly: (userId: string, year: number, week: number) => 
      [...queryKeys.analytics.all, 'weekly', userId, year, week] as const,
    monthly: (userId: string, year: number, month: number) => 
      [...queryKeys.analytics.all, 'monthly', userId, year, month] as const,
  },
  
  // Profile
  profile: {
    all: ['profile'] as const,
    current: (userId: string) => [...queryKeys.profile.all, 'current', userId] as const,
    public: (userId: string) => [...queryKeys.profile.all, 'public', userId] as const,
  },
  
  // Social
  friends: {
    all: ['friends'] as const,
    list: (userId: string) => [...queryKeys.friends.all, 'list', userId] as const,
    requests: (userId: string) => [...queryKeys.friends.all, 'requests', userId] as const,
  },
  
  // Achievements
  achievements: {
    all: ['achievements'] as const,
    list: () => [...queryKeys.achievements.all, 'list'] as const,
    user: (userId: string) => [...queryKeys.achievements.all, 'user', userId] as const,
    progress: (userId: string, achievementId: string) => 
      [...queryKeys.achievements.all, 'progress', userId, achievementId] as const,
  },
  
  // Library (AI content)
  library: {
    all: ['library'] as const,
    list: (userId: string, type?: string) => 
      [...queryKeys.library.all, 'list', userId, type] as const,
    detail: (id: string) => [...queryKeys.library.all, 'detail', id] as const,
  },
  
  // Credits
  credits: {
    all: ['credits'] as const,
    balance: (userId: string) => [...queryKeys.credits.all, 'balance', userId] as const,
    usage: (userId: string) => [...queryKeys.credits.all, 'usage', userId] as const,
  },
  
  // Session history
  sessions: {
    all: ['sessions'] as const,
    list: (userId: string, limit?: number) => 
      [...queryKeys.sessions.all, 'list', userId, limit] as const,
    stats: (userId: string) => [...queryKeys.sessions.all, 'stats', userId] as const,
  },
};

/**
 * Helper to invalidate related queries
 */
export const invalidateQueries = {
  habits: () => queryClient.invalidateQueries({ queryKey: queryKeys.habits.all }),
  goals: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals.all }),
  analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
  profile: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
  friends: () => queryClient.invalidateQueries({ queryKey: queryKeys.friends.all }),
  achievements: () => queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all }),
  library: () => queryClient.invalidateQueries({ queryKey: queryKeys.library.all }),
  credits: () => queryClient.invalidateQueries({ queryKey: queryKeys.credits.all }),
  sessions: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all }),
};

/**
 * Prefetch helper
 */
export async function prefetchQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
}

/**
 * Set query data helper (for optimistic updates)
 */
export function setQueryData<T>(
  queryKey: readonly unknown[],
  updater: T | ((old: T | undefined) => T)
) {
  return queryClient.setQueryData(queryKey, updater);
}

/**
 * Get query data helper
 */
export function getQueryData<T>(queryKey: readonly unknown[]): T | undefined {
  return queryClient.getQueryData(queryKey);
}
