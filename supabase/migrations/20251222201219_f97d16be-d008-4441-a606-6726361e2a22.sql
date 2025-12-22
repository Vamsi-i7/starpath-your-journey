-- Fix the friend profile policy - the previous approach with email IS NULL was incorrect
-- It filtered out rows instead of hiding the email column
-- The correct approach is to allow friends to read but handle column restrictions in application code
DROP POLICY IF EXISTS "Friends can view non-email profile data" ON public.profiles;

-- Create a proper permissive policy for friends that works alongside own profile policy
-- Application code must be updated to not select email for friend profiles
CREATE POLICY "Friends can view friend profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.is_friend_with(id));