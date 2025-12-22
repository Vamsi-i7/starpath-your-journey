import { useState } from 'react';
import { Goal, Task } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GoalRowProps {
  goal: Goal;
  onToggleTask: (goalId: string, taskId: string) => void;
  onAddTask: (goalId: string, title: string, dueDate?: string) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoal: (goalId: string, updates: { title?: string; description?: string; deadline?: string | null }) => Promise<boolean>;
}

export function GoalRow({
  goal,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onDeleteGoal,
  onUpdateGoal,
}: GoalRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const completedTasks = goal.tasks.filter(t => t.completed).length;
  const totalTasks = goal.tasks.length;

  const getStatusBadge = () => {
    switch (goal.status) {
      case 'completed':
        return <Badge variant="outline" className="bg-xp/10 text-xp border-xp/30">Completed</Badge>;
      case 'at_risk':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">At Risk</Badge>;
      default:
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Active</Badge>;
    }
  };

  const getTypeBadge = () => {
    if (goal.goal_type === 'long_term') {
      return <Badge variant="secondary" className="text-xs">Long-term</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Short-term</Badge>;
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const success = await onAddTask(goal.id, newTaskTitle, newTaskDueDate || undefined);
    if (success) {
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setIsAddingTask(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    const success = await onUpdateGoal(goal.id, { title: editTitle });
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <>
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {/* Main Row */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Status Icon */}
            <div className="shrink-0">
              {goal.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-xp" />
              ) : goal.status === 'at_risk' ? (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              ) : (
                <Target className="w-5 h-5 text-primary" />
              )}
            </div>

            {/* Title & Type */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="shrink-0">
                    <Check className="w-4 h-4 text-xp" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground truncate">{goal.title}</h3>
                  {getTypeBadge()}
                </div>
              )}
              {goal.description && !isEditing && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">{goal.description}</p>
              )}
            </div>

            {/* Deadline */}
            <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
              <Calendar className="w-4 h-4" />
              {goal.deadline ? (
                <span>{format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
              ) : (
                <span>No deadline</span>
              )}
            </div>

            {/* Progress */}
            <div className="hidden sm:flex items-center gap-3 shrink-0 w-32">
              <Progress value={goal.progress} className="h-2 flex-1" />
              <span className="text-sm font-medium text-foreground w-10 text-right">
                {goal.progress}%
              </span>
            </div>

            {/* Status */}
            <div className="hidden lg:block shrink-0">
              {getStatusBadge()}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditTitle(goal.title);
                  setIsEditing(true);
                }}
                className="h-8 w-8"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Progress */}
          <div className="sm:hidden mt-3">
            <div className="flex items-center gap-3">
              <Progress value={goal.progress} className="h-2 flex-1" />
              <span className="text-sm font-medium text-foreground">
                {goal.progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Tasks Section */}
        {isExpanded && (
          <div className="border-t border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Tasks ({completedTasks}/{totalTasks})
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAddingTask(true)}
                className="text-primary hover:text-primary/80"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            </div>

            {/* Tasks List */}
            <div className="space-y-2">
              {goal.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => onToggleTask(goal.id, task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))}

              {goal.tasks.length === 0 && !isAddingTask && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks yet. Add one to start tracking progress.
                </p>
              )}

              {/* Add Task Inline */}
              {isAddingTask && (
                <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task name"
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <Input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-36"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Button size="icon" variant="ghost" onClick={handleAddTask}>
                    <Check className="w-4 h-4 text-xp" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsAddingTask(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{goal.title}" and all its tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteGoal(goal.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
      <Checkbox
        checked={task.completed}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-xp data-[state=checked]:border-xp"
      />
      <span
        className={`flex-1 text-sm ${
          task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
        }`}
      >
        {task.title}
      </span>
      {task.due_date && (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
        </span>
      )}
      <Button
        size="icon"
        variant="ghost"
        onClick={onDelete}
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
