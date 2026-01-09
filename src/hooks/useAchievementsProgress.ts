import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AchievementProgress {
  achievement_id: string;
  achievement_name: string;
  achievement_description: string;
  achievement_icon: string;
  achievement_type: string;
  tier: string;
  xp_reward: number;
  current_value: number;
  target_value: number;
  progress_percentage: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

export const useAchievementsProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAchievements = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_achievement_progress', {
        p_user_id: user.id,
      });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error fetching achievements:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to load achievements',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  const checkAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: user.id,
      });

      if (error) throw error;

      // Show notifications for newly unlocked achievements
      if (data && data.length > 0) {
        data.forEach((achievement: any) => {
          if (achievement.newly_unlocked) {
            toast({
              title: `🏆 Achievement Unlocked!`,
              description: `${achievement.achievement_name} - +${achievement.xp_reward} XP`,
              duration: 5000,
            });
          }
        });
        
        // Refresh achievements list
        fetchAchievements();
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error checking achievements:', error);
      }
    }
  };

  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return {
    achievements,
    isLoading,
    unlockedCount,
    totalCount,
    completionPercentage,
    fetchAchievements,
    checkAchievements,
  };
};
