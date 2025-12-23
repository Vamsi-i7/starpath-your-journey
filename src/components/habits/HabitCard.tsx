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
          "group p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer min-w-0",
          isCompletedToday 
            ? "bg-gradient-to-br from-xp/20 to-xp/5 border-xp/30" 
            : `bg-gradient-to-br ${colorClasses[habit.color] || colorClasses.primary}`
        )}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <span className="text-2xl sm:text-3xl flex-shrink-0">{habit.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{habit.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{habit.description}</p>
            </div>
          </div>
          
          <div className="flex items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-card/50 transition-all">
                  <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
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

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 text-streak">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{habit.streak}d</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-level">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">+{habit.xp_reward} XP</span>
            </div>
          </div>

          <div className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0",
            isCompletedToday 
              ? "bg-xp text-xp-foreground" 
              : "bg-card/50 text-muted-foreground group-hover:bg-card"
          )}>
            {isCompletedToday ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
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
