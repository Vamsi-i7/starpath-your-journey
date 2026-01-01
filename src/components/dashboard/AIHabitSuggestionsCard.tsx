import { useState } from 'react';
import { Lightbulb, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAICoach } from '@/hooks/useAICoach';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';

export function AIHabitSuggestionsCard() {
  const { profile } = useAuth();
  const { getHabitSuggestions, isLoading } = useAICoach();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const [suggestions, setSuggestions] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    const habitNames = habits?.map(h => h.name).join(', ') || 'None';
    const goalTitles = goals?.map(g => g.title).join(', ') || 'General productivity';
    
    const content = await getHabitSuggestions({
      habits: habitNames,
      goals: goalTitles,
      level: profile?.level,
    });
    
    if (content) {
      setSuggestions(content);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/30 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground">AI Habit Suggestions</h3>
        </div>
      </div>

      {!suggestions ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">
            Get personalized habit suggestions based on your goals and current routine.
          </p>
          <Button
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Generate Suggestions
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {suggestions}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}
