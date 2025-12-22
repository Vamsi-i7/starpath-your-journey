-- Fix friendships update policy to prevent status manipulation
-- Only the friend_id (receiver) should be able to accept/reject pending requests
-- The requester (user_id) should NOT be able to change status to 'accepted'

-- First drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update friendships involving them" ON public.friendships;

-- Create a more restrictive policy: only the receiver can accept/reject pending requests
CREATE POLICY "Friend can accept or reject pending requests" 
ON public.friendships 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = friend_id 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = friend_id 
  AND status IN ('accepted', 'rejected')
);