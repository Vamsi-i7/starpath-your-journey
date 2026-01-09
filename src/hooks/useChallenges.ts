import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Challenge {
  id: string;
  creator_id: string;
  challenger_id: string;
  challenge_type: string;
  target_value: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: string;
  winner_id: string | null;
  creator_progress: number;
  challenger_progress: number;
  metadata: Record<string, any>;
  creator?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  challenger?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const useChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChallenges = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('friend_challenges')
        .select(`
          *,
          creator:creator_id(username, display_name, avatar_url),
          challenger:challenger_id(username, display_name, avatar_url)
        `)
        .or(`creator_id.eq.${user.id},challenger_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error fetching challenges:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to load challenges',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const createChallenge = async (
    challengerId: string,
    challengeType: string,
    targetValue: number,
    durationDays: number
  ) => {
    if (!user) return null;

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const { data, error } = await supabase
        .from('friend_challenges')
        .insert({
          creator_id: user.id,
          challenger_id: challengerId,
          challenge_type: challengeType,
          target_value: targetValue,
          duration_days: durationDays,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Challenge Sent!',
        description: 'Your friend will be notified',
      });

      fetchChallenges();
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create challenge',
        variant: 'destructive',
      });
      return null;
    }
  };

  const respondToChallenge = async (challengeId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friend_challenges')
        .update({
          status: accept ? 'active' : 'declined',
        })
        .eq('id', challengeId)
        .eq('challenger_id', user?.id);

      if (error) throw error;

      toast({
        title: accept ? 'Challenge Accepted!' : 'Challenge Declined',
        description: accept ? 'Good luck! 🔥' : 'Challenge declined',
      });

      fetchChallenges();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to respond to challenge',
        variant: 'destructive',
      });
    }
  };

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const pendingChallenges = challenges.filter(c => c.status === 'pending' && c.challenger_id === user?.id);
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  return {
    challenges,
    activeChallenges,
    pendingChallenges,
    completedChallenges,
    isLoading,
    fetchChallenges,
    createChallenge,
    respondToChallenge,
  };
};
