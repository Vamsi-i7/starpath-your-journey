-- Subscription System for Premium Features
-- Migration: 20260110000004_subscription_system.sql

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  tier text NOT NULL CHECK (tier IN ('free', 'premium', 'pro', 'lifetime')),
  price_monthly numeric(10,2),
  price_yearly numeric(10,2),
  price_lifetime numeric(10,2),
  features jsonb NOT NULL DEFAULT '{}',
  limits jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  plan_id uuid REFERENCES subscription_plans(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'trialing')),
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz DEFAULT now(),
  reset_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_name)
);

-- Insert subscription plans
INSERT INTO subscription_plans (name, tier, price_monthly, price_yearly, price_lifetime, features, limits, sort_order) VALUES
  (
    'Free',
    'free',
    0,
    0,
    NULL,
    '{
      "max_habits": 10,
      "max_goals": 3,
      "analytics_range": "week,month",
      "ai_coaching_daily": 5,
      "habit_categories": 3,
      "export_data": false,
      "custom_themes": false,
      "priority_support": false,
      "integrations": false
    }'::jsonb,
    '{
      "max_habits": 10,
      "max_goals": 3,
      "max_categories": 3,
      "ai_requests_per_day": 5
    }'::jsonb,
    1
  ),
  (
    'Premium',
    'premium',
    4.99,
    49.99,
    NULL,
    '{
      "max_habits": "unlimited",
      "max_goals": "unlimited",
      "analytics_range": "week,month,year,custom",
      "ai_coaching_daily": 50,
      "habit_categories": "unlimited",
      "export_data": true,
      "custom_themes": true,
      "priority_support": true,
      "ad_free": true,
      "advanced_statistics": true,
      "habit_templates": true
    }'::jsonb,
    '{
      "max_habits": 9999,
      "max_goals": 9999,
      "max_categories": 9999,
      "ai_requests_per_day": 50
    }'::jsonb,
    2
  ),
  (
    'Pro',
    'pro',
    9.99,
    99.99,
    NULL,
    '{
      "max_habits": "unlimited",
      "max_goals": "unlimited",
      "analytics_range": "week,month,year,custom,predictive",
      "ai_coaching_daily": "unlimited",
      "habit_categories": "unlimited",
      "export_data": true,
      "custom_themes": true,
      "priority_support": true,
      "ad_free": true,
      "advanced_statistics": true,
      "habit_templates": true,
      "predictive_analytics": true,
      "habit_automations": true,
      "integrations": true,
      "team_accounts": true,
      "white_label": true,
      "api_access": true,
      "max_team_members": 5
    }'::jsonb,
    '{
      "max_habits": 9999,
      "max_goals": 9999,
      "max_categories": 9999,
      "ai_requests_per_day": 9999,
      "max_team_members": 5
    }'::jsonb,
    3
  ),
  (
    'Lifetime',
    'lifetime',
    NULL,
    NULL,
    99.99,
    '{
      "max_habits": "unlimited",
      "max_goals": "unlimited",
      "analytics_range": "week,month,year,custom,predictive",
      "ai_coaching_daily": "unlimited",
      "habit_categories": "unlimited",
      "export_data": true,
      "custom_themes": true,
      "priority_support": true,
      "ad_free": true,
      "advanced_statistics": true,
      "habit_templates": true,
      "predictive_analytics": true,
      "habit_automations": true,
      "integrations": true,
      "team_accounts": true,
      "white_label": true,
      "api_access": true,
      "early_access": true,
      "founder_badge": true,
      "lifetime_updates": true,
      "max_team_members": 5
    }'::jsonb,
    '{
      "max_habits": 9999,
      "max_goals": 9999,
      "max_categories": 9999,
      "ai_requests_per_day": 9999,
      "max_team_members": 5
    }'::jsonb,
    4
  )
ON CONFLICT (name) DO NOTHING;

-- Function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(
  p_user_id uuid,
  p_feature_name text
)
RETURNS boolean AS $$
DECLARE
  user_plan record;
BEGIN
  -- Get user's subscription plan
  SELECT 
    sp.features,
    sp.tier
  INTO user_plan
  FROM profiles p
  LEFT JOIN user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
  LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE p.id = p_user_id;
  
  -- If no subscription, use free plan
  IF user_plan IS NULL THEN
    SELECT features, tier INTO user_plan
    FROM subscription_plans
    WHERE tier = 'free';
  END IF;
  
  -- Check if feature exists and is true/unlimited
  RETURN (user_plan.features->p_feature_name)::text IN ('true', '"unlimited"');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id uuid,
  p_limit_name text
)
RETURNS boolean AS $$
DECLARE
  user_plan record;
  current_usage integer;
  limit_value integer;
BEGIN
  -- Get user's plan limits
  SELECT 
    sp.limits,
    sp.tier
  INTO user_plan
  FROM profiles p
  LEFT JOIN user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
  LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE p.id = p_user_id;
  
  -- If no subscription, use free plan
  IF user_plan IS NULL THEN
    SELECT limits INTO user_plan
    FROM subscription_plans
    WHERE tier = 'free';
  END IF;
  
  -- Get limit value
  limit_value := (user_plan.limits->p_limit_name)::integer;
  
  -- Check current usage based on limit type
  CASE p_limit_name
    WHEN 'max_habits' THEN
      SELECT COUNT(*) INTO current_usage
      FROM habits
      WHERE user_id = p_user_id AND deleted_at IS NULL;
      
    WHEN 'max_goals' THEN
      SELECT COUNT(*) INTO current_usage
      FROM goals
      WHERE user_id = p_user_id AND status != 'completed';
      
    WHEN 'max_categories' THEN
      SELECT COUNT(*) INTO current_usage
      FROM habit_categories
      WHERE user_id = p_user_id;
      
    WHEN 'ai_requests_per_day' THEN
      SELECT usage_count INTO current_usage
      FROM feature_usage
      WHERE user_id = p_user_id 
        AND feature_name = 'ai_coaching'
        AND reset_at > now() - interval '1 day';
      current_usage := COALESCE(current_usage, 0);
      
    ELSE
      current_usage := 0;
  END CASE;
  
  RETURN current_usage < limit_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(
  p_user_id uuid,
  p_feature_name text
)
RETURNS void AS $$
BEGIN
  INSERT INTO feature_usage (user_id, feature_name, usage_count, last_used_at, reset_at)
  VALUES (p_user_id, p_feature_name, 1, now(), now() + interval '1 day')
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET
    usage_count = CASE 
      WHEN feature_usage.reset_at < now() THEN 1
      ELSE feature_usage.usage_count + 1
    END,
    last_used_at = now(),
    reset_at = CASE
      WHEN feature_usage.reset_at < now() THEN now() + interval '1 day'
      ELSE feature_usage.reset_at
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user ON feature_usage(user_id);

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can view own subscription"
ON user_subscriptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view own feature usage"
ON feature_usage FOR SELECT
USING (user_id = auth.uid());

-- Grant permissions
GRANT EXECUTE ON FUNCTION has_feature_access TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit TO authenticated;
GRANT EXECUTE ON FUNCTION increment_feature_usage TO authenticated;

COMMENT ON TABLE subscription_plans IS 'Available subscription tiers and their features';
COMMENT ON TABLE user_subscriptions IS 'User subscription status and billing information';
COMMENT ON TABLE feature_usage IS 'Tracks feature usage for rate limiting and analytics';
COMMENT ON FUNCTION has_feature_access IS 'Checks if user has access to a specific feature';
COMMENT ON FUNCTION check_usage_limit IS 'Checks if user has reached their usage limit for a feature';
