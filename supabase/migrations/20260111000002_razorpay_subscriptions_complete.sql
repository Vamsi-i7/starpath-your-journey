-- ============================================
-- COMPLETE DATABASE MIGRATION FOR RAZORPAY SUBSCRIPTIONS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create user_razorpay_customers table (stores Razorpay customer IDs)
CREATE TABLE IF NOT EXISTS public.user_razorpay_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_customer_id TEXT NOT NULL UNIQUE,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Create razorpay_subscriptions table (stores subscription details)
CREATE TABLE IF NOT EXISTS public.razorpay_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_subscription_id TEXT NOT NULL UNIQUE,
    razorpay_plan_id TEXT NOT NULL,
    plan_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created',
    short_url TEXT,
    current_start TIMESTAMPTZ,
    current_end TIMESTAMPTZ,
    charge_at TIMESTAMPTZ,
    total_count INTEGER,
    paid_count INTEGER DEFAULT 0,
    remaining_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update subscriptions table to include razorpay fields (if not exists)
DO $$ 
BEGIN
    -- Add razorpay_subscription_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' 
                   AND column_name = 'razorpay_subscription_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN razorpay_subscription_id TEXT;
    END IF;
END $$;

-- 4. Ensure payments table has all required columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' 
                   AND column_name = 'razorpay_subscription_id') THEN
        ALTER TABLE public.payments ADD COLUMN razorpay_subscription_id TEXT;
    END IF;
END $$;

-- 5. Create payment_orders table if not exists
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created',
    type TEXT NOT NULL,
    metadata JSONB,
    payment_id TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create sessions table for analytics (if not exists)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    duration_minutes INTEGER DEFAULT 0,
    focus_area TEXT,
    notes TEXT,
    xp_earned INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ensure credits table exists with all columns
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    last_daily_credit TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ensure credit_transactions table exists
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
    reason TEXT NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Ensure ai_library table exists
CREATE TABLE IF NOT EXISTS public.ai_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('notes', 'flashcards', 'roadmap', 'chat')),
    tags TEXT[],
    metadata JSONB,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Ensure notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create ai_generations table if not exists (for tracking AI usage)
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    prompt TEXT,
    result JSONB,
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_razorpay_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- User Razorpay Customers policies
DROP POLICY IF EXISTS "Users can view own razorpay customer" ON public.user_razorpay_customers;
CREATE POLICY "Users can view own razorpay customer" ON public.user_razorpay_customers
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own razorpay customer" ON public.user_razorpay_customers;
CREATE POLICY "Users can insert own razorpay customer" ON public.user_razorpay_customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Razorpay Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.razorpay_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.razorpay_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.razorpay_subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.razorpay_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment Orders policies
DROP POLICY IF EXISTS "Users can view own payment orders" ON public.payment_orders;
CREATE POLICY "Users can view own payment orders" ON public.payment_orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment orders" ON public.payment_orders;
CREATE POLICY "Users can insert own payment orders" ON public.payment_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sessions policies
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.sessions;
CREATE POLICY "Users can manage own sessions" ON public.sessions
    FOR ALL USING (auth.uid() = user_id);

-- Credits policies
DROP POLICY IF EXISTS "Users can view own credits" ON public.credits;
CREATE POLICY "Users can view own credits" ON public.credits
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credits" ON public.credits;
CREATE POLICY "Users can insert own credits" ON public.credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own credits" ON public.credits;
CREATE POLICY "Users can update own credits" ON public.credits
    FOR UPDATE USING (auth.uid() = user_id);

-- Credit Transactions policies
DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can insert own credit transactions" ON public.credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Library policies
DROP POLICY IF EXISTS "Users can manage own library items" ON public.ai_library;
CREATE POLICY "Users can manage own library items" ON public.ai_library
    FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- AI Generations policies
DROP POLICY IF EXISTS "Users can view own generations" ON public.ai_generations;
CREATE POLICY "Users can view own generations" ON public.ai_generations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own generations" ON public.ai_generations;
CREATE POLICY "Users can insert own generations" ON public.ai_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_razorpay_subscriptions_user_id ON public.razorpay_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_subscriptions_status ON public.razorpay_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_library_user_id ON public.ai_library(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ============================================
-- TRIGGER: Auto-create credits for new users
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.credits (user_id, balance, total_earned)
    VALUES (NEW.id, 10, 10)  -- Give 10 free credits to start
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table (runs when a new profile is created)
DROP TRIGGER IF EXISTS on_profile_created_credits ON public.profiles;
CREATE TRIGGER on_profile_created_credits
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- ============================================
-- Grant service role access for webhooks
-- ============================================

GRANT ALL ON public.user_razorpay_customers TO service_role;
GRANT ALL ON public.razorpay_subscriptions TO service_role;
GRANT ALL ON public.payment_orders TO service_role;
GRANT ALL ON public.credits TO service_role;
GRANT ALL ON public.credit_transactions TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.notifications TO service_role;

-- ============================================
-- DONE!
-- ============================================
