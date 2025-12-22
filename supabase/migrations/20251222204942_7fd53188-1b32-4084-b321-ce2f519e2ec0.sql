-- Create achievements table with predefined achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'streak', 'completion', 'level', 'social', 'special'
  requirement_type TEXT NOT NULL, -- 'streak_days', 'habits_completed', 'level_reached', 'hearts_earned', 'goals_completed'
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_achievements table to track earned achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create daily_challenges table
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'complete_habits', 'earn_xp', 'maintain_streak', 'complete_all'
  target_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_challenge_progress table
CREATE TABLE public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Achievements are public (read-only for everyone)
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- Users can only see their own earned achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily challenges are public (read-only)
CREATE POLICY "Anyone can view daily challenges" ON public.daily_challenges
  FOR SELECT USING (true);

-- Users can manage their own challenge progress
CREATE POLICY "Users can view own challenge progress" ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge progress" ON public.user_challenge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress" ON public.user_challenge_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity) VALUES
-- Streak achievements
('First Flame', 'Complete your first habit', '🔥', 'streak', 'habits_completed', 1, 50, 'common'),
('Week Warrior', 'Maintain a 7-day streak', '⚡', 'streak', 'streak_days', 7, 100, 'common'),
('Fortnight Fighter', 'Maintain a 14-day streak', '💪', 'streak', 'streak_days', 14, 200, 'rare'),
('Monthly Master', 'Maintain a 30-day streak', '🏆', 'streak', 'streak_days', 30, 500, 'epic'),
('Century Champion', 'Maintain a 100-day streak', '👑', 'streak', 'streak_days', 100, 1000, 'legendary'),

-- Completion achievements
('Getting Started', 'Complete 10 habits total', '🌱', 'completion', 'habits_completed', 10, 75, 'common'),
('Habit Builder', 'Complete 50 habits total', '🏗️', 'completion', 'habits_completed', 50, 150, 'common'),
('Habit Hero', 'Complete 100 habits total', '🦸', 'completion', 'habits_completed', 100, 300, 'rare'),
('Habit Legend', 'Complete 500 habits total', '🌟', 'completion', 'habits_completed', 500, 750, 'epic'),
('Habit Titan', 'Complete 1000 habits total', '💎', 'completion', 'habits_completed', 1000, 1500, 'legendary'),

-- Level achievements
('Rising Star', 'Reach Level 5', '⭐', 'level', 'level_reached', 5, 100, 'common'),
('Constellation Keeper', 'Reach Level 10', '✨', 'level', 'level_reached', 10, 250, 'rare'),
('Galaxy Guardian', 'Reach Level 25', '🌌', 'level', 'level_reached', 25, 500, 'epic'),
('Universe Master', 'Reach Level 50', '🚀', 'level', 'level_reached', 50, 1000, 'legendary'),

-- Heart achievements
('Heart Collector', 'Earn your first heart', '❤️', 'special', 'hearts_earned', 1, 75, 'common'),
('Full Hearts', 'Reach maximum hearts', '💖', 'special', 'hearts_earned', 5, 250, 'rare'),

-- Goal achievements
('Goal Getter', 'Complete your first goal', '🎯', 'completion', 'goals_completed', 1, 100, 'common'),
('Dream Achiever', 'Complete 5 goals', '🏅', 'completion', 'goals_completed', 5, 300, 'rare'),
('Destiny Maker', 'Complete 10 goals', '🌠', 'completion', 'goals_completed', 10, 500, 'epic');

-- Insert sample daily challenges (these will rotate)
INSERT INTO public.daily_challenges (title, description, icon, challenge_type, target_value, xp_reward, active_date) VALUES
('Early Bird', 'Complete 3 habits today', '🌅', 'complete_habits', 3, 75, CURRENT_DATE),
('Perfect Day', 'Complete all your habits today', '✨', 'complete_all', 1, 150, CURRENT_DATE),
('XP Hunter', 'Earn 100 XP today', '💰', 'earn_xp', 100, 50, CURRENT_DATE);