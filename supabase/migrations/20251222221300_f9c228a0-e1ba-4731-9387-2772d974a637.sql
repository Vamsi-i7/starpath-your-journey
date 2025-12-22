-- Add explicit UPDATE denial policy for messages table
-- This documents that message immutability is intentional
CREATE POLICY "Messages cannot be updated"
ON public.messages
FOR UPDATE
TO authenticated
USING (false);