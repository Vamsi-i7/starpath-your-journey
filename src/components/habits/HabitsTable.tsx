import { useState } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Habit } from '@/hooks/useHabits';

interface HabitsTableProps {
  habits: Habit[];
  onAddHabit: (habitData: {
    name: string;
    description: string;
    icon: string;
    color: string;
    frequency: 'daily' | 'weekly';
    xp_reward: number;
  }) => void;
  onDeleteHabit: (id: string) => void;
  onToggleCompletion: (habitId: string) => void;
  getTodayString: () => string;
}

const ICONS = ['🧘', '📚', '💪', '💻', '✍️', '🎯', '🌅', '💧', '🥗', '😴', '🎨', '🎵'];
const COLORS = ['primary', 'secondary', 'streak', 'destructive'];

export function HabitsTable({ habits, onAddHabit, onDeleteHabit, onToggleCompletion, getTodayString }: HabitsTableProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🎯');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily');

  const today = getTodayString();

  // Get days for the view
  const getDays = () => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  };

  const days = getDays();

  const navigatePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    onAddHabit({
      name: newHabitName.trim(),
      description: '',
      icon: newHabitIcon,
      color: 'primary',
      frequency: newHabitFrequency,
      xp_reward: 50,
    });
    setNewHabitName('');
    setNewHabitIcon('🎯');
    setNewHabitFrequency('daily');
  };

  const isHabitCompletedOnDate = (habit: Habit, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return habit.completedDates.includes(dateStr);
  };

  const getCompletionRate = (habit: Habit) => {
    const relevantDays = days.filter(day => {
      const habitCreated = new Date(habit.created_at);
      return day >= habitCreated && day <= new Date();
    });
    if (relevantDays.length === 0) return 0;
    const completedCount = relevantDays.filter(day => isHabitCompletedOnDate(habit, day)).length;
    return Math.round((completedCount / relevantDays.length) * 100);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="week">Weekly</TabsTrigger>
            <TabsTrigger value="month">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {viewMode === 'week'
              ? `${format(days[0], 'MMM d')} - ${format(days[days.length - 1], 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Add Habit */}
      <div className="flex flex-wrap gap-2">
        <Select value={newHabitIcon} onValueChange={setNewHabitIcon}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ICONS.map((icon) => (
              <SelectItem key={icon} value={icon}>
                {icon}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Add a new habit..."
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
          className="flex-1 min-w-[200px]"
        />
        <Select value={newHabitFrequency} onValueChange={(v) => setNewHabitFrequency(v as 'daily' | 'weekly')}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddHabit} disabled={!newHabitName.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Habits Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">Habit</TableHead>
              {days.map((day) => (
                <TableHead
                  key={day.toISOString()}
                  className={`text-center min-w-[50px] ${isToday(day) ? 'bg-primary/10' : ''}`}
                >
                  <div className="text-xs">
                    <div>{format(day, 'EEE')}</div>
                    <div className={isToday(day) ? 'text-primary font-bold' : ''}>{format(day, 'd')}</div>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center min-w-[60px]">Rate</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {habits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={days.length + 3} className="text-center py-8 text-muted-foreground">
                  No habits yet. Add your first habit above!
                </TableCell>
              </TableRow>
            ) : (
              habits.map((habit) => (
                <TableRow key={habit.id}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2">
                      <span>{habit.icon}</span>
                      <div>
                        <div>{habit.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{habit.frequency}</div>
                      </div>
                    </div>
                  </TableCell>
                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCompleted = isHabitCompletedOnDate(habit, day);
                    const isTodayDate = isToday(day);
                    const isPast = day < new Date() && !isTodayDate;
                    const isFuture = day > new Date();

                    return (
                      <TableCell
                        key={day.toISOString()}
                        className={`text-center ${isTodayDate ? 'bg-primary/5' : ''}`}
                      >
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => {
                            if (dateStr === today) {
                              onToggleCompletion(habit.id);
                            }
                          }}
                          disabled={dateStr !== today}
                          className={`mx-auto ${isCompleted ? 'data-[state=checked]:bg-primary' : ''} ${
                            isPast && !isCompleted ? 'opacity-30' : ''
                          } ${isFuture ? 'opacity-20' : ''}`}
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    <span className={`text-sm font-medium ${getCompletionRate(habit) >= 80 ? 'text-primary' : getCompletionRate(habit) >= 50 ? 'text-muted-foreground' : 'text-destructive'}`}>
                      {getCompletionRate(habit)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteHabit(habit.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      {habits.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{habits.length}</div>
            <div className="text-sm text-muted-foreground">Total Habits</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {habits.filter(h => h.completedDates.includes(today)).length}
            </div>
            <div className="text-sm text-muted-foreground">Completed Today</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {habits.filter(h => h.frequency === 'daily').length}
            </div>
            <div className="text-sm text-muted-foreground">Daily Habits</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {habits.filter(h => h.frequency === 'weekly').length}
            </div>
            <div className="text-sm text-muted-foreground">Weekly Habits</div>
          </div>
        </div>
      )}
    </div>
  );
}
