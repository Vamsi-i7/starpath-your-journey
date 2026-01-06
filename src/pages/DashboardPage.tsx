import { useAuth } from '@/contexts/AuthContext';
import { AppTopbar } from '@/components/app/AppTopbar';
import { HabitCard } from '@/components/habits/HabitCard';
import { GamificationPanel } from '@/components/dashboard/GamificationPanel';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { TodayProgress } from '@/components/dashboard/TodayProgress';
import { DailyChallengesCard } from '@/components/dashboard/DailyChallengesCard';
import { RecentAchievementsCard } from '@/components/dashboard/RecentAchievementsCard';
import { WelcomeTutorial } from '@/components/onboarding/WelcomeTutorial';
import { AIAffirmationCard } from '@/components/dashboard/AIAffirmationCard';
import { AIHabitSuggestionsCard } from '@/components/dashboard/AIHabitSuggestionsCard';
import { AICoachChat } from '@/components/dashboard/AICoachChat';
import { useHabits } from '@/hooks/useHabits';
import { useTimeBasedXP } from '@/hooks/useTimeBasedXP';
import { Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const { habits, isLoading, getTodayString, toggleHabitCompletion, deleteHabit } = useHabits();
  const { profile } = useAuth();
  useTimeBasedXP(); // Award XP based on time spent in app
  const today = getTodayString();

  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <WelcomeTutorial />
      <AppTopbar title="Dashboard" />
      
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <StatsCards 
          totalHabits={habits.length}
          completedToday={completedToday}
          totalXp={profile ? profile.level * 500 + profile.xp : 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Daily Challenges */}
            <DailyChallengesCard />

            {/* Today's Habits */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  Today's Habits
                </h2>
                <TodayProgress completed={completedToday} total={habits.length} />
              </div>
              
              <p className="text-xs text-muted-foreground sm:hidden">
                Swipe right on a habit to mark complete
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                <div className="text-center py-8 sm:py-12 rounded-2xl border border-dashed border-border/50">
                  <p className="text-sm sm:text-base text-muted-foreground">No habits yet. Create your first habit!</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <AIAffirmationCard />
            <GamificationPanel />
            <AIHabitSuggestionsCard />
            <RecentAchievementsCard />
          </div>
        </div>
      </div>
      
      <AICoachChat />
    </div>
  );
};

export default DashboardPage;
