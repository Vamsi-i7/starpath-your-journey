import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAICoach } from '@/hooks/useAICoach';
import { useHabits } from '@/hooks/useHabits';

export function AIAffirmationCard() {
  const { profile } = useAuth();
  const { getDailyAffirmation, isLoading } = useAICoach();
  const { habits, getTodayString } = useHabits();
  const [affirmation, setAffirmation] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const today = getTodayString();
  const completedToday = habits?.filter(h => h.completedDates?.includes(today)).length || 0;
  const maxStreak = habits?.reduce((max, h) => Math.max(max, h.streak || 0), 0) || 0;

  const fetchAffirmation = async () => {
    const content = await getDailyAffirmation({
      username: profile?.username,
      level: profile?.level,
      xp: profile?.xp,
      completedToday,
      streak: maxStreak,
    });
    if (content) {
      setAffirmation(content);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    if (profile && !hasLoaded) {
      fetchAffirmation();
    }
  }, [profile]);

  if (!affirmation && !isLoading) return null;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Daily Insight</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchAffirmation}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 bg-muted/50 rounded animate-pulse w-full" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {affirmation}
        </p>
      )}
    </div>
  );
}
