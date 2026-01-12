-- ============================================================================
-- Ensure tasks table has all required columns for Goals & Planner feature
-- This migration safely adds columns if they don't exist
-- ============================================================================

-- Add due_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'tasks' 
                 AND column_name = 'due_date') THEN
    ALTER TABLE public.tasks ADD COLUMN due_date DATE;
    RAISE NOTICE 'Added due_date column to tasks table';
  END IF;
END $$;

-- Add parent_task_id column if it doesn't exist (for subtasks support)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'tasks' 
                 AND column_name = 'parent_task_id') THEN
    ALTER TABLE public.tasks ADD COLUMN parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added parent_task_id column to tasks table';
  END IF;
END $$;

-- Add position column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'tasks' 
                 AND column_name = 'position') THEN
    ALTER TABLE public.tasks ADD COLUMN position INTEGER DEFAULT 0;
    RAISE NOTICE 'Added position column to tasks table';
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'tasks' 
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to tasks table';
  END IF;
END $$;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON public.tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_goal_position ON public.tasks(goal_id, position);

-- Ensure RLS is enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Ensure all necessary RLS policies exist
DO $$
BEGIN
  -- Drop and recreate policies to ensure they're correct
  DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
  DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
  DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
  DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
  DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
  
  -- Create comprehensive policies
  CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT TO authenticated 
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can create own tasks" ON public.tasks
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);
    
  RAISE NOTICE 'RLS policies for tasks table have been updated';
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_tasks_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.tasks IS 'Tasks associated with goals, supports nested subtasks';
COMMENT ON COLUMN public.tasks.due_date IS 'Optional due date for the task';
COMMENT ON COLUMN public.tasks.parent_task_id IS 'Reference to parent task for nested subtasks. NULL means top-level task.';
COMMENT ON COLUMN public.tasks.position IS 'Task position/order within the goal';
COMMENT ON COLUMN public.tasks.updated_at IS 'Timestamp of last update';

-- Verify the table structure
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'tasks';
  
  RAISE NOTICE 'Tasks table now has % columns', col_count;
END $$;
