import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Verify signature
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret not configured');
    }

    const generatedSignature = createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Get order details
    const { data: order } = await supabaseClient
      .from('payment_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .single();

    if (!order) {
      throw new Error('Order not found');
    }

    // Update order status
    await supabaseClient
      .from('payment_orders')
      .update({
        status: 'completed',
        payment_id: razorpay_payment_id,
        completed_at: new Date().toISOString(),
      })
      .eq('order_id', razorpay_order_id);

    // Process based on type
    if (order.type === 'subscription') {
      // Update user subscription
      const tier = order.metadata.tier;
      const duration = order.metadata.duration || 1; // months
      
      await supabaseClient
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_start: new Date().toISOString(),
          subscription_end: new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', user.id);

      // Grant monthly credits
      const creditAmounts: Record<string, number> = {
        basic: 50,
        premium: 500,
        lifetime: 1000,
      };

      if (creditAmounts[tier]) {
        await supabaseClient.rpc('add_credits', {
          p_user_id: user.id,
          p_amount: creditAmounts[tier],
          p_transaction_type: 'subscription_grant',
          p_description: `${tier} subscription credits`,
        });
      }

    } else if (order.type === 'credits') {
      // Add purchased credits
      const credits = order.metadata.credits || 0;
      const bonus = order.metadata.bonus || 0;
      const total = credits + bonus;

      await supabaseClient.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: total,
        p_transaction_type: 'purchase',
        p_description: `Purchased ${credits} credits${bonus > 0 ? ` (+${bonus} bonus)` : ''}`,
      });
    }

    return new Response(JSON.stringify({ success: true, order }), {
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
