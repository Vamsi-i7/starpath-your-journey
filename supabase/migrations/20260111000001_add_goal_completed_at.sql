-- Add completed_at timestamp to goals table for better analytics tracking
ALTER TABLE public.goals 
ADD COLUMN completed_at TIMESTAMPTZ;

-- Create index for faster queries on completed goals
CREATE INDEX idx_goals_completed_at ON public.goals(completed_at) WHERE completed_at IS NOT NULL;

-- Create a function to automatically set completed_at when progress reaches 100
CREATE OR REPLACE FUNCTION update_goal_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If progress reaches 100% and completed_at is not set, set it
  IF NEW.progress = 100 AND OLD.progress < 100 AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- If progress drops below 100%, clear completed_at
  IF NEW.progress < 100 AND NEW.completed_at IS NOT NULL THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically manage completed_at
CREATE TRIGGER set_goal_completed_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_completed_at();

-- Backfill completed_at for existing completed goals (progress = 100)
UPDATE public.goals
SET completed_at = updated_at
WHERE progress = 100 AND completed_at IS NULL;

COMMENT ON COLUMN public.goals.completed_at IS 'Timestamp when the goal reached 100% completion';
