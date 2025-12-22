import { useAchievements } from '@/hooks/useAchievements';
import { Progress } from '@/components/ui/progress';
import { Target, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DailyChallengesCard() {
  const { dailyChallenges, challengeProgress, isLoading } = useAchievements();

  if (isLoading || dailyChallenges.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Daily Challenges</h3>
          <p className="text-xs text-muted-foreground">Complete for bonus XP!</p>
        </div>
      </div>

      <div className="space-y-3">
        {dailyChallenges.map((challenge) => {
          const progress = challengeProgress.find(p => p.challenge_id === challenge.id);
          const currentProgress = progress?.progress || 0;
          const isCompleted = progress?.completed || false;
          const progressPercent = Math.min((currentProgress / challenge.target_value) * 100, 100);

          return (
            <div 
              key={challenge.id}
              className={cn(
                "p-4 rounded-xl border transition-all duration-300",
                isCompleted 
                  ? "bg-xp/10 border-xp/30" 
                  : "bg-card/50 border-border/30"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{challenge.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium truncate",
                      isCompleted ? "text-xp" : "text-foreground"
                    )}>
                      {challenge.title}
                    </p>
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-xp flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{challenge.description}</p>
                  
                  <div className="mt-2 space-y-1">
                    <Progress value={progressPercent} className="h-2" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {currentProgress} / {challenge.target_value}
                      </span>
                      <span className="flex items-center gap-1 text-star">
                        <Zap className="w-3 h-3" />
                        +{challenge.xp_reward} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}