import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LibraryItem {
  id: string;
  user_id: string;
  tool_type: 'notes' | 'flashcards' | 'roadmap' | 'mentor';
  title: string;
  content: any;
  raw_content?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  delete_at?: string;
  is_pinned: boolean;
}

export function useLibrary() {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching library:', error);
      toast.error('Failed to load library');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const saveItem = async (
    toolType: LibraryItem['tool_type'],
    title: string,
    content: any,
    rawContent?: string,
    tags: string[] = []
  ) => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    try {
      // Check library limits
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'lifetime';
      const currentCount = items.length;
      const limit = isPremium ? Infinity : 10;

      if (currentCount >= limit) {
        toast.error('Library limit reached', {
          description: isPremium 
            ? 'You have reached the maximum library size.' 
            : 'Free users can save up to 10 items. Upgrade to premium for unlimited storage.',
        });
        return null;
      }

      const { data, error } = await supabase
        .from('ai_library')
        .insert({
          user_id: user.id,
          tool_type: toolType,
          title,
          content,
          raw_content: rawContent,
          tags,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Saved to library!');
      fetchItems();
      return data;
    } catch (error: any) {
      console.error('Error saving to library:', error);
      toast.error('Failed to save to library');
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Item deleted');
      fetchItems();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_library')
        .update({ is_pinned: !currentPinned })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentPinned ? 'Unpinned' : 'Pinned');
      fetchItems();
    } catch (error: any) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update');
    }
  };

  const updateTags = async (id: string, tags: string[]) => {
    try {
      const { error } = await supabase
        .from('ai_library')
        .update({ tags })
        .eq('id', id);

      if (error) throw error;

      toast.success('Tags updated');
      fetchItems();
    } catch (error: any) {
      console.error('Error updating tags:', error);
      toast.error('Failed to update tags');
    }
  };

  return {
    items,
    isLoading,
    saveItem,
    deleteItem,
    togglePin,
    updateTags,
    refetch: fetchItems,
  };
}
