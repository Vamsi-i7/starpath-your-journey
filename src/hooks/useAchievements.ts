import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  rarity: string;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
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
          earned_at,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id);

      if (userAchievements) {
        setEarnedAchievements(userAchievements as unknown as UserAchievement[]);
      }
    }
  }, [user]);

  const fetchDailyChallenges = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: challenges } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('active_date', today);

    if (challenges) {
      setDailyChallenges(challenges);
    }

    // Fetch user's challenge progress
    if (user && challenges) {
      const { data: progress } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('challenge_id', challenges.map(c => c.id));

      if (progress) {
        setChallengeProgress(progress);
      }
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
        case 'habits_completed':
          earned = profile.total_habits_completed >= achievement.requirement_value;
          break;
        case 'streak_days':
          earned = profile.longest_streak >= achievement.requirement_value;
          break;
        case 'level_reached':
          earned = profile.level >= achievement.requirement_value;
          break;
        case 'hearts_earned':
          earned = profile.hearts >= achievement.requirement_value;
          break;
        case 'goals_completed':
          // Would need to query goals table for this
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
  }, [profile?.total_habits_completed, profile?.longest_streak, profile?.level, profile?.hearts]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-muted-foreground';
      case 'rare': return 'text-primary';
      case 'epic': return 'text-accent';
      case 'legendary': return 'text-star';
      default: return 'text-muted-foreground';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-muted/20';
      case 'rare': return 'bg-primary/20';
      case 'epic': return 'bg-accent/20';
      case 'legendary': return 'bg-gradient-to-br from-star/30 to-streak/30';
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
    getRarityColor,
    getRarityBg,
    refetch: () => Promise.all([fetchAchievements(), fetchDailyChallenges()]),
  };
}