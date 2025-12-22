import { Heart, Zap, Star, TrendingUp, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function GamificationPanel() {
  const { profile } = useAuth();

  if (!profile) return null;

  const xpProgress = (profile.xp / 500) * 100;
  const heartsArray = Array.from({ length: profile.max_hearts }, (_, i) => i < profile.hearts);

  // Calculate hearts earned info
  const heartsToNext = profile.hearts < profile.max_hearts 
    ? `Complete 5-day streaks to earn hearts` 
    : 'Maximum hearts reached!';

  return (
    <div className="space-y-4">
      {/* XP & Level Card */}
      <div className="p-6 rounded-2xl bg-card border border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-level/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-level" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Experience Points</p>
            <p className="text-2xl font-bold text-foreground">{profile.xp} XP</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Level {profile.level}</span>
            <span className="text-muted-foreground">Level {profile.level + 1}</span>
          </div>
          <Progress value={xpProgress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {500 - profile.xp} XP to next level
          </p>
        </div>
      </div>

      {/* Hearts Card */}
      <div className="p-6 rounded-2xl bg-card border border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-heart/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-heart fill-heart" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Lives</p>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    Hearts start at 0 and are earned by maintaining streaks. 
                    Every 5 consecutive streak days earns you 1 heart!
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-foreground">{profile.hearts} / {profile.max_hearts}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {heartsArray.map((filled, index) => (
            <Heart 
              key={index} 
              className={`w-8 h-8 transition-all duration-300 ${
                filled 
                  ? 'text-heart fill-heart' 
                  : 'text-muted-foreground/30'
              }`} 
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {heartsToNext}
        </p>
      </div>

      {/* Level Badge */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
            <Star className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Level</p>
            <p className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Level {profile.level}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xp">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">
                {profile.level >= 10 ? 'Galaxy Master' : 
                 profile.level >= 5 ? 'Star Explorer' : 
                 profile.level >= 2 ? 'Rising Star' : 
                 'Stargazer'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="p-6 rounded-2xl bg-card border border-border/30">
        <h3 className="font-semibold text-foreground mb-4">Your Journey</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Completed</span>
            <span className="font-medium text-foreground">{profile.total_habits_completed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Longest Streak</span>
            <span className="font-medium text-streak">{profile.longest_streak} days</span>
          </div>
        </div>
      </div>
    </div>
  );
}