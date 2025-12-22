-- Create a secure function to get friend profile without exposing email
CREATE OR REPLACE FUNCTION public.get_friend_profile(friend_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  bio text,
  level integer,
  xp integer,
  hearts integer,
  max_hearts integer,
  total_habits_completed integer,
  longest_streak integer,
  user_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is friends with the target user
  IF NOT is_friend_with(friend_id) THEN
    RAISE EXCEPTION 'Not authorized to view this profile';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id, 
    p.username, 
    p.avatar_url, 
    p.bio, 
    p.level, 
    p.xp, 
    p.hearts, 
    p.max_hearts, 
    p.total_habits_completed, 
    p.longest_streak, 
    p.user_code
  FROM profiles p
  WHERE p.id = get_friend_profile.friend_id;
END;
$$;

-- Drop the existing "Friends can view friend profiles" policy that exposes all columns
DROP POLICY IF EXISTS "Friends can view friend profiles" ON public.profiles;