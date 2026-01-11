import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  razorpay_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }

      // If no subscription exists, create a free one
      if (!data) {
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan: 'free',
            status: 'active',
          })
          .select()
          .single();

        if (!insertError && newSub) {
          setSubscription(newSub as Subscription);
        }
      } else {
        setSubscription(data as Subscription);
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const currentTier = subscription?.plan || 'free';
  const isPremium = currentTier === 'premium' || currentTier === 'pro';

  const updateSubscription = async (plan: 'free' | 'pro' | 'premium', periodEnd?: Date) => {
    if (!user) return false;

    try {
      const updateData: any = {
        plan,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      if (periodEnd) {
        updateData.current_period_start = new Date().toISOString();
        updateData.current_period_end = periodEnd.toISOString();
      }

      if (subscription) {
        const { error } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            ...updateData,
          });

        if (error) throw error;
      }

      toast({
        title: 'Subscription updated!',
        description: `You now have access to ${plan} features.`,
      });

      await fetchSubscription();
      return true;
    } catch (error: any) {
      toast({
        title: 'Subscription failed',
        description: error.message || 'Could not update subscription.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return false;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription has been cancelled.',
      });

      await fetchSubscription();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not cancel subscription.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    subscription,
    isLoading,
    isPremium,
    currentTier,
    updateSubscription,
    cancelSubscription,
    refetch: fetchSubscription,
  };
}
