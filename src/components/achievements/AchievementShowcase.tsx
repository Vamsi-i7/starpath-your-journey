import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Trophy, Star, Zap, TrendingUp, Users, Award, Clock } from 'lucide-react';
import { useAchievementsProgress } from '@/hooks/useAchievementsProgress';
import { cn } from '@/lib/utils';
import type { AchievementProgress } from '@/hooks/useAchievementsProgress';

const tierColors = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-400 to-cyan-600',
  diamond: 'from-purple-400 to-purple-600',
};

const typeIcons: Record<string, any> = {
  milestone: Trophy,
  streak: Zap,
  category: Star,
  social: Users,
  special: Award,
  time: Clock,
};

export function AchievementShowcase() {
  const { achievements, isLoading, unlockedCount, totalCount, completionPercentage } = useAchievementsProgress();
  const [filter, setFilter] = useState<string>('all');

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return achievement.is_unlocked;
    if (filter === 'locked') return !achievement.is_unlocked;
    return achievement.achievement_type === filter;
  });

  const groupedByType = achievements.reduce((acc, achievement) => {
    const type = achievement.achievement_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(achievement);
    return acc;
  }, {} as Record<string, AchievementProgress[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Trophy className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Achievement Progress</h3>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} of {totalCount} achievements unlocked
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {completionPercentage.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={completionPercentage} className="h-3" />
        </div>
      </Card>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-8 gap-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
          <TabsTrigger value="locked">Locked</TabsTrigger>
          <TabsTrigger value="milestone">Milestones</TabsTrigger>
          <TabsTrigger value="streak">Streaks</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const Icon = typeIcons[achievement.achievement_type] || Trophy;
          const isUnlocked = achievement.is_unlocked;
          
          return (
            <Card
              key={achievement.achievement_id}
              className={cn(
                "p-6 relative overflow-hidden transition-all",
                isUnlocked 
                  ? "border-primary/40 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg" 
                  : "opacity-60 hover:opacity-80"
              )}
            >
              {/* Tier Badge */}
              <div className="absolute top-3 right-3">
                <Badge
                  className={cn(
                    "uppercase text-xs font-bold bg-gradient-to-r",
                    tierColors[achievement.tier as keyof typeof tierColors]
                  )}
                >
                  {achievement.tier}
                </Badge>
              </div>

              {/* Icon */}
              <div className="mb-4">
                {isUnlocked ? (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl animate-scale-in">
                    {achievement.achievement_icon}
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-bold text-lg",
                      !isUnlocked && "text-muted-foreground"
                    )}>
                      {achievement.achievement_name}
                    </h3>
                  </div>
                </div>

                <p className={cn(
                  "text-sm",
                  isUnlocked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {achievement.achievement_description}
                </p>

                {/* Progress Bar */}
                {!isUnlocked && achievement.progress_percentage > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {achievement.current_value} / {achievement.target_value}
                      </span>
                    </div>
                    <Progress value={achievement.progress_percentage} className="h-2" />
                  </div>
                )}

                {/* XP Reward */}
                <div className="flex items-center justify-between pt-2">
                  <Badge variant={isUnlocked ? "default" : "secondary"} className="gap-1">
                    <Zap className="w-3 h-3" />
                    {achievement.xp_reward} XP
                  </Badge>
                  {isUnlocked && achievement.unlocked_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No achievements found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try a different filter or start completing habits to unlock achievements!
          </p>
        </Card>
      )}
    </div>
  );
}
