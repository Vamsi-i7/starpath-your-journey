import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'circle' | 'chart';
  width?: string;
  height?: string;
}

export function Skeleton({ 
  className, 
  variant = 'default',
  width,
  height,
  ...props 
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-muted rounded";
  
  const variantClasses = {
    default: "h-4",
    card: "h-32 rounded-xl",
    text: "h-3",
    circle: "rounded-full aspect-square",
    chart: "h-[300px] rounded-lg",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-xl bg-card border border-border/30 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton variant="text" className="w-1/3" />
        </div>
      </div>
      <Skeleton variant="card" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="p-5 rounded-xl bg-card border border-border/30 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton variant="circle" className="w-12 h-12" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="p-6 rounded-xl bg-card border border-border/30 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton variant="text" className="w-48" />
      </div>
      <Skeleton variant="chart" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="rounded-xl bg-card border border-border/30 overflow-hidden">
      <div className="p-4 border-b border-border/30">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="divide-y divide-border/30">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton variant="circle" className="w-10 h-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton variant="text" className="w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
