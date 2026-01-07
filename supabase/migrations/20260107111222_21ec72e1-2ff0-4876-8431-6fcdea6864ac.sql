-- Create session_history table
CREATE TABLE public.session_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  session_type TEXT NOT NULL DEFAULT 'focus', -- 'focus', 'pomodoro_work', 'pomodoro_break'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own session history"
ON public.session_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session history"
ON public.session_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session history"
ON public.session_history FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_session_history_user_id ON public.session_history(user_id);
CREATE INDEX idx_session_history_ended_at ON public.session_history(ended_at DESC);