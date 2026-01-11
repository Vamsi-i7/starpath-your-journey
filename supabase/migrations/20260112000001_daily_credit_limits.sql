-- Daily Credit Limits System
-- This migration adds daily usage tracking for AI tools

-- Add daily credit tracking table
CREATE TABLE IF NOT EXISTS public.daily_credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  ai_mentor_uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_credit_usage_user_date ON public.daily_credit_usage(user_id, usage_date);

-- RLS Policies
ALTER TABLE public.daily_credit_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own daily usage" ON public.daily_credit_usage;
DROP POLICY IF EXISTS "Users can insert their own daily usage" ON public.daily_credit_usage;
DROP POLICY IF EXISTS "Users can update their own daily usage" ON public.daily_credit_usage;

CREATE POLICY "Users can view their own daily usage"
  ON public.daily_credit_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily usage"
  ON public.daily_credit_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily usage"
  ON public.daily_credit_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get daily credits remaining
CREATE OR REPLACE FUNCTION get_daily_credits_remaining(p_user_id UUID)
RETURNS TABLE(
  general_remaining INTEGER,
  mentor_remaining INTEGER,
  general_limit INTEGER,
  mentor_limit INTEGER,
  general_used INTEGER,
  mentor_used INTEGER
) AS $$
DECLARE
  v_used INTEGER;
  v_mentor_used INTEGER;
  v_daily_limit INTEGER := 50;  -- Free tier default
  v_mentor_limit INTEGER := 100;
  v_subscription_type TEXT;
BEGIN
  -- Get user's subscription type
  SELECT subscription_tier INTO v_subscription_type
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Adjust limits based on subscription
  IF v_subscription_type = 'pro' THEN
    v_daily_limit := 100;
    v_mentor_limit := 200;
  ELSIF v_subscription_type = 'premium' THEN
    v_daily_limit := 500;
    v_mentor_limit := 1000;
  END IF;
  
  -- Get today's usage
  SELECT 
    COALESCE(dcu.credits_used, 0),
    COALESCE(dcu.ai_mentor_uses, 0)
  INTO v_used, v_mentor_used
  FROM daily_credit_usage dcu
  WHERE dcu.user_id = p_user_id 
    AND dcu.usage_date = CURRENT_DATE;
  
  -- If no record, user hasn't used any today
  IF NOT FOUND THEN
    v_used := 0;
    v_mentor_used := 0;
  END IF;
  
  RETURN QUERY SELECT 
    GREATEST(v_daily_limit - v_used, 0)::INTEGER as general_remaining,
    GREATEST(v_mentor_limit - v_mentor_used, 0)::INTEGER as mentor_remaining,
    v_daily_limit::INTEGER as general_limit,
    v_mentor_limit::INTEGER as mentor_limit,
    v_used::INTEGER as general_used,
    v_mentor_used::INTEGER as mentor_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment daily usage
CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_user_id UUID,
  p_credits INTEGER DEFAULT 1,
  p_is_mentor BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO daily_credit_usage (user_id, usage_date, credits_used, ai_mentor_uses)
  VALUES (
    p_user_id,
    CURRENT_DATE,
    CASE WHEN p_is_mentor THEN 0 ELSE p_credits END,
    CASE WHEN p_is_mentor THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    credits_used = daily_credit_usage.credits_used + CASE WHEN p_is_mentor THEN 0 ELSE p_credits END,
    ai_mentor_uses = daily_credit_usage.ai_mentor_uses + CASE WHEN p_is_mentor THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_daily_credits_remaining(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_daily_usage(UUID, INTEGER, BOOLEAN) TO authenticated;
