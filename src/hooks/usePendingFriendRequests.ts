import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';

export const usePendingFriendRequests = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setCount(0);
      return;
    }

    // Fetch initial count
    const fetchCount = async () => {
      const { count: pendingCount, error } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (!error && pendingCount !== null) {
        setCount(pendingCount);
      }
    };

    fetchCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('pending-requests-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        (payload) => {
          const newRecord = payload.new as { friend_id?: string; status?: string } | null;
          const oldRecord = payload.old as { friend_id?: string; status?: string } | null;

          // Check if this affects the current user's pending requests
          const affectsUser =
            (newRecord?.friend_id === user.id) ||
            (oldRecord?.friend_id === user.id);

          if (affectsUser) {
            // Refetch count
            fetchCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return count;
};
