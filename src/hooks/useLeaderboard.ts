import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  level: number;
  score: number;
  rank: number;
  is_current_user: boolean;
}

export const useLeaderboard = (timeframe: 'all_time' | 'weekly' = 'all_time') => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  const fetchLeaderboard = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_friend_leaderboard', {
        p_user_id: user.id,
        p_timeframe: timeframe,
      });

      if (error) throw error;
      
      const leaderboardData = data || [];
      setEntries(leaderboardData);
      
      const currentUser = leaderboardData.find((e: LeaderboardEntry) => e.is_current_user);
      setCurrentUserRank(currentUser?.rank || null);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error fetching leaderboard:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to load leaderboard',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user, timeframe]);

  return {
    entries,
    isLoading,
    currentUserRank,
    refresh: fetchLeaderboard,
  };
};
