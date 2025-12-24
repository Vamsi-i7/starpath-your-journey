import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  starts_at: string;
  ends_at: string | null;
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

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
    }

    setSubscription(data as Subscription | null);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const isPremium = subscription?.plan_type === 'monthly' || subscription?.plan_type === 'yearly';

  const subscribe = async (planType: 'monthly' | 'yearly') => {
    if (!user) return;

    // Calculate end date
    const endsAt = new Date();
    if (planType === 'monthly') {
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    }

    // For mock payments, we just create the subscription
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_type: planType,
        status: 'active',
        ends_at: endsAt.toISOString(),
      });

    if (error) {
      toast({
        title: 'Subscription failed',
        description: 'Could not process your subscription.',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Subscription activated!',
      description: `You now have access to all premium features.`,
    });
    
    fetchSubscription();
    return true;
  };

  const cancelSubscription = async () => {
    if (!subscription) return;

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscription.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not cancel subscription.',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Subscription cancelled',
      description: 'Your subscription has been cancelled.',
    });
    
    fetchSubscription();
    return true;
  };

  return {
    subscription,
    isLoading,
    isPremium,
    subscribe,
    cancelSubscription,
    refetch: fetchSubscription,
  };
}
