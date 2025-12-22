import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2 } from 'lucide-react';

interface TaskInput {
  id: string;
  title: string;
  due_date: string;
}

interface CreateGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    deadline?: string;
    tasks: { title: string; due_date?: string }[];
  }) => Promise<boolean>;
}

export function CreateGoalModal({ open, onOpenChange, onSubmit }: CreateGoalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tasks, setTasks] = useState<TaskInput[]>([
    { id: crypto.randomUUID(), title: '', due_date: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTask = () => {
    setTasks([...tasks, { id: crypto.randomUUID(), title: '', due_date: '' }]);
  };

  const handleRemoveTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleTaskChange = (id: string, field: 'title' | 'due_date', value: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validTasks = tasks
      .filter(t => t.title.trim())
      .map(t => ({ title: t.title, due_date: t.due_date || undefined }));

    setIsSubmitting(true);
    const success = await onSubmit({
      title,
      description,
      deadline: deadline || undefined,
      tasks: validTasks,
    });
    setIsSubmitting(false);

    if (success) {
      // Reset form
      setTitle('');
      setDescription('');
      setDeadline('');
      setTasks([{ id: crypto.randomUUID(), title: '', due_date: '' }]);
      onOpenChange(false);
    }
  };

  const resetAndClose = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setTasks([{ id: crypto.randomUUID(), title: '', due_date: '' }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete React Course"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you want to achieve?"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Target Date</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sub-tasks</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddTask}
                className="text-primary hover:text-primary/80"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      value={task.title}
                      onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)}
                      placeholder={`Task ${index + 1}`}
                      maxLength={200}
                    />
                  </div>
                  <Input
                    type="date"
                    value={task.due_date}
                    onChange={(e) => handleTaskChange(task.id, 'due_date', e.target.value)}
                    className="w-36"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTask(task.id)}
                    disabled={tasks.length === 1}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Add at least one task to track progress
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Goal'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
