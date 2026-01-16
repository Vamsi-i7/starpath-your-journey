import { Loader2, Target, Flame, TrendingUp } from 'lucide-react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useHabits } from '@/hooks/useHabits';
import { HabitsTable } from '@/components/habits/HabitsTable';
import { useMemo } from 'react';

const HabitsPage = () => {
  const { habits, isLoading, addHabit, deleteHabit, toggleHabitCompletion, getTodayString } = useHabits();

  const today = useMemo(() => getTodayString(), [getTodayString]);
  
  const stats = useMemo(() => {
    const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
    const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
    const bestStreak = Math.max(...habits.map(h => h.best_streak), 0);
    return { completedToday, totalStreak, bestStreak };
  }, [habits, today]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <AppTopbar title="Habits Tracker" />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Your Habits
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Track your daily and weekly habits with a visual calendar view
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-xl">
              <Target className="w-4 h-4 text-primary" />
              <div className="text-sm">
                <span className="font-semibold">{stats.completedToday}</span>
                <span className="text-muted-foreground">/{habits.length} today</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-xl">
              <Flame className="w-4 h-4 text-orange-500" />
              <div className="text-sm">
                <span className="font-semibold">{stats.bestStreak}</span>
                <span className="text-muted-foreground"> best streak</span>
              </div>
            </div>
          </div>
        </div>

        <HabitsTable
          habits={habits}
          onAddHabit={addHabit}
          onDeleteHabit={deleteHabit}
          onToggleCompletion={toggleHabitCompletion}
          getTodayString={getTodayString}
        />
      </div>
    </div>
  );
};

export default HabitsPage;
