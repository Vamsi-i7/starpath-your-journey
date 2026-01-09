import { useState } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type GenerationType = 'notes' | 'flashcards' | 'roadmap' | 'mentor' | 'habit_suggestion' | 'affirmation' | 'coach' | 'notes_from_file' | 'flashcards_from_file' | 'roadmap_from_file';

export function useAIGenerate() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generate = async (type: GenerationType, prompt: string, context?: string, fileData?: string) => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to use AI features.',
        variant: 'destructive',
      });
      return null;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: { type, prompt, context, fileData },
      });

      if (error) {
        throw error;
      }

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
