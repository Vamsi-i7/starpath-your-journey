import { useState } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRateLimiter } from './useRateLimiter';
import { useErrorRecovery } from './useErrorRecovery';

type GenerationType = 'notes' | 'flashcards' | 'roadmap' | 'mentor' | 'habit_suggestion' | 'affirmation' | 'coach' | 'notes_from_file' | 'flashcards_from_file' | 'roadmap_from_file';

export function useAIGenerate() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const rateLimiter = useRateLimiter();
  const { executeWithRetry } = useErrorRecovery();

  const generate = async (type: GenerationType, prompt: string, context?: string, fileData?: string) => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to use AI features.',
        variant: 'destructive',
      });
      return null;
    }

    // Check rate limit
    if (!rateLimiter.checkLimit()) {
      const hoursUntilReset = Math.ceil(rateLimiter.timeUntilReset / (1000 * 60 * 60));
      toast({
        title: 'Rate limit reached',
        description: `You've used all ${rateLimiter.maxRequests} requests. Try again in ${hoursUntilReset} hour(s).`,
        variant: 'destructive',
      });
      return null;
    }

    setIsGenerating(true);

    try {
      // Increment rate limit counter
      rateLimiter.incrementCount();

      // Execute with retry logic
      const result = await executeWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke('ai-generate', {
          body: { type, prompt, context, fileData },
        });

        if (error) {
          throw error;
        }

        return data;
      });

      if (!result) {
        return null;
      }

      const data = result;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Log the generation
      await supabase.from('ai_generations').insert({
        user_id: user.id,
        type,
        prompt: fileData ? `[File Upload] ${prompt}` : prompt,
        result: { content: data.result },
      });

      return data.result;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('AI generation error:', error);
      }
      toast({
        title: 'Generation failed',
        description: error.message || 'Could not generate content.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generate,
    isGenerating,
  };
}
