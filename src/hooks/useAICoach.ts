import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIContext {
  habits?: string;
  goals?: string;
  level?: number;
  xp?: number;
  completedToday?: number;
  streak?: number;
  username?: string;
  message?: string;
}

export function useAICoach() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getHabitSuggestions = useCallback(async (context: AIContext) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { type: 'habit_suggestions', context },
      });

      if (error) throw error;
      return data.content;
    } catch (error: any) {
      console.error('AI error:', error);
      toast({
        title: "AI Error",
        description: error.message || "Failed to get suggestions",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getDailyAffirmation = useCallback(async (context: AIContext) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { type: 'daily_affirmation', context },
      });

      if (error) throw error;
      return data.content;
    } catch (error: any) {
      console.error('AI error:', error);
      toast({
        title: "AI Error",
        description: error.message || "Failed to get affirmation",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const streamCoachChat = useCallback(async (
    message: string,
    onDelta: (text: string) => void,
    onDone: () => void
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ type: 'coach_chat', context: { message } }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to AI coach');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      onDone();
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: error.message || "Failed to get response",
        variant: "destructive",
      });
      onDone();
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    getHabitSuggestions,
    getDailyAffirmation,
    streamCoachChat,
  };
}
