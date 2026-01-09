import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription_grant';
  description: string | null;
  tool_type: 'notes' | 'flashcards' | 'roadmap' | 'mentor' | null;
  cost_per_use: number | null;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
  bonus_credits: number;
  is_active: boolean;
  sort_order: number;
}

export interface ToolCost {
  tool_type: 'notes' | 'flashcards' | 'roadmap' | 'mentor';
  credits_per_use: number;
  description: string;
}

export function useCredits() {
  const { user, profile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [toolCosts, setToolCosts] = useState<ToolCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const credits = profile?.ai_credits || 0;

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [transactionsRes, packagesRes, costsRes] = await Promise.all([
        supabase
          .from('credit_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('credit_packages')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('ai_tool_costs')
          .select('*'),
      ]);

      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (packagesRes.data) setPackages(packagesRes.data);
      if (costsRes.data) setToolCosts(costsRes.data);
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
    if (!user) return false;

    // Get cost for this tool
    const toolCost = toolCosts.find(c => c.tool_type === toolType);
    if (!toolCost) {
      toast.error('Unable to determine credit cost');
      return false;
    }

    // Check if user has enough credits
    if (credits < toolCost.credits_per_use) {
      toast.error('Insufficient credits', {
        description: `You need ${toolCost.credits_per_use} credits but only have ${credits}.`,
      });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: toolCost.credits_per_use,
        p_tool_type: toolType,
        p_description: description || `Used ${toolType} tool`,
      });

      if (error) throw error;

      if (data) {
        toast.success(`Used ${toolCost.credits_per_use} credits`);
        await refreshProfile();
        fetchData();
        return true;
      } else {
        toast.error('Insufficient credits');
        return false;
      }
    } catch (error: any) {
      console.error('Error deducting credits:', error);
      toast.error('Failed to deduct credits');
      return false;
    }
  };

  const canAfford = (toolType: 'notes' | 'flashcards' | 'roadmap' | 'mentor'): boolean => {
    const toolCost = toolCosts.find(c => c.tool_type === toolType);
    if (!toolCost) return false;
    return credits >= toolCost.credits_per_use;
  };

  const getCost = (toolType: 'notes' | 'flashcards' | 'roadmap' | 'mentor'): number => {
    const toolCost = toolCosts.find(c => c.tool_type === toolType);
    return toolCost?.credits_per_use || 0;
  };

  return {
    credits,
    transactions,
    packages,
    toolCosts,
    isLoading,
    deductCredits,
    canAfford,
    getCost,
    refetch: fetchData,
  };
}
