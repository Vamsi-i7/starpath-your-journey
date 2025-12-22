import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CreateHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const habitIcons = ['🧘', '📚', '💪', '💻', '✍️', '🎯', '🌅', '💧', '🥗', '😴', '🎨', '🎵'];
const habitColors = ['primary', 'accent', 'xp', 'streak'];

export function CreateHabitModal({ open, onOpenChange }: CreateHabitModalProps) {
  const { addHabit } = useApp();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('primary');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [xpReward, setXpReward] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a habit name',
        variant: 'destructive',
      });
      return;
    }

    addHabit({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      frequency,
      xpReward,
    });

    toast({
      title: 'Habit created!',
      description: `"${name}" has been added to your habits`,
    });

    // Reset form
    setName('');
    setDescription('');
    setIcon('🎯');
    setColor('primary');
    setFrequency('daily');
    setXpReward(50);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
          <DialogDescription>
            Add a new habit to track. Completing habits earns you XP!
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              placeholder="e.g., Morning Meditation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., 10 minutes of mindfulness"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {habitIcons.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-10 h-10 text-xl rounded-lg border transition-all ${
                      icon === emoji 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>XP Reward: {xpReward}</Label>
            <input
              type="range"
              min="25"
              max="200"
              step="25"
              value={xpReward}
              onChange={(e) => setXpReward(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>25 XP</span>
              <span>200 XP</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Create Habit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
