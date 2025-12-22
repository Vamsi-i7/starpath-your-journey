-- Fix: Drop the friend_profiles view that has no RLS and caused security definer warning
-- This was created inadvertently and has no RLS protection
DROP VIEW IF EXISTS public.friend_profiles CASCADE;

-- Fix profiles_email_exposure: Recreate a proper RLS policy for friends that still allows access
-- but application code should select only non-sensitive columns
-- The current "Users can view own profile" policy is RESTRICTIVE, 
-- so we need a PERMISSIVE policy for friend access to work alongside it
DROP POLICY IF EXISTS "Users can view friend profiles" ON public.profiles;

-- Create friend profile viewing with proper RLS (application must select non-email columns)
CREATE POLICY "Friends can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id 
  OR public.is_friend_with(id)
);

-- Make it permissive so it works with existing policies
-- Actually the policy above replaces need for separate own profile policy for SELECT
-- Let's ensure both own and friend access work
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Add restrictive policy for friends (separate from own)
DROP POLICY IF EXISTS "Friends can view profiles" ON public.profiles;

CREATE POLICY "Friends can view non-email profile data" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  public.is_friend_with(id) AND email IS NULL
);