-- ============================================================================
-- CRITICAL FIX: Add missing columns to tasks table
-- This resolves the "Cannot add tasks to goals" bug
-- ============================================================================
-- Run this on your Supabase database immediately!

-- Add parent_task_id column for subtasks support
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Add due_date column for task deadlines
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id 
  ON public.tasks(parent_task_id) 
  WHERE parent_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
  ON public.tasks(due_date) 
  WHERE due_date IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN public.tasks.parent_task_id IS 'Reference to parent task for nested subtasks. NULL means top-level task.';
COMMENT ON COLUMN public.tasks.due_date IS 'Optional due date for the task';

-- Verify the columns were added
DO $$
DECLARE
  has_parent_task_id BOOLEAN;
  has_due_date BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'parent_task_id'
  ) INTO has_parent_task_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'due_date'
  ) INTO has_due_date;
  
  IF has_parent_task_id AND has_due_date THEN
    RAISE NOTICE '✅ SUCCESS: Both columns added successfully!';
  ELSE
    IF NOT has_parent_task_id THEN
      RAISE WARNING '❌ FAILED: parent_task_id column not found';
    END IF;
    IF NOT has_due_date THEN
      RAISE WARNING '❌ FAILED: due_date column not found';
    END IF;
  END IF;
END $$;

-- Display final table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;
