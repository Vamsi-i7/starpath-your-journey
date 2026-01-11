import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreFlight } from "../_shared/corsHeaders.ts";
import { checkRateLimit, addRateLimitHeaders, createRateLimitResponse } from "../_shared/rateLimiter.ts";
import { verifyAuth, createUnauthorizedResponse } from "../_shared/auth.ts";

// Rate limit: 5 payment orders per minute (prevent spam)
const RATE_LIMIT_CONFIG = {
  maxRequests: 5,
  windowMs: 60 * 1000,
  message: "Payment order creation rate limit exceeded. Please wait before retrying.",
};

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

    // 2. Check rate limit
    const rateLimitResult = checkRateLimit(userId, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult.error || "Rate limit exceeded",
        rateLimitResult.resetTime,
        corsHeaders
      );
    }

    // 3. Parse and validate request
    const { amount, currency, type, metadata } = await req.json();

    // Validate amount
    if (!amount || amount <= 0 || amount > 100000) {
      return new Response(
        JSON.stringify({ error: "Invalid amount. Must be between 1 and 100000" }),
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

    // Create Razorpay order
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const orderData = {
      amount: amount * 100, // Convert to smallest currency unit (paise)
      currency: currency || 'INR',
      receipt: `order_${Date.now()}_${user.id.substring(0, 8)}`,
      notes: {
        user_id: user.id,
        type: type, // 'subscription' or 'credits'
        ...metadata,
      },
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Razorpay API error:', error);
      throw new Error('Failed to create Razorpay order');
    }

    const order = await response.json();

    // Store order in database
    await supabaseClient.from('payment_orders').insert({
      user_id: user.id,
      order_id: order.id,
      amount: amount,
      currency: order.currency,
      status: 'created',
      type: type,
      metadata: metadata,
    });

    const responseHeaders = addRateLimitHeaders(
      { ...corsHeaders, 'Content-Type': 'application/json' },
      rateLimitResult
    );

    return new Response(JSON.stringify(order), {
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    
    // Don't expose internal errors
    const publicMessage = error instanceof Error && error.message.includes('Razorpay')
      ? 'Payment service temporarily unavailable. Please try again.'
      : error instanceof Error && error.message.includes('credentials')
      ? 'Payment service configuration error. Please contact support.'
      : 'Failed to create payment order. Please try again.';

    return new Response(
      JSON.stringify({ error: publicMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
