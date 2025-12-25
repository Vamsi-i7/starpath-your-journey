import { Loader2, Target } from 'lucide-react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useGoals } from '@/hooks/useGoals';
import { GoalsTable } from '@/components/goals/GoalsTable';

const GoalsPage = () => {
  const { goals, isLoading, addGoal, deleteGoal, toggleTask, addTask, deleteTask } = useGoals();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const totalTasks = goals.reduce((acc, g) => acc + g.tasks.length, 0);
  const completedTasks = goals.reduce((acc, g) => acc + g.tasks.filter(t => t.completed).length, 0);

  return (
    <div className="min-h-screen">
      <AppTopbar title="Goals & Planner" />
      
      <div className="p-4 sm:p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Active Goals</span>
            </div>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <div className="text-2xl font-bold text-primary">{completedGoals.length}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">Total Tasks</span>
            </div>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">Tasks Done</span>
            </div>
            <div className="text-2xl font-bold text-primary">{completedTasks}</div>
          </div>
        </div>

        {/* Goals Table */}
        <GoalsTable
          goals={goals}
          onAddGoal={addGoal}
          onDeleteGoal={deleteGoal}
          onToggleTask={toggleTask}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
        />
      </div>
    </div>
  );
};

export default GoalsPage;
