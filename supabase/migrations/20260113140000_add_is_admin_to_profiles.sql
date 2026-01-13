-- Add is_admin column to profiles table for admin access control
-- This migration must run before the admin credit management system

-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'profiles' 
      AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
    
    -- Add comment
    COMMENT ON COLUMN public.profiles.is_admin IS 'Flag indicating if user has admin privileges for credit management and other admin functions';
    
    -- Create index for admin queries (partial index for efficiency)
    CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;
    
    -- Log the change
    RAISE NOTICE 'Added is_admin column to profiles table';
  ELSE
    RAISE NOTICE 'is_admin column already exists in profiles table';
  END IF;
END $$;
