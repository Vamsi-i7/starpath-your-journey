-- Enhanced User System with Usernames and Public Profiles
-- Migration: 20260110000001_enhanced_user_system.sql

-- Add username and enhanced profile fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"profile_visible": true, "stats_visible": true, "friends_visible": true}',
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_tier text CHECK (premium_tier IN ('free', 'premium', 'pro', 'lifetime')),
ADD COLUMN IF NOT EXISTS premium_since timestamptz,
ADD COLUMN IF NOT EXISTS total_habits_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_goals_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS member_since timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now();

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);

-- Function to generate suggested usernames
CREATE OR REPLACE FUNCTION generate_username(base_name text)
RETURNS text AS $$
DECLARE
  suggested_name text;
  counter integer := 1;
BEGIN
  -- Clean the base name
  base_name := lower(regexp_replace(base_name, '[^a-zA-Z0-9_]', '', 'g'));
  base_name := substring(base_name from 1 for 15);
  
  suggested_name := base_name;
  
  -- Check if username exists, append numbers if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = suggested_name) LOOP
    suggested_name := base_name || counter::text;
    counter := counter + 1;
  END LOOP;
  
  RETURN suggested_name;
END;
$$ LANGUAGE plpgsql;

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS trigger AS $$
BEGIN
  NEW.last_active := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_active
CREATE TRIGGER trigger_update_last_active
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- View for public profiles (respects privacy settings)
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  CASE 
    WHEN (p.privacy_settings->>'bio_visible')::boolean THEN p.bio
    ELSE NULL
  END as bio,
  CASE 
    WHEN (p.privacy_settings->>'location_visible')::boolean THEN p.location
    ELSE NULL
  END as location,
  p.level,
  CASE 
    WHEN (p.privacy_settings->>'stats_visible')::boolean THEN p.xp
    ELSE NULL
  END as xp,
  CASE 
    WHEN (p.privacy_settings->>'stats_visible')::boolean THEN p.current_streak
    ELSE NULL
  END as current_streak,
  CASE 
    WHEN (p.privacy_settings->>'stats_visible')::boolean THEN p.longest_streak
    ELSE NULL
  END as longest_streak,
  CASE 
    WHEN (p.privacy_settings->>'stats_visible')::boolean THEN p.total_habits_completed
    ELSE NULL
  END as total_habits_completed,
  CASE 
    WHEN (p.privacy_settings->>'stats_visible')::boolean THEN p.total_goals_completed
    ELSE NULL
  END as total_goals_completed,
  p.is_premium,
  p.premium_tier,
  p.member_since,
  p.last_active
FROM profiles p
WHERE (p.privacy_settings->>'profile_visible')::boolean = true;

-- RLS policy for public profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (
  (privacy_settings->>'profile_visible')::boolean = true
  OR auth.uid() = id
);

-- Function to search users by username or display name
CREATE OR REPLACE FUNCTION search_users(search_term text, limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  level integer,
  is_premium boolean,
  premium_tier text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.level,
    p.is_premium,
    p.premium_tier
  FROM profiles p
  WHERE 
    (p.privacy_settings->>'profile_visible')::boolean = true
    AND (
      p.username ILIKE '%' || search_term || '%'
      OR p.display_name ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    CASE WHEN p.username ILIKE search_term || '%' THEN 1 ELSE 2 END,
    p.level DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to search function
GRANT EXECUTE ON FUNCTION search_users TO authenticated;

COMMENT ON TABLE profiles IS 'Enhanced user profiles with usernames, privacy settings, and premium status';
COMMENT ON COLUMN profiles.username IS 'Unique username for user identification and search';
COMMENT ON COLUMN profiles.privacy_settings IS 'JSON object controlling profile visibility';
COMMENT ON COLUMN profiles.premium_tier IS 'Subscription tier: free, premium, pro, or lifetime';
