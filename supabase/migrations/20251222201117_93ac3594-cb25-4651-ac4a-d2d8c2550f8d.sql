-- Drop the security definer view as it's flagged by the linter
DROP VIEW IF EXISTS public.friend_profiles;

-- The is_friend_with function is fine to keep as SECURITY DEFINER since it's a function, not a view
-- The profiles table now correctly doesn't have the friend profiles policy
-- Users should query friend profiles through application code that excludes email