import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/errorLogger';

export interface Task {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  progress: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  tasks: Task[];
  status: 'active' | 'completed' | 'at_risk';
  goal_type: 'short_term' | 'long_term';
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchGoals = async () => {
    if (!user) {
      setGoals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (goalsError) {
      logError('Goals Fetch', goalsError);
      setIsLoading(false);
      return;
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (tasksError) {
      logError('Tasks Fetch', tasksError);
    }

    const goalsWithTasks: Goal[] = (goalsData || []).map(goal => {
      const goalTasks = (tasksData || []).filter(t => t.goal_id === goal.id);
      const completedCount = goalTasks.filter(t => t.completed).length;
      const progress = goalTasks.length > 0 ? Math.round((completedCount / goalTasks.length) * 100) : 0;
      
      // Determine status
      let status: Goal['status'] = 'active';
      if (progress === 100) {
        status = 'completed';
      } else if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline < 0) {
          status = 'at_risk';
        } else if (daysUntilDeadline <= 3 && progress < 75) {
          status = 'at_risk';
        }
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
        tasks: goalTasks,
        progress,
        status,
        goal_type: goalType,
      };
    });

    setGoals(goalsWithTasks);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

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
      toast({
        title: 'Error creating goal',
        description: goalError.message,
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
      toast({
        title: 'Error updating goal',
        description: error.message,
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
      toast({
        title: 'Error deleting goal',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setGoals(goals.filter(g => g.id !== id));
      toast({ title: 'Goal deleted' });
    }
  };

  const addTask = async (goalId: string, title: string, dueDate?: string): Promise<boolean> => {
    if (!user) return false;

    const trimmedTitle = title?.trim() || '';
    if (!trimmedTitle || trimmedTitle.length > 200) {
      toast({
        title: 'Invalid task title',
        description: 'Title must be between 1 and 200 characters.',
        variant: 'destructive',
      });
      return false;
    }

    const { error } = await supabase
      .from('tasks')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        title: trimmedTitle,
        due_date: dueDate || null,
      });

    if (error) {
      toast({
        title: 'Error adding task',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchGoals();
    return true;
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
      toast({
        title: 'Error updating task',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchGoals();
    return true;
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error deleting task',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchGoals();
    return true;
  };

  const toggleTask = async (goalId: string, taskId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const task = goal.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    // Optimistic update
    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id !== goalId) return g;
      const updatedTasks = g.tasks.map(t => 
        t.id === taskId ? { ...t, completed: newCompleted } : t
      );
      const completedCount = updatedTasks.filter(t => t.completed).length;
      const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
      return { ...g, tasks: updatedTasks, progress };
    }));

    const { error } = await supabase
      .from('tasks')
      .update({ completed: newCompleted })
      .eq('id', taskId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      await fetchGoals();
      return;
    }

    // Update goal progress in DB
    const updatedTasks = goal.tasks.map(t => 
      t.id === taskId ? { ...t, completed: newCompleted } : t
    );
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = Math.round((completedCount / updatedTasks.length) * 100);

    await supabase
      .from('goals')
      .update({ progress })
      .eq('id', goalId);
  };

  return {
    goals,
    isLoading,
    addGoal,
    updateGoal,
    deleteGoal,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    refetch: fetchGoals,
  };
}
