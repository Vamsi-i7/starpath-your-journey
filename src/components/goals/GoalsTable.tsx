import { useState } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Goal, Task } from '@/hooks/useGoals';

interface GoalsTableProps {
  goals: Goal[];
  onAddGoal: (goalData: { title: string; description: string; deadline?: string; tasks: { title: string; due_date?: string }[] }) => Promise<boolean>;
  onDeleteGoal: (id: string) => void;
  onToggleTask: (goalId: string, taskId: string) => void;
  onAddTask: (goalId: string, title: string, dueDate?: string) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
}

export function GoalsTable({ goals, onAddGoal, onDeleteGoal, onToggleTask, onAddTask, onDeleteTask }: GoalsTableProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

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

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    const success = await onAddGoal({
      title: newGoalTitle.trim(),
      description: '',
      tasks: [],
    });
    if (success) {
      setNewGoalTitle('');
    }
  };

  const handleAddTask = async (goalId: string) => {
    const taskTitle = newTaskInputs[goalId]?.trim();
    if (!taskTitle) return;
    const success = await onAddTask(goalId, taskTitle);
    if (success) {
      setNewTaskInputs(prev => ({ ...prev, [goalId]: '' }));
    }
  };

  const isTaskCompletedOnDate = (task: Task, date: Date) => {
    // For simplicity, we check if task was completed and if its created_at is before or on this date
    // In a real app, you'd track completions per day
    if (!task.completed) return false;
    const taskCreated = new Date(task.created_at);
    return isSameDay(date, new Date()) || date > taskCreated;
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

      {/* Quick Add Goal */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a new goal..."
          value={newGoalTitle}
          onChange={(e) => setNewGoalTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
          className="flex-1"
        />
        <Button onClick={handleAddGoal} disabled={!newGoalTitle.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Goals Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">Goal / Task</TableHead>
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
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={days.length + 2} className="text-center py-8 text-muted-foreground">
                  No goals yet. Add your first goal above!
                </TableCell>
              </TableRow>
            ) : (
              goals.map((goal) => (
                <>
                  {/* Goal Row */}
                  <TableRow key={goal.id} className="bg-muted/30">
                    <TableCell className="font-medium sticky left-0 bg-muted/30 z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">📎</span>
                        {goal.title}
                        <span className="text-xs text-muted-foreground">({goal.progress}%)</span>
                      </div>
                    </TableCell>
                    {days.map((day) => (
                      <TableCell key={day.toISOString()} className="text-center">
                        {/* Goal progress indicator */}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteGoal(goal.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Task Rows */}
                  {goal.tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="pl-8 sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">└</span>
                          <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.title}
                          </span>
                        </div>
                      </TableCell>
                      {days.map((day) => (
                        <TableCell key={day.toISOString()} className={`text-center ${isToday(day) ? 'bg-primary/5' : ''}`}>
                          <Checkbox
                            checked={isTaskCompletedOnDate(task, day)}
                            onCheckedChange={() => {
                              if (isToday(day)) {
                                onToggleTask(goal.id, task.id);
                              }
                            }}
                            disabled={!isToday(day)}
                            className="mx-auto"
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteTask(task.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Add Task Row */}
                  <TableRow>
                    <TableCell className="pl-8 sticky left-0 bg-background z-10" colSpan={days.length + 2}>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add a task..."
                          value={newTaskInputs[goal.id] || ''}
                          onChange={(e) => setNewTaskInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTask(goal.id)}
                          className="h-8 text-sm flex-1 max-w-[300px]"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddTask(goal.id)}
                          disabled={!newTaskInputs[goal.id]?.trim()}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
