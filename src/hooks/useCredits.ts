import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
  balance_after: number;
  created_at: string;
}

export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  last_daily_credit: string | null;
}

// Tool costs in credits
const TOOL_COSTS: Record<string, number> = {
  notes: 5,
  flashcards: 10,
  roadmap: 15,
  mentor: 3,
  quiz: 10,
  essay: 15,
  math: 5,
  mindmap: 10,
  summary: 5,
  language: 5,
};

export function useCredits() {
  const { user } = useAuth();
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const credits = userCredits?.balance || 0;

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setUserCredits(null);
      setTransactions([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch user credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creditsError && creditsError.code !== 'PGRST116') {
        console.error('Error fetching credits:', creditsError);
      }

      // If no credits record exists, create one
      if (!creditsData) {
        const { data: newCredits, error: insertError } = await supabase
          .from('credits')
          .insert({ user_id: user.id, balance: 10, total_earned: 10 })
          .select()
          .single();
        
        if (!insertError && newCredits) {
          setUserCredits(newCredits);
        }
      } else {
        setUserCredits(creditsData);
      }

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsData) {
        setTransactions(transactionsData);
      }
    } catch (error: any) {
      console.error('Error fetching credit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deductCredits = async (
    toolType: 'notes' | 'flashcards' | 'roadmap' | 'mentor',
    description?: string
  ): Promise<boolean> => {
    if (!user || !userCredits) return false;

    const cost = TOOL_COSTS[toolType] || 0;

    // Check if user has enough credits
    if (credits < cost) {
      toast.error('Insufficient credits', {
        description: `You need ${cost} credits but only have ${credits}.`,
      });
      return false;
    }

    try {
      const newBalance = credits - cost;
      const newTotalSpent = (userCredits.total_spent || 0) + cost;

      // Update credits
      const { error: updateError } = await supabase
        .from('credits')
        .update({ 
          balance: newBalance,
          total_spent: newTotalSpent,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: cost,
          type: 'spend',
          reason: description || `Used ${toolType} tool`,
          balance_after: newBalance,
        });

      toast.success(`Used ${cost} credits`);
      await fetchData();
      return true;
    } catch (error: any) {
      console.error('Error deducting credits:', error);
      toast.error('Failed to deduct credits');
      return false;
    }
  };

  const addCredits = async (amount: number, reason: string): Promise<boolean> => {
    if (!user || !userCredits) return false;

    try {
      const newBalance = credits + amount;
      const newTotalEarned = (userCredits.total_earned || 0) + amount;

      // Update credits
      const { error: updateError } = await supabase
        .from('credits')
        .update({ 
          balance: newBalance,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          type: 'earn',
          reason: reason,
          balance_after: newBalance,
        });

      await fetchData();
      return true;
    } catch (error: any) {
      console.error('Error adding credits:', error);
      return false;
    }
  };

  const canAfford = (toolType: 'notes' | 'flashcards' | 'roadmap' | 'mentor'): boolean => {
    const cost = TOOL_COSTS[toolType] || 0;
    return credits >= cost;
  };

  const getCost = (toolType: 'notes' | 'flashcards' | 'roadmap' | 'mentor'): number => {
    return TOOL_COSTS[toolType] || 0;
  };

  return {
    credits,
    userCredits,
    transactions,
    isLoading,
    deductCredits,
    addCredits,
    canAfford,
    getCost,
    refetch: fetchData,
  };
}
