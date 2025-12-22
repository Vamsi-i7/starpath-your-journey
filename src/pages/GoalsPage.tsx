import { useState } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useGoals } from '@/hooks/useGoals';
import { CreateGoalModal } from '@/components/goals/CreateGoalModal';
import { GoalRow } from '@/components/goals/GoalRow';
import { Plus, Target, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GoalsPage = () => {
  const { goals, isLoading, addGoal, updateGoal, deleteGoal, addTask, deleteTask, toggleTask } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const atRiskGoals = goals.filter(g => g.status === 'at_risk');

  const totalTasks = goals.reduce((acc, g) => acc + g.tasks.length, 0);
  const completedTasks = goals.reduce((acc, g) => acc + g.tasks.filter(t => t.completed).length, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppTopbar title="Goals & Planner" />
      
      <div className="p-6 space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground">
              Track your long-term goals and daily tasks
            </p>
            <div className="flex items-center gap-6 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">
                  {activeGoals.length} Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-xp" />
                <span className="text-muted-foreground">
                  {completedGoals.length} Completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-muted-foreground">
                  {atRiskGoals.length} At Risk
                </span>
              </div>
              <div className="hidden sm:block text-muted-foreground">
                Overall: {completedTasks}/{totalTasks} tasks ({overallProgress}%)
              </div>
            </div>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-5 h-5" />
            New Goal
          </Button>
        </div>

        {/* Goals Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({goals.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="at_risk">At Risk ({atRiskGoals.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {goals.length === 0 ? (
              <EmptyState onCreateGoal={() => setIsModalOpen(true)} />
            ) : (
              goals.map(goal => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  onToggleTask={toggleTask}
                  onAddTask={addTask}
                  onDeleteTask={deleteTask}
                  onDeleteGoal={deleteGoal}
                  onUpdateGoal={updateGoal}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-3">
            {activeGoals.length === 0 ? (
              <EmptyTabState message="No active goals" />
            ) : (
              activeGoals.map(goal => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  onToggleTask={toggleTask}
                  onAddTask={addTask}
                  onDeleteTask={deleteTask}
                  onDeleteGoal={deleteGoal}
                  onUpdateGoal={updateGoal}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="at_risk" className="space-y-3">
            {atRiskGoals.length === 0 ? (
              <EmptyTabState message="No goals at risk" />
            ) : (
              atRiskGoals.map(goal => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  onToggleTask={toggleTask}
                  onAddTask={addTask}
                  onDeleteTask={deleteTask}
                  onDeleteGoal={deleteGoal}
                  onUpdateGoal={updateGoal}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedGoals.length === 0 ? (
              <EmptyTabState message="No completed goals yet" />
            ) : (
              completedGoals.map(goal => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  onToggleTask={toggleTask}
                  onAddTask={addTask}
                  onDeleteTask={deleteTask}
                  onDeleteGoal={deleteGoal}
                  onUpdateGoal={updateGoal}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateGoalModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={addGoal}
      />
    </div>
  );
};

function EmptyState({ onCreateGoal }: { onCreateGoal: () => void }) {
  return (
    <div className="text-center py-16 rounded-lg border border-dashed border-border bg-card/50">
      <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No goals yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Create your first goal to start planning and tracking your progress.
      </p>
      <Button onClick={onCreateGoal} className="gap-2">
        <Plus className="w-4 h-4" />
        Create Your First Goal
      </Button>
    </div>
  );
}

function EmptyTabState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 rounded-lg border border-dashed border-border bg-card/50">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export default GoalsPage;
