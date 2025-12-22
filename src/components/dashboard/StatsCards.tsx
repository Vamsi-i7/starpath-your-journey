import { Target, CheckCircle2, Flame, Zap } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface StatsCardsProps {
  totalHabits: number;
  completedToday: number;
  totalStreak: number;
}

export function StatsCards({ totalHabits, completedToday, totalStreak }: StatsCardsProps) {
  const { user } = useApp();

  const stats = [
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
      label: 'Total Streak Days',
      value: totalStreak,
      icon: Flame,
      color: 'text-streak',
      bgColor: 'bg-streak/10',
    },
    {
      label: 'Total XP',
      value: user ? user.level * 500 + user.xp : 0,
      icon: Zap,
      color: 'text-level',
      bgColor: 'bg-level/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className="p-5 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-all duration-300 animate-scale-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
