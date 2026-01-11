import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export interface LibraryItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  content_type: 'notes' | 'flashcards' | 'roadmap' | 'chat' | 'quiz' | 'essay' | 'math' | 'mindmap' | 'summary' | 'language';
  tags: string[] | null;
  metadata: any;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export function useLibrary() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_library')
        .select('*')
        .eq('user_id', user.id)
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
    contentType: LibraryItem['content_type'],
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

      // Convert content to string if it's an object
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

      const { data, error } = await supabase
        .from('ai_library')
        .insert({
          user_id: user.id,
          content_type: contentType,
          title,
          content: contentStr,
          tags: tags.length > 0 ? tags : null,
          metadata: rawContent ? { raw_content: rawContent } : null,
          is_favorite: false,
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

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_library')
        .update({ is_favorite: !currentFavorite })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentFavorite ? 'Removed from favorites' : 'Added to favorites');
      fetchItems();
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
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
    toggleFavorite,
    updateTags,
    refetch: fetchItems,
  };
}
