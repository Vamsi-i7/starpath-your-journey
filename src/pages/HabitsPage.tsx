import { Loader2 } from 'lucide-react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useHabits } from '@/hooks/useHabits';
import { HabitsTable } from '@/components/habits/HabitsTable';

const HabitsPage = () => {
  const { habits, isLoading, addHabit, deleteHabit, toggleHabitCompletion, getTodayString } = useHabits();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AppTopbar title="Habits Tracker" />
      
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <p className="text-muted-foreground">
            Track your daily and weekly habits with a visual calendar view
          </p>
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
