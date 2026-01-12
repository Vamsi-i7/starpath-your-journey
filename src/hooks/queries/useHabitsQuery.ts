import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { toast } from 'sonner';
import { Habit } from '@/hooks/useHabits';

/**
 * React Query version of useHabits hook
 * Provides better caching, automatic refetching, and optimistic updates
 */

// Fetch habits with completions
async function fetchHabitsWithCompletions(userId: string) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

  const [habitsResult, completionsResult] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('habit_completions')
      .select('habit_id, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', dateFilter)
  ]);

  if (habitsResult.error) throw habitsResult.error;
  if (completionsResult.error) throw completionsResult.error;

  const habitsWithCompletions: Habit[] = (habitsResult.data || []).map(habit => ({
    ...habit,
    completedDates: (completionsResult.data || [])
      .filter(c => c.habit_id === habit.id)
      .map(c => c.completed_at ? new Date(c.completed_at).toISOString().split('T')[0] : ''),
  }));

  return habitsWithCompletions;
}

// Main hook for fetching habits
export function useHabitsQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.habits.list(user?.id || ''),
    queryFn: () => fetchHabitsWithCompletions(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Add habit mutation
export function useAddHabitMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitData: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      frequency?: 'daily' | 'weekly';
      difficulty?: 'easy' | 'medium' | 'hard';
      xp_reward?: number;
      category_id?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const difficultyXP: Record<string, number> = {
        easy: 5,
        medium: 10,
        hard: 20,
      };
      const xpReward = habitData.xp_reward || difficultyXP[habitData.difficulty || 'medium'] || 10;

      const { data, error } = await supabase
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
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, completedDates: [] };
    },
    onMutate: async (newHabit) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list(user!.id) });

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(queryKeys.habits.list(user!.id));

      // Optimistically update
      if (previousHabits) {
        queryClient.setQueryData<Habit[]>(
          queryKeys.habits.list(user!.id),
          [...previousHabits, {
            id: 'temp-' + Date.now(),
            name: newHabit.name,
            user_id: user!.id,
            completedDates: [],
            ...newHabit,
          } as any]
        );
      }

      return { previousHabits };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.list(user!.id), context.previousHabits);
      }
      toast.error('Failed to add habit', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    },
    onSuccess: () => {
      toast.success('Habit created successfully!');
      invalidateQueries.habits();
      invalidateQueries.analytics();
    },
  });
}

// Delete habit mutation
export function useDeleteHabitMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list(user!.id) });

      const previousHabits = queryClient.getQueryData<Habit[]>(queryKeys.habits.list(user!.id));

      if (previousHabits) {
        queryClient.setQueryData<Habit[]>(
          queryKeys.habits.list(user!.id),
          previousHabits.filter(h => h.id !== habitId)
        );
      }

      return { previousHabits };
    },
    onError: (error, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.list(user!.id), context.previousHabits);
      }
      toast.error('Failed to delete habit');
    },
    onSuccess: () => {
      toast.success('Habit deleted');
      invalidateQueries.habits();
      invalidateQueries.analytics();
    },
  });
}

// Toggle habit completion mutation
export function useToggleHabitMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const { data: existingCompletion } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('user_id', user!.id)
        .gte('completed_at', date)
        .lt('completed_at', new Date(new Date(date).getTime() + 86400000).toISOString())
        .maybeSingle();

      if (existingCompletion) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existingCompletion.id);
        
        if (error) throw error;
        return { action: 'removed', date };
      } else {
        // Add completion
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user!.id,
            completed_at: new Date(date).toISOString(),
          });
        
        if (error) throw error;
        return { action: 'added', date };
      }
    },
    onMutate: async ({ habitId, date }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list(user!.id) });

      const previousHabits = queryClient.getQueryData<Habit[]>(queryKeys.habits.list(user!.id));

      if (previousHabits) {
        const updatedHabits = previousHabits.map(habit => {
          if (habit.id === habitId) {
            const hasCompletion = habit.completedDates.includes(date);
            return {
              ...habit,
              completedDates: hasCompletion
                ? habit.completedDates.filter(d => d !== date)
                : [...habit.completedDates, date],
            };
          }
          return habit;
        });

        queryClient.setQueryData<Habit[]>(queryKeys.habits.list(user!.id), updatedHabits);
      }

      return { previousHabits };
    },
    onError: (error, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.list(user!.id), context.previousHabits);
      }
      toast.error('Failed to update habit');
    },
    onSuccess: (result) => {
      // Silent success for better UX
      invalidateQueries.habits();
      invalidateQueries.analytics();
    },
  });
}
