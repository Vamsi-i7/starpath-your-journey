import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

// Credit amounts for each plan
const PLAN_CREDITS: Record<string, number> = {
  'pro_monthly': 100,
  'pro_yearly': 100,
  'premium_monthly': 500,
  'premium_yearly': 500,
  'credits_starter_monthly': 50,
  'credits_starter_yearly': 50,
  'credits_popular_monthly': 150,
  'credits_popular_yearly': 150,
  'credits_power_monthly': 350,
  'credits_power_yearly': 350,
  'credits_ultimate_monthly': 1000,
  'credits_ultimate_yearly': 1000,
};

// Subscription tier mapping
const PLAN_TIERS: Record<string, string> = {
  'pro_monthly': 'pro',
  'pro_yearly': 'pro',
  'premium_monthly': 'premium',
  'premium_yearly': 'premium',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload;

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Received webhook event:', eventType);

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const subscription = payload.subscription.entity;
        const payment = payload.payment?.entity;

        // Get user from subscription notes
        const userId = subscription.notes?.user_id;
        const planKey = subscription.notes?.plan_key;

        if (!userId) {
          console.error('No user_id in subscription notes');
          break;
        }

        // Update subscription status
        await supabaseAdmin
          .from('razorpay_subscriptions')
          .update({
            status: subscription.status,
            current_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
            current_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
            charge_at: subscription.charge_at ? new Date(subscription.charge_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', subscription.id);

        // Update user's subscription tier if it's a subscription plan
        if (PLAN_TIERS[planKey]) {
          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan: PLAN_TIERS[planKey],
              status: 'active',
              razorpay_subscription_id: subscription.id,
              current_period_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : new Date().toISOString(),
              current_period_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });
        }

        // Add credits for this billing cycle
        const creditsToAdd = PLAN_CREDITS[planKey] || 0;
        if (creditsToAdd > 0) {
          // Get current credits
          const { data: currentCredits } = await supabaseAdmin
            .from('credits')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (currentCredits) {
            // Update existing credits
            await supabaseAdmin
              .from('credits')
              .update({
                balance: currentCredits.balance + creditsToAdd,
                total_earned: currentCredits.total_earned + creditsToAdd,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);
          } else {
            // Create new credits record
            await supabaseAdmin
              .from('credits')
              .insert({
                user_id: userId,
                balance: creditsToAdd,
                total_earned: creditsToAdd,
              });
          }

          // Log transaction
          await supabaseAdmin
            .from('credit_transactions')
            .insert({
              user_id: userId,
              amount: creditsToAdd,
              type: 'earn',
              reason: `${planKey} subscription renewal`,
              balance_after: (currentCredits?.balance || 0) + creditsToAdd,
            });
        }

        // Record payment
        if (payment) {
          await supabaseAdmin.from('payments').insert({
            user_id: userId,
            amount: payment.amount / 100, // Convert from paise
            currency: payment.currency,
            status: payment.status,
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            plan: planKey,
          });
        }

        break;
      }

      case 'subscription.pending':
      case 'subscription.halted':
      case 'subscription.cancelled': {
        const subscription = payload.subscription.entity;

        // Update subscription status
        await supabaseAdmin
          .from('razorpay_subscriptions')
          .update({
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', subscription.id);

        // If cancelled or halted, update user subscription
        if (subscription.status === 'cancelled' || subscription.status === 'halted') {
          const userId = subscription.notes?.user_id;
          if (userId) {
            await supabaseAdmin
              .from('subscriptions')
              .update({
                status: subscription.status,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);
          }
        }

        break;
      }

      case 'payment.failed': {
        const payment = payload.payment.entity;
        const userId = payment.notes?.user_id;

        if (userId) {
          // Record failed payment
          await supabaseAdmin.from('payments').insert({
            user_id: userId,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: 'failed',
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            plan: payment.notes?.plan_key || 'unknown',
          });

          // Create notification for user
          await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            title: 'Payment Failed',
            message: 'Your subscription payment failed. Please update your payment method.',
            type: 'payment',
          });
        }

        break;
      }

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
