import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Zap, 
  Clock, 
  TrendingUp,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface TodayViewProps {
  data: {
    date: string;
    habitsCompleted: number;
    totalHabits: number;
    xpEarned: number;
    sessionMinutes: number;
    goalsCompleted: number;
    completionRate: number;
  };
}

export function TodayView({ data }: TodayViewProps) {
  const completionPercent = data.totalHabits > 0 
    ? (data.habitsCompleted / data.totalHabits) * 100 
    : 0;

  const hours = Math.floor(data.sessionMinutes / 60);
  const minutes = data.sessionMinutes % 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Today's Progress</h2>
          <p className="text-muted-foreground">
            {format(new Date(data.date), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Calendar className="w-8 h-8 text-primary" />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Habits Completed */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Habits
              </CardTitle>
              <Target className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {data.habitsCompleted}
                <span className="text-lg text-muted-foreground">/{data.totalHabits}</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {completionPercent.toFixed(0)}% complete
              </p>
            </div>
          </CardContent>
        </Card>

        {/* XP Earned */}
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                XP Earned
              </CardTitle>
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{data.xpEarned}</div>
              <p className="text-xs text-muted-foreground">
                Experience points
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Session Time */}
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Study Time
              </CardTitle>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {hours > 0 ? `${hours}h` : ''} {minutes}m
              </div>
              <p className="text-xs text-muted-foreground">
                {data.sessionMinutes} minutes total
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Goals Completed */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Goals
              </CardTitle>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{data.goalsCompleted}</div>
              <p className="text-xs text-muted-foreground">
                Completed today
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Today's Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-semibold">{completionPercent.toFixed(1)}%</span>
            </div>
            <Progress value={completionPercent} className="h-3" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg per habit</p>
              <p className="text-lg font-semibold">
                {data.totalHabits > 0 
                  ? (data.xpEarned / data.totalHabits).toFixed(0) 
                  : 0} XP
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Productivity</p>
              <p className="text-lg font-semibold">
                {data.habitsCompleted > 0 
                  ? (data.sessionMinutes / data.habitsCompleted).toFixed(0) 
                  : 0} min/habit
              </p>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="pt-4 border-t">
            {completionPercent === 100 ? (
              <p className="text-sm text-green-600 font-medium">
                🎉 Perfect day! All habits completed!
              </p>
            ) : completionPercent >= 75 ? (
              <p className="text-sm text-blue-600">
                💪 Great progress! Keep pushing!
              </p>
            ) : completionPercent >= 50 ? (
              <p className="text-sm text-orange-600">
                📈 Good start! You're halfway there!
              </p>
            ) : completionPercent > 0 ? (
              <p className="text-sm text-muted-foreground">
                🌟 Every habit counts! Keep going!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                🚀 Start your day strong! Complete your first habit.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
