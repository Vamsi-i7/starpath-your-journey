import { Target, CheckCircle2, Zap, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StatsCardsProps {
  totalHabits: number;
  completedToday: number;
  totalXp: number;
}

export function StatsCards({ totalHabits, completedToday, totalXp }: StatsCardsProps) {
  const stats: Array<{
    label: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
    tooltip?: boolean;
  }> = [
    {
      label: 'Total Habits',
      value: totalHabits,
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Completed Today',
      value: completedToday,
      icon: CheckCircle2,
      color: 'text-xp',
      bgColor: 'bg-xp/10',
    },
    {
      label: 'Total XP',
      value: totalXp,
      icon: Zap,
      color: 'text-level',
      bgColor: 'bg-level/10',
      tooltip: true,
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-all duration-300 animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
              </div>
              <div className="text-center sm:text-left min-w-0 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                  {stat.tooltip && (
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <button className="hover:text-primary transition-colors">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-primary" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-4" side="bottom">
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">Earning XP</p>
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <p>✅ Complete habits: <span className="text-foreground font-medium">+50 XP</span></p>
                            <p>⏱️ Active time: <span className="text-foreground font-medium">+1 XP/min</span></p>
                            <p>🏆 Unlock achievements for bonus XP!</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
