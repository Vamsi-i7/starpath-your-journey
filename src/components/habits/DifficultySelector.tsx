import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface DifficultySelectorProps {
  value: number;
  onChange: (difficulty: number) => void;
  showXpMultiplier?: boolean;
  className?: string;
}

const difficultyInfo = [
  { level: 1, label: 'Easy', multiplier: '1x', color: 'text-green-500', description: 'Simple daily task' },
  { level: 2, label: 'Medium', multiplier: '1.2x', color: 'text-blue-500', description: 'Requires some effort' },
  { level: 3, label: 'Hard', multiplier: '1.5x', color: 'text-yellow-500', description: 'Challenging task' },
  { level: 4, label: 'Very Hard', multiplier: '2x', color: 'text-orange-500', description: 'Very challenging' },
  { level: 5, label: 'Extreme', multiplier: '3x', color: 'text-red-500', description: 'Maximum difficulty' },
];

export function DifficultySelector({ value, onChange, showXpMultiplier = true, className }: DifficultySelectorProps) {
  const selected = difficultyInfo.find(d => d.level === value) || difficultyInfo[0];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label>Difficulty Level</Label>
        {showXpMultiplier && (
          <span className="text-sm text-muted-foreground">
            XP Multiplier: <span className={cn("font-bold", selected.color)}>{selected.multiplier}</span>
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {difficultyInfo.map((difficulty) => (
          <button
            key={difficulty.level}
            onClick={() => onChange(difficulty.level)}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
              "hover:border-primary/50",
              value === difficulty.level
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card"
            )}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: difficulty.level }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("w-3 h-3", difficulty.color)}
                  fill="currentColor"
                />
              ))}
            </div>
            <span className={cn(
              "text-xs font-medium",
              value === difficulty.level ? difficulty.color : "text-muted-foreground"
            )}>
              {difficulty.label}
            </span>
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        {selected.description}
      </p>
    </div>
  );
}
