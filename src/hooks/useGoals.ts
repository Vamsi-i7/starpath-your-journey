import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/errorLogger';
import { getDisplayErrorMessage } from '@/lib/errorMessages';

// Constants for validation
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_TASKS_PER_GOAL = 50;
const MAX_SUBTASK_DEPTH = 3;

export interface Task {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  parent_task_id: string | null;
  due_date: string | null;
  subtasks: Task[];
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
  progress: number;
  status: 'active' | 'completed' | 'archived';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  tasks: Task[];
  goal_type: 'short_term' | 'long_term';
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) {
        logError('Goals Fetch', goalsError);
        toast({
          title: 'Error loading goals',
          description: getDisplayErrorMessage(goalsError, 'goal'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (tasksError) {
        logError('Tasks Fetch', tasksError);
        // Continue with empty tasks rather than failing completely
        console.warn('Failed to fetch tasks, continuing with goals only');
      }

    // Helper function to build nested task structure
    const buildTaskTree = (tasks: any[], parentId: string | null = null): Task[] => {
      return tasks
        .filter(t => t.parent_task_id === parentId)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(task => ({
          ...task,
          subtasks: buildTaskTree(tasks, task.id),
        }));
    };

    // Helper function to count all tasks recursively (including subtasks)
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

    const goalsWithTasks: Goal[] = (goalsData || []).map(goal => {
      const goalTasks = (tasksData || []).filter(t => t.goal_id === goal.id);
      const nestedTasks = buildTaskTree(goalTasks, null);
      const { total, completed: completedCount } = countAllTasks(nestedTasks);
      const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      
      // Determine status based on database status or calculate it
      let status: Goal['status'] = goal.status || 'active';
      if (progress === 100 && status !== 'archived') {
        status = 'completed';
      }

      // Determine goal type based on deadline
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

      setGoals(goalsWithTasks);
    } catch (error) {
      logError('Goals Fetch Unexpected', error);
      toast({
        title: 'Error loading goals',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (goalData: {
    title: string;
    description: string;
    deadline?: string;
    tasks: { title: string; due_date?: string }[];
  }): Promise<boolean> => {
    if (!user) return false;

    const trimmedTitle = goalData.title?.trim() || '';
    if (!trimmedTitle || trimmedTitle.length > 200) {
      toast({
        title: 'Invalid goal title',
        description: 'Title must be between 1 and 200 characters.',
        variant: 'destructive',
      });
      return false;
    }

    const trimmedDescription = goalData.description?.trim() || '';
    if (trimmedDescription.length > 1000) {
      toast({
        title: 'Description too long',
        description: 'Description must be less than 1000 characters.',
        variant: 'destructive',
      });
      return false;
    }

    if (goalData.deadline) {
      const deadlineDate = new Date(goalData.deadline);
      if (isNaN(deadlineDate.getTime())) {
        toast({
          title: 'Invalid deadline',
          description: 'Please provide a valid date.',
          variant: 'destructive',
        });
        return false;
      }
    }

    if (goalData.tasks.length > 50) {
      toast({
        title: 'Too many tasks',
        description: 'Maximum 50 tasks per goal.',
        variant: 'destructive',
      });
      return false;
    }

    for (const task of goalData.tasks) {
      const trimmedTaskTitle = task.title?.trim() || '';
      if (!trimmedTaskTitle || trimmedTaskTitle.length > 200) {
        toast({
          title: 'Invalid task title',
          description: 'Each task title must be between 1 and 200 characters.',
          variant: 'destructive',
        });
        return false;
      }
    }

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert({
        title: trimmedTitle.slice(0, 200),
        description: trimmedDescription.slice(0, 1000) || null,
        deadline: goalData.deadline || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (goalError) {
      logError('Goal Create', goalError);
      toast({
        title: 'Error creating goal',
        description: getDisplayErrorMessage(goalError, 'goal'),
        variant: 'destructive',
      });
      return false;
    }

    if (goalData.tasks.length > 0) {
      const tasksToInsert = goalData.tasks.map(t => ({
        goal_id: goal.id,
        user_id: user.id,
        title: t.title.trim().slice(0, 200),
        due_date: t.due_date || null,
      }));

      const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);
      if (tasksError) {
        logError('Tasks Insert', tasksError);
      }
    }

    toast({
      title: 'Goal created!',
      description: `"${trimmedTitle}" has been added`,
    });

    await fetchGoals();
    return true;
  };

  const updateGoal = async (id: string, updates: {
    title?: string;
    description?: string;
    deadline?: string | null;
  }): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logError('Goal Update', error);
      toast({
        title: 'Error updating goal',
        description: getDisplayErrorMessage(error, 'goal'),
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Goal updated!' });
    await fetchGoals();
    return true;
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      logError('Goal Delete', error);
      toast({
        title: 'Error deleting goal',
        description: getDisplayErrorMessage(error, 'goal'),
        variant: 'destructive',
      });
    } else {
      setGoals(goals.filter(g => g.id !== id));
      toast({ title: 'Goal deleted' });
    }
  };

  // Helper function to calculate task depth
  const getTaskDepth = (taskId: string, allTasks: Task[]): number => {
    const findDepth = (id: string | null, depth: number): number => {
      if (!id) return depth;
      const task = allTasks.find(t => t.id === id);
      if (!task || !task.parent_task_id) return depth;
      return findDepth(task.parent_task_id, depth + 1);
    };
    return findDepth(taskId, 0);
  };

  // Helper to count tasks for a goal
  const countTasksForGoal = (goalId: string): number => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return 0;
    
    const countRecursive = (tasks: Task[]): number => {
      return tasks.reduce((count, task) => {
        return count + 1 + (task.subtasks ? countRecursive(task.subtasks) : 0);
      }, 0);
    };
    
    return countRecursive(goal.tasks);
  };

  const addTask = async (goalId: string, title: string, dueDate?: string, parentTaskId?: string): Promise<boolean> => {
    if (!user) return false;

    // Validate title
    const trimmedTitle = title?.trim() || '';
    if (!trimmedTitle) {
      toast({
        title: 'Invalid task title',
        description: 'Task title cannot be empty.',
        variant: 'destructive',
      });
      return false;
    }
    
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      toast({
        title: 'Title too long',
        description: `Title must be less than ${MAX_TITLE_LENGTH} characters.`,
        variant: 'destructive',
      });
      return false;
    }

    // Validate goal exists
    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      toast({
        title: 'Goal not found',
        description: 'The goal you are trying to add a task to does not exist.',
        variant: 'destructive',
      });
      return false;
    }

    // Check task limit per goal
    const currentTaskCount = countTasksForGoal(goalId);
    if (currentTaskCount >= MAX_TASKS_PER_GOAL) {
      toast({
        title: 'Task limit reached',
        description: `Maximum ${MAX_TASKS_PER_GOAL} tasks per goal. Consider breaking this into multiple goals.`,
        variant: 'destructive',
      });
      return false;
    }

    // Check subtask depth if this is a subtask
    if (parentTaskId) {
      const allFlatTasks = goal.tasks.flatMap(function flatten(t: Task): Task[] {
        return [t, ...(t.subtasks ? t.subtasks.flatMap(flatten) : [])];
      });
      
      const parentTask = allFlatTasks.find(t => t.id === parentTaskId);
      if (!parentTask) {
        toast({
          title: 'Parent task not found',
          description: 'The parent task does not exist.',
          variant: 'destructive',
        });
        return false;
      }

      const parentDepth = getTaskDepth(parentTaskId, allFlatTasks);
      if (parentDepth >= MAX_SUBTASK_DEPTH) {
        toast({
          title: 'Subtask depth limit',
          description: `Maximum subtask depth is ${MAX_SUBTASK_DEPTH} levels. Try organizing differently.`,
          variant: 'destructive',
        });
        return false;
      }
    }

    // Validate due date if provided
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        toast({
          title: 'Invalid due date',
          description: 'Please provide a valid date.',
          variant: 'destructive',
        });
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          goal_id: goalId,
          user_id: user.id,
          title: trimmedTitle,
          due_date: dueDate || null,
          parent_task_id: parentTaskId || null,
        });

      if (error) {
        logError('Task Add', error);
        toast({
          title: 'Error adding task',
          description: getDisplayErrorMessage(error, 'task'),
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Task added!',
        description: parentTaskId ? 'Subtask created successfully.' : 'Task created successfully.',
      });

      await fetchGoals();
      return true;
    } catch (error) {
      logError('Task Add Unexpected', error);
      toast({
        title: 'Error adding task',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addSubtask = async (goalId: string, parentTaskId: string, title: string, dueDate?: string): Promise<boolean> => {
    return addTask(goalId, title, dueDate, parentTaskId);
  };

  const updateTask = async (taskId: string, updates: {
    title?: string;
    due_date?: string | null;
  }): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      logError('Task Update', error);
      toast({
        title: 'Error updating task',
        description: getDisplayErrorMessage(error, 'goal'),
        variant: 'destructive',
      });
      return false;
    }

    await fetchGoals();
    return true;
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!user) return false;

    if (!taskId) {
      toast({
        title: 'Error deleting task',
        description: 'Invalid task ID.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        logError('Task Delete', error);
        toast({
          title: 'Error deleting task',
          description: getDisplayErrorMessage(error, 'task'),
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Task deleted',
        description: 'Task and any subtasks have been removed.',
      });

      await fetchGoals();
      return true;
    } catch (error) {
      logError('Task Delete Unexpected', error);
      toast({
        title: 'Error deleting task',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleTask = async (goalId: string, taskId: string) => {
    if (!user) return;
    
    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      toast({
        title: 'Error',
        description: 'Goal not found.',
        variant: 'destructive',
      });
      return;
    }

    // Find task in nested structure
    const findTaskRecursive = (tasks: Task[]): Task | undefined => {
      for (const task of tasks) {
        if (task.id === taskId) return task;
        if (task.subtasks) {
          const found = findTaskRecursive(task.subtasks);
          if (found) return found;
        }
      }
      return undefined;
    };

    const task = findTaskRecursive(goal.tasks);
    if (!task) {
      toast({
        title: 'Error',
        description: 'Task not found.',
        variant: 'destructive',
      });
      return;
    }

    const newCompleted = !task.completed;
    const previousGoals = [...goals];

    // Optimistic update with recursive task update
    const updateTaskRecursive = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, completed: newCompleted };
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateTaskRecursive(t.subtasks) };
        }
        return t;
      });
    };

    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id !== goalId) return g;
      const updatedTasks = updateTaskRecursive(g.tasks);
      
      // Calculate progress including subtasks
      const countTasks = (tasks: Task[]): { total: number; completed: number } => {
        return tasks.reduce((acc, t) => {
          acc.total += 1;
          if (t.completed || (t.id === taskId && newCompleted)) acc.completed += 1;
          else if (t.id === taskId && !newCompleted) { /* already not counted */ }
          else if (t.completed) acc.completed += 1;
          
          if (t.subtasks) {
            const subCount = countTasks(t.subtasks);
            acc.total += subCount.total;
            acc.completed += subCount.completed;
          }
          return acc;
        }, { total: 0, completed: 0 });
      };
      
      const { total, completed } = countTasks(updatedTasks);
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...g, tasks: updatedTasks, progress };
    }));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: newCompleted })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        logError('Task Toggle', error);
        toast({
          title: 'Error updating task',
          description: getDisplayErrorMessage(error, 'task'),
          variant: 'destructive',
        });
        // Rollback optimistic update
        setGoals(previousGoals);
        return;
      }

      // Update goal progress in DB
      const currentGoal = goals.find(g => g.id === goalId);
      if (currentGoal) {
        const countAllTasks = (tasks: Task[]): { total: number; completed: number } => {
          return tasks.reduce((acc, t) => {
            acc.total += 1;
            if (t.id === taskId) {
              if (newCompleted) acc.completed += 1;
            } else if (t.completed) {
              acc.completed += 1;
            }
            if (t.subtasks) {
              const sub = countAllTasks(t.subtasks);
              acc.total += sub.total;
              acc.completed += sub.completed;
            }
            return acc;
          }, { total: 0, completed: 0 });
        };
        
        const { total, completed } = countAllTasks(currentGoal.tasks);
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        await supabase
          .from('goals')
          .update({ progress })
          .eq('id', goalId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      logError('Task Toggle Unexpected', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      // Rollback optimistic update
      setGoals(previousGoals);
    }
  };

  return {
    goals,
    isLoading,
    addGoal,
    updateGoal,
    deleteGoal,
    addTask,
    addSubtask,
    updateTask,
    deleteTask,
    toggleTask,
    refetch: fetchGoals,
  };
}
