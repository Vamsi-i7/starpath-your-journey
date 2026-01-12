import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';

interface SessionHistoryItem {
  id: string;
  duration_seconds: number;
  xp_earned: number;
  session_type: string;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export function useSessionHistory(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-history', user?.id, limit],
    queryFn: async (): Promise<SessionHistoryItem[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useSessionStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-stats', user?.id],
    queryFn: async () => {
      if (!user) return { totalSessions: 0, totalMinutes: 0, totalXp: 0 };

      const { data, error } = await supabase
        .from('sessions')
        .select('duration_seconds, xp_earned')
        .eq('user_id', user.id);

      if (error) throw error;

      const totalSessions = data?.length || 0;
      const totalMinutes = data?.reduce((acc, s) => acc + Math.floor((s.duration_seconds || 0) / 60), 0) || 0;
      const totalXp = data?.reduce((acc, s) => acc + (s.xp_earned || 0), 0) || 0;

      return { totalSessions, totalMinutes, totalXp };
    },
    enabled: !!user,
  });
}
