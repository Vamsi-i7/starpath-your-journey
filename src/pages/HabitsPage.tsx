import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppTopbar } from '@/components/app/AppTopbar';
import { HabitCard } from '@/components/habits/HabitCard';
import { CreateHabitModal } from '@/components/habits/CreateHabitModal';
import { useHabits } from '@/hooks/useHabits';

const HabitsPage = () => {
  const { habits, isLoading, toggleHabitCompletion, deleteHabit, getTodayString } = useHabits();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const today = getTodayString();

  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AppTopbar title="Habits" />
      
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Your Habits
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">Track and manage your daily habits</p>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            New Habit
          </Button>
        </div>

        <section>
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-3 sm:mb-4">Daily Habits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {dailyHabits.map((habit) => (
              <HabitCard 
                key={habit.id} 
                habit={habit}
                onToggle={() => toggleHabitCompletion(habit.id)}
                onDelete={() => deleteHabit(habit.id)}
                today={today}
              />
            ))}
          </div>
          {dailyHabits.length === 0 && (
            <div className="text-center py-8 sm:py-12 rounded-2xl border border-dashed border-border/50">
              <p className="text-sm sm:text-base text-muted-foreground">No daily habits yet</p>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-3 sm:mb-4">Weekly Habits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {weeklyHabits.map((habit) => (
              <HabitCard 
                key={habit.id} 
                habit={habit}
                onToggle={() => toggleHabitCompletion(habit.id)}
                onDelete={() => deleteHabit(habit.id)}
                today={today}
              />
            ))}
          </div>
          {weeklyHabits.length === 0 && (
            <div className="text-center py-8 sm:py-12 rounded-2xl border border-dashed border-border/50">
              <p className="text-sm sm:text-base text-muted-foreground">No weekly habits yet</p>
            </div>
          )}
        </section>
      </div>

      <CreateHabitModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
};

export default HabitsPage;
