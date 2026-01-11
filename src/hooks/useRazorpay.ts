import { useState } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { initializeRazorpay, getRazorpayKey, RazorpayResponse } from '@/lib/razorpay';

// Plan key mappings for Razorpay auto-recurring subscriptions
const PLAN_KEYS: Record<string, { monthly: string; yearly: string }> = {
  // Subscription plans
  pro: { monthly: 'pro_monthly', yearly: 'pro_yearly' },
  premium: { monthly: 'premium_monthly', yearly: 'premium_yearly' },
  // Credit plans
  Starter: { monthly: 'credits_starter_monthly', yearly: 'credits_starter_yearly' },
  Popular: { monthly: 'credits_popular_monthly', yearly: 'credits_popular_yearly' },
  Power: { monthly: 'credits_power_monthly', yearly: 'credits_power_yearly' },
  Ultimate: { monthly: 'credits_ultimate_monthly', yearly: 'credits_ultimate_yearly' },
};

interface PurchaseOptions {
  amount: number;
  type: 'subscription' | 'credits';
  metadata: {
    tier?: string;
    duration?: number;
    credits?: number;
    bonus?: number;
    packageName?: string;
  };
}

export function useRazorpay() {
  const { user, profile, refreshProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrder = async (options: PurchaseOptions) => {
    if (!user) {
      toast.error('Please log in to make a purchase');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: options.amount,
          currency: 'INR',
          type: options.type,
          metadata: options.metadata,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      return null;
    }
  };

  // Create auto-recurring subscription via Razorpay Subscriptions API
  const createRecurringSubscription = async (planKey: string) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: {
          plan_key: planKey,
          customer_email: user.email,
          customer_name: profile?.full_name || profile?.username || user.email?.split('@')[0],
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || 'Failed to create subscription');
      return null;
    }
  };

  const verifyPayment = async (response: RazorpayResponse) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: response,
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error('Payment verification failed');
      return null;
    }
  };

  // Auto-recurring subscription purchase
  const purchaseSubscription = async (tier: string, amount: number, duration: number = 1) => {
    if (!user) {
      toast.error('Please login to subscribe');
      return;
    }

    setIsProcessing(true);

    try {
      const billingCycle = duration >= 12 ? 'yearly' : 'monthly';
      const planKeys = PLAN_KEYS[tier];
      
      if (planKeys) {
        // Use Razorpay Subscriptions API for auto-recurring billing
        const planKey = planKeys[billingCycle];
        const result = await createRecurringSubscription(planKey);

        if (result?.short_url) {
          // Open Razorpay subscription payment page
          toast.success('Redirecting to payment page...');
          window.open(result.short_url, '_blank');
          
          // Show instructions
          toast.info('Complete payment in the new tab. Your subscription will activate automatically.', {
            duration: 10000,
          });
        } else {
          throw new Error('Failed to create subscription. Please try again.');
        }
      } else {
        // Fallback to one-time payment for free tier or unsupported plans
        const order = await createOrder({
          amount,
          type: 'subscription',
          metadata: { tier, duration },
        });

        if (!order) {
          throw new Error('Failed to create order');
        }

        await initializeRazorpay({
          key: getRazorpayKey(),
          amount: order.amount,
          currency: order.currency,
          name: 'StarPath',
          description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan - ${billingCycle}`,
          order_id: order.id,
          prefill: {
            name: profile?.full_name || profile?.username || '',
            email: user?.email || '',
          },
          theme: {
            color: '#6366f1',
          },
          handler: async (response: RazorpayResponse) => {
            const verified = await verifyPayment(response);
            if (verified) {
              toast.success('Subscription activated! 🎉');
              await refreshProfile();
            }
            setIsProcessing(false);
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled');
              setIsProcessing(false);
            },
          },
        });
        return;
      }
    } catch (error: any) {
      console.error('Error purchasing subscription:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-recurring credit subscription purchase
  const purchaseCredits = async (
    credits: number,
    bonus: number,
    amount: number,
    packageName: string,
    duration: number = 1 // 1 = monthly, 12 = yearly
  ) => {
    if (!user) {
      toast.error('Please login to subscribe');
      return;
    }

    setIsProcessing(true);

    try {
      const billingCycle = duration >= 12 ? 'yearly' : 'monthly';
      // Extract the plan name (Starter, Popular, Power, Ultimate)
      const planName = packageName.split(' ')[0];
      const planKeys = PLAN_KEYS[planName];
      
      if (planKeys) {
        // Use Razorpay Subscriptions API for auto-recurring billing
        const planKey = planKeys[billingCycle];
        const result = await createRecurringSubscription(planKey);

        if (result?.short_url) {
          toast.success('Redirecting to payment page...');
          window.open(result.short_url, '_blank');
          
          toast.info('Complete payment in the new tab. Credits will be added automatically every month.', {
            duration: 10000,
          });
        } else {
          throw new Error('Failed to create credit subscription. Please try again.');
        }
      } else {
        // Fallback to one-time payment
        const order = await createOrder({
          amount,
          type: 'credits',
          metadata: { credits, bonus, packageName, duration },
        });

        if (!order) {
          throw new Error('Failed to create order');
        }

        const billingType = duration === 12 ? 'Yearly' : 'Monthly';
        const description = `${packageName} - ${credits} Credits/${billingType === 'Yearly' ? 'month (Yearly)' : 'month'}`;

        await initializeRazorpay({
          key: getRazorpayKey(),
          amount: order.amount,
          currency: order.currency,
          name: 'StarPath',
          description,
          order_id: order.id,
          prefill: {
            name: profile?.full_name || profile?.username || '',
            email: user?.email || '',
          },
          theme: {
            color: '#6366f1',
          },
          handler: async (response: RazorpayResponse) => {
            const verified = await verifyPayment(response);
            if (verified) {
              toast.success(`Credit subscription activated! ${credits} credits/month 🎉`);
              await refreshProfile();
            }
            setIsProcessing(false);
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled');
              setIsProcessing(false);
            },
          },
        });
        return;
      }
    } catch (error: any) {
      console.error('Error purchasing credits:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    purchaseSubscription,
    purchaseCredits,
  };
}
