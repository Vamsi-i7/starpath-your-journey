-- Habit Categories and Difficulty System
-- Migration: 20260110000002_habit_categories_difficulty.sql

-- Create habit categories table
CREATE TABLE IF NOT EXISTS habit_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#8b5cf6',
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_system boolean DEFAULT false, -- System categories vs user-created
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Create tags table for flexible categorization
CREATE TABLE IF NOT EXISTS habit_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#8b5cf6',
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Junction table for habit-tag relationships (many-to-many)
CREATE TABLE IF NOT EXISTS habit_tag_assignments (
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES habit_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (habit_id, tag_id)
);

-- Add fields to habits table
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES habit_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS difficulty integer DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS template_name text,
ADD COLUMN IF NOT EXISTS template_description text,
ADD COLUMN IF NOT EXISTS reminder_times jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false;

-- Update XP rewards based on difficulty
CREATE OR REPLACE FUNCTION calculate_xp_reward(base_xp integer, difficulty_level integer)
RETURNS integer AS $$
BEGIN
  RETURN CASE difficulty_level
    WHEN 1 THEN base_xp          -- Easy: 1x
    WHEN 2 THEN base_xp * 1.2    -- Medium: 1.2x
    WHEN 3 THEN base_xp * 1.5    -- Hard: 1.5x
    WHEN 4 THEN base_xp * 2      -- Very Hard: 2x
    WHEN 5 THEN base_xp * 3      -- Extreme: 3x
    ELSE base_xp
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category_id);
CREATE INDEX IF NOT EXISTS idx_habits_difficulty ON habits(difficulty);
CREATE INDEX IF NOT EXISTS idx_habits_is_template ON habits(is_template);
CREATE INDEX IF NOT EXISTS idx_habit_categories_user ON habit_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_tags_user ON habit_tags(user_id);

-- Insert system default categories
INSERT INTO habit_categories (name, description, icon, color, is_system) VALUES
  ('Health & Fitness', 'Physical health, exercise, nutrition', '💪', '#10b981', true),
  ('Study & Learning', 'Academic work, skill development', '📚', '#3b82f6', true),
  ('Work & Career', 'Professional development, work tasks', '💼', '#f59e0b', true),
  ('Personal Development', 'Self-improvement, mindfulness', '🧘', '#8b5cf6', true),
  ('Social & Family', 'Relationships, social activities', '👥', '#ec4899', true),
  ('Hobbies & Fun', 'Creative pursuits, entertainment', '🎨', '#14b8a6', true),
  ('Finance', 'Money management, savings', '💰', '#22c55e', true),
  ('Home & Chores', 'Household tasks, organization', '🏠', '#94a3b8', true)
ON CONFLICT DO NOTHING;

-- View for habit categories with usage count
CREATE OR REPLACE VIEW habit_categories_with_count AS
SELECT 
  hc.*,
  COUNT(h.id) as habit_count
FROM habit_categories hc
LEFT JOIN habits h ON h.category_id = hc.id
GROUP BY hc.id;

