import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/safeClient';

/**
 * Optimized Realtime Subscriptions for Supabase
 * Implements connection pooling, automatic reconnection, and smart debouncing
 */

interface SubscriptionConfig {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
  debounceMs?: number;
}

interface PresenceConfig {
  channel: string;
  userState: Record<string, any>;
  onJoin?: (key: string, user: any) => void;
  onLeave?: (key: string, user: any) => void;
  onSync?: () => void;
}

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;

  /**
   * Subscribe to database changes with optimization
   */
  subscribe(config: SubscriptionConfig): () => void {
    const { table, filter, event = '*', callback, debounceMs = 0 } = config;
    
    const channelName = `${table}:${filter || 'all'}:${event}`;
    
    // Return existing subscription if available
    if (this.channels.has(channelName)) {
      console.log(`Reusing existing subscription: ${channelName}`);
      return () => this.unsubscribe(channelName);
    }

    // Create new channel
    const channel = supabase.channel(channelName);

    // Debounced callback wrapper
    const debouncedCallback = (payload: RealtimePostgresChangesPayload<any>) => {
      if (debounceMs > 0) {
        const timerId = this.debounceTimers.get(channelName);
        if (timerId) clearTimeout(timerId);
        
        const newTimerId = setTimeout(() => {
          callback(payload);
          this.debounceTimers.delete(channelName);
        }, debounceMs);
        
        this.debounceTimers.set(channelName, newTimerId);
      } else {
        callback(payload);
      }
    };

    // Configure postgres changes subscription
    let subscription = channel.on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        filter,
      },
      debouncedCallback
    );

    // Subscribe and handle errors
    subscription.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to ${channelName}`);
        this.reconnectAttempts.set(channelName, 0);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Channel error for ${channelName}:`, err);
        this.handleReconnect(channelName, config);
      } else if (status === 'TIMED_OUT') {
        console.warn(`⏱️ Subscription timed out for ${channelName}`);
        this.handleReconnect(channelName, config);
      } else if (status === 'CLOSED') {
        console.log(`🔌 Channel closed for ${channelName}`);
      }
    });

    this.channels.set(channelName, channel);

    // Return cleanup function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Handle automatic reconnection
   */
  private handleReconnect(channelName: string, config: SubscriptionConfig) {
    const attempts = this.reconnectAttempts.get(channelName) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${channelName}`);
      return;
    }

    this.reconnectAttempts.set(channelName, attempts + 1);
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    
    console.log(`Reconnecting ${channelName} in ${delay}ms (attempt ${attempts + 1})`);
    
    setTimeout(() => {
      this.unsubscribe(channelName);
      this.subscribe(config);
    }, delay);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      
      // Clear debounce timer
      const timerId = this.debounceTimers.get(channelName);
      if (timerId) {
        clearTimeout(timerId);
        this.debounceTimers.delete(channelName);
      }
      
      console.log(`Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Subscribe to presence (online users)
   */
  subscribePresence(config: PresenceConfig): () => void {
    const { channel: channelName, userState, onJoin, onLeave, onSync } = config;
    
    if (this.channels.has(channelName)) {
      console.log(`Reusing existing presence channel: ${channelName}`);
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase.channel(channelName);

    // Track presence
    const presenceChannel = channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence sync:', state);
        onSync?.();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        newPresences.forEach(presence => onJoin?.(key, presence));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        leftPresences.forEach(presence => onLeave?.(key, presence));
      });

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(userState);
        console.log(`✅ Presence tracked in ${channelName}`);
      }
    });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Broadcast messages to channel
   */
  broadcast(channelName: string, event: string, payload: any) {
    const channel = this.channels.get(channelName);
    
    if (!channel) {
      console.warn(`Channel ${channelName} not found for broadcast`);
      return;
    }

    channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  /**
   * Subscribe to broadcast messages
   */
  subscribeBroadcast(
    channelName: string,
    event: string,
    callback: (payload: any) => void
  ): () => void {
    if (this.channels.has(channelName)) {
      const channel = this.channels.get(channelName)!;
      channel.on('broadcast', { event }, ({ payload }) => callback(payload));
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase.channel(channelName);
    
    channel.on('broadcast', { event }, ({ payload }) => callback(payload));
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to broadcast ${channelName}:${event}`);
      }
    });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Clean up all subscriptions
   */
  unsubscribeAll() {
    const channelNames = Array.from(this.channels.keys());
    channelNames.forEach(name => this.unsubscribe(name));
    console.log('All subscriptions cleaned up');
  }

  /**
   * Get active channels count
   */
  getActiveChannelsCount(): number {
    return this.channels.size;
  }

  /**
   * Get channel status
   */
  getChannelStatus(channelName: string): string | null {
    const channel = this.channels.get(channelName);
    return channel ? (channel as any).state : null;
  }
}

// Singleton instance
export const realtimeManager = new RealtimeManager();

/**
 * Optimized subscription patterns
 */

// Subscribe to user's habits changes
export function subscribeToHabits(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return realtimeManager.subscribe({
    table: 'habits',
    filter: `user_id=eq.${userId}`,
    callback,
    debounceMs: 500, // Debounce for 500ms to batch rapid updates
  });
}

// Subscribe to user's goals changes
export function subscribeToGoals(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return realtimeManager.subscribe({
    table: 'goals',
    filter: `user_id=eq.${userId}`,
    callback,
    debounceMs: 500,
  });
}

// Subscribe to friend requests
export function subscribeToFriendRequests(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return realtimeManager.subscribe({
    table: 'friend_requests',
    filter: `receiver_id=eq.${userId}`,
    event: 'INSERT',
    callback,
  });
}

// Subscribe to notifications
export function subscribeToNotifications(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return realtimeManager.subscribe({
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    event: 'INSERT',
    callback,
  });
}

// Track online presence
export function trackPresence(
  userId: string,
  username: string,
  onlineCallback?: (users: any[]) => void
) {
  return realtimeManager.subscribePresence({
    channel: 'online-users',
    userState: {
      user_id: userId,
      username,
      online_at: new Date().toISOString(),
    },
    onSync: () => {
      if (onlineCallback) {
        const channel = (realtimeManager as any).channels.get('online-users');
        if (channel) {
          const state = channel.presenceState();
          const users = Object.values(state).flat();
          onlineCallback(users);
        }
      }
    },
  });
}

// Broadcast typing indicator
export function broadcastTyping(channelId: string, userId: string, isTyping: boolean) {
  realtimeManager.broadcast(`chat:${channelId}`, 'typing', {
    user_id: userId,
    is_typing: isTyping,
  });
}

// Subscribe to typing indicators
export function subscribeToTyping(
  channelId: string,
  callback: (payload: { user_id: string; is_typing: boolean }) => void
) {
  return realtimeManager.subscribeBroadcast(`chat:${channelId}`, 'typing', callback);
}

// Export the manager for advanced use cases
export { RealtimeManager };
