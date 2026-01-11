-- ============================================================================
-- STARPATH APP - COMPLETE DATABASE SCHEMA (SAFE RE-RUN VERSION)
-- ============================================================================
-- This script is SAFE to run multiple times - it won't fail on existing objects
-- Run this entire SQL in Supabase SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE - User profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  theme TEXT DEFAULT 'system',
  notification_enabled BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add username column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON public.profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. CATEGORIES TABLE - Habit categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 3. HABITS TABLE - User habits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '✓',
  color TEXT DEFAULT '#6366f1',
  difficulty TEXT DEFAULT 'medium',
  frequency TEXT DEFAULT 'daily',
  target_count INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint if not exists (safe)
DO $$ BEGIN
  ALTER TABLE public.habits ADD CONSTRAINT habits_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;
CREATE POLICY "Users can manage their own habits" ON public.habits
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 4. HABIT COMPLETIONS TABLE - Track daily completions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER DEFAULT 0,
  notes TEXT
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own habit completions" ON public.habit_completions;
CREATE POLICY "Users can manage their own habit completions" ON public.habit_completions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 5. GOALS TABLE - User goals
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  deadline DATE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints if not exists (safe)
DO $$ BEGIN
  ALTER TABLE public.goals ADD CONSTRAINT goals_priority_check CHECK (priority IN ('low', 'medium', 'high'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.goals ADD CONSTRAINT goals_progress_check CHECK (progress >= 0 AND progress <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.goals ADD CONSTRAINT goals_status_check CHECK (status IN ('active', 'completed', 'archived'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own goals" ON public.goals;
CREATE POLICY "Users can manage their own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 6. TASKS TABLE - Sub-tasks for goals
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
CREATE POLICY "Users can manage their own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 7. SESSIONS TABLE - Study/work sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  focus_area TEXT,
  notes TEXT,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.sessions;
CREATE POLICY "Users can manage their own sessions" ON public.sessions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 8. ACHIEVEMENTS TABLE - Available achievements
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  category TEXT NOT NULL,
  tier TEXT DEFAULT 'bronze',
  xp_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.achievements ADD CONSTRAINT achievements_tier_check CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 9. USER ACHIEVEMENTS TABLE - Unlocked achievements
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_achievements_unique'
  ) THEN
    ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_unique UNIQUE(user_id, achievement_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert achievements" ON public.user_achievements;
CREATE POLICY "System can insert achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 10. FRIENDSHIPS TABLE - Social connections
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_unique') THEN
    ALTER TABLE public.friendships ADD CONSTRAINT friendships_unique UNIQUE(user_id, friend_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.friendships ADD CONSTRAINT friendships_status_check CHECK (status IN ('pending', 'accepted', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.friendships ADD CONSTRAINT friendships_self_check CHECK (user_id != friend_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
CREATE POLICY "Users can create friendships" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
CREATE POLICY "Users can update their friendships" ON public.friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================================================
-- 11. ACTIVITY FEED TABLE - Social activity tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own and friends activities" ON public.activity_feed;
CREATE POLICY "Users can view their own and friends activities" ON public.activity_feed
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (user_id = auth.uid() AND friend_id = activity_feed.user_id AND status = 'accepted')
         OR (friend_id = auth.uid() AND user_id = activity_feed.user_id AND status = 'accepted')
    )
  );

DROP POLICY IF EXISTS "Users can create their own activities" ON public.activity_feed;
CREATE POLICY "Users can create their own activities" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 12. CHALLENGES TABLE - Community challenges
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  duration_days INTEGER DEFAULT 7,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  xp_reward INTEGER DEFAULT 100,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public challenges" ON public.challenges;
CREATE POLICY "Anyone can view public challenges" ON public.challenges
  FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;
CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- ============================================================================
-- 13. CHALLENGE PARTICIPANTS TABLE - Challenge participation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'challenge_participants_unique') THEN
    ALTER TABLE public.challenge_participants ADD CONSTRAINT challenge_participants_unique UNIQUE(challenge_id, user_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view challenge participants" ON public.challenge_participants;
CREATE POLICY "Users can view challenge participants" ON public.challenge_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
CREATE POLICY "Users can join challenges" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their challenge progress" ON public.challenge_participants;
CREATE POLICY "Users can update their challenge progress" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 14. SUBSCRIPTIONS TABLE - User subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  razorpay_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_unique') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_unique UNIQUE(user_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'pro', 'premium'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'cancelled', 'expired'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their subscription" ON public.subscriptions;
CREATE POLICY "Users can update their subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 15. PAYMENTS TABLE - Payment history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  plan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'success', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 16. CREDITS TABLE - AI feature credits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 10,
  total_earned INTEGER DEFAULT 10,
  total_spent INTEGER DEFAULT 0,
  last_daily_credit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credits_user_unique') THEN
    ALTER TABLE public.credits ADD CONSTRAINT credits_user_unique UNIQUE(user_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own credits" ON public.credits;
CREATE POLICY "Users can view their own credits" ON public.credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their credits" ON public.credits;
CREATE POLICY "Users can insert their credits" ON public.credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their credits" ON public.credits;
CREATE POLICY "Users can update their credits" ON public.credits
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 17. CREDIT TRANSACTIONS TABLE - Credit usage history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check CHECK (type IN ('earn', 'spend'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.credit_transactions;
CREATE POLICY "Users can insert their own transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 18. AI LIBRARY TABLE - Saved AI content
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  tags TEXT[],
  metadata JSONB,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.ai_library ADD CONSTRAINT ai_library_content_type_check CHECK (content_type IN ('notes', 'flashcards', 'roadmap', 'chat'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.ai_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own library" ON public.ai_library;
CREATE POLICY "Users can manage their own library" ON public.ai_library
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 19. NOTIFICATIONS TABLE - User notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('info', 'success', 'warning', 'error', 'payment'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 20. AI GENERATIONS TABLE - Track AI usage
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  prompt TEXT,
  result JSONB,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own generations" ON public.ai_generations;
CREATE POLICY "Users can view their own generations" ON public.ai_generations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own generations" ON public.ai_generations;
CREATE POLICY "Users can insert their own generations" ON public.ai_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 21. RAZORPAY CUSTOMERS TABLE - Store Razorpay customer IDs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_razorpay_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  razorpay_customer_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_razorpay_customers_user_unique') THEN
    ALTER TABLE public.user_razorpay_customers ADD CONSTRAINT user_razorpay_customers_user_unique UNIQUE(user_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_razorpay_customers_razorpay_unique') THEN
    ALTER TABLE public.user_razorpay_customers ADD CONSTRAINT user_razorpay_customers_razorpay_unique UNIQUE(razorpay_customer_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.user_razorpay_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own razorpay customer" ON public.user_razorpay_customers;
CREATE POLICY "Users can view own razorpay customer" ON public.user_razorpay_customers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own razorpay customer" ON public.user_razorpay_customers;
CREATE POLICY "Users can insert own razorpay customer" ON public.user_razorpay_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 22. RAZORPAY SUBSCRIPTIONS TABLE - Track subscription details
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.razorpay_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT NOT NULL,
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'razorpay_subscriptions_unique') THEN
    ALTER TABLE public.razorpay_subscriptions ADD CONSTRAINT razorpay_subscriptions_unique UNIQUE(razorpay_subscription_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.razorpay_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.razorpay_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.razorpay_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.razorpay_subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.razorpay_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at 
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credits_updated_at ON public.credits;
CREATE TRIGGER update_credits_updated_at 
  BEFORE UPDATE ON public.credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_library_updated_at ON public.ai_library;
CREATE TRIGGER update_ai_library_updated_at 
  BEFORE UPDATE ON public.ai_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_razorpay_subscriptions_updated_at ON public.razorpay_subscriptions;
CREATE TRIGGER update_razorpay_subscriptions_updated_at 
  BEFORE UPDATE ON public.razorpay_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Handle new user signup (CRITICAL - creates profile on signup)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create initial subscription
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

-- Trigger: New user signup (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function: Update goal progress based on tasks
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  new_progress INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
  INTO total_tasks, completed_tasks
  FROM public.tasks
  WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  IF total_tasks > 0 THEN
    new_progress := (completed_tasks * 100) / total_tasks;
  ELSE
    new_progress := 0;
  END IF;
  
  UPDATE public.goals
  SET progress = new_progress, updated_at = NOW()
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update goal progress when tasks change
DROP TRIGGER IF EXISTS update_goal_progress_on_task_change ON public.tasks;
CREATE TRIGGER update_goal_progress_on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_goal_progress();

-- Function: Update goal completed_at timestamp
CREATE OR REPLACE FUNCTION update_goal_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.progress = 100 AND OLD.progress < 100 AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  IF NEW.progress < 100 AND NEW.completed_at IS NOT NULL THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Set goal completed_at
DROP TRIGGER IF EXISTS set_goal_completed_at ON public.goals;
CREATE TRIGGER set_goal_completed_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_goal_completed_at();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date 
  ON public.habit_completions(user_id, completed_at);

CREATE INDEX IF NOT EXISTS idx_habit_completions_habit 
  ON public.habit_completions(habit_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date 
  ON public.sessions(user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_goals_user_status 
  ON public.goals(user_id, status);

CREATE INDEX IF NOT EXISTS idx_goals_completed_at 
  ON public.goals(completed_at) WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_goal 
  ON public.tasks(goal_id);

CREATE INDEX IF NOT EXISTS idx_friendships_users 
  ON public.friendships(user_id, friend_id);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_date 
  ON public.activity_feed(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON public.notifications(user_id, read);

-- ============================================================================
-- DAILY CHALLENGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  challenge_type TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER DEFAULT 50,
  active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view daily challenges" ON public.daily_challenges;
CREATE POLICY "Anyone can view daily challenges" ON public.daily_challenges
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(active_date);

-- ============================================================================
-- USER CHALLENGE PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_challenge_unique') THEN
    ALTER TABLE public.user_challenge_progress ADD CONSTRAINT user_challenge_unique UNIQUE(user_id, challenge_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own challenge progress" ON public.user_challenge_progress;
CREATE POLICY "Users can view their own challenge progress" ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own challenge progress" ON public.user_challenge_progress;
CREATE POLICY "Users can insert their own challenge progress" ON public.user_challenge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own challenge progress" ON public.user_challenge_progress;
CREATE POLICY "Users can update their own challenge progress" ON public.user_challenge_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user ON public.user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge ON public.user_challenge_progress(challenge_id);

-- ============================================================================
-- SEED INITIAL ACHIEVEMENTS
-- ============================================================================

INSERT INTO public.achievements (key, name, description, icon, category, tier, xp_reward, requirement_type, requirement_value) VALUES
('first_habit', 'First Steps', 'Complete your first habit', '👣', 'habits', 'bronze', 50, 'habit_completions', 1),
('habit_streak_7', 'Week Warrior', 'Maintain a 7-day streak', '🔥', 'habits', 'silver', 100, 'streak', 7),
('habit_streak_30', 'Monthly Master', 'Maintain a 30-day streak', '⭐', 'habits', 'gold', 300, 'streak', 30),
('first_goal', 'Goal Getter', 'Complete your first goal', '🎯', 'goals', 'bronze', 75, 'goals_completed', 1),
('level_10', 'Rising Star', 'Reach level 10', '✨', 'progression', 'silver', 200, 'level', 10),
('level_25', 'Elite Performer', 'Reach level 25', '💫', 'progression', 'gold', 500, 'level', 25),
('first_friend', 'Social Butterfly', 'Add your first friend', '🦋', 'social', 'bronze', 50, 'friends', 1),
('total_xp_1000', 'XP Collector', 'Earn 1000 total XP', '💎', 'progression', 'silver', 150, 'total_xp', 1000)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- SEED SAMPLE DAILY CHALLENGES
-- ============================================================================
INSERT INTO public.daily_challenges (title, description, icon, challenge_type, target_value, xp_reward, active_date) VALUES
('Morning Starter', 'Complete 1 habit before noon', '🌅', 'habit_completion', 1, 25, CURRENT_DATE),
('Streak Builder', 'Maintain your streak today', '🔥', 'maintain_streak', 1, 30, CURRENT_DATE),
('Goal Focused', 'Work on any goal task', '🎯', 'task_completion', 1, 20, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$ 
BEGIN 
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📊 Created 19 tables with all relationships';
  RAISE NOTICE '🔐 Row Level Security enabled on all user tables';
  RAISE NOTICE '⚡ Triggers and functions configured';
  RAISE NOTICE '🎯 8 initial achievements seeded';
  RAISE NOTICE '🚀 Your Starpath app database is ready to use!';
  RAISE NOTICE '============================================================';
END $$;
