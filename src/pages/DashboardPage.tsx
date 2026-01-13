import { useAuth } from "@/contexts/AuthContext";
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
import { SessionTimer } from '@/components/dashboard/SessionTimer';
import { SessionHistoryCard } from '@/components/dashboard/SessionHistoryCard';
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary';
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
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-background via-background to-background/95">
      <WelcomeTutorial />
      <AppTopbar title="Dashboard" />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground animate-slide-up">
                Welcome back, {profile?.username || 'Champion'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1 animate-fade-in stagger-1">Let's make today count. Track your progress and achieve your goals.</p>
            </div>
            <div className="animate-scale-in stagger-2">
              <SessionTimer />
            </div>

          </div>
          
          {/* Stats Overview */}
          <div className="relative animate-slide-up stagger-2">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-3xl blur-3xl -z-10 animate-pulse-slow" />
            <StatsCards 
              totalHabits={habits.length}
              completedToday={completedToday}
              totalXp={profile ? profile.level * 500 + profile.xp : 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Daily Challenges */}
              <SectionErrorBoundary compact fallbackMessage="Daily challenges unavailable">
                <div className="group hover:scale-[1.01] transition-transform duration-300 animate-slide-up stagger-3">
                  <DailyChallengesCard />
                </div>
              </SectionErrorBoundary>

              {/* Today's Habits */}
              <div className="space-y-4 sm:space-y-5 animate-fade-in stagger-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <span className="text-2xl animate-bounce-in">📋</span>
                      Today's Habits
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Complete your daily goals</p>
                  </div>
                  <div className="animate-scale-in">
                    <TodayProgress completed={completedToday} total={habits.length} />
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground sm:hidden bg-card/50 p-3 rounded-lg border border-border/30">
                  💡 Tip: Swipe right on a habit to mark it complete
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {habits.map((habit, index) => (
                    <div 
                      key={habit.id} 
                      className={`group hover:scale-[1.02] hover-lift transition-all duration-300 animate-slide-up stagger-${Math.min(index + 1, 6)}`}
                    >
                      <HabitCard 
                        habit={habit} 
                        onToggle={() => toggleHabitCompletion(habit.id)}
                        onDelete={() => deleteHabit(habit.id)}
                        today={today}
                      />
                    </div>
                  ))}
                </div>

                {habits.length === 0 && (
                  <div className="text-center py-12 sm:py-16 rounded-3xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 animate-scale-in">
                    <div className="text-5xl mb-4 animate-bounce-in">🎯</div>
                    <p className="text-base sm:text-lg font-semibold text-foreground mb-2 animate-fade-in stagger-1">No habits yet</p>
                    <p className="text-sm text-muted-foreground animate-fade-in stagger-2">Start building better habits today!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-24 lg:self-start">
              <SectionErrorBoundary compact fallbackMessage="Session history unavailable">
                <div className="hover-lift animate-slide-up stagger-3">
                  <SessionHistoryCard />
                </div>
              </SectionErrorBoundary>
              <SectionErrorBoundary compact fallbackMessage="AI insights unavailable">
                <div className="hover-lift animate-slide-up stagger-4">
                  <AIAffirmationCard />
                </div>
              </SectionErrorBoundary>
              <SectionErrorBoundary compact fallbackMessage="Stats unavailable">
                <div className="hover-lift animate-slide-up stagger-5">
                  <GamificationPanel />
                </div>
              </SectionErrorBoundary>
              <SectionErrorBoundary compact fallbackMessage="AI suggestions unavailable">
                <div className="hover-lift animate-slide-up stagger-6">
                  <AIHabitSuggestionsCard />
                </div>
              </SectionErrorBoundary>
              <SectionErrorBoundary compact fallbackMessage="Achievements unavailable">
                <div className="hover-lift animate-slide-up stagger-6">
                  <RecentAchievementsCard />
                </div>
              </SectionErrorBoundary>
            </div>
          </div>
        </div>
    </div>
  );
};

export default DashboardPage;
