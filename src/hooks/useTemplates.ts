import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useToast } from '@/hooks/use-toast';

export interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  template_description: string;
  category_id: string;
  category_name: string;
  difficulty: number;
  xp_reward: number;
  icon: string;
  color: string;
  frequency: string;
}

export const useTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = async (categoryFilter?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_habit_templates', {
        category_filter: categoryFilter || null,
      });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error fetching templates:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    isLoading,
    fetchTemplates,
  };
};
