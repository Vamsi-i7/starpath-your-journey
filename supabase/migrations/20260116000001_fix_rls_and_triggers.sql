-- Fix RLS Policies and User Creation Trigger
-- Migration: 20260116000001_fix_rls_and_triggers.sql

-- =====================================================
-- 1. FIX PROFILES RLS - Remove overly permissive SELECT
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

-- Create secure profiles SELECT policy
-- Users can view their own profile, or public profiles, or admins can view all
CREATE POLICY "profiles_select_secure" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR  -- Own profile
    is_public = true OR  -- Public profiles
    EXISTS (  -- Admin access
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- =====================================================
-- 2. FIX HANDLE_NEW_USER TRIGGER - Include OAuth data
-- =====================================================

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create improved function that handles OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_email TEXT;
  v_user_code TEXT;
BEGIN
  -- Extract email
  v_email := NEW.email;
  
  -- Extract data from OAuth metadata (Google, etc.)
  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'username'
  );
  
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture'
  );
  
  -- Generate username from metadata or email
  v_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'preferred_username',
    split_part(v_full_name, ' ', 1),
    split_part(v_email, '@', 1),
    'StarExplorer' || substr(NEW.id::text, 1, 8)
  );
  
  -- Ensure username is unique by appending random chars if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = v_username) LOOP
    v_username := v_username || substr(md5(random()::text), 1, 4);
  END LOOP;
  
  -- Generate unique user code
  v_user_code := 'SP' || upper(substr(md5(NEW.id::text || now()::text), 1, 6));
  
  -- Ensure user_code is unique
  WHILE EXISTS (SELECT 1 FROM profiles WHERE user_code = v_user_code) LOOP
    v_user_code := 'SP' || upper(substr(md5(random()::text), 1, 6));
  END LOOP;
  
  -- Insert the new profile with all available data
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    avatar_url,
    user_code,
    level,
    xp,
    total_xp,
    streak,
    longest_streak,
    hearts,
    max_hearts,
    total_habits_completed,
    ai_credits,
    is_admin,
    is_public,
    notification_enabled,
    theme,
    account_status
  ) VALUES (
    NEW.id,
    v_email,
    v_username,
    v_full_name,
    v_avatar_url,
    v_user_code,
    1,      -- level
    0,      -- xp
    0,      -- total_xp
    0,      -- streak
    0,      -- longest_streak
    5,      -- hearts
    5,      -- max_hearts
    0,      -- total_habits_completed
    0,      -- ai_credits (welcome credits granted by separate trigger)
    FALSE,  -- is_admin
    TRUE,   -- is_public
    TRUE,   -- notification_enabled
    'dark', -- theme
    'active' -- account_status
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If there's a conflict, try with modified username
    v_username := v_username || substr(md5(random()::text), 1, 6);
    INSERT INTO public.profiles (id, email, username, user_code)
    VALUES (NEW.id, v_email, v_username, v_user_code);
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. ENSURE ALL REQUIRED COLUMNS EXIST ON PROFILES
-- =====================================================

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- account_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
    ALTER TABLE public.profiles ADD COLUMN account_status TEXT DEFAULT 'active' NOT NULL;
  END IF;
  
  -- ai_credits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ai_credits') THEN
    ALTER TABLE public.profiles ADD COLUMN ai_credits INTEGER DEFAULT 0 NOT NULL;
  END IF;
  
  -- is_admin
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;
  
  -- subscription_tier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_tier') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
  END IF;
  
  -- last_daily_credit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_daily_credit') THEN
    ALTER TABLE public.profiles ADD COLUMN last_daily_credit TIMESTAMPTZ;
  END IF;
  
  -- total_credits_purchased
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_credits_purchased') THEN
    ALTER TABLE public.profiles ADD COLUMN total_credits_purchased INTEGER DEFAULT 0 NOT NULL;
  END IF;
  
  -- credits_used_this_month
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'credits_used_this_month') THEN
    ALTER TABLE public.profiles ADD COLUMN credits_used_this_month INTEGER DEFAULT 0 NOT NULL;
  END IF;
  
  -- disabled_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'disabled_at') THEN
    ALTER TABLE public.profiles ADD COLUMN disabled_at TIMESTAMPTZ;
  END IF;
  
  -- disabled_reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'disabled_reason') THEN
    ALTER TABLE public.profiles ADD COLUMN disabled_reason TEXT;
  END IF;
END $$;

-- =====================================================
-- 4. FIX ACHIEVEMENTS RLS - Protect secret achievements
-- =====================================================

DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;

-- Public achievements are viewable by all, secret ones only if unlocked
CREATE POLICY "achievements_select_secure" ON public.achievements
  FOR SELECT TO authenticated
  USING (
    is_secret = FALSE OR  -- Public achievements
    EXISTS (  -- User has unlocked this secret achievement
      SELECT 1 FROM user_achievements 
      WHERE user_achievements.achievement_id = achievements.id 
      AND user_achievements.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. ADD INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_achievements_is_secret ON public.achievements(is_secret);

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON POLICY "profiles_select_secure" ON public.profiles IS 'Users can view own profile, public profiles, or admins can view all';
COMMENT ON POLICY "achievements_select_secure" ON public.achievements IS 'Public achievements visible to all, secret ones only if unlocked';
