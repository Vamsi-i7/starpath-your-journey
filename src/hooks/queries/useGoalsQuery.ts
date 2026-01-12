import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { toast } from 'sonner';
import { Goal, Task } from '@/hooks/useGoals';

/**
 * React Query version of useGoals hook
 */

// Fetch goals with tasks
async function fetchGoalsWithTasks(userId: string) {
  const [goalsResult, tasksResult] = await Promise.all([
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
  ]);

  if (goalsResult.error) throw goalsResult.error;
  if (tasksResult.error) throw tasksResult.error;

  // Build task tree
  const buildTaskTree = (tasks: any[], parentId: string | null = null): Task[] => {
    return tasks
      .filter(t => t.parent_task_id === parentId)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map(task => ({
        ...task,
        subtasks: buildTaskTree(tasks, task.id),
      }));
  };

  // Count all tasks recursively
  const countAllTasks = (tasks: Task[]): { total: number; completed: number } => {
    let total = 0;
    let completed = 0;
    
    const countRecursive = (taskList: Task[]) => {
      for (const task of taskList) {
        total++;
        if (task.completed) completed++;
        if (task.subtasks && task.subtasks.length > 0) {
          countRecursive(task.subtasks);
        }
      }
    };
    
    countRecursive(tasks);
    return { total, completed };
  };

  const goalsWithTasks: Goal[] = (goalsResult.data || []).map(goal => {
    const goalTasks = (tasksResult.data || []).filter(t => t.goal_id === goal.id);
    const nestedTasks = buildTaskTree(goalTasks, null);
    const { total, completed: completedCount } = countAllTasks(nestedTasks);
    const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    
    let status: Goal['status'] = goal.status || 'active';
    if (progress === 100 && status !== 'archived') {
      status = 'completed';
    }

    let goalType: Goal['goal_type'] = 'short_term';
    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      const now = new Date();
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline > 30) {
        goalType = 'long_term';
      }
    }

    return {
      ...goal,
      tasks: nestedTasks,
      progress,
      status,
      goal_type: goalType,
    };
  });

  return goalsWithTasks;
}

// Main hook for fetching goals
export function useGoalsQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.goals.list(user?.id || ''),
    queryFn: () => fetchGoalsWithTasks(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Add goal mutation
export function useAddGoalMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalData: {
      title: string;
      description: string;
      deadline?: string;
      tasks: { title: string; due_date?: string }[];
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goalData.title.trim(),
          description: goalData.description.trim(),
          deadline: goalData.deadline || null,
          status: 'active',
          progress: 0,
        })
        .select()
        .single();

      if (goalError) throw goalError;

      if (goalData.tasks.length > 0) {
        const tasksToInsert = goalData.tasks.map((task, index) => ({
          goal_id: goal.id,
          user_id: user.id,
          title: task.title.trim(),
          due_date: task.due_date || null,
          completed: false,
          position: index,
          parent_task_id: null,
        }));

        const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);
        if (tasksError) throw tasksError;
      }

      return goal;
    },
    onSuccess: () => {
      toast.success('Goal created successfully!');
      invalidateQueries.goals();
      invalidateQueries.analytics();
    },
    onError: (error) => {
      toast.error('Failed to create goal', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    },
  });
}

// Toggle task mutation
export function useToggleTaskMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onMutate: async ({ taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.list(user!.id) });

      const previousGoals = queryClient.getQueryData<Goal[]>(queryKeys.goals.list(user!.id));

      if (previousGoals) {
        const updatedGoals = previousGoals.map(goal => {
          const updateTaskRecursive = (tasks: Task[]): Task[] => {
            return tasks.map(task => {
              if (task.id === taskId) {
                return { ...task, completed };
              }
              if (task.subtasks && task.subtasks.length > 0) {
                return {
                  ...task,
                  subtasks: updateTaskRecursive(task.subtasks),
                };
              }
              return task;
            });
          };

          const updatedTasks = updateTaskRecursive(goal.tasks);
          
          // Recalculate progress
          const countTasks = (tasks: Task[]): { total: number; completed: number } => {
            let total = 0;
            let completed = 0;
            const count = (taskList: Task[]) => {
              for (const t of taskList) {
                total++;
                if (t.completed) completed++;
                if (t.subtasks?.length) count(t.subtasks);
              }
            };
            count(tasks);
            return { total, completed };
          };

          const { total, completed: completedCount } = countTasks(updatedTasks);
          const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

          return {
            ...goal,
            tasks: updatedTasks,
            progress,
          };
        });

        queryClient.setQueryData<Goal[]>(queryKeys.goals.list(user!.id), updatedGoals);
      }

      return { previousGoals };
    },
    onError: (error, variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(queryKeys.goals.list(user!.id), context.previousGoals);
      }
      toast.error('Failed to update task');
    },
    onSuccess: () => {
      invalidateQueries.goals();
      invalidateQueries.analytics();
    },
  });
}

// Delete goal mutation
export function useDeleteGoalMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onMutate: async (goalId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.list(user!.id) });

      const previousGoals = queryClient.getQueryData<Goal[]>(queryKeys.goals.list(user!.id));

      if (previousGoals) {
        queryClient.setQueryData<Goal[]>(
          queryKeys.goals.list(user!.id),
          previousGoals.filter(g => g.id !== goalId)
        );
      }

      return { previousGoals };
    },
    onError: (error, variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(queryKeys.goals.list(user!.id), context.previousGoals);
      }
      toast.error('Failed to delete goal');
    },
    onSuccess: () => {
      toast.success('Goal deleted');
      invalidateQueries.goals();
      invalidateQueries.analytics();
    },
  });
}
