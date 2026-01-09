import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';

interface OnlineUser {
  user_id: string;
  username: string;
  online_at: string;
}

export const useOnlinePresence = () => {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id || !profile?.username) return;

    // Create a global presence channel
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.keys(state).forEach((key) => {
          online.add(key);
        });
        
        setOnlineUsers(online);
        if (import.meta.env.DEV) {
          console.log('Online users:', Array.from(online));
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (import.meta.env.DEV) {
          console.log('User came online:', key);
        }
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (import.meta.env.DEV) {
          console.log('User went offline:', key);
        }
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: user.id,
            username: profile.username,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Handle page visibility changes
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await channel.untrack();
      } else {
        await channel.track({
          user_id: user.id,
          username: profile.username,
          online_at: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload to clean up presence
    const handleBeforeUnload = () => {
      channel.untrack();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.username]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    onlineUsers,
    isUserOnline,
  };
};
