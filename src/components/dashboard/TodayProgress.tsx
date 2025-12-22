import { CheckCircle2 } from 'lucide-react';

interface TodayProgressProps {
  completed: number;
  total: number;
}

export function TodayProgress({ completed, total }: TodayProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/30">
      <CheckCircle2 className={`w-5 h-5 ${completed === total && total > 0 ? 'text-xp' : 'text-muted-foreground'}`} />
      <span className="text-sm font-medium text-foreground">
        {completed}/{total}
      </span>
      <span className="text-sm text-muted-foreground">
        ({percentage}%)
      </span>
    </div>
  );
}
