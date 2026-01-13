-- Fix Daily Credits System
-- This migration implements automatic daily credit grants

-- 1. Create function to grant daily credits
CREATE OR REPLACE FUNCTION public.grant_daily_credits(p_user_id UUID)
RETURNS TABLE(
  granted BOOLEAN,
  amount INTEGER,
  new_balance INTEGER,
  message TEXT
) AS $$
DECLARE
  v_subscription_tier TEXT;
  v_daily_amount INTEGER := 10; -- Default for free tier
  v_last_grant DATE;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get user's subscription and last grant date
  SELECT 
    subscription_tier, 
    last_daily_credit::DATE,
    ai_credits
  INTO v_subscription_tier, v_last_grant, v_current_balance
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check if already granted today
  IF v_last_grant = CURRENT_DATE THEN
    RETURN QUERY SELECT 
      FALSE,
      0::INTEGER,
      v_current_balance::INTEGER,
      'Daily credits already received today'::TEXT;
    RETURN;
  END IF;
  
  -- Set daily amount based on tier
  IF v_subscription_tier = 'basic' THEN
    v_daily_amount := 20;
  ELSIF v_subscription_tier = 'premium' OR v_subscription_tier = 'lifetime' THEN
    v_daily_amount := 50;
  ELSIF v_subscription_tier IS NULL OR v_subscription_tier = 'free' THEN
    v_daily_amount := 10;
  END IF;
  
  -- Grant the credits
  UPDATE profiles
  SET 
    ai_credits = ai_credits + v_daily_amount,
    last_daily_credit = NOW()
  WHERE id = p_user_id
  RETURNING ai_credits INTO v_new_balance;
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    reason,
    balance_after
  ) VALUES (
    p_user_id,
    v_daily_amount,
    'earn',
    'Daily free credits',
    v_new_balance
  );
  
  RETURN QUERY SELECT 
    TRUE,
    v_daily_amount::INTEGER,
    v_new_balance::INTEGER,
    format('Granted %s daily credits!', v_daily_amount)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permission
GRANT EXECUTE ON FUNCTION public.grant_daily_credits(UUID) TO authenticated;

-- 3. Create function to grant welcome credits for new signups
CREATE OR REPLACE FUNCTION public.grant_welcome_credits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_welcome_amount INTEGER := 50;
  v_current_balance INTEGER;
BEGIN
  -- Check if user already has credits (not a new user)
  SELECT ai_credits INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;
  
  -- Only grant if this is truly a new user with 0 credits
  IF v_current_balance > 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Grant welcome credits
  UPDATE profiles
  SET 
    ai_credits = ai_credits + v_welcome_amount,
    last_daily_credit = NOW()
  WHERE id = p_user_id;
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    reason,
    balance_after
  ) VALUES (
    p_user_id,
    v_welcome_amount,
    'earn',
    'Welcome bonus',
    v_welcome_amount
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.grant_welcome_credits(UUID) TO authenticated;

-- 4. Create trigger to grant welcome credits on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Grant welcome credits on profile creation
  PERFORM public.grant_welcome_credits(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_grant_welcome ON public.profiles;

CREATE TRIGGER on_profile_created_grant_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_welcome_credits();

-- 5. Comment the functions
COMMENT ON FUNCTION public.grant_daily_credits(UUID) IS 'Grants daily free credits to users based on their subscription tier. Free: 10, Basic: 20, Premium/Lifetime: 50';
COMMENT ON FUNCTION public.grant_welcome_credits(UUID) IS 'Grants 50 welcome credits to new users on signup';
