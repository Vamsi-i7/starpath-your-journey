import { useState } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from '@/lib/performanceUtils';

export interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  level: number;
  is_premium: boolean;
  premium_tier: string;
}

export const useUserSearch = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm,
        limit_count: 10,
      });

      if (error) throw error;
      setResults(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error searching users:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced version for real-time search
  const debouncedSearch = useDebouncedCallback(searchUsers, 300);

  return {
    results,
    isSearching,
    searchUsers,
    debouncedSearch,
    clearResults: () => setResults([]),
  };
};
