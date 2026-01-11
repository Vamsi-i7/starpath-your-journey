-- ============================================================================
-- PART 1: FIX COLUMN MISMATCHES & CREATE VIEWS
-- ============================================================================
-- This fixes all the 404 errors you're seeing in console

-- 1. Create VIEW: session_history (maps to sessions table)
-- ============================================================================
CREATE OR REPLACE VIEW session_history AS
SELECT 
  id,
  user_id,
  title,
  duration_minutes as duration_seconds,
  focus_area,
  notes,
  xp_earned,
  started_at,
  ended_at,
  created_at
FROM public.sessions;

-- Enable RLS on view
ALTER VIEW session_history SET (security_invoker = true);

-- Grant permissions
GRANT SELECT ON session_history TO authenticated;
GRANT INSERT ON session_history TO authenticated;
GRANT UPDATE ON session_history TO authenticated;
GRANT DELETE ON session_history TO authenticated;

COMMENT ON VIEW session_history IS 'View mapping sessions table for backward compatibility';

-- 2. Create TABLE: daily_challenges
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(active_date, challenge_type)
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Daily challenges are visible to all authenticated users
CREATE POLICY "Anyone can view daily challenges"
  ON public.daily_challenges FOR SELECT
  TO authenticated
  USING (true);

-- Only system can create/update challenges (you can do this via SQL editor)
CREATE POLICY "Service role can manage challenges"
  ON public.daily_challenges FOR ALL
  TO service_role
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date 
  ON public.daily_challenges(active_date);

-- Seed today's challenges
INSERT INTO public.daily_challenges (title, description, challenge_type, target_value, xp_reward, active_date)
VALUES 
  ('Complete 5 Habits', 'Finish 5 different habits today', 'habits', 5, 50, CURRENT_DATE),
  ('Study Session', 'Complete a 30-minute focus session', 'session', 30, 75, CURRENT_DATE),
  ('Goal Progress', 'Make progress on 2 goals', 'goals', 2, 60, CURRENT_DATE)
ON CONFLICT (active_date, challenge_type) DO NOTHING;

-- 3. Create TABLE: habit_categories (alias for categories)
-- ============================================================================
CREATE OR REPLACE VIEW habit_categories AS
SELECT 
  id,
  user_id,
  name,
  icon,
  color,
  is_default,
  created_at
FROM public.categories;

ALTER VIEW habit_categories SET (security_invoker = true);

GRANT SELECT ON habit_categories TO authenticated;
GRANT INSERT ON habit_categories TO authenticated;
GRANT UPDATE ON habit_categories TO authenticated;
GRANT DELETE ON habit_categories TO authenticated;

-- 4. Create TABLE: ai_generations (for AI tools history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result TEXT NOT NULL,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generations"
  ON public.ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create generations"
  ON public.ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_date 
  ON public.ai_generations(user_id, created_at DESC);

-- 5. Create TABLE: ai_generation_history (detailed history)
-- ============================================================================
CREATE OR REPLACE VIEW ai_generation_history AS
SELECT * FROM public.ai_generations;

ALTER VIEW ai_generation_history SET (security_invoker = true);

GRANT SELECT ON ai_generation_history TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Part 1 Complete: Fixed column mismatches & created critical tables';
  RAISE NOTICE '📊 Created: session_history view, daily_challenges, habit_categories, ai_generations';
  RAISE NOTICE '🎯 Console errors should now be reduced significantly!';
END $$;
