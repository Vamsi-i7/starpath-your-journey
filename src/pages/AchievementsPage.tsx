import { AppTopbar } from '@/components/app/AppTopbar';
import { useAchievements } from '@/hooks/useAchievements';
import { Loader2, Trophy, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AchievementsPage = () => {
  const { 
    achievements, 
    earnedAchievements, 
    isLoading, 
    getTierColor, 
    getTierBg 
  } = useAchievements();

  const earnedIds = new Set(earnedAchievements.map(ea => ea.achievement_id));
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'habits', label: 'Habits' },
    { id: 'goals', label: 'Goals' },
    { id: 'progression', label: 'Progression' },
    { id: 'social', label: 'Social' },
  ];

  const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <AppTopbar title="Achievements" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const sortedAchievements = [...achievements].sort((a, b) => {
    // Sort by earned first, then by tier
    const aEarned = earnedIds.has(a.id);
    const bEarned = earnedIds.has(b.id);
    if (aEarned !== bEarned) return bEarned ? 1 : -1;
    return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
  });

  return (
    <div className="min-h-screen">
      <AppTopbar title="Achievements" />
      <div className="p-6">
        {/* Stats Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-star/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-star" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{earnedAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Unlocked</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{achievements.length - earnedAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Locked</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {Math.round((earnedAchievements.length / achievements.length) * 100) || 0}%
              </p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-star/20 to-streak/20 border border-star/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-star/20 flex items-center justify-center">
              <span className="text-lg">💎</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {earnedAchievements.filter(ea => ea.achievement.tier === 'diamond' || ea.achievement.tier === 'platinum').length}
              </p>
              <p className="text-xs text-muted-foreground">Premium</p>
            </div>
          </div>
        </div>

        {/* Achievement Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 bg-card/50">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="capitalize">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedAchievements
                  .filter(a => cat.id === 'all' || a.category === cat.id)
                  .map((achievement) => {
                    const isEarned = earnedIds.has(achievement.id);
                    const earnedData = earnedAchievements.find(ea => ea.achievement_id === achievement.id);
                    
                    return (
                      <div
                        key={achievement.id}
                        className={cn(
                          "relative p-5 rounded-2xl border transition-all duration-300",
                          isEarned 
                            ? cn(getTierBg(achievement.tier), "border-primary/30 hover:scale-[1.02]")
                            : "bg-card/30 border-border/20 opacity-60"
                        )}
                      >
                        {/* Tier Badge */}
                        <div className={cn(
                          "absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                          isEarned ? getTierBg(achievement.tier) : "bg-muted/20 text-muted-foreground"
                        )}>
                          <span className={isEarned ? getTierColor(achievement.tier) : ""}>
                            {achievement.tier}
                          </span>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center text-3xl",
                            isEarned ? "bg-card/50" : "bg-muted/20 grayscale"
                          )}>
                            {isEarned ? achievement.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-semibold",
                              isEarned ? getTierColor(achievement.tier) : "text-muted-foreground"
                            )}>
                              {achievement.name}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-3 text-xs">
                              <span className="text-star">+{achievement.xp_reward} XP</span>
                              {isEarned && earnedData && (
                                <span className="text-muted-foreground">
                                  Earned {new Date(earnedData.unlocked_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default AchievementsPage;