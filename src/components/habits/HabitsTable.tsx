import { useState } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Habit } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';

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

const ICONS = ['🧘', '📚', '💪', '💻', '✍️', '🎯', '🌅', '💧', '🥗', '😴', '🎨', '🎵', '🏃', '🧠', '📝', '☕'];

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

  const goToToday = () => {
    setCurrentDate(new Date());
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

  const getStreakForHabit = (habit: Habit) => {
    return habit.streak || 0;
  };

  const todayCompletedCount = habits.filter(h => h.completedDates.includes(today)).length;
  const todayProgress = habits.length > 0 ? Math.round((todayCompletedCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* View Toggle & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-4 rounded-lg border border-border/50">
        <div className="flex items-center gap-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
            <TabsList className="bg-background/50">
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-primary">
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrev} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {viewMode === 'week'
              ? `${format(days[0], 'MMM d')} - ${format(days[days.length - 1], 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={navigateNext} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Today's Progress Banner */}
      {habits.length > 0 && (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">Today's Progress</span>
            </div>
            <span className="text-sm font-semibold text-primary">{todayCompletedCount}/{habits.length} completed</span>
          </div>
          <Progress value={todayProgress} className="h-2" />
        </div>
      )}

      {/* Quick Add Habit */}
      <div className="flex flex-wrap gap-2 bg-card/30 p-3 rounded-lg border border-border/30">
        <Select value={newHabitIcon} onValueChange={setNewHabitIcon}>
          <SelectTrigger className="w-[60px] bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <div className="grid grid-cols-4 gap-1 p-1">
              {ICONS.map((icon) => (
                <SelectItem key={icon} value={icon} className="p-2 text-center cursor-pointer">
                  {icon}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
        <Input
          placeholder="Add a new habit..."
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
          className="flex-1 min-w-[180px] bg-background/50"
        />
        <Select value={newHabitFrequency} onValueChange={(v) => setNewHabitFrequency(v as 'daily' | 'weekly')}>
          <SelectTrigger className="w-[100px] bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddHabit} disabled={!newHabitName.trim()} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Habits Table */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="min-w-[200px] sticky left-0 bg-muted/30 z-10 font-semibold">Habit</TableHead>
                {days.map((day) => (
                  <TableHead
                    key={day.toISOString()}
                    className={cn(
                      "text-center min-w-[48px] p-2",
                      isToday(day) && "bg-primary/10"
                    )}
                  >
                    <div className="text-xs">
                      <div className="font-medium text-muted-foreground">{format(day, 'EEE')}</div>
                      <div className={cn(
                        "text-sm",
                        isToday(day) && "text-primary font-bold"
                      )}>{format(day, 'd')}</div>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center min-w-[70px]">Rate</TableHead>
                <TableHead className="text-center min-w-[60px]">Streak</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {habits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={days.length + 4} className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">No habits yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add your first habit above to start tracking!</p>
                  </TableCell>
                </TableRow>
              ) : (
                habits.map((habit) => {
                  const completionRate = getCompletionRate(habit);
                  const streak = getStreakForHabit(habit);
                  
                  return (
                    <TableRow key={habit.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium sticky left-0 bg-background z-10 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                            {habit.icon}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{habit.name}</div>
                            <Badge variant="outline" className="text-xs mt-0.5 capitalize">
                              {habit.frequency}
                            </Badge>
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
                            className={cn(
                              "text-center p-2",
                              isTodayDate && "bg-primary/5"
                            )}
                          >
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => {
                                if (dateStr === today) {
                                  onToggleCompletion(habit.id);
                                }
                              }}
                              disabled={dateStr !== today}
                              className={cn(
                                "mx-auto",
                                isCompleted && "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                                isPast && !isCompleted && "opacity-20",
                                isFuture && "opacity-10"
                              )}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "text-sm font-semibold",
                            completionRate >= 80 ? "text-primary" : 
                            completionRate >= 50 ? "text-muted-foreground" : 
                            "text-destructive"
                          )}>
                            {completionRate}%
                          </span>
                          <Progress value={completionRate} className="h-1 w-12" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {streak > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="font-semibold text-orange-500">{streak}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary Stats */}
      {habits.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Habits</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{habits.length}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Today Done</span>
            </div>
            <div className="text-2xl font-bold text-primary">{todayCompletedCount}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Daily Habits</div>
            <div className="text-2xl font-bold text-foreground">{habits.filter(h => h.frequency === 'daily').length}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Weekly Habits</div>
            <div className="text-2xl font-bold text-foreground">{habits.filter(h => h.frequency === 'weekly').length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
