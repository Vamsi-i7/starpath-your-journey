import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppTopbar } from '@/components/app/AppTopbar';
import { HabitCard } from '@/components/habits/HabitCard';
import { CreateHabitModal } from '@/components/habits/CreateHabitModal';
import { useApp } from '@/contexts/AppContext';

const HabitsPage = () => {
  const { habits } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly');

  return (
    <div className="min-h-screen">
      <AppTopbar title="Habits" />
      
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Your Habits
            </h2>
            <p className="text-muted-foreground">Track and manage your daily habits</p>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-5 h-5" />
            New Habit
          </Button>
        </div>

        {/* Daily Habits */}
        <section>
          <h3 className="text-lg font-medium text-foreground mb-4">Daily Habits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
          {dailyHabits.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border/50">
              <p className="text-muted-foreground">No daily habits yet</p>
            </div>
          )}
        </section>

        {/* Weekly Habits */}
        <section>
          <h3 className="text-lg font-medium text-foreground mb-4">Weekly Habits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
          {weeklyHabits.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border/50">
              <p className="text-muted-foreground">No weekly habits yet</p>
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
