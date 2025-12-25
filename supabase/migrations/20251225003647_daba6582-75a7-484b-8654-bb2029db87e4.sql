-- Create a function to search for users by user_code (public search)
CREATE OR REPLACE FUNCTION public.search_user_by_code(search_code text)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  level integer,
  xp integer,
  user_code text,
  bio text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.level,
    p.xp,
    p.user_code,
    p.bio
  FROM profiles p
  WHERE p.user_code = UPPER(TRIM(search_code));
END;
$$;

-- Create a function to get user public profile by ID
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  level integer,
  xp integer,
  user_code text,
  bio text,
  total_habits_completed integer,
  longest_streak integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.level,
    p.xp,
    p.user_code,
    p.bio,
    p.total_habits_completed,
    p.longest_streak
  FROM profiles p
  WHERE p.id = profile_id;
END;
$$;