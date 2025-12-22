import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2, Dumbbell, BookOpen, Briefcase, Heart, Code, Languages, Wallet, ChevronLeft } from 'lucide-react';

interface TaskInput {
  id: string;
  title: string;
  due_date: string;
}

interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultTitle: string;
  defaultDescription: string;
  tasks: string[];
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Health & exercise goals',
    icon: <Dumbbell className="w-5 h-5" />,
    defaultTitle: 'Get Fit',
    defaultDescription: 'Improve physical health through consistent exercise and healthy habits',
    tasks: [
      'Create workout schedule',
      'Set up meal prep routine',
      'Track daily water intake',
      'Complete 3 workouts this week',
      'Get 7+ hours of sleep nightly',
    ],
  },
  {
    id: 'learning',
    name: 'Learning',
    description: 'Education & skill development',
    icon: <BookOpen className="w-5 h-5" />,
    defaultTitle: 'Learn New Skill',
    defaultDescription: 'Master a new skill through structured learning and practice',
    tasks: [
      'Find learning resources (courses, books)',
      'Create study schedule',
      'Complete first module/chapter',
      'Practice for 30 mins daily',
      'Build a small project',
      'Review and consolidate notes',
    ],
  },
  {
    id: 'project',
    name: 'Project',
    description: 'Project management & delivery',
    icon: <Briefcase className="w-5 h-5" />,
    defaultTitle: 'Complete Project',
    defaultDescription: 'Successfully deliver a project from planning to completion',
    tasks: [
      'Define project scope and goals',
      'Break down into milestones',
      'Set up project tools/workspace',
      'Complete first milestone',
      'Review progress and adjust',
      'Final review and delivery',
    ],
  },
  {
    id: 'coding',
    name: 'Coding',
    description: 'Programming & development',
    icon: <Code className="w-5 h-5" />,
    defaultTitle: 'Build Application',
    defaultDescription: 'Develop a complete application from concept to deployment',
    tasks: [
      'Plan architecture and features',
      'Set up development environment',
      'Build core functionality',
      'Add user interface',
      'Write tests',
      'Deploy and document',
    ],
  },
  {
    id: 'language',
    name: 'Language',
    description: 'Language learning goals',
    icon: <Languages className="w-5 h-5" />,
    defaultTitle: 'Learn Language',
    defaultDescription: 'Achieve conversational proficiency in a new language',
    tasks: [
      'Choose learning app/method',
      'Learn basic vocabulary (100 words)',
      'Study grammar fundamentals',
      'Practice speaking daily',
      'Watch content in target language',
      'Have first conversation',
    ],
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Mental health & self-care',
    icon: <Heart className="w-5 h-5" />,
    defaultTitle: 'Improve Wellness',
    defaultDescription: 'Build healthy mental habits and self-care routines',
    tasks: [
      'Establish morning routine',
      'Practice meditation daily',
      'Journal thoughts and feelings',
      'Schedule regular breaks',
      'Connect with friends/family',
      'Digital detox evenings',
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial goals & savings',
    icon: <Wallet className="w-5 h-5" />,
    defaultTitle: 'Financial Goal',
    defaultDescription: 'Achieve financial milestone through disciplined saving and planning',
    tasks: [
      'Set specific savings target',
      'Create monthly budget',
      'Track all expenses for a week',
      'Identify areas to cut spending',
      'Set up automatic savings',
      'Review progress monthly',
    ],
  },
];

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
  const [step, setStep] = useState<'template' | 'form'>('template');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tasks, setTasks] = useState<TaskInput[]>([
    { id: crypto.randomUUID(), title: '', due_date: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectTemplate = (template: GoalTemplate | null) => {
    if (template) {
      setTitle(template.defaultTitle);
      setDescription(template.defaultDescription);
      setTasks(template.tasks.map(t => ({
        id: crypto.randomUUID(),
        title: t,
        due_date: '',
      })));
    } else {
      // Blank template
      setTitle('');
      setDescription('');
      setTasks([{ id: crypto.randomUUID(), title: '', due_date: '' }]);
    }
    setStep('form');
  };

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
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setStep('template');
    setTitle('');
    setDescription('');
    setDeadline('');
    setTasks([{ id: crypto.randomUUID(), title: '', due_date: '' }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {step === 'template' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Choose a Template</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Start with a template or create from scratch
              </p>

              <div className="grid grid-cols-2 gap-3">
                {GOAL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        {template.icon}
                      </div>
                      <span className="font-medium text-foreground">{template.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleSelectTemplate(null)}
                className="w-full p-4 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-center"
              >
                <Plus className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Start from Scratch</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep('template')}
                  className="shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <DialogTitle className="text-xl font-semibold">Create Goal</DialogTitle>
              </div>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
