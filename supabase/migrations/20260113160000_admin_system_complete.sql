-- Admin System Complete Migration
-- Includes: Audit logging, enhanced RLS, admin functions for user management

-- 1. Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_email TEXT,
  entity_type TEXT NOT NULL, -- 'user', 'credit', 'subscription', 'account'
  entity_id TEXT,
  before_value JSONB,
  after_value JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_user ON public.admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target_user ON public.admin_audit_log(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_log(created_at DESC);

-- 2. Add account status fields to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'disabled', 'suspended'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'disabled_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN disabled_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'disabled_reason'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN disabled_reason TEXT;
  END IF;
END $$;

-- 3. Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id UUID,
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_entity_type TEXT DEFAULT 'user',
  p_entity_id TEXT DEFAULT NULL,
  p_before_value JSONB DEFAULT NULL,
  p_after_value JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_admin_email TEXT;
  v_target_email TEXT;
  v_log_id UUID;
BEGIN
  -- Get admin email
  SELECT email INTO v_admin_email FROM profiles WHERE id = p_admin_user_id;
  
  -- Get target user email if applicable
  IF p_target_user_id IS NOT NULL THEN
    SELECT email INTO v_target_email FROM profiles WHERE id = p_target_user_id;
  END IF;

  -- Insert audit log
  INSERT INTO admin_audit_log (
    admin_user_id,
    admin_email,
    action,
    target_user_id,
    target_user_email,
    entity_type,
    entity_id,
    before_value,
    after_value,
    metadata
  ) VALUES (
    p_admin_user_id,
    v_admin_email,
    p_action,
    p_target_user_id,
    v_target_email,
    p_entity_type,
    p_entity_id,
    p_before_value,
    p_after_value,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin function to get all users with full details
CREATE OR REPLACE FUNCTION public.admin_get_all_users(
  p_admin_user_id UUID,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  username TEXT,
  account_status TEXT,
  ai_credits INTEGER,
  total_credits_purchased INTEGER,
  credits_used_this_month INTEGER,
  subscription_status TEXT,
  subscription_plan TEXT,
  disabled_at TIMESTAMPTZ,
  disabled_reason TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verify admin status
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = p_admin_user_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.username,
    p.account_status,
    p.ai_credits,
    p.total_credits_purchased,
    p.credits_used_this_month,
    COALESCE(s.status, 'none')::TEXT as subscription_status,
    COALESCE(s.plan_type, 'free')::TEXT as subscription_plan,
    p.disabled_at,
    p.disabled_reason,
    p.created_at,
    p.last_sign_in_at
  FROM profiles p
  LEFT JOIN subscriptions s ON p.id = s.user_id AND s.status = 'active'
  WHERE 
    (p_search IS NULL OR 
     p.email ILIKE '%' || p_search || '%' OR 
     p.full_name ILIKE '%' || p_search || '%' OR 
     p.username ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR p.account_status = p_status)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Admin function to disable/enable user account
CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_old_status TEXT;
  v_target_email TEXT;
BEGIN
  -- Verify admin status
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = p_admin_user_id;
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Admin access required'::TEXT;
    RETURN;
  END IF;

  -- Validate status
  IF p_status NOT IN ('active', 'disabled', 'suspended') THEN
    RETURN QUERY SELECT FALSE, 'Invalid status. Must be: active, disabled, or suspended'::TEXT;
    RETURN;
  END IF;

  -- Get current status and email
  SELECT account_status, email INTO v_old_status, v_target_email
  FROM profiles WHERE id = p_target_user_id;

  IF v_target_email IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User not found'::TEXT;
    RETURN;
  END IF;

  -- Update user status
  UPDATE profiles
  SET 
    account_status = p_status,
    disabled_at = CASE WHEN p_status IN ('disabled', 'suspended') THEN NOW() ELSE NULL END,
    disabled_reason = CASE WHEN p_status IN ('disabled', 'suspended') THEN p_reason ELSE NULL END
  WHERE id = p_target_user_id;

  -- Log the action
  PERFORM log_admin_action(
    p_admin_user_id,
    'user_status_change',
    p_target_user_id,
    'account',
    p_target_user_id::TEXT,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', p_status, 'reason', p_reason),
    NULL
  );

  RETURN QUERY SELECT 
    TRUE,
    format('User %s status changed from %s to %s', v_target_email, v_old_status, p_status)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Admin function to update user subscription
CREATE OR REPLACE FUNCTION public.admin_update_user_subscription(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_plan_type TEXT,
  p_status TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_target_email TEXT;
  v_existing_sub UUID;
BEGIN
  -- Verify admin status
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = p_admin_user_id;
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Admin access required'::TEXT;
    RETURN;
  END IF;

  -- Get target user email
  SELECT email INTO v_target_email FROM profiles WHERE id = p_target_user_id;
  IF v_target_email IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User not found'::TEXT;
    RETURN;
  END IF;

  -- Check if subscription exists
  SELECT id INTO v_existing_sub FROM subscriptions WHERE user_id = p_target_user_id;

  IF v_existing_sub IS NOT NULL THEN
    -- Update existing subscription
    UPDATE subscriptions
    SET 
      plan_type = p_plan_type,
      status = p_status,
      updated_at = NOW()
    WHERE user_id = p_target_user_id;
  ELSE
    -- Create new subscription
    INSERT INTO subscriptions (user_id, plan_type, status)
    VALUES (p_target_user_id, p_plan_type, p_status);
  END IF;

  -- Log the action
  PERFORM log_admin_action(
    p_admin_user_id,
    'subscription_update',
    p_target_user_id,
    'subscription',
    v_existing_sub::TEXT,
    NULL,
    jsonb_build_object('plan_type', p_plan_type, 'status', p_status),
    NULL
  );

  RETURN QUERY SELECT 
    TRUE,
    format('Subscription updated for %s: %s (%s)', v_target_email, p_plan_type, p_status)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Enhanced RLS Policies

-- Audit log: Only admins can read
DROP POLICY IF EXISTS admin_audit_log_select ON public.admin_audit_log;
CREATE POLICY admin_audit_log_select ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Profiles: Users can read only their own, admins can read all
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Profiles: Users can update only their own (except admin fields), admins can update all
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Credit transactions: Users can read only their own, admins can read all
DROP POLICY IF EXISTS credit_transactions_select ON public.credit_transactions;
CREATE POLICY credit_transactions_select ON public.credit_transactions
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Subscriptions: Users can read only their own, admins can read all
DROP POLICY IF EXISTS subscriptions_select ON public.subscriptions;
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_subscription TO authenticated;

-- 9. Enable RLS on audit log table
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 10. Add helpful comments
COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all admin actions';
COMMENT ON FUNCTION public.log_admin_action IS 'Log an admin action with full context';
COMMENT ON FUNCTION public.admin_get_all_users IS 'Get all users with search and filter capabilities';
COMMENT ON FUNCTION public.admin_set_user_status IS 'Enable or disable user accounts';
COMMENT ON FUNCTION public.admin_update_user_subscription IS 'Update user subscription plans';
