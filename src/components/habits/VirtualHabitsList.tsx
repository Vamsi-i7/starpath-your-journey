import { VirtualList } from '@/components/ui/virtual-list';
import { HabitCard } from './HabitCard';
import { Habit } from '@/hooks/useHabits';

interface VirtualHabitsListProps {
  habits: Habit[];
  onToggle: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  today: string;
  height?: number;
}

/**
 * Virtualized Habits List
 * Only renders visible habit cards for better performance with 100+ habits
 */
export function VirtualHabitsList({
  habits,
  onToggle,
  onDelete,
  today,
  height = 600,
}: VirtualHabitsListProps) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 rounded-2xl border border-dashed border-border/50">
        <p className="text-sm sm:text-base text-muted-foreground">
          No habits yet. Create your first habit!
        </p>
      </div>
    );
  }

  // For small lists (< 20 items), render normally without virtualization
  if (habits.length < 20) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onToggle={() => onToggle(habit.id)}
            onDelete={() => onDelete(habit.id)}
            today={today}
          />
        ))}
      </div>
    );
  }

  // For large lists, use virtualization
  return (
    <VirtualList
      items={habits}
      height={height}
      itemHeight={120} // Approximate height of HabitCard
      overscan={3}
      className="rounded-lg"
      keyExtractor={(habit) => habit.id}
      renderItem={(habit) => (
        <div className="px-2 pb-3">
          <HabitCard
            habit={habit}
            onToggle={() => onToggle(habit.id)}
            onDelete={() => onDelete(habit.id)}
            today={today}
          />
        </div>
      )}
    />
  );
}
