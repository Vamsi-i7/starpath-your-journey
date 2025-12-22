-- Fix profiles_email_exposure: Create a view that excludes email for friend visibility
-- First, drop the existing "Users can view friend profiles" policy
DROP POLICY IF EXISTS "Users can view friend profiles" ON public.profiles;

-- Create a security definer function to check friendship
CREATE OR REPLACE FUNCTION public.is_friend_with(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = _profile_id AND friendships.status = 'accepted')
      OR
      (friendships.friend_id = auth.uid() AND friendships.user_id = _profile_id AND friendships.status = 'accepted')
    )
  )
$$;

-- Create a view for friend-safe profile data (excludes email)
CREATE OR REPLACE VIEW public.friend_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  level,
  xp,
  hearts,
  max_hearts,
  total_habits_completed,
  longest_streak,
  created_at,
  updated_at
FROM public.profiles
WHERE public.is_friend_with(id);

-- Fix messages_no_friendship: Restrict message sending to friends only
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages to friends only" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = sender_id AND friendships.friend_id = receiver_id AND friendships.status = 'accepted')
      OR
      (friendships.friend_id = sender_id AND friendships.user_id = receiver_id AND friendships.status = 'accepted')
    )
  )
);