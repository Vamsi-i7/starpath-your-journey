import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  account_status: string;
  ai_credits: number;
  total_credits_purchased: number;
  credits_used_this_month: number;
  subscription_status: string;
  subscription_plan: string;
  disabled_at: string | null;
  disabled_reason: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface AuditLogEntry {
  id: string;
  admin_email: string;
  action: string;
  target_user_email: string | null;
  entity_type: string;
  before_value: any;
  after_value: any;
  metadata: any;
  created_at: string;
}

export function useAdminUserManagement() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('admin_get_all_users', {
        p_admin_user_id: user.id,
        p_search: searchQuery || null,
        p_status: statusFilter,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async (limit: number = 50) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    }
  };

  // Update user account status
  const setUserStatus = async (
    targetUserId: string,
    status: 'active' | 'disabled' | 'suspended',
    reason?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('admin_set_user_status', {
        p_admin_user_id: user.id,
        p_target_user_id: targetUserId,
        p_status: status,
        p_reason: reason || null,
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].success) {
        toast.success('Status updated', {
          description: data[0].message,
        });
        await fetchUsers();
        await fetchAuditLogs();
        return true;
      } else {
        toast.error('Failed to update status', {
          description: data?.[0]?.message || 'Unknown error',
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status', {
        description: error.message,
      });
      return false;
    }
  };

  // Update user subscription
  const updateUserSubscription = async (
    targetUserId: string,
    planType: string,
    status: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('admin_update_user_subscription', {
        p_admin_user_id: user.id,
        p_target_user_id: targetUserId,
        p_plan_type: planType,
        p_status: status,
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].success) {
        toast.success('Subscription updated', {
          description: data[0].message,
        });
        await fetchUsers();
        await fetchAuditLogs();
        return true;
      } else {
        toast.error('Failed to update subscription', {
          description: data?.[0]?.message || 'Unknown error',
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription', {
        description: error.message,
      });
      return false;
    }
  };

  // Grant credits to user (using existing admin_grant_credits function)
  const grantCredits = async (
    targetUserId: string,
    amount: number,
    reason: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('admin_grant_credits', {
        p_admin_user_id: user.id,
        p_target_user_id: targetUserId,
        p_amount: amount,
        p_reason: reason,
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].success) {
        toast.success('Credits granted', {
          description: data[0].message,
        });
        await fetchUsers();
        await fetchAuditLogs();
        return true;
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

  // Deduct credits from user (using existing admin_deduct_credits function)
  const deductCredits = async (
    targetUserId: string,
    amount: number,
    reason: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('admin_deduct_credits', {
        p_admin_user_id: user.id,
        p_target_user_id: targetUserId,
        p_amount: amount,
        p_reason: reason,
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].success) {
        toast.success('Credits deducted', {
          description: data[0].message,
        });
        await fetchUsers();
        await fetchAuditLogs();
        return true;
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

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchUsers();
      fetchAuditLogs();
    }
  }, [user?.id, searchQuery, statusFilter]);

  return {
    users,
    auditLogs,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    setUserStatus,
    updateUserSubscription,
    grantCredits,
    deductCredits,
    refetch: fetchUsers,
    refetchAuditLogs: fetchAuditLogs,
  };
}
