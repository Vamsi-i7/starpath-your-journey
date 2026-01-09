-- Enhanced Social Features: Challenges, Activity Feed, Leaderboards
-- Migration: 20260110000005_social_features.sql

-- Friend Challenges
CREATE TABLE IF NOT EXISTS friend_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  challenger_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_type text NOT NULL CHECK (challenge_type IN ('habit_count', 'streak', 'xp', 'specific_habit', 'category')),
  target_value integer NOT NULL,
  duration_days integer DEFAULT 7,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined')),
  winner_id uuid REFERENCES profiles(id),
  creator_progress integer DEFAULT 0,
  challenger_progress integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN (
    'habit_completed', 'goal_completed', 'achievement_unlocked', 
    'streak_milestone', 'level_up', 'challenge_won', 'challenge_started',
    'friend_added', 'challenge_accepted'
  )),
  activity_data jsonb NOT NULL DEFAULT '{}',
  visibility text DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'private')),
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Activity Likes
CREATE TABLE IF NOT EXISTS activity_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- Activity Comments
CREATE TABLE IF NOT EXISTS activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leaderboards (Materialized View for Performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS global_leaderboard AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.level,
  p.xp,
  p.current_streak,
  p.longest_streak,
  p.total_habits_completed,
  p.total_goals_completed,
  ROW_NUMBER() OVER (ORDER BY p.level DESC, p.xp DESC) as rank_overall,
  ROW_NUMBER() OVER (ORDER BY p.total_habits_completed DESC) as rank_habits,
  ROW_NUMBER() OVER (ORDER BY p.current_streak DESC) as rank_streak,
  ROW_NUMBER() OVER (ORDER BY p.xp DESC) as rank_xp
FROM profiles p
WHERE (p.privacy_settings->>'profile_visible')::boolean = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_leaderboard_id ON global_leaderboard(id);

-- Weekly Leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_leaderboard AS
SELECT 
  hc.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.level,
  COUNT(*) as habits_this_week,
  SUM(h.xp_reward) as xp_this_week,
  ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, SUM(h.xp_reward) DESC) as rank
FROM habit_completions hc
JOIN profiles p ON p.id = hc.user_id
JOIN habits h ON h.id = hc.habit_id
WHERE hc.completed_at >= date_trunc('week', now())
  AND (p.privacy_settings->>'profile_visible')::boolean = true
GROUP BY hc.user_id, p.username, p.display_name, p.avatar_url, p.level;

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_leaderboard_user ON weekly_leaderboard(user_id);

-- Study Groups / Teams
CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  creator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_private boolean DEFAULT false,
  max_members integer DEFAULT 50,
  group_type text DEFAULT 'study' CHECK (group_type IN ('study', 'fitness', 'productivity', 'general')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group Goals (Shared Goals)
CREATE TABLE IF NOT EXISTS group_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_value integer NOT NULL,
  current_value integer DEFAULT 0,
  goal_type text NOT NULL CHECK (goal_type IN ('collective_habits', 'collective_xp', 'collective_streak')),
  deadline timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_friend_challenges_creator ON friend_challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenger ON friend_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_status ON friend_challenges(status);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_creator ON study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Function to create activity feed entry
CREATE OR REPLACE FUNCTION create_activity(
  p_user_id uuid,
  p_activity_type text,
  p_activity_data jsonb,
  p_visibility text DEFAULT 'friends'
)
RETURNS uuid AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO activity_feed (user_id, activity_type, activity_data, visibility)
  VALUES (p_user_id, p_activity_type, p_activity_data, p_visibility)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friend activity feed
CREATE OR REPLACE FUNCTION get_friend_activity_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  activity_id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  activity_type text,
  activity_data jsonb,
  like_count integer,
  comment_count integer,
  user_has_liked boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    af.id,
    af.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    af.activity_type,
    af.activity_data,
    af.like_count,
    af.comment_count,
    EXISTS(SELECT 1 FROM activity_likes al WHERE al.activity_id = af.id AND al.user_id = p_user_id) as user_has_liked,
    af.created_at
  FROM activity_feed af
  JOIN profiles p ON p.id = af.user_id
  WHERE (
    -- User's own activities
    af.user_id = p_user_id
    OR
    -- Friends' activities
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = p_user_id AND f.friend_id = af.user_id)
         OR (f.friend_id = p_user_id AND f.user_id = af.user_id)
        AND f.status = 'accepted'
    )
  )
  AND (
    af.visibility = 'public'
    OR (af.visibility = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE ((f.user_id = p_user_id AND f.friend_id = af.user_id)
         OR (f.friend_id = p_user_id AND f.user_id = af.user_id))
        AND f.status = 'accepted'
    ))
    OR af.user_id = p_user_id
  )
  ORDER BY af.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard with friends
