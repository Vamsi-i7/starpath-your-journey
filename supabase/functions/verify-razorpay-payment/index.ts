import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';
import { getCorsHeaders, handleCorsPreFlight } from "../_shared/corsHeaders.ts";
import { verifyAuth, createUnauthorizedResponse } from "../_shared/auth.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req);
  }

  try {
    // 1. Verify authentication
    const { userId, error: authError } = await verifyAuth(req);
    if (authError || !userId) {
      return createUnauthorizedResponse(authError || "Authentication required", corsHeaders);
    }

    // 2. Parse request
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // 3. Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required payment verification fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user from auth
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
      return createUnauthorizedResponse("Invalid session", corsHeaders);
    }

    // 4. MANDATORY: Verify Razorpay signature
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      console.error('CRITICAL: RAZORPAY_KEY_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Payment verification unavailable. Contact support.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const generatedSignature = createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('SECURITY: Invalid payment signature detected for user:', userId);
      return new Response(
        JSON.stringify({ error: 'Payment verification failed. Invalid signature.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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

    // IDEMPOTENCY CHECK: If already processed, return success
    if (order.status === 'completed') {
      console.log('Order already processed (idempotent):', razorpay_order_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment already processed',
          order 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent double-processing with atomic update
    const { error: lockError } = await supabaseClient
      .from('payment_orders')
      .update({ status: 'processing' })
      .eq('order_id', razorpay_order_id)
      .eq('status', 'pending'); // Only update if still pending

    if (lockError) {
      console.log('Order already being processed:', razorpay_order_id);
      return new Response(
        JSON.stringify({ error: 'Payment is already being processed' }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update order status to completed
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
    console.error('Payment verification error:', error);
    
    // Don't expose internal errors
    const publicMessage = error instanceof Error && error.message.includes('signature')
      ? 'Payment verification failed. Please contact support.'
      : error instanceof Error && error.message.includes('not found')
      ? 'Payment order not found. Please try again.'
      : 'Payment verification error. Please contact support.';

    return new Response(
      JSON.stringify({ error: publicMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
