import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface AdminUserCreditOverview {
  user_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  subscription_tier: string | null;
  current_balance: number;
  total_credits_purchased: number;
  credits_used_this_month: number;
  last_credit_reset: string | null;
  last_daily_credit: string | null;
  user_created_at: string;
  total_credits_earned: number;
  total_credits_spent: number;
  total_transactions: number;
  last_transaction_date: string | null;
}

export interface AdminCreditTransaction {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  amount: number;
  transaction_type: string;
  description: string | null;
  tool_type: string | null;
  cost_per_use: number | null;
  metadata: any;
  created_at: string;
  user_current_balance: number;
}

export interface AdminCreditStats {
  total_users: number;
  total_credits_in_circulation: number;
  total_credits_earned_all_time: number;
  total_credits_spent_all_time: number;
  avg_credits_per_user: number;
  users_with_zero_credits: number;
  transactions_today: number;
  credits_used_today: number;
}

export interface AdminUserCreditDetails {
  user_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  subscription_tier: string | null;
  current_balance: number;
  total_earned: number;
  total_spent: number;
  total_transactions: number;
  last_transaction_date: string | null;
  last_daily_credit: string | null;
  created_at: string;
}

export function useAdminCredits() {
  const { user, profile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<AdminUserCreditOverview[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<AdminCreditTransaction[]>([]);
  const [stats, setStats] = useState<AdminCreditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsAdmin(data.is_admin || false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  // Fetch all admin data
  const fetchAdminData = async () => {
    if (!user?.id || !isAdmin) return;

    try {
      setIsLoading(true);

      // Fetch user overview
      const { data: usersData, error: usersError } = await supabase
        .from('admin_user_credits_overview')
        .select('*')
        .order('user_created_at', { ascending: false })
        .limit(100);

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('admin_recent_credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setRecentTransactions(transactionsData || []);

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('admin_get_credit_stats');

      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }
    } catch (error: any) {
      console.error('Error fetching admin credit data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user?.id || !isAdmin) return;

    // Subscribe to credit transactions for real-time updates
    const channel = supabase
      .channel('admin-credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_transactions'
        },
        (payload) => {
          console.log('Credit transaction change detected:', payload);
          // Refresh data when changes occur
          fetchAdminData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'ai_credits=neq.null'
        },
        (payload) => {
          console.log('Profile credit change detected:', payload);
          // Refresh data when credits change
          fetchAdminData();
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, isAdmin]);

  // Initial data fetch
  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  // Grant credits to a user
  const grantCredits = async (
    targetUserId: string,
    amount: number,
    reason: string = 'Admin credit grant'
  ): Promise<boolean> => {
    if (!user?.id || !isAdmin) {
      toast.error('Unauthorized', {
        description: 'Only admins can grant credits',
      });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('admin_grant_credits', {
        p_admin_user_id: user.id,
        p_target_user_id: targetUserId,
        p_amount: amount,
        p_reason: reason,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          toast.success('Credits granted successfully', {
            description: result.message,
          });
          await fetchAdminData();
          return true;
        } else {
          toast.error('Failed to grant credits', {
            description: result.message,
          });
          return false;
        }
      }

      return false;
    } catch (error: any) {
      console.error('Error granting credits:', error);
      toast.error('Failed to grant credits', {
        description: error.message,
      });
      return false;
    }
  };

  // Deduct credits from a user
  const deductCredits = async (
    targetUserId: string,
    amount: number,
    reason: string = 'Admin credit deduction'
  ): Promise<boolean> => {
    if (!user?.id || !isAdmin) {
      toast.error('Unauthorized', {
        description: 'Only admins can deduct credits',
      });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('admin_deduct_credits', {
        p_admin_user_id: user.id,
        p_target_user_id: targetUserId,
        p_amount: amount,
        p_reason: reason,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          toast.success('Credits deducted successfully', {
            description: result.message,
          });
          await fetchAdminData();
          return true;
        } else {
          toast.error('Failed to deduct credits', {
            description: result.message,
          });
          return false;
        }
      }

      return false;
    } catch (error: any) {
      console.error('Error deducting credits:', error);
      toast.error('Failed to deduct credits', {
        description: error.message,
      });
      return false;
    }
  };

  // Get detailed credit info for a specific user
  const getUserCreditDetails = async (
    targetUserId: string
  ): Promise<AdminUserCreditDetails | null> => {
    if (!user?.id || !isAdmin) return null;

    try {
      const { data, error } = await supabase.rpc('admin_get_user_credit_details', {
        p_user_id: targetUserId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0];
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching user credit details:', error);
      toast.error('Failed to load user details');
      return null;
    }
  };

  // Get user transactions
  const getUserTransactions = async (
    targetUserId: string,
    limit: number = 50
  ): Promise<AdminCreditTransaction[]> => {
    if (!user?.id || !isAdmin) return [];

    try {
      const { data, error } = await supabase
        .from('admin_recent_credit_transactions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  };

  return {
    isAdmin,
    users,
    recentTransactions,
    stats,
    isLoading,
    grantCredits,
    deductCredits,
    getUserCreditDetails,
    getUserTransactions,
    refetch: fetchAdminData,
  };
}
