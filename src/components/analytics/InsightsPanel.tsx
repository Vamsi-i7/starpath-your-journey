import { Card } from '@/components/ui/card';
import { AlertCircle, TrendingUp, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Insight {
  type: 'success' | 'warning' | 'info' | 'trend';
  title: string;
  description: string;
  metric?: string;
}

interface InsightsPanelProps {
  insights: Insight[];
  loading?: boolean;
}

export const InsightsPanel = ({ insights, loading = false }: InsightsPanelProps) => {
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColorClasses = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'trend':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) {
    return (
      <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-muted rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Complete more habits to generate insights
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
          {insights.length} insights
        </span>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02]",
              getColorClasses(insight.type)
            )}
          >
            <div className="flex-shrink-0">
              {getIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm text-foreground">
                  {insight.title}
                </h4>
                {insight.metric && (
                  <span className="text-xs font-mono bg-background/50 px-2 py-0.5 rounded whitespace-nowrap">
                    {insight.metric}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {insight.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
