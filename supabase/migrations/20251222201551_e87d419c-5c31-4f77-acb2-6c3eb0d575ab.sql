-- Fix habit_completions_update_missing: Add UPDATE policy for habit_completions
-- Since habit completions are just date markers, we don't need UPDATE functionality
-- But we should explicitly add a restrictive policy to be consistent
CREATE POLICY "Users can update own completions" 
ON public.habit_completions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);