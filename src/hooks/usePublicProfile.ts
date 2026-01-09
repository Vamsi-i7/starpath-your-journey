import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useToast } from '@/hooks/use-toast';

export interface PublicProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  level: number;
  xp: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  total_habits_completed: number | null;
  total_goals_completed: number | null;
  is_premium: boolean;
  premium_tier: string;
  member_since: string;
  last_active: string;
}

export const usePublicProfile = (userId?: string) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Profile not found or private');
        return;
      }

      setProfile(data as PublicProfile);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error fetching profile:', error);
      }
      setError(error.message || 'Failed to load profile');
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
  };
};
