import { useState } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight, Target, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Goal, Task } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

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
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set(goals.map(g => g.id)));

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

  const toggleGoalExpand = (goalId: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const getGoalStatus = (goal: Goal) => {
    if (goal.progress === 100) return 'completed';
    if (goal.progress > 0) return 'active';
    return 'not_started';
  };

  const getStatusBadge = (goal: Goal) => {
    const status = getGoalStatus(goal);
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Done</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30"><Target className="w-3 h-3 mr-1" /> Active</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground"><AlertTriangle className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

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

      {/* Quick Add Goal */}
      <div className="flex gap-2 bg-card/30 p-3 rounded-lg border border-border/30">
        <Target className="w-5 h-5 text-muted-foreground mt-2" />
        <Input
          placeholder="Add a new goal..."
          value={newGoalTitle}
          onChange={(e) => setNewGoalTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
          className="flex-1 border-none bg-transparent focus-visible:ring-0 px-0 text-base"
        />
        <Button onClick={handleAddGoal} disabled={!newGoalTitle.trim()} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Goal
        </Button>
      </div>

      {/* Goals Table */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="min-w-[280px] sticky left-0 bg-muted/30 z-10 font-semibold">Goal / Task</TableHead>
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
                <TableHead className="w-[80px] text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={days.length + 3} className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">No goals yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add your first goal above to start tracking!</p>
                  </TableCell>
                </TableRow>
              ) : (
                goals.map((goal) => (
                  <>
                    {/* Goal Row */}
                    <TableRow key={goal.id} className="bg-muted/20 hover:bg-muted/30 border-t-2 border-border/50">
                      <TableCell className="font-medium sticky left-0 bg-muted/20 z-10 py-3">
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => toggleGoalExpand(goal.id)}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center text-xs transition-transform",
                            expandedGoals.has(goal.id) ? "rotate-90" : ""
                          )}>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">{goal.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={goal.progress} className="h-1.5 w-24" />
                              <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {days.map((day) => (
                        <TableCell key={day.toISOString()} className={cn(
                          "text-center p-2",
                          isToday(day) && "bg-primary/5"
                        )}>
                          {/* Goal-level indicator could go here */}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        {getStatusBadge(goal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteGoal(goal.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Task Rows - Only show if expanded */}
                    {expandedGoals.has(goal.id) && goal.tasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-muted/10">
                        <TableCell className="pl-12 sticky left-0 bg-background z-10 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-border" />
                            <span className={cn(
                              "text-sm",
                              task.completed && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </span>
                          </div>
                        </TableCell>
                        {days.map((day) => {
                          const isTodayDate = isToday(day);
                          return (
                            <TableCell key={day.toISOString()} className={cn(
                              "text-center p-2",
                              isTodayDate && "bg-primary/5"
                            )}>
                              <Checkbox
                                checked={task.completed && (isSameDay(day, new Date()) || day < new Date())}
                                onCheckedChange={() => {
                                  if (isTodayDate) {
                                    onToggleTask(goal.id, task.id);
                                  }
                                }}
                                disabled={!isTodayDate}
                                className={cn(
                                  "mx-auto",
                                  !isTodayDate && !task.completed && "opacity-20"
                                )}
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell></TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteTask(task.id)}
                            className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Add Task Row - Only show if expanded */}
                    {expandedGoals.has(goal.id) && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="pl-12 sticky left-0 bg-background z-10 py-1" colSpan={days.length + 3}>
                          <div className="flex items-center gap-2">
                            <Plus className="w-3 h-3 text-muted-foreground" />
                            <Input
                              placeholder="Add a task..."
                              value={newTaskInputs[goal.id] || ''}
                              onChange={(e) => setNewTaskInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddTask(goal.id)}
                              className="h-7 text-sm flex-1 max-w-[280px] border-none bg-transparent focus-visible:ring-0 px-0"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddTask(goal.id)}
                              disabled={!newTaskInputs[goal.id]?.trim()}
                              className="h-7 px-2 text-xs"
                            >
                              Add
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{goals.length}</div>
            <div className="text-sm text-muted-foreground">Total Goals</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">{goals.filter(g => g.progress === 100).length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{goals.reduce((acc, g) => acc + g.tasks.length, 0)}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">{goals.reduce((acc, g) => acc + g.tasks.filter(t => t.completed).length, 0)}</div>
            <div className="text-sm text-muted-foreground">Tasks Done</div>
          </div>
        </div>
      )}
    </div>
  );
}
