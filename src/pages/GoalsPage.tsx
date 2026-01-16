import { Loader2, Target, Trophy, CheckCircle2, ListTodo } from 'lucide-react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useGoals } from '@/hooks/useGoals';
import { GoalsTable } from '@/components/goals/GoalsTable';
import { useMemo } from 'react';

const GoalsPage = () => {
  const { goals, isLoading, addGoal, deleteGoal, toggleTask, addTask, addSubtask, deleteTask } = useGoals();

  const stats = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const totalTasks = goals.reduce((acc, g) => acc + g.tasks.length, 0);
    const completedTasks = goals.reduce((acc, g) => acc + g.tasks.filter(t => t.completed).length, 0);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { activeGoals, completedGoals, totalTasks, completedTasks, completionRate };
  }, [goals]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppTopbar title="Goals & Planner" />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Your Goals
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Set ambitious goals and break them down into achievable tasks
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Active Goals</span>
            </div>
            <div className="text-2xl font-bold">{stats.activeGoals.length}</div>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-500">{stats.completedGoals.length}</div>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ListTodo className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">Total Tasks</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm text-muted-foreground">Tasks Done</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.completedTasks}
              <span className="text-sm font-normal text-muted-foreground ml-1">({stats.completionRate}%)</span>
            </div>
          </div>
        </div>

        {/* Goals Table */}
        <GoalsTable
          goals={goals}
          onAddGoal={addGoal}
          onDeleteGoal={deleteGoal}
          onToggleTask={toggleTask}
          onAddTask={addTask}
          onAddSubtask={addSubtask}
          onDeleteTask={deleteTask}
        />
      </div>
    </div>
  );
};

export default GoalsPage;
