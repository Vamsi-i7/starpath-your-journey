import { useState } from 'react';
import { CheckCircle2, Circle, Flame, Zap, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    streak: number;
    xp_reward: number;
    completedDates: string[];
  };
  onToggle: () => void;
  onDelete: () => void;
  today: string;
}

export function HabitCard({ habit, onToggle, onDelete, today }: HabitCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isCompletedToday = habit.completedDates.includes(today);

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const colorClasses: Record<string, string> = {
    primary: 'from-primary/20 to-primary/5 border-primary/30',
    accent: 'from-accent/20 to-accent/5 border-accent/30',
    xp: 'from-xp/20 to-xp/5 border-xp/30',
    streak: 'from-streak/20 to-streak/5 border-streak/30',
  };

  return (
    <>
      <div 
        className={cn(
          "group p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer",
          isCompletedToday 
            ? "bg-gradient-to-br from-xp/20 to-xp/5 border-xp/30" 
            : `bg-gradient-to-br ${colorClasses[habit.color] || colorClasses.primary}`
        )}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{habit.icon}</span>
            <div>
              <h3 className="font-semibold text-foreground">{habit.name}</h3>
              <p className="text-sm text-muted-foreground">{habit.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-card/50 transition-all">
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-streak">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">{habit.streak} day streak</span>
            </div>
            <div className="flex items-center gap-1.5 text-level">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">+{habit.xp_reward} XP</span>
            </div>
          </div>

          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
            isCompletedToday 
              ? "bg-xp text-xp-foreground" 
              : "bg-card/50 text-muted-foreground group-hover:bg-card"
          )}>
            {isCompletedToday ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{habit.name}"? This action cannot be undone and you will lose all streak data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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
