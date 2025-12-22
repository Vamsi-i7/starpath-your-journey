import { Heart, Zap, Star, TrendingUp } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Progress } from '@/components/ui/progress';

export function GamificationPanel() {
  const { user } = useApp();

  if (!user) return null;

  const xpProgress = (user.xp / 500) * 100;
  const heartsArray = Array.from({ length: user.maxHearts }, (_, i) => i < user.hearts);

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
            <p className="text-2xl font-bold text-foreground">{user.xp} XP</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Level {user.level}</span>
            <span className="text-muted-foreground">Level {user.level + 1}</span>
          </div>
          <Progress value={xpProgress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {500 - user.xp} XP to next level
          </p>
        </div>
      </div>

      {/* Hearts Card */}
      <div className="p-6 rounded-2xl bg-card border border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-heart/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-heart fill-heart" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lives Remaining</p>
            <p className="text-2xl font-bold text-foreground">{user.hearts} / {user.maxHearts}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {heartsArray.map((filled, index) => (
            <Heart 
              key={index} 
              className={`w-8 h-8 transition-all duration-300 ${
                filled 
                  ? 'text-heart fill-heart animate-pulse-glow' 
                  : 'text-muted-foreground/30'
              }`} 
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Complete 7-day streaks to earn more hearts
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
              Level {user.level}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xp">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Rising Star</span>
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
            <span className="font-medium text-foreground">{user.totalHabitsCompleted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Longest Streak</span>
            <span className="font-medium text-streak">{user.longestStreak} days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
