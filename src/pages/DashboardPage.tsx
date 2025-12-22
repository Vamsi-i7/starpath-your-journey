import { useAuth } from '@/contexts/AuthContext';
import { AppTopbar } from '@/components/app/AppTopbar';
import { HabitCard } from '@/components/habits/HabitCard';
import { GamificationPanel } from '@/components/dashboard/GamificationPanel';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { TodayProgress } from '@/components/dashboard/TodayProgress';
import { DailyChallengesCard } from '@/components/dashboard/DailyChallengesCard';
import { RecentAchievementsCard } from '@/components/dashboard/RecentAchievementsCard';
import { WelcomeTutorial } from '@/components/onboarding/WelcomeTutorial';
import { useHabits } from '@/hooks/useHabits';
import { Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const { habits, isLoading, getTodayString, toggleHabitCompletion, deleteHabit } = useHabits();
  const { profile } = useAuth();
  const today = getTodayString();

  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <WelcomeTutorial />
      <AppTopbar title="Dashboard" />
      
      <div className="p-6 space-y-6">
        <StatsCards 
          totalHabits={habits.length}
          completedToday={completedToday}
          totalStreak={totalStreak}
          totalXp={profile ? profile.level * 500 + profile.xp : 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Challenges */}
            <DailyChallengesCard />

            {/* Today's Habits */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  Today's Habits
                </h2>
                <TodayProgress completed={completedToday} total={habits.length} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habits.map((habit) => (
                  <HabitCard 
                    key={habit.id} 
                    habit={habit} 
                    onToggle={() => toggleHabitCompletion(habit.id)}
                    onDelete={() => deleteHabit(habit.id)}
                    today={today}
                  />
                ))}
              </div>

              {habits.length === 0 && (
                <div className="text-center py-12 rounded-2xl border border-dashed border-border/50">
                  <p className="text-muted-foreground">No habits yet. Create your first habit!</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <GamificationPanel />
            <RecentAchievementsCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