-- Function to get habit templates
CREATE OR REPLACE FUNCTION get_habit_templates(category_filter uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category_id uuid,
  category_name text,
  difficulty integer,
  xp_reward integer,
  icon text,
  color text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.name,
    h.template_description as description,
    h.category_id,
    hc.name as category_name,
    h.difficulty,
    h.xp_reward,
    h.icon,
    h.color
  FROM habits h
  LEFT JOIN habit_categories hc ON h.category_id = hc.id
  WHERE h.is_template = true
    AND (category_filter IS NULL OR h.category_id = category_filter)
  ORDER BY h.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert habit templates
INSERT INTO habits (
  user_id, 
  name, 
  description,
  template_name,
  template_description,
  category_id, 
  difficulty, 
  xp_reward, 
  icon, 
  color,
  is_template,
  frequency
) 
SELECT 
  NULL, -- Templates are not user-specific
  t.name,
  t.description,
  t.name,
  t.description,
  (SELECT id FROM habit_categories WHERE name = t.category AND is_system = true LIMIT 1),
  t.difficulty,
  t.xp_reward,
  t.icon,
  t.color,
  true,
  'daily'
FROM (VALUES
  -- Health & Fitness Templates
  ('Morning Exercise', '30 minutes of exercise', 'Health & Fitness', 3, 75, '🏃', '#10b981'),
  ('Drink Water', '8 glasses of water daily', 'Health & Fitness', 1, 50, '💧', '#3b82f6'),
  ('Healthy Meal', 'Prepare and eat a nutritious meal', 'Health & Fitness', 2, 60, '🥗', '#22c55e'),
  ('Meditation', '10 minutes of mindfulness', 'Health & Fitness', 2, 60, '🧘', '#8b5cf6'),
  ('Sleep Early', 'In bed by 10 PM', 'Health & Fitness', 2, 60, '😴', '#6366f1'),
  
  -- Study & Learning Templates
  ('Study Session', '2 hours focused study', 'Study & Learning', 3, 75, '📖', '#3b82f6'),
  ('Read Book', 'Read for 30 minutes', 'Study & Learning', 1, 50, '📚', '#8b5cf6'),
  ('Practice Coding', 'Code for 1 hour', 'Study & Learning', 3, 75, '💻', '#10b981'),
  ('Language Learning', '30 min language practice', 'Study & Learning', 2, 60, '🌍', '#f59e0b'),
  ('Online Course', 'Complete one lecture', 'Study & Learning', 2, 60, '🎓', '#3b82f6'),
  
  -- Work & Career Templates
  ('Deep Work Session', '2 hours uninterrupted work', 'Work & Career', 3, 75, '⚡', '#f59e0b'),
  ('Email Inbox Zero', 'Process all emails', 'Work & Career', 2, 60, '📧', '#3b82f6'),
  ('Professional Development', 'Learn new work skill', 'Work & Career', 3, 75, '📈', '#10b981'),
  ('Network', 'Connect with one professional', 'Work & Career', 2, 60, '🤝', '#8b5cf6'),
  
  -- Personal Development Templates
  ('Journaling', 'Write morning pages', 'Personal Development', 1, 50, '📝', '#8b5cf6'),
  ('Gratitude Practice', 'List 3 things grateful for', 'Personal Development', 1, 50, '🙏', '#ec4899'),
  ('Goal Review', 'Review weekly goals', 'Personal Development', 2, 60, '🎯', '#f59e0b'),
  ('Self-reflection', '15 minutes reflection', 'Personal Development', 2, 60, '💭', '#8b5cf6'),
  
  -- Social & Family Templates
  ('Call Family', 'Connect with family member', 'Social & Family', 1, 50, '📱', '#ec4899'),
  ('Quality Time', 'Spend time with loved ones', 'Social & Family', 2, 60, '❤️', '#ef4444'),
  ('Social Activity', 'Meet with friends', 'Social & Family', 2, 60, '🎉', '#14b8a6'),
  
  -- Hobbies & Fun Templates
  ('Creative Work', 'Work on creative project', 'Hobbies & Fun', 2, 60, '🎨', '#ec4899'),
  ('Music Practice', 'Practice instrument', 'Hobbies & Fun', 3, 75, '🎵', '#8b5cf6'),
  ('Gaming', 'Enjoy favorite game', 'Hobbies & Fun', 1, 50, '🎮', '#3b82f6'),
  
  -- Finance Templates
  ('Budget Review', 'Review expenses', 'Finance', 2, 60, '💰', '#22c55e'),
  ('Save Money', 'Add to savings', 'Finance', 2, 60, '🏦', '#10b981'),
  
  -- Home & Chores Templates
  ('Clean Room', 'Tidy up living space', 'Home & Chores', 2, 60, '🧹', '#94a3b8'),
  ('Laundry', 'Do the laundry', 'Home & Chores', 1, 50, '👕', '#64748b'),
  ('Organize', 'Declutter one area', 'Home & Chores', 2, 60, '📦', '#94a3b8')
) AS t(name, description, category, difficulty, xp_reward, icon, color)
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE habit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all categories"
ON habit_categories FOR SELECT
USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "Users can create own categories"
ON habit_categories FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can update own categories"
ON habit_categories FOR UPDATE
USING (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own categories"
ON habit_categories FOR DELETE
USING (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can view own tags"
ON habit_tags FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own tags"
ON habit_tags FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own tag assignments"
ON habit_tag_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM habits h
    WHERE h.id = habit_id AND h.user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_habit_templates TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_xp_reward TO authenticated;

COMMENT ON TABLE habit_categories IS 'Categories for organizing habits (Health, Study, Work, etc.)';
COMMENT ON TABLE habit_tags IS 'Flexible tags for habits (many-to-many relationship)';
COMMENT ON COLUMN habits.difficulty IS 'Difficulty level 1-5 (Easy to Extreme) affecting XP rewards';
COMMENT ON COLUMN habits.is_template IS 'Whether this habit is a reusable template';
