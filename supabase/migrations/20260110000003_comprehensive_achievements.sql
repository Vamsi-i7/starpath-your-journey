-- Comprehensive Achievement System (25+ Achievements)
-- Migration: 20260110000003_comprehensive_achievements.sql

-- Enhanced achievements table
ALTER TABLE achievements
ADD COLUMN IF NOT EXISTS achievement_type text DEFAULT 'milestone' CHECK (achievement_type IN ('milestone', 'streak', 'category', 'social', 'special', 'time')),
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
ADD COLUMN IF NOT EXISTS requirement_value integer,
ADD COLUMN IF NOT EXISTS requirement_type text,
ADD COLUMN IF NOT EXISTS is_secret boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Achievement progress tracking
CREATE TABLE IF NOT EXISTS achievement_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  current_value integer DEFAULT 0,
  target_value integer NOT NULL,
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_progress_user ON achievement_progress(user_id);

-- Insert comprehensive achievement set
INSERT INTO achievements (name, description, icon, xp_reward, achievement_type, tier, requirement_value, requirement_type) VALUES
  -- Milestone Achievements
  ('First Step', 'Complete your first habit', '🌟', 50, 'milestone', 'bronze', 1, 'habits_completed'),
  ('Getting Started', 'Complete 10 habits', '⭐', 100, 'milestone', 'bronze', 10, 'habits_completed'),
  ('Habit Builder', 'Complete 50 habits', '🌠', 200, 'milestone', 'silver', 50, 'habits_completed'),
  ('Consistency Champion', 'Complete 100 habits', '✨', 500, 'milestone', 'gold', 100, 'habits_completed'),
  ('Habit Master', 'Complete 500 habits', '💫', 1000, 'milestone', 'platinum', 500, 'habits_completed'),
  ('Legend', 'Complete 1000 habits', '🏆', 2500, 'milestone', 'diamond', 1000, 'habits_completed'),
  
  -- Streak Achievements
  ('3-Day Warrior', 'Maintain a 3-day streak', '🔥', 75, 'streak', 'bronze', 3, 'streak_days'),
  ('Week Streak', 'Maintain a 7-day streak', '⚡', 150, 'streak', 'silver', 7, 'streak_days'),
  ('Two Weeks Strong', 'Maintain a 14-day streak', '💪', 300, 'streak', 'silver', 14, 'streak_days'),
  ('Hot Streak', 'Maintain a 30-day streak', '🔥', 500, 'streak', 'gold', 30, 'streak_days'),
  ('Unstoppable', 'Maintain a 60-day streak', '⚡', 1000, 'streak', 'gold', 60, 'streak_days'),
  ('Century Club', 'Maintain a 100-day streak', '💯', 2000, 'streak', 'platinum', 100, 'streak_days'),
  ('Year Round', 'Maintain a 365-day streak', '🌈', 5000, 'streak', 'diamond', 365, 'streak_days'),
  
  -- Time-Based Achievements
  ('Early Bird', 'Complete 20 habits before 7 AM', '🌅', 200, 'time', 'bronze', 20, 'early_morning'),
  ('Night Owl', 'Complete 20 habits after 10 PM', '🦉', 200, 'time', 'bronze', 20, 'late_night'),
  ('Weekend Warrior', 'Complete 50 habits on weekends', '🎯', 300, 'time', 'silver', 50, 'weekend'),
  
  -- Category Achievements
  ('Health Enthusiast', 'Complete 50 health habits', '💪', 250, 'category', 'silver', 50, 'health_category'),
  ('Scholar', 'Complete 50 study habits', '🎓', 250, 'category', 'silver', 50, 'study_category'),
  ('Professional', 'Complete 50 work habits', '💼', 250, 'category', 'silver', 50, 'work_category'),
  ('Zen Master', 'Complete 50 meditation/mindfulness habits', '🧘', 250, 'category', 'silver', 50, 'personal_category'),
  
  -- Difficulty Achievements
  ('Challenge Accepted', 'Complete 10 hard difficulty habits', '⭐', 300, 'milestone', 'silver', 10, 'hard_habits'),
  ('Extreme Champion', 'Complete 5 extreme difficulty habits', '💎', 500, 'milestone', 'gold', 5, 'extreme_habits'),
  
  -- Goal Achievements
  ('Goal Getter', 'Complete your first goal', '🎯', 100, 'milestone', 'bronze', 1, 'goals_completed'),
  ('Goal Crusher', 'Complete 5 goals', '🏅', 300, 'milestone', 'silver', 5, 'goals_completed'),
  ('Dream Achiever', 'Complete 25 goals', '🌟', 1000, 'milestone', 'gold', 25, 'goals_completed'),
  
  -- Social Achievements
  ('Social Butterfly', 'Add 10 friends', '👥', 150, 'social', 'bronze', 10, 'friends_count'),
  ('Team Player', 'Complete 5 friend challenges', '🤝', 300, 'social', 'silver', 5, 'challenges_completed'),
  ('Motivator', 'Help 10 friends with their habits', '💬', 400, 'social', 'gold', 10, 'friends_helped'),
  
  -- XP and Level Achievements
  ('Level 5 Reached', 'Reach level 5', '⚡', 200, 'milestone', 'bronze', 5, 'level_reached'),
  ('Level 10 Reached', 'Reach level 10', '⚡', 500, 'milestone', 'silver', 10, 'level_reached'),
  ('Level 25 Reached', 'Reach level 25', '⚡', 1500, 'milestone', 'gold', 25, 'level_reached'),
  ('Level 50 Reached', 'Reach level 50', '⚡', 5000, 'milestone', 'platinum', 50, 'level_reached'),
  
  -- Special Achievements
  ('Perfect Week', 'Complete 100% of habits for a week', '💯', 500, 'special', 'gold', 7, 'perfect_week'),
  ('Comeback Kid', 'Return after 7+ days absence and complete a habit', '🔄', 200, 'special', 'silver', 1, 'comeback'),
  ('Multi-tasker', 'Complete 5 habits in one day', '🚀', 150, 'special', 'silver', 5, 'daily_habits'),
  ('Overachiever', 'Complete 10 habits in one day', '⚡', 300, 'special', 'gold', 10, 'daily_habits'),
  ('Star Student', 'Complete all assigned daily challenges for a month', '🌟', 1000, 'special', 'platinum', 30, 'daily_challenges')
