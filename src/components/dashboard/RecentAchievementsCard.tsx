import { useAchievements } from '@/hooks/useAchievements';
import { Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function RecentAchievementsCard() {
  const { earnedAchievements, getRarityColor, getRarityBg } = useAchievements();

  // Get the 3 most recent achievements
  const recentAchievements = [...earnedAchievements]
    .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
    .slice(0, 3);

  return (
    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border/30">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-star/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-star" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Achievements</h3>
            <p className="text-xs text-muted-foreground">{earnedAchievements.length} unlocked</p>
          </div>
        </div>
        <Link 
          to="/app/achievements"
          className="flex items-center gap-1 text-xs sm:text-sm text-primary hover:underline"
        >
          View all
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </Link>
      </div>

      {recentAchievements.length === 0 ? (
        <div className="text-center py-4 sm:py-6">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs sm:text-sm text-muted-foreground">No achievements yet</p>
          <p className="text-xs text-muted-foreground">Complete habits to unlock badges!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentAchievements.map((earned) => (
            <div 
              key={earned.id}
              className={cn(
                "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all hover:scale-[1.02]",
                getRarityBg(earned.achievement.rarity)
              )}
            >
              <span className="text-xl sm:text-2xl flex-shrink-0">{earned.achievement.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium text-sm truncate", getRarityColor(earned.achievement.rarity))}>
                  {earned.achievement.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {earned.achievement.description}
                </p>
              </div>
              <div className="text-xs text-muted-foreground capitalize hidden sm:block">
                {earned.achievement.rarity}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}