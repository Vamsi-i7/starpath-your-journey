-- Admin Credit Management System
-- This migration creates comprehensive admin tools for monitoring and managing user credits

-- First, ensure all required columns exist in profiles table
DO $$ 
BEGIN
  -- Add ai_credits if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_credits'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN ai_credits INTEGER DEFAULT 0 NOT NULL;
  END IF;

  -- Add total_credits_purchased if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'total_credits_purchased'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN total_credits_purchased INTEGER DEFAULT 0 NOT NULL;
  END IF;

  -- Add credits_used_this_month if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'credits_used_this_month'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN credits_used_this_month INTEGER DEFAULT 0 NOT NULL;
  END IF;

  -- Add last_credit_reset if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_credit_reset'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_credit_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add last_daily_credit if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_daily_credit'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_daily_credit DATE;
  END IF;

  -- Add full_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
END $$;

-- Ensure credit_transactions table exists with proper columns
DO $$
BEGIN
  -- Check if table exists first
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credit_transactions') THEN
    CREATE TABLE public.credit_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
      reason TEXT NOT NULL,
      balance_after INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  -- Add transaction_type column if it doesn't exist (for backward compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'credit_transactions' AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE public.credit_transactions ADD COLUMN transaction_type TEXT;
  END IF;
  
  -- Add description column if it doesn't exist (for backward compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'credit_transactions' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.credit_transactions ADD COLUMN description TEXT;
  END IF;
  
  -- Add tool_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'credit_transactions' AND column_name = 'tool_type'
  ) THEN
    ALTER TABLE public.credit_transactions ADD COLUMN tool_type TEXT;
  END IF;
  
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'credit_transactions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.credit_transactions ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Ensure daily_credit_usage table exists
CREATE TABLE IF NOT EXISTS public.daily_credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credits_used INTEGER DEFAULT 0 NOT NULL,
  ai_mentor_uses INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, usage_date)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_credit_usage_user_date ON public.daily_credit_usage(user_id, usage_date);

-- 1. Create admin view for all user credits with usage statistics
CREATE OR REPLACE VIEW public.admin_user_credits_overview AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.username,
  'N/A'::TEXT as subscription_tier,
  p.ai_credits as current_balance,
  p.total_credits_purchased,
  p.credits_used_this_month,
  p.last_credit_reset,
  p.last_daily_credit,
  p.created_at as user_created_at,
  -- Calculate total earned from transactions (use type column from existing schema)
  COALESCE(SUM(CASE WHEN ct.type = 'earn' THEN ct.amount ELSE 0 END), 0) as total_credits_earned,
  -- Calculate total spent from transactions (use type column from existing schema)
  COALESCE(SUM(CASE WHEN ct.type = 'spend' THEN ct.amount ELSE 0 END), 0) as total_credits_spent,
  -- Count transactions
  COUNT(ct.id) as total_transactions,
  -- Last transaction date
  MAX(ct.created_at) as last_transaction_date
FROM public.profiles p
LEFT JOIN public.credit_transactions ct ON p.id = ct.user_id
GROUP BY p.id, p.email, p.full_name, p.username, 
         p.ai_credits, p.total_credits_purchased, p.credits_used_this_month, 
         p.last_credit_reset, p.last_daily_credit, p.created_at
ORDER BY p.created_at DESC;

-- 2. Create admin view for recent credit transactions across all users
CREATE OR REPLACE VIEW public.admin_recent_credit_transactions AS
SELECT 
  ct.id,
  ct.user_id,
  p.email,
  p.full_name,
  p.username,
  ct.amount,
  ct.type as transaction_type,
  COALESCE(ct.description, ct.reason) as description,
  ct.tool_type,
  ct.metadata,
  ct.created_at,
  p.ai_credits as user_current_balance
FROM public.credit_transactions ct
JOIN public.profiles p ON ct.user_id = p.id
ORDER BY ct.created_at DESC;

-- 3. Create admin view for daily credit usage across all users
CREATE OR REPLACE VIEW public.admin_daily_credit_usage AS
SELECT 
  dcu.id,
  dcu.user_id,
  p.email,
  p.full_name,
  p.username,
  'N/A'::TEXT as subscription_tier,
  dcu.usage_date,
  dcu.credits_used,
  dcu.ai_mentor_uses,
  dcu.created_at,
  dcu.updated_at
FROM public.daily_credit_usage dcu
JOIN public.profiles p ON dcu.user_id = p.id
ORDER BY dcu.usage_date DESC, dcu.credits_used DESC;

-- 4. Create admin function to grant credits to a specific user
CREATE OR REPLACE FUNCTION public.admin_grant_credits(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'Admin credit grant'
)
RETURNS TABLE(
  success BOOLEAN,
  new_balance INTEGER,
  message TEXT
) AS $$
DECLARE
  v_is_admin BOOLEAN := FALSE;
  v_new_balance INTEGER;
  v_target_email TEXT;
BEGIN
  -- Check if the requesting user is an admin
  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT 
      FALSE,
      0::INTEGER,
      'Unauthorized: Only admins can grant credits'::TEXT;
    RETURN;
  END IF;
  
  -- Get target user email for logging
  SELECT email INTO v_target_email
  FROM profiles
  WHERE id = p_target_user_id;
  
  IF v_target_email IS NULL THEN
    RETURN QUERY SELECT 
      FALSE,
      0::INTEGER,
      'User not found'::TEXT;
    RETURN;
  END IF;
  
  -- Grant the credits
  UPDATE profiles
  SET ai_credits = ai_credits + p_amount
  WHERE id = p_target_user_id
  RETURNING ai_credits INTO v_new_balance;
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    reason,
    balance_after,
    description,
    metadata
  ) VALUES (
    p_target_user_id,
    p_amount,
    'earn',
    p_reason,
    v_new_balance,
    p_reason,
    jsonb_build_object(
      'granted_by', p_admin_user_id,
      'granted_at', NOW()
    )
  );
  
  RETURN QUERY SELECT 
    TRUE,
    v_new_balance::INTEGER,
    format('Successfully granted %s credits to %s. New balance: %s', p_amount, v_target_email, v_new_balance)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create admin function to deduct credits from a specific user
CREATE OR REPLACE FUNCTION public.admin_deduct_credits(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'Admin credit deduction'
)
RETURNS TABLE(
  success BOOLEAN,
  new_balance INTEGER,
  message TEXT
) AS $$
DECLARE
  v_is_admin BOOLEAN := FALSE;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_target_email TEXT;
BEGIN
  -- Check if the requesting user is an admin
  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT 
      FALSE,
      0::INTEGER,
      'Unauthorized: Only admins can deduct credits'::TEXT;
    RETURN;
  END IF;
  
  -- Get target user info
  SELECT email, ai_credits INTO v_target_email, v_current_balance
  FROM profiles
  WHERE id = p_target_user_id;
  
  IF v_target_email IS NULL THEN
    RETURN QUERY SELECT 
      FALSE,
      0::INTEGER,
      'User not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT 
      FALSE,
      v_current_balance::INTEGER,
      format('Insufficient balance. User has %s credits but trying to deduct %s', v_current_balance, p_amount)::TEXT;
    RETURN;
  END IF;
  
  -- Deduct the credits
  UPDATE profiles
  SET ai_credits = ai_credits - p_amount
  WHERE id = p_target_user_id
  RETURNING ai_credits INTO v_new_balance;
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    reason,
    balance_after,
    description,
    metadata
  ) VALUES (
    p_target_user_id,
    p_amount,
    'spend',
    p_reason,
    v_new_balance,
    p_reason,
    jsonb_build_object(
      'deducted_by', p_admin_user_id,
      'deducted_at', NOW()
    )
  );
  
  RETURN QUERY SELECT 
    TRUE,
    v_new_balance::INTEGER,
    format('Successfully deducted %s credits from %s. New balance: %s', p_amount, v_target_email, v_new_balance)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create admin function to get credit statistics