ON CONFLICT (name) DO NOTHING;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id uuid)
RETURNS TABLE (
  achievement_id uuid,
  achievement_name text,
  achievement_description text,
  xp_reward integer,
  newly_unlocked boolean
) AS $$
DECLARE
  user_stats record;
  achievement record;
  progress_record record;
BEGIN
  -- Get user statistics
  SELECT 
    p.level,
    p.current_streak,
    p.longest_streak,
    p.total_habits_completed,
    p.total_goals_completed,
    COUNT(DISTINCT f.friend_id) as friends_count
  INTO user_stats
  FROM profiles p
  LEFT JOIN friendships f ON (f.user_id = p.id OR f.friend_id = p.id) AND f.status = 'accepted'
  WHERE p.id = p_user_id
  GROUP BY p.id;
  
  -- Check each achievement
  FOR achievement IN 
    SELECT a.* FROM achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
  LOOP
    DECLARE
      should_award boolean := false;
      current_progress integer := 0;
    BEGIN
      -- Check achievement conditions
      CASE achievement.requirement_type
        WHEN 'habits_completed' THEN
          current_progress := user_stats.total_habits_completed;
          should_award := current_progress >= achievement.requirement_value;
          
        WHEN 'streak_days' THEN
          current_progress := user_stats.current_streak;
          should_award := current_progress >= achievement.requirement_value;
          
        WHEN 'goals_completed' THEN
          current_progress := user_stats.total_goals_completed;
          should_award := current_progress >= achievement.requirement_value;
          
        WHEN 'level_reached' THEN
          current_progress := user_stats.level;
          should_award := current_progress >= achievement.requirement_value;
          
        WHEN 'friends_count' THEN
          current_progress := user_stats.friends_count;
          should_award := current_progress >= achievement.requirement_value;
          
        ELSE
          current_progress := 0;
      END CASE;
      
      -- Update or create progress
      INSERT INTO achievement_progress (user_id, achievement_id, current_value, target_value)
      VALUES (p_user_id, achievement.id, current_progress, achievement.requirement_value)
      ON CONFLICT (user_id, achievement_id) 
      DO UPDATE SET 
        current_value = EXCLUDED.current_value,
        updated_at = now();
      
      -- Award achievement if conditions met
      IF should_award THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (p_user_id, achievement.id)
        ON CONFLICT DO NOTHING;
        
        -- Add XP reward
        UPDATE profiles
        SET xp = xp + achievement.xp_reward
        WHERE id = p_user_id;
        
        -- Return newly unlocked achievement
        RETURN QUERY
        SELECT 
          achievement.id,
          achievement.name,
          achievement.description,
          achievement.xp_reward,
          true as newly_unlocked;
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get achievement progress for a user
CREATE OR REPLACE FUNCTION get_achievement_progress(p_user_id uuid)
RETURNS TABLE (
  achievement_id uuid,
  achievement_name text,
  achievement_description text,
  achievement_icon text,
  achievement_type text,
  tier text,
  xp_reward integer,
  current_value integer,
  target_value integer,
  progress_percentage numeric,
  is_unlocked boolean,
  unlocked_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.description,
    a.icon,
    a.achievement_type,
    a.tier,
    a.xp_reward,
    COALESCE(ap.current_value, 0) as current_value,
    a.requirement_value as target_value,
    ROUND((COALESCE(ap.current_value, 0)::numeric / a.requirement_value::numeric) * 100, 1) as progress_percentage,
    EXISTS(SELECT 1 FROM user_achievements ua WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id) as is_unlocked,
    ua.unlocked_at
  FROM achievements a
  LEFT JOIN achievement_progress ap ON ap.achievement_id = a.id AND ap.user_id = p_user_id
  LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = p_user_id
  WHERE a.is_secret = false OR EXISTS(SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_id = a.id)
  ORDER BY a.sort_order, a.tier, a.xp_reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check achievements after habit completion
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS trigger AS $$
BEGIN
  PERFORM check_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_habit_completion_check_achievements
  AFTER INSERT ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

-- RLS Policies
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievement progress"
ON achievement_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can manage achievement progress"
ON achievement_progress FOR ALL
USING (true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION get_achievement_progress TO authenticated;

COMMENT ON TABLE achievement_progress IS 'Tracks user progress towards achievements';
COMMENT ON FUNCTION check_achievements IS 'Checks and awards achievements for a user based on their statistics';
COMMENT ON FUNCTION get_achievement_progress IS 'Returns all achievements with progress for a user';
