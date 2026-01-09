import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
  color?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}

export const MetricCard = ({
  title,
  value,
  icon: Icon,
  change,
  subtitle,
  color = 'text-primary',
  trend,
  loading = false,
}: MetricCardProps) => {
  const getTrendIcon = () => {
    if (!change) return null;
    if (change.direction === 'up') return <TrendingUp className="w-4 h-4" />;
    if (change.direction === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!change || change.direction === 'neutral') return 'text-muted-foreground';
    
    // Determine if the trend is good or bad
    const isPositive = trend === 'positive' || (trend === undefined && change.direction === 'up');
    return isPositive ? 'text-emerald-500' : 'text-red-500';
  };

  if (loading) {
    return (
      <Card className="p-5 border-border/40 bg-card/50 backdrop-blur-sm animate-pulse">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-8 bg-muted rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {value.toLocaleString()}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {change && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>{change.value.toFixed(1)}%</span>
              <span className="text-xs text-muted-foreground ml-1">vs previous</span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors",
          color
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};
