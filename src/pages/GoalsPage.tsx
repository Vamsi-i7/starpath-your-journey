import { AppTopbar } from '@/components/app/AppTopbar';
import { useApp } from '@/contexts/AppContext';
import { Plus, CheckCircle2, Circle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const GoalsPage = () => {
  const { goals, toggleTask } = useApp();

  return (
    <div className="min-h-screen">
      <AppTopbar title="Goals & Planner" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Track your long-term goals and daily tasks</p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="w-5 h-5" /> New Goal
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <div key={goal.id} className="p-6 rounded-2xl bg-card border border-border/30">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>

              <div className="space-y-2">
                {goal.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(goal.id, task.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-card/50 transition-colors text-left"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-xp" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className={task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                      {task.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
