import { useApp } from '@/contexts/AppContext';
import { AppTopbar } from '@/components/app/AppTopbar';
import { HabitCard } from '@/components/habits/HabitCard';
import { GamificationPanel } from '@/components/dashboard/GamificationPanel';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { TodayProgress } from '@/components/dashboard/TodayProgress';

const DashboardPage = () => {
  const { habits, getTodayString } = useApp();
  const today = getTodayString();

  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);

  return (
    <div className="min-h-screen">
      <AppTopbar title="Dashboard" />
      
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <StatsCards 
          totalHabits={habits.length}
          completedToday={completedToday}
          totalStreak={totalStreak}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Habits */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                Today's Habits
              </h2>
              <TodayProgress completed={completedToday} total={habits.length} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} />
              ))}
            </div>

            {habits.length === 0 && (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border/50">
                <p className="text-muted-foreground">No habits yet. Create your first habit!</p>
              </div>
            )}
          </div>

          {/* Gamification Panel */}
          <div className="lg:col-span-1">
            <GamificationPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
