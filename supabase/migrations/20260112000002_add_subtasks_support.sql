-- Add parent_task_id column to tasks table for nested subtasks support
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Create index for faster queries on subtasks
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- Add position column if it doesn't exist for ordering tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(goal_id, position);

-- Add updated_at column if it doesn't exist
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to update updated_at on tasks
CREATE OR REPLACE FUNCTION public.update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_task_updated_at();

-- Comment on the new column
COMMENT ON COLUMN public.tasks.parent_task_id IS 'Reference to parent task for nested subtasks. NULL means top-level task.';