CREATE OR REPLACE FUNCTION get_friend_leaderboard(
  p_user_id uuid,
  p_timeframe text DEFAULT 'all_time'
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  level integer,
  score integer,
  rank bigint,
  is_current_user boolean
) AS $$
BEGIN
  IF p_timeframe = 'weekly' THEN
    RETURN QUERY
    SELECT 
      wl.user_id,
      wl.username,
      wl.display_name,
      wl.avatar_url,
      wl.level,
      wl.habits_this_week::integer as score,
      wl.rank,
      wl.user_id = p_user_id as is_current_user
    FROM weekly_leaderboard wl
    WHERE wl.user_id = p_user_id
       OR EXISTS (
         SELECT 1 FROM friendships f
         WHERE ((f.user_id = p_user_id AND f.friend_id = wl.user_id)
            OR (f.friend_id = p_user_id AND f.user_id = wl.user_id))
           AND f.status = 'accepted'
       )
    ORDER BY wl.rank;
  ELSE
    RETURN QUERY
    SELECT 
      gl.id as user_id,
      gl.username,
      gl.display_name,
      gl.avatar_url,
      gl.level,
      gl.xp as score,
      gl.rank_overall as rank,
      gl.id = p_user_id as is_current_user
    FROM global_leaderboard gl
    WHERE gl.id = p_user_id
       OR EXISTS (
         SELECT 1 FROM friendships f
         WHERE ((f.user_id = p_user_id AND f.friend_id = gl.id)
            OR (f.friend_id = p_user_id AND f.user_id = gl.id))
           AND f.status = 'accepted'
       )
    ORDER BY gl.rank_overall;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress()
RETURNS trigger AS $$
DECLARE
  challenge record;
BEGIN
  -- Update all active challenges for this user
  FOR challenge IN
    SELECT * FROM friend_challenges
    WHERE (creator_id = NEW.user_id OR challenger_id = NEW.user_id)
      AND status = 'active'
      AND end_date > now()
  LOOP
    IF challenge.challenge_type = 'habit_count' THEN
      IF challenge.creator_id = NEW.user_id THEN
        UPDATE friend_challenges
        SET creator_progress = creator_progress + 1
        WHERE id = challenge.id;
      ELSE
        UPDATE friend_challenges
        SET challenger_progress = challenger_progress + 1
        WHERE id = challenge.id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_habit_completion_update_challenges
  AFTER INSERT ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_progress();

-- Trigger to create activity feed entries
CREATE OR REPLACE FUNCTION auto_create_activity()
RETURNS trigger AS $$
BEGIN
  -- Achievement unlocked
  IF TG_TABLE_NAME = 'user_achievements' THEN
    INSERT INTO activity_feed (user_id, activity_type, activity_data)
    SELECT NEW.user_id, 'achievement_unlocked', 
           jsonb_build_object('achievement_id', NEW.achievement_id, 'achievement_name', a.name)
    FROM achievements a WHERE a.id = NEW.achievement_id;
  END IF;
  
  -- Goal completed
  IF TG_TABLE_NAME = 'goals' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO activity_feed (user_id, activity_type, activity_data)
    VALUES (NEW.user_id, 'goal_completed', jsonb_build_object('goal_id', NEW.id, 'goal_title', NEW.title));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_achievement_create_activity
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_activity();

CREATE TRIGGER after_goal_complete_create_activity
  AFTER UPDATE ON goals
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION auto_create_activity();

-- Scheduled job to refresh leaderboards (call this via cron)
CREATE OR REPLACE FUNCTION refresh_leaderboards()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY global_leaderboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE friend_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view challenges they're part of"
ON friend_challenges FOR SELECT
USING (creator_id = auth.uid() OR challenger_id = auth.uid());

CREATE POLICY "Users can create challenges"
ON friend_challenges FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own challenges"
ON friend_challenges FOR UPDATE
USING (creator_id = auth.uid() OR challenger_id = auth.uid());

CREATE POLICY "Users can view friends' activity"
ON activity_feed FOR SELECT
USING (
  user_id = auth.uid()
  OR visibility = 'public'
  OR (visibility = 'friends' AND EXISTS (
    SELECT 1 FROM friendships f
    WHERE ((f.user_id = auth.uid() AND f.friend_id = user_id)
       OR (f.friend_id = auth.uid() AND f.user_id = user_id))
      AND f.status = 'accepted'
  ))
);

CREATE POLICY "Users can create own activity"
ON activity_feed FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can like activities"
ON activity_likes FOR ALL
USING (true);

CREATE POLICY "Users can comment on visible activities"
ON activity_comments FOR ALL
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM activity_feed af
    WHERE af.id = activity_id
      AND (af.user_id = auth.uid() OR af.visibility != 'private')
  )
);

CREATE POLICY "Anyone can view public groups"
ON study_groups FOR SELECT
USING (is_private = false OR creator_id = auth.uid() OR EXISTS (
  SELECT 1 FROM group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()
));

CREATE POLICY "Users can create groups"
ON study_groups FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Group owners/admins can manage"
ON group_members FOR ALL
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role IN ('owner', 'admin')
  )
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_activity_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_leaderboards TO authenticated;

COMMENT ON TABLE friend_challenges IS 'Head-to-head challenges between friends';
COMMENT ON TABLE activity_feed IS 'Social activity feed for sharing achievements and progress';
COMMENT ON TABLE study_groups IS 'Groups for collaborative habit tracking and goals';
COMMENT ON FUNCTION get_friend_activity_feed IS 'Retrieves activity feed with proper privacy filtering';
COMMENT ON FUNCTION get_friend_leaderboard IS 'Gets leaderboard filtered to user and their friends';
