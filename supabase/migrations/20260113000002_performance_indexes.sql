-- ============================================================================
-- PERFORMANCE OPTIMIZATION - DATABASE INDEXES
-- Created: 2026-01-13
-- Purpose: Add missing indexes to improve query performance
-- ============================================================================

-- 1. Habits table indexes
CREATE INDEX IF NOT EXISTS idx_habits_user_active 
  ON public.habits(user_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_habits_user_created 
  ON public.habits(user_id, created_at DESC);

-- 2. Habit completions - Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_completed 
  ON public.habit_completions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_completed 
  ON public.habit_completions(habit_id, completed_at DESC);

-- 3. Session history - Critical for analytics performance
CREATE INDEX IF NOT EXISTS idx_session_history_user_started 
  ON public.session_history(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_history_user_ended 
  ON public.session_history(user_id, ended_at DESC);

-- 4. Tasks - Optimize goal progress calculations
CREATE INDEX IF NOT EXISTS idx_tasks_goal_user 
  ON public.tasks(goal_id, user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_completed 
  ON public.tasks(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_tasks_parent 
  ON public.tasks(parent_task_id) 
  WHERE parent_task_id IS NOT NULL;

-- 5. Goals - Optimize filtering and sorting
CREATE INDEX IF NOT EXISTS idx_goals_user_status_deadline 
  ON public.goals(user_id, status, deadline DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_goals_user_completed 
  ON public.goals(user_id, completed_at DESC) 
  WHERE completed_at IS NOT NULL;

-- 6. Activity feed - Social features performance
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_created 
  ON public.activity_feed(user_id, created_at DESC);

-- 7. Library items - AI tools performance
-- Handle the case where library_items table doesn't exist yet
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'library_items') THEN
    CREATE INDEX IF NOT EXISTS idx_library_items_user_created 
      ON public.library_items(user_id, created_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_library_items_user_type 
      ON public.library_items(user_id, content_type);
  END IF;
END $$;

-- 8. Credits usage - Track AI tool usage efficiently
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credits_usage') THEN
    CREATE INDEX IF NOT EXISTS idx_credits_usage_user_created 
      ON public.credits_usage(user_id, created_at DESC);
  END IF;
END $$;

-- 9. User achievements - Gamification queries
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unlocked 
      ON public.user_achievements(user_id, unlocked_at DESC);
  END IF;
END $$;

-- 10. Notifications - Real-time features
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
      AND t.table_name = 'notifications'
      AND c.column_name = 'is_read'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
      ON public.notifications(user_id, created_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
      ON public.notifications(user_id, is_read) 
      WHERE is_read = false;
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'notifications'
  ) THEN
    -- Create index without is_read filter if column doesn't exist
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
      ON public.notifications(user_id, created_at DESC);
  END IF;
END $$;

-- Analyze tables to update statistics for query planner
ANALYZE public.habits;
ANALYZE public.habit_completions;
ANALYZE public.session_history;
ANALYZE public.tasks;
ANALYZE public.goals;
ANALYZE public.activity_feed;
