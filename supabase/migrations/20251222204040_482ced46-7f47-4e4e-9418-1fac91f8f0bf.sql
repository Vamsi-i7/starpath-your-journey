-- Add unique user_id field to profiles table for login via User ID
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_code TEXT UNIQUE;

-- Create function to generate unique user code
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code
    new_code := 'SP' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Update handle_new_user function to include user_code generation and set hearts to 0
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
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
  
  -- Insert with hearts starting at 0
  INSERT INTO public.profiles (id, username, email, user_code, hearts)
  VALUES (NEW.id, new_username, NEW.email, new_user_code, 0);
  
  RETURN NEW;
END;
$$;

-- Update existing profiles without user_code
UPDATE public.profiles 
SET user_code = 'SP' || upper(substr(replace(id::text, '-', ''), 1, 6))
WHERE user_code IS NULL;