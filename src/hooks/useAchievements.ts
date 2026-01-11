import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  tier: string;
  is_secret: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement: Achievement;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  active_date: string;
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
}

export function useAchievements() {
  const { user, profile, updateProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<UserAchievement[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<ChallengeProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAchievements = useCallback(async () => {
    // Fetch all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (allAchievements) {
      setAchievements(allAchievements);
    }

    // Fetch user's earned achievements
    if (user) {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select(`
          id,
          achievement_id,
          unlocked_at,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id);

      if (userAchievements) {
        setEarnedAchievements(userAchievements as unknown as UserAchievement[]);
      }
    }
  }, [user]);

  const fetchDailyChallenges = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: challenges, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('active_date', today);

      // Handle table not existing gracefully
      if (error) {
        console.log('Daily challenges table not available:', error.message);
        setDailyChallenges([]);
        return;
      }

      if (challenges) {
        setDailyChallenges(challenges);
      }

      // Fetch user's challenge progress
      if (user && challenges && challenges.length > 0) {
        const { data: progress } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('challenge_id', challenges.map(c => c.id));

        if (progress) {
          setChallengeProgress(progress);
        }
      }
    } catch (err) {
      console.log('Error fetching daily challenges:', err);
      setDailyChallenges([]);
    }
  }, [user]);

  const checkAndAwardAchievements = useCallback(async () => {
    if (!user || !profile || achievements.length === 0) return;

    const earnedIds = new Set(earnedAchievements.map(ea => ea.achievement_id));
    const newlyEarned: Achievement[] = [];

    for (const achievement of achievements) {
      if (earnedIds.has(achievement.id)) continue;

      let earned = false;
      
      switch (achievement.requirement_type) {
        case 'habit_completions':
          earned = profile.total_habits_completed >= achievement.requirement_value;
          break;
        case 'streak':
          earned = profile.longest_streak >= achievement.requirement_value;
          break;
        case 'level':
          earned = profile.level >= achievement.requirement_value;
          break;
        case 'total_xp':
          earned = profile.total_xp >= achievement.requirement_value;
          break;
        case 'goals_completed':
          // Would need to query goals table for this
          break;
        case 'friends':
          // Would need to query friendships table for this
          break;
      }

      if (earned) {
        const { error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
          });

        if (!error) {
          newlyEarned.push(achievement);
          
          // Award XP for the achievement
          const newXp = (profile.xp || 0) + achievement.xp_reward;
          let newLevel = profile.level;
          let remainingXp = newXp;
          
          while (remainingXp >= 500) {
            remainingXp -= 500;
            newLevel++;
          }

          await updateProfile({ xp: remainingXp, level: newLevel });
        }
      }
    }

    if (newlyEarned.length > 0) {
      for (const achievement of newlyEarned) {
        toast({
          title: `🏆 Achievement Unlocked!`,
          description: `${achievement.icon} ${achievement.name} - +${achievement.xp_reward} XP`,
        });
      }
      fetchAchievements();
    }
  }, [user, profile, achievements, earnedAchievements, updateProfile, toast, fetchAchievements]);

  const updateChallengeProgress = async (challengeId: string, newProgress: number) => {
    if (!user) return;

    const challenge = dailyChallenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const existingProgress = challengeProgress.find(p => p.challenge_id === challengeId);
    const completed = newProgress >= challenge.target_value;

    if (existingProgress) {
      const { error } = await supabase
        .from('user_challenge_progress')
        .update({
          progress: newProgress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', existingProgress.id);

      if (!error && completed && !existingProgress.completed) {
        // Award XP for completing the challenge
        if (profile) {
          const newXp = profile.xp + challenge.xp_reward;
          let newLevel = profile.level;
          let remainingXp = newXp;
          
          while (remainingXp >= 500) {
            remainingXp -= 500;
            newLevel++;
          }

          await updateProfile({ xp: remainingXp, level: newLevel });
        }

        toast({
          title: '🎯 Challenge Completed!',
          description: `${challenge.icon} ${challenge.title} - +${challenge.xp_reward} XP`,
        });
      }
    } else {
      const { error } = await supabase
        .from('user_challenge_progress')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          progress: newProgress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        });

      if (!error && completed && profile) {
        const newXp = profile.xp + challenge.xp_reward;
        let newLevel = profile.level;
        let remainingXp = newXp;
        
        while (remainingXp >= 500) {
          remainingXp -= 500;
          newLevel++;
        }

        await updateProfile({ xp: remainingXp, level: newLevel });

        toast({
          title: '🎯 Challenge Completed!',
          description: `${challenge.icon} ${challenge.title} - +${challenge.xp_reward} XP`,
        });
      }
    }

    fetchDailyChallenges();
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAchievements(), fetchDailyChallenges()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchAchievements, fetchDailyChallenges]);

  // Check for new achievements when profile changes
  useEffect(() => {
    if (profile && achievements.length > 0) {
      checkAndAwardAchievements();
    }
  }, [profile?.total_habits_completed, profile?.longest_streak, profile?.level, profile?.total_xp]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-400';
      case 'silver': return 'text-slate-400';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-cyan-400';
      case 'diamond': return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  const getTierBg = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-500/20';
      case 'silver': return 'bg-slate-400/20';
      case 'gold': return 'bg-yellow-500/20';
      case 'platinum': return 'bg-cyan-400/20';
      case 'diamond': return 'bg-gradient-to-br from-purple-500/30 to-pink-500/30';
      default: return 'bg-muted/20';
    }
  };

  return {
    achievements,
    earnedAchievements,
    dailyChallenges,
    challengeProgress,
    isLoading,
    updateChallengeProgress,
    checkAndAwardAchievements,
    getTierColor,
    getTierBg,
    refetch: () => Promise.all([fetchAchievements(), fetchDailyChallenges()]),
  };
}