-- Add missing columns to goals table for proper functionality

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='goals' AND column_name='status') THEN
    ALTER TABLE public.goals ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));
  END IF;
END $$;

-- Add category column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='goals' AND column_name='category') THEN
    ALTER TABLE public.goals ADD COLUMN category TEXT;
  END IF;
END $$;

-- Add priority column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='goals' AND column_name='priority') THEN
    ALTER TABLE public.goals ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Add goal_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='goals' AND column_name='goal_type') THEN
    ALTER TABLE public.goals ADD COLUMN goal_type TEXT DEFAULT 'short_term' CHECK (goal_type IN ('short_term', 'long_term'));
  END IF;
END $$;

-- Add missing columns to tasks table
-- Add position column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='position') THEN
    ALTER TABLE public.tasks ADD COLUMN position INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='updated_at') THEN
    ALTER TABLE public.tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add parent_task_id column if it doesn't exist (for subtasks)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='parent_task_id') THEN
    ALTER TABLE public.tasks ADD COLUMN parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON public.goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(goal_id, position);

-- Update existing goals to have proper status based on progress
UPDATE public.goals 
SET status = 'completed' 
WHERE progress = 100 AND status = 'active';

-- Add comments for documentation
COMMENT ON COLUMN public.goals.status IS 'Goal status: active, completed, or archived';
COMMENT ON COLUMN public.goals.category IS 'Optional category for organizing goals';
COMMENT ON COLUMN public.goals.priority IS 'Goal priority level: low, medium, or high';
COMMENT ON COLUMN public.goals.goal_type IS 'Goal duration type: short_term or long_term';
COMMENT ON COLUMN public.tasks.position IS 'Task position/order within the goal';
COMMENT ON COLUMN public.tasks.parent_task_id IS 'Parent task ID for nested subtasks';
