import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { toast } from 'sonner';

type GenerationType = 
  | 'notes' 
  | 'flashcards' 
  | 'roadmap' 
  | 'mentor'
  | 'notes_from_file'
  | 'flashcards_from_file'
  | 'roadmap_from_file';

export function useAIGenerateStreaming() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [progress, setProgress] = useState(0);

  const generateStreaming = useCallback(
    async (
      type: GenerationType,
      prompt: string,
      context?: string,
      fileData?: string,
      onChunk?: (chunk: string, accumulated: string) => void,
      onComplete?: (finalContent: string) => void
    ): Promise<string | null> => {
      setIsGenerating(true);
      setStreamedContent('');
      setProgress(0);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Please log in to use AI tools');
          return null;
        }

        const requestBody: any = {
          type,
          prompt,
        };

        if (context) requestBody.context = context;
        if (fileData) requestBody.fileData = fileData;

        // For now, we'll use the existing non-streaming endpoint
        // In production, you'd implement a streaming endpoint
        const { data, error } = await supabase.functions.invoke('ai-generate', {
          body: requestBody,
        });

        if (error) throw error;

        const result = data.result || data.content || '';
        
        // Simulate streaming for better UX
        if (result && onChunk) {
          const words = result.split(' ');
          let accumulated = '';
          const chunkSize = Math.max(1, Math.floor(words.length / 20)); // 20 chunks
          
          for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
            accumulated += chunk;
            setStreamedContent(accumulated);
            setProgress((i / words.length) * 100);
            onChunk(chunk, accumulated);
            
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          setStreamedContent(result);
          setProgress(100);
          if (onComplete) onComplete(result);
        }

        // Save to history
        await supabase.from('ai_generation_history').insert({
          user_id: session.user.id,
          generation_type: type,
          prompt,
          result,
        });

        return result;
      } catch (error: any) {
        console.error('AI generation error:', error);
        toast.error(error.message || 'Failed to generate content');
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStreamedContent('');
    setProgress(0);
  }, []);

  return {
    generateStreaming,
    isGenerating,
    streamedContent,
    progress,
    reset,
  };
}
