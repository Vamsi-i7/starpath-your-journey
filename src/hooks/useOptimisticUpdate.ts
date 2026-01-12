import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

/**
 * Hook for optimistic updates with automatic rollback on error
 * Improves perceived performance by updating UI immediately
 */

interface OptimisticUpdateOptions<T> {
  queryKey: string[];
  updateFn: (oldData: T) => T;
  mutationFn: () => Promise<any>;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticUpdate<T>() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const performUpdate = async ({
    queryKey,
    updateFn,
    mutationFn,
    successMessage,
    errorMessage,
  }: OptimisticUpdateOptions<T>) => {
    // Store old data for rollback
    const previousData = queryClient.getQueryData<T>(queryKey);

    try {
      // Optimistically update
      queryClient.setQueryData<T>(queryKey, (old) => {
        if (!old) return old;
        return updateFn(old);
      });

      // Perform actual mutation
      await mutationFn();

      // Show success toast
      if (successMessage) {
        toast({
          title: 'Success',
          description: successMessage,
        });
      }

      // Invalidate to refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);

      // Show error toast
      toast({
        title: 'Error',
        description: errorMessage || 'Something went wrong',
        variant: 'destructive',
      });

      throw error;
    }
  };

  return { performUpdate };
}

// Specific optimistic update hooks for common operations

export function useOptimisticHabitToggle() {
  const { performUpdate } = useOptimisticUpdate<any[]>();

  const toggleHabit = async (habitId: string, date: string, mutationFn: () => Promise<any>) => {
    await performUpdate({
      queryKey: ['habits'],
      updateFn: (habits) => {
        return habits.map((habit) => {
          if (habit.id === habitId) {
            const completedDates = [...habit.completedDates];
            const index = completedDates.indexOf(date);
            
            if (index > -1) {
              completedDates.splice(index, 1);
            } else {
              completedDates.push(date);
            }
            
            return { ...habit, completedDates };
          }
          return habit;
        });
      },
      mutationFn,
      successMessage: 'Habit updated!',
    });
  };

  return { toggleHabit };
}

export function useOptimisticGoalUpdate() {
  const { performUpdate } = useOptimisticUpdate<any[]>();

  const updateGoalProgress = async (
    goalId: string,
    newProgress: number,
    mutationFn: () => Promise<any>
  ) => {
    await performUpdate({
      queryKey: ['goals'],
      updateFn: (goals) => {
        return goals.map((goal) =>
          goal.id === goalId ? { ...goal, progress: newProgress } : goal
        );
      },
      mutationFn,
      successMessage: 'Progress updated!',
    });
  };

  return { updateGoalProgress };
}
