import { CheckCircle2 } from 'lucide-react';

interface TodayProgressProps {
  completed: number;
  total: number;
}

export function TodayProgress({ completed, total }: TodayProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-card border border-border/30 self-start sm:self-auto">
      <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 ${completed === total && total > 0 ? 'text-xp' : 'text-muted-foreground'}`} />
      <span className="text-xs sm:text-sm font-medium text-foreground">
        {completed}/{total}
      </span>
      <span className="text-xs sm:text-sm text-muted-foreground">
        ({percentage}%)
      </span>
    </div>
  );
}
