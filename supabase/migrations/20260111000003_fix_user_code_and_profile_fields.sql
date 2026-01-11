-- ============================================================================
-- FIX: Add missing profile fields and ensure user_code generation works
-- ============================================================================
-- This migration ensures:
-- 1. All required profile fields exist (user_code, hearts, max_hearts, total_habits_completed)
-- 2. The user_code generation function exists
-- 3. The handle_new_user trigger includes user_code generation
-- 4. Existing users without user_code get one assigned
-- ============================================================================

-- Add missing columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_code TEXT UNIQUE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hearts INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS max_hearts INTEGER DEFAULT 5;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_habits_completed INTEGER DEFAULT 0;

-- ============================================================================
-- Function: Generate unique user code (SP + 6 alphanumeric characters)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 8-character code: SP + 6 uppercase alphanumeric
    new_code := 'SP' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- ============================================================================
-- Function: Handle new user signup (creates profile with all required fields)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  username_exists BOOLEAN;
  new_user_code TEXT;
BEGIN
  -- Get username from metadata or generate a unique one
  new_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Check if username already exists and make it unique if needed
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = new_username) INTO username_exists;
  
  IF username_exists THEN
    new_username := new_username || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  END IF;
  
  -- Generate unique user code
  new_user_code := public.generate_user_code();
  
  -- Create profile with all required fields
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    username, 
    avatar_url,
    user_code, 
    hearts,
    max_hearts,
    total_habits_completed,
    level,
    xp,
    total_xp,
    streak,
    longest_streak
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', new_username),
    new_username, 
    NEW.raw_user_meta_data ->> 'avatar_url',
    new_user_code,
    0,    -- hearts start at 0
    5,    -- max_hearts
    0,    -- total_habits_completed
    1,    -- level starts at 1
    0,    -- xp starts at 0
    0,    -- total_xp starts at 0
    0,    -- streak starts at 0
    0     -- longest_streak starts at 0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    user_code = COALESCE(public.profiles.user_code, EXCLUDED.user_code);
  
  -- Create initial subscription (free tier)
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create initial credits (10 free credits)
  INSERT INTO public.credits (user_id, balance, total_earned)
  VALUES (NEW.id, 10, 10)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default categories
  INSERT INTO public.categories (user_id, name, icon, color, is_default) VALUES
    (NEW.id, 'Health & Fitness', '💪', '#ef4444', true),
    (NEW.id, 'Learning', '📚', '#3b82f6', true),
    (NEW.id, 'Work', '💼', '#8b5cf6', true),
    (NEW.id, 'Personal', '🌟', '#f59e0b', true)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Recreate the trigger to ensure it uses the updated function
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Fix existing users: Assign user_code to users who don't have one
-- ============================================================================
DO $$
DECLARE
  profile_record RECORD;
  new_code TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id FROM public.profiles WHERE user_code IS NULL
  LOOP
    new_code := public.generate_user_code();
    UPDATE public.profiles 
    SET user_code = new_code 
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- ============================================================================
-- Function: Increment total_habits_completed when a habit is completed
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_habit_completion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET total_habits_completed = total_habits_completed + 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment total_habits_completed
DROP TRIGGER IF EXISTS on_habit_completed ON public.habit_completions;
CREATE TRIGGER on_habit_completed
  AFTER INSERT ON public.habit_completions
  FOR EACH ROW EXECUTE FUNCTION public.increment_habit_completion();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$ 
BEGIN 
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ User code and profile fields migration complete!';
  RAISE NOTICE '📊 Added: user_code, hearts, max_hearts, total_habits_completed';
  RAISE NOTICE '🔐 Updated handle_new_user trigger';
  RAISE NOTICE '👥 Existing users without user_code have been assigned one';
  RAISE NOTICE '============================================================';
END $$;
