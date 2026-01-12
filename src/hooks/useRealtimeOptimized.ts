import { useEffect, useRef } from 'react';
import {
  subscribeToHabits,
  subscribeToGoals,
  subscribeToFriendRequests,
  subscribeToNotifications,
  trackPresence,
} from '@/lib/realtimeOptimizations';
import { useAuth } from '@/contexts/AuthContext';
import { invalidateQueries } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Optimized realtime hooks with automatic cleanup and reconnection
 */

// Subscribe to habits changes
export function useHabitsRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;

    unsubscribeRef.current = subscribeToHabits(user.id, (payload) => {
      console.log('Habits change:', payload);
      
      // Invalidate habits queries to refetch data
      invalidateQueries.habits();
      invalidateQueries.analytics();
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [user, queryClient]);
}

// Subscribe to goals changes
export function useGoalsRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;

    unsubscribeRef.current = subscribeToGoals(user.id, (payload) => {
      console.log('Goals change:', payload);
      
      invalidateQueries.goals();
      invalidateQueries.analytics();
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [user, queryClient]);
}

// Subscribe to friend requests
export function useFriendRequestsRealtime(onNewRequest?: () => void) {
  const { user } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;

    unsubscribeRef.current = subscribeToFriendRequests(user.id, (payload) => {
      console.log('New friend request:', payload);
      
      invalidateQueries.friends();
      onNewRequest?.();
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [user, onNewRequest]);
}

// Subscribe to notifications
export function useNotificationsRealtime(onNewNotification?: (notification: any) => void) {
  const { user } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;

    unsubscribeRef.current = subscribeToNotifications(user.id, (payload) => {
      console.log('New notification:', payload);
      
      if (payload.eventType === 'INSERT' && payload.new) {
        onNewNotification?.(payload.new);
      }
      
      // Don't invalidate immediately to avoid too many refetches
      // User can manually refresh or it will refresh on next focus
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [user, onNewNotification]);
}

// Track online presence
export function usePresenceTracking(enabled: boolean = true) {
  const { user, profile } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user || !profile || !enabled) return;

    unsubscribeRef.current = trackPresence(
      user.id,
      profile.username || profile.full_name || 'Anonymous',
      (users) => {
        console.log('Online users:', users.length);
      }
    );

    return () => {
      unsubscribeRef.current?.();
    };
  }, [user, profile, enabled]);
}

// Master hook to enable all realtime features
export function useRealtimeSync(options?: {
  habits?: boolean;
  goals?: boolean;
  friendRequests?: boolean;
  notifications?: boolean;
  presence?: boolean;
}) {
  const {
    habits = true,
    goals = true,
    friendRequests = true,
    notifications = true,
    presence = false, // Disabled by default to save resources
  } = options || {};

  // Enable individual subscriptions based on options
  if (habits) useHabitsRealtime();
  if (goals) useGoalsRealtime();
  if (friendRequests) useFriendRequestsRealtime();
  if (notifications) useNotificationsRealtime();
  if (presence) usePresenceTracking(true);
}
