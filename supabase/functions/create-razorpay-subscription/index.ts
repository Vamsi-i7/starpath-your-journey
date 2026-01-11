import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Razorpay Plan IDs - These should match plans created in Razorpay Dashboard
// You'll need to replace these with your actual Plan IDs from Razorpay
const RAZORPAY_PLANS = {
  // Subscription Plans
  'pro_monthly': Deno.env.get('RAZORPAY_PLAN_PRO_MONTHLY') || '',
  'pro_yearly': Deno.env.get('RAZORPAY_PLAN_PRO_YEARLY') || '',
  'premium_monthly': Deno.env.get('RAZORPAY_PLAN_PREMIUM_MONTHLY') || '',
  'premium_yearly': Deno.env.get('RAZORPAY_PLAN_PREMIUM_YEARLY') || '',
  // Credit Plans
  'credits_starter_monthly': Deno.env.get('RAZORPAY_PLAN_CREDITS_STARTER_MONTHLY') || '',
  'credits_starter_yearly': Deno.env.get('RAZORPAY_PLAN_CREDITS_STARTER_YEARLY') || '',
  'credits_popular_monthly': Deno.env.get('RAZORPAY_PLAN_CREDITS_POPULAR_MONTHLY') || '',
  'credits_popular_yearly': Deno.env.get('RAZORPAY_PLAN_CREDITS_POPULAR_YEARLY') || '',
  'credits_power_monthly': Deno.env.get('RAZORPAY_PLAN_CREDITS_POWER_MONTHLY') || '',
  'credits_power_yearly': Deno.env.get('RAZORPAY_PLAN_CREDITS_POWER_YEARLY') || '',
  'credits_ultimate_monthly': Deno.env.get('RAZORPAY_PLAN_CREDITS_ULTIMATE_MONTHLY') || '',
  'credits_ultimate_yearly': Deno.env.get('RAZORPAY_PLAN_CREDITS_ULTIMATE_YEARLY') || '',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { plan_key, customer_email, customer_name, customer_contact } = await req.json();

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const planId = RAZORPAY_PLANS[plan_key as keyof typeof RAZORPAY_PLANS];

    if (!planId) {
      throw new Error(`Invalid plan: ${plan_key}. Please configure Razorpay plan IDs in Supabase secrets.`);
    }

    // Step 1: Create or get customer
    let customerId: string;

    // Check if user already has a Razorpay customer ID
    const { data: existingCustomer } = await supabaseClient
      .from('user_razorpay_customers')
      .select('razorpay_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingCustomer?.razorpay_customer_id) {
      customerId = existingCustomer.razorpay_customer_id;
    } else {
      // Create new Razorpay customer
      const customerResponse = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customer_name || user.email?.split('@')[0] || 'Customer',
          email: customer_email || user.email,
          contact: customer_contact || '',
          notes: {
            user_id: user.id,
          },
        }),
      });

      if (!customerResponse.ok) {
        const error = await customerResponse.text();
        console.error('Failed to create customer:', error);
        throw new Error('Failed to create customer');
      }

      const customer = await customerResponse.json();
      customerId = customer.id;

      // Store customer ID in database
      await supabaseClient.from('user_razorpay_customers').insert({
        user_id: user.id,
        razorpay_customer_id: customerId,
        email: customer_email || user.email,
      });
    }

    // Step 2: Create subscription
    const subscriptionData = {
      plan_id: planId,
      customer_id: customerId,
      total_count: plan_key.includes('yearly') ? 1 : 12, // 1 year for yearly, 12 months for monthly
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: user.id,
        plan_key: plan_key,
      },
    };

    const subscriptionResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      console.error('Razorpay subscription error:', error);
      throw new Error('Failed to create subscription');
    }

    const subscription = await subscriptionResponse.json();

    // Store subscription in database with pending status
    await supabaseClient.from('razorpay_subscriptions').insert({
      user_id: user.id,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: planId,
      plan_key: plan_key,
      status: 'created',
      short_url: subscription.short_url,
      current_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
      current_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
    });

    return new Response(JSON.stringify({
      subscription_id: subscription.id,
      short_url: subscription.short_url,
      status: subscription.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
