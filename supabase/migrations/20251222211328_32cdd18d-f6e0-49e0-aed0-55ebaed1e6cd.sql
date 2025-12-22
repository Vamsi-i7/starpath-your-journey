-- Update default value for hearts to 0 for new users
ALTER TABLE public.profiles 
ALTER COLUMN hearts SET DEFAULT 0;

-- Also ensure the handle_new_user function explicitly sets all gamification values to 0
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_username text;
  username_exists boolean;
  new_user_code text;
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
  
  -- Generate unique user code
  new_user_code := public.generate_user_code();
  
  -- Insert with all gamification values starting at 0
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    user_code, 
    hearts, 
    xp, 
    level, 
    longest_streak, 
    total_habits_completed
  )
  VALUES (
    NEW.id, 
    new_username, 
    NEW.email, 
    new_user_code, 
    0,  -- hearts start at 0
    0,  -- xp starts at 0
    1,  -- level starts at 1
    0,  -- longest_streak starts at 0
    0   -- total_habits_completed starts at 0
  );
  
  RETURN NEW;
END;
$$;