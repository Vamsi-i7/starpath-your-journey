import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/errorLogger';
import { getDisplayErrorMessage } from '@/lib/errorMessages';
import { triggerStarConfetti, triggerCelebrationBurst } from '@/lib/confetti';

export interface Habit {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  difficulty: string;
  frequency: string;
  target_count: number;
  xp_reward: number;
  is_active: boolean;
  streak: number;
  best_streak: number;
  total_completions: number;
  created_at: string;
  updated_at: string;
  completedDates: string[];
}

export function useHabits() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const getYesterdayString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const fetchHabits = async () => {
    if (!user) {
      setHabits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Fetch only active habits and recent completions (last 90 days) for better performance
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

      const [habitsResult, completionsResult] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('habit_completions')
          .select('habit_id, completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', dateFilter)
      ]);

      const { data: habitsData, error: habitsError } = habitsResult;
      const { data: completionsData, error: completionsError } = completionsResult;

      if (habitsError) {
        logError('Habits Fetch', habitsError);
        setIsLoading(false);
        return;
      }

      if (completionsError) {
        logError('Completions Fetch', completionsError);
      }

      // Map completions to habits
      const habitsWithCompletions: Habit[] = (habitsData || []).map(habit => ({
        ...habit,
        completedDates: (completionsData || [])
          .filter(c => c.habit_id === habit.id)
          .map(c => c.completed_at ? new Date(c.completed_at).toISOString().split('T')[0] : ''),
      }));

      setHabits(habitsWithCompletions);
    } catch (error) {
      logError('Habits Fetch Unexpected', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [user]);

  const addHabit = async (habitData: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    frequency?: 'daily' | 'weekly';
    difficulty?: 'easy' | 'medium' | 'hard';
    xp_reward?: number;
    category_id?: string;
  }) => {
    if (!user) return;

    // Validate name (max 100 chars)
    if (!habitData.name || habitData.name.length > 100) {
      toast({
        title: 'Invalid habit name',
        description: 'Name must be between 1 and 100 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate description (max 500 chars)
    if (habitData.description && habitData.description.length > 500) {
      toast({
        title: 'Description too long',
        description: 'Description must be less than 500 characters.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate XP based on difficulty
    const difficultyXP: Record<string, number> = {
      easy: 5,
      medium: 10,
      hard: 20,
    };
    const xpReward = habitData.xp_reward || difficultyXP[habitData.difficulty || 'medium'] || 10;

    // New habits start with streak 0
    const { error } = await supabase
      .from('habits')
      .insert({
        name: habitData.name.trim().slice(0, 100),
        description: habitData.description?.trim().slice(0, 500) || null,
        icon: habitData.icon || '✓',
        color: habitData.color || '#6366f1',
        frequency: habitData.frequency || 'daily',
        difficulty: habitData.difficulty || 'medium',
        xp_reward: xpReward,
        user_id: user.id,
        category_id: habitData.category_id || null,
        streak: 0,
        best_streak: 0,
        total_completions: 0,
        is_active: true,
      });

    if (error) {
      logError('Habit Create', error);
      toast({
        title: 'Error creating habit',
        description: getDisplayErrorMessage(error, 'habit'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Habit created!',
        description: `"${habitData.name}" has been added`,
      });
      fetchHabits();
    }
  };

  const deleteHabit = async (id: string) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) {
      logError('Habit Delete', error);
      toast({
        title: 'Error deleting habit',
        description: getDisplayErrorMessage(error, 'habit'),
        variant: 'destructive',
      });
    } else {
      setHabits(habits.filter(h => h.id !== id));
    }
  };

  // Calculate consecutive streak days across all habits
  const calculateTotalConsecutiveStreakDays = async (): Promise<number> => {
    if (!user) return 0;

    const { data: completions, error } = await supabase
      .from('habit_completions')
      .select('completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (error || !completions || completions.length === 0) return 0;

    // Get unique dates
    const uniqueDates = [...new Set(completions.map(c => c.completed_at ? new Date(c.completed_at).toISOString().split('T')[0] : ''))].filter(d => d).sort().reverse();
    
    if (uniqueDates.length === 0) return 0;

    // Check if today or yesterday has a completion (to count current streak)
    const today = getTodayString();
    const yesterday = getYesterdayString();
    
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0; // Streak is broken
    }

    // Count consecutive days
    let streakDays = 0;
    let currentDate = new Date(uniqueDates[0]);
    
    for (const dateStr of uniqueDates) {
      const checkDate = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streakDays++;
        currentDate = checkDate;
      } else {
        break;
      }
    }

    return streakDays;
  };

  const toggleHabitCompletion = async (habitId: string) => {
    if (!user || !profile) return;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = getTodayString();
    const isCompleted = habit.completedDates.includes(today);

    if (isCompleted) {
      // Remove completion
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`);

      if (error) {
        logError('Habit Completion Remove', error);
        toast({
          title: 'Error',
          description: getDisplayErrorMessage(error, 'habit'),
          variant: 'destructive',
        });
        return;
      }

      // Update habit streak
      const newStreak = Math.max(0, habit.streak - 1);
      await supabase
        .from('habits')
        .update({ streak: newStreak })
        .eq('id', habitId);

      // Decrease XP
      const newXp = Math.max(0, (profile.xp || 0) - habit.xp_reward);
      await updateProfile({ xp: newXp });

    } else {
      // Add completion
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_at: new Date().toISOString(),
          xp_earned: habit.xp_reward,
        });

      if (error) {
        logError('Habit Completion Add', error);
        toast({
          title: 'Error',
          description: getDisplayErrorMessage(error, 'habit'),
          variant: 'destructive',
        });
        return;
      }

      // Update habit streak and total completions
      const newStreak = habit.streak + 1;
      const newBestStreak = Math.max(habit.best_streak || 0, newStreak);
      await supabase
        .from('habits')
        .update({ 
          streak: newStreak,
          best_streak: newBestStreak,
          total_completions: (habit.total_completions || 0) + 1,
        })
        .eq('id', habitId);

      // Add XP and check for level up
      let newXp = (profile.xp || 0) + habit.xp_reward;
      let newTotalXp = (profile.total_xp || 0) + habit.xp_reward;
      let newLevel = profile.level || 1;
      const xpPerLevel = 500;

      while (newXp >= xpPerLevel) {
        newXp -= xpPerLevel;
        newLevel++;
      }

      // Calculate total consecutive streak days
      const totalStreakDays = await calculateTotalConsecutiveStreakDays();

      // Update longest streak if this is a new record
      const newLongestStreak = Math.max(profile.longest_streak || 0, newStreak);

      await updateProfile({ 
        xp: newXp, 
        total_xp: newTotalXp,
        level: newLevel,
        streak: totalStreakDays,
        longest_streak: newLongestStreak,
        last_activity_date: today,
      });

      // Level up celebration
      if (newLevel > (profile.level || 1)) {
        triggerCelebrationBurst();
        toast({
          title: `🚀 Level Up! You're now Level ${newLevel}`,
          description: `+${habit.xp_reward} XP earned`,
        });
      } else {
        toast({
          title: '🎉 Habit completed!',
          description: `+${habit.xp_reward} XP earned`,
        });
      }
    }

    // Update local state immediately (optimistic update)
    setHabits(prevHabits => 
      prevHabits.map(h => {
        if (h.id === habitId) {
          const today = getTodayString();
          const isCompleted = h.completedDates.includes(today);
          return {
            ...h,
            completedDates: isCompleted
              ? h.completedDates.filter(d => d !== today)
              : [...h.completedDates, today],
            streak: isCompleted ? Math.max(0, h.streak - 1) : h.streak + 1,
            total_completions: isCompleted 
              ? Math.max(0, (h.total_completions || 0) - 1) 
              : (h.total_completions || 0) + 1,
          };
        }
        return h;
      })
    );

    // Refresh profile data to update XP/level in background
    await refreshProfile();
  };

  return {
    habits,
    isLoading,
    addHabit,
    deleteHabit,
    toggleHabitCompletion,
    getTodayString,
    refetch: fetchHabits,
  };
}