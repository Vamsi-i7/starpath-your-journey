import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/errorLogger';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: string;
  xp_reward: number;
  streak: number;
  created_at: string;
  completedDates: string[];
}

export function useHabits() {
  const { user, profile, updateProfile } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const fetchHabits = async () => {
    if (!user) {
      setHabits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Fetch habits
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (habitsError) {
      logError('Habits Fetch', habitsError);
      setIsLoading(false);
      return;
    }

    // Fetch completions for all habits
    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('habit_id, completed_date')
      .eq('user_id', user.id);

    if (completionsError) {
      logError('Completions Fetch', completionsError);
    }

    // Map completions to habits
    const habitsWithCompletions: Habit[] = (habitsData || []).map(habit => ({
      ...habit,
      completedDates: (completionsData || [])
        .filter(c => c.habit_id === habit.id)
        .map(c => c.completed_date),
    }));

    setHabits(habitsWithCompletions);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHabits();
  }, [user]);

  const addHabit = async (habitData: {
    name: string;
    description: string;
    icon: string;
    color: string;
    frequency: 'daily' | 'weekly';
    xp_reward: number;
  }) => {
    if (!user) return;

    // Input validation
    const allowedColors = ['primary', 'secondary', 'streak', 'destructive'];
    const allowedIcons = ['🧘', '📚', '💪', '💻', '✍️', '🎯', '🌅', '💧', '🥗', '😴', '🎨', '🎵'];
    
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
    
    // Validate icon
    if (!allowedIcons.includes(habitData.icon)) {
      toast({
        title: 'Invalid icon',
        description: 'Please select a valid icon.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate color
    if (!allowedColors.includes(habitData.color)) {
      toast({
        title: 'Invalid color',
        description: 'Please select a valid color.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('habits')
      .insert({
        name: habitData.name.trim().slice(0, 100),
        description: habitData.description?.trim().slice(0, 500) || null,
        icon: habitData.icon,
        color: habitData.color,
        frequency: habitData.frequency,
        xp_reward: habitData.xp_reward,
        user_id: user.id,
      });

    if (error) {
      toast({
        title: 'Error creating habit',
        description: error.message,
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
      toast({
        title: 'Error deleting habit',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setHabits(habits.filter(h => h.id !== id));
    }
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
        .eq('completed_date', today);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Update streak
      await supabase
        .from('habits')
        .update({ streak: Math.max(0, habit.streak - 1) })
        .eq('id', habitId);

      // Decrease XP
      const newXp = Math.max(0, profile.xp - habit.xp_reward);
      await updateProfile({ xp: newXp });

    } else {
      // Add completion
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_date: today,
        });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Update streak
      const newStreak = habit.streak + 1;
      await supabase
        .from('habits')
        .update({ streak: newStreak })
        .eq('id', habitId);

      // Add XP and check for level up
      let newXp = profile.xp + habit.xp_reward;
      let newLevel = profile.level;
      const xpPerLevel = 500;

      while (newXp >= xpPerLevel) {
        newXp -= xpPerLevel;
        newLevel++;
      }

      // Check for heart bonus (every 7-day streak)
      let newHearts = profile.hearts;
      if (newStreak % 7 === 0 && newHearts < profile.max_hearts) {
        newHearts++;
        toast({
          title: '❤️ Heart Earned!',
          description: '7-day streak bonus!',
        });
      }

      await updateProfile({ 
        xp: newXp, 
        level: newLevel,
        hearts: newHearts,
        total_habits_completed: profile.total_habits_completed + 1,
        longest_streak: Math.max(profile.longest_streak, newStreak),
      });

      toast({
        title: '🎉 Habit completed!',
        description: `+${habit.xp_reward} XP earned`,
      });
    }

    fetchHabits();
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
