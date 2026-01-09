import { Zap, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';

export function GamificationPanel() {
  const { profile } = useAuth();

  if (!profile) return null;

  const xpProgress = (profile.xp / 500) * 100;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* XP & Level Card */}
      <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border/30">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-level/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-level" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Experience Points</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{profile.xp} XP</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Level {profile.level}</span>
            <span className="text-muted-foreground">Level {profile.level + 1}</span>
          </div>
          <Progress value={xpProgress} className="h-2 sm:h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {500 - profile.xp} XP to next level
          </p>
        </div>
      </div>

      {/* Level Badge */}
      <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow flex-shrink-0">
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground fill-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Current Level</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Level {profile.level}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xp">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">
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
      <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border/30">
        <h3 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Your Journey</h3>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Completed</span>
            <span className="font-medium text-foreground">{profile.total_habits_completed}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total XP Earned</span>
            <span className="font-medium text-xp">{(profile.level - 1) * 500 + profile.xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}