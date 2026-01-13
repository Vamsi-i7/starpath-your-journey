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
  const { user, profile } = useAuth();
  const [credits, setCredits] = useState(0);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check and grant daily credits on mount
  const checkAndGrantDailyCredits = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('grant_daily_credits', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error granting daily credits:', error);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        if (result.granted) {
          toast.success(`🎉 ${result.message}`, {
            description: `You received ${result.amount} credits. New balance: ${result.new_balance}`,
          });
        }
      }
    } catch (error) {
      console.error('Error in daily credits check:', error);
    }
  };

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Fetch user credits from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('ai_credits, last_daily_credit')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setCredits(profileData?.ai_credits || 0);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(transactionsData || []);
    } catch (error: any) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      // Check and grant daily credits first
      checkAndGrantDailyCredits();
      // Then fetch current data
      fetchData();
    }
  }, [user?.id]);

  const deductCredits = async (toolType: 'notes' | 'flashcards' | 'roadmap' | 'mentor', reason: string = ''): Promise<boolean> => {
    if (!user?.id) return false;

    const cost = TOOL_COSTS[toolType] || 0;

    if (credits < cost) {
      toast.error('Insufficient credits', {
        description: `You need ${cost} credits to use this tool. Current balance: ${credits}`,
        action: {
          label: 'Get Credits',
          onClick: () => {
            window.location.href = '/app/subscription';
          },
        },
      });
      return false;
    }

    try {
      // Deduct from profile ai_credits
      const newBalance = credits - cost;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          ai_credits: newBalance,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: cost,
          type: 'spend',
          reason: reason || `Used ${toolType} tool`,
          balance_after: newBalance,
        });

      await fetchData();
      return true;
    } catch (error: any) {
      console.error('Error deducting credits:', error);
      toast.error('Failed to deduct credits. Please try again.');
      return false;
    }
  };

  const addCredits = async (amount: number, reason: string = 'Manual addition'): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Use the database function for adding credits
      const { error } = await supabase.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_transaction_type: 'manual',
        p_description: reason,
      });

      if (error) throw error;

      await fetchData();
      toast.success(`Added ${amount} credits!`);
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