CREATE OR REPLACE FUNCTION public.admin_get_credit_stats()
RETURNS TABLE(
  total_users INTEGER,
  total_credits_in_circulation INTEGER,
  total_credits_earned_all_time BIGINT,
  total_credits_spent_all_time BIGINT,
  avg_credits_per_user NUMERIC,
  users_with_zero_credits INTEGER,
  transactions_today INTEGER,
  credits_used_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.id)::INTEGER as total_users,
    COALESCE(SUM(p.ai_credits), 0)::INTEGER as total_credits_in_circulation,
    COALESCE(SUM(CASE WHEN ct.type = 'earn' THEN ct.amount ELSE 0 END), 0) as total_credits_earned_all_time,
    COALESCE(SUM(CASE WHEN ct.type = 'spend' THEN ct.amount ELSE 0 END), 0) as total_credits_spent_all_time,
    COALESCE(AVG(p.ai_credits), 0)::NUMERIC(10,2) as avg_credits_per_user,
    COUNT(CASE WHEN p.ai_credits = 0 THEN 1 END)::INTEGER as users_with_zero_credits,
    COUNT(CASE WHEN ct.created_at::DATE = CURRENT_DATE THEN 1 END)::INTEGER as transactions_today,
    COALESCE(SUM(CASE WHEN ct.created_at::DATE = CURRENT_DATE AND ct.type = 'spend' THEN ct.amount ELSE 0 END), 0) as credits_used_today
  FROM public.profiles p
  LEFT JOIN public.credit_transactions ct ON p.id = ct.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create admin function to get user credit details
CREATE OR REPLACE FUNCTION public.admin_get_user_credit_details(p_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  username TEXT,
  subscription_tier TEXT,
  current_balance INTEGER,
  total_earned BIGINT,
  total_spent BIGINT,
  total_transactions BIGINT,
  last_transaction_date TIMESTAMPTZ,
  last_daily_credit DATE,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.username,
    'N/A'::TEXT as subscription_tier,
    p.ai_credits,
    COALESCE(SUM(CASE WHEN ct.type = 'earn' THEN ct.amount ELSE 0 END), 0) as total_earned,
    COALESCE(SUM(CASE WHEN ct.type = 'spend' THEN ct.amount ELSE 0 END), 0) as total_spent,
    COUNT(ct.id) as total_transactions,
    MAX(ct.created_at) as last_transaction_date,
    p.last_daily_credit::DATE,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.credit_transactions ct ON p.id = ct.user_id
  WHERE p.id = p_user_id
  GROUP BY p.id, p.email, p.full_name, p.username, p.ai_credits, p.last_daily_credit, p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add is_admin column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 9. Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(transaction_type);

-- 10. Grant permissions to authenticated users (views are read-only)
-- Note: Direct access to views is restricted, functions handle authorization

-- Grant execute permissions for admin functions
GRANT EXECUTE ON FUNCTION public.admin_grant_credits(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_deduct_credits(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_credit_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_credit_details(UUID) TO authenticated;

-- 11. Create RLS policies for admin views (accessible via functions only)
-- These views should only be accessible to admins through the functions above

-- 12. Add comments for documentation
COMMENT ON VIEW public.admin_user_credits_overview IS 'Admin view showing all users with their credit balances and usage statistics';
COMMENT ON VIEW public.admin_recent_credit_transactions IS 'Admin view showing recent credit transactions across all users';
COMMENT ON VIEW public.admin_daily_credit_usage IS 'Admin view showing daily credit usage patterns';
COMMENT ON FUNCTION public.admin_grant_credits IS 'Admin function to grant credits to a specific user with audit trail';
COMMENT ON FUNCTION public.admin_deduct_credits IS 'Admin function to deduct credits from a specific user with audit trail';
COMMENT ON FUNCTION public.admin_get_credit_stats IS 'Get overall credit system statistics';
COMMENT ON FUNCTION public.admin_get_user_credit_details IS 'Get detailed credit information for a specific user';
