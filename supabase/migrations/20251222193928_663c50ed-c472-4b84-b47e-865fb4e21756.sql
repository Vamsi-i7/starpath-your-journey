-- Fix the handle_new_user function to generate truly unique usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_username text;
  username_exists boolean;
BEGIN
  -- Get username from metadata or generate a unique one
  new_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    'StarExplorer' || substr(replace(NEW.id::text, '-', ''), 1, 12)
  );
  
  -- Check if username already exists and make it unique if needed
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = new_username) INTO username_exists;
  
  IF username_exists THEN
    new_username := new_username || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  END IF;
  
  INSERT INTO public.profiles (id, username, email)
  VALUES (NEW.id, new_username, NEW.email);
  
  RETURN NEW;
END;
$function$;

-- Also fix the profiles SELECT policy to only allow users to see their own profile (security fix)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a separate policy for viewing friend profiles only
CREATE POLICY "Users can view friend profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.id AND friendships.status = 'accepted')
    OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.id AND friendships.status = 'accepted')
  )
);