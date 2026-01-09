import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface HabitCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  user_id: string | null;
  is_system: boolean;
  sort_order: number;
  habit_count?: number;
}

export const useCategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('habit_categories')
        .select('*')
        .or(`is_system.eq.true,user_id.eq.${user.id}`)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error fetching categories:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const createCategory = async (category: Partial<HabitCategory>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('habit_categories')
        .insert({
          ...category,
          user_id: user.id,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category created successfully',
      });

      fetchCategories();
      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCategory = async (id: string, updates: Partial<HabitCategory>) => {
    try {
      const { error } = await supabase
        .from('habit_categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('habit_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  return {
    categories,
    isLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
