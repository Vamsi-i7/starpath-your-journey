import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  progress: number;
  deadline: string | null;
  created_at: string;
  tasks: Task[];
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
      .eq('user_id', user.id);

    if (tasksError) {
      logError('Tasks Fetch', tasksError);
    }

    const goalsWithTasks: Goal[] = (goalsData || []).map(goal => ({
      ...goal,
      tasks: (tasksData || []).filter(t => t.goal_id === goal.id),
    }));

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
    tasks: { title: string }[];
  }) => {
    if (!user) return;

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert({
        title: goalData.title,
        description: goalData.description,
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
      return;
    }

    if (goalData.tasks.length > 0) {
      const tasksToInsert = goalData.tasks.map(t => ({
        goal_id: goal.id,
        user_id: user.id,
        title: t.title,
      }));

      await supabase.from('tasks').insert(tasksToInsert);
    }

    toast({
      title: 'Goal created!',
      description: `"${goalData.title}" has been added`,
    });

    fetchGoals();
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
    }
  };

  const toggleTask = async (goalId: string, taskId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const task = goal.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

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
      return;
    }

    // Calculate new progress
    const updatedTasks = goal.tasks.map(t => 
      t.id === taskId ? { ...t, completed: newCompleted } : t
    );
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = Math.round((completedCount / updatedTasks.length) * 100);

    await supabase
      .from('goals')
      .update({ progress })
      .eq('id', goalId);

    fetchGoals();
  };

  return {
    goals,
    isLoading,
    addGoal,
    deleteGoal,
    toggleTask,
    refetch: fetchGoals,
  };
}
