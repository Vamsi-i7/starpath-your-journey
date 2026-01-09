-- AI Library System
-- Store and manage AI-generated content

-- Create ai_library table
CREATE TABLE IF NOT EXISTS public.ai_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('notes', 'flashcards', 'roadmap', 'mentor')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  raw_content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete_at TIMESTAMP WITH TIME ZONE,
  is_pinned BOOLEAN DEFAULT FALSE,
  CONSTRAINT ai_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ai_library_user_id_idx ON public.ai_library(user_id);
CREATE INDEX IF NOT EXISTS ai_library_tool_type_idx ON public.ai_library(tool_type);
CREATE INDEX IF NOT EXISTS ai_library_created_at_idx ON public.ai_library(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_library_delete_at_idx ON public.ai_library(delete_at) WHERE delete_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_library_tags_idx ON public.ai_library USING GIN(tags);

-- Enable RLS
ALTER TABLE public.ai_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own library items"
  ON public.ai_library
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own library items"
  ON public.ai_library
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library items"
  ON public.ai_library
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own library items"
  ON public.ai_library
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-delete expired items
CREATE OR REPLACE FUNCTION public.delete_expired_library_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ai_library
  WHERE delete_at IS NOT NULL
    AND delete_at < NOW();
END;
$$;

-- Function to set delete_at timestamp based on user tier
CREATE OR REPLACE FUNCTION public.set_library_delete_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_tier TEXT;
  days_to_keep INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Set days based on tier
  IF user_tier = 'premium' OR user_tier = 'lifetime' THEN
    days_to_keep := 90; -- Premium: 90 days
  ELSE
    days_to_keep := 7; -- Free: 7 days
  END IF;
  
  -- Set delete_at if not pinned
  IF NOT COALESCE(NEW.is_pinned, FALSE) THEN
    NEW.delete_at := NOW() + (days_to_keep || ' days')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to set delete_at on insert
CREATE TRIGGER set_library_delete_at_trigger
  BEFORE INSERT ON public.ai_library
  FOR EACH ROW
  EXECUTE FUNCTION public.set_library_delete_at();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_library_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Trigger to update timestamp
CREATE TRIGGER update_library_timestamp_trigger
  BEFORE UPDATE ON public.ai_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_library_timestamp();

-- Grant permissions
GRANT ALL ON public.ai_library TO authenticated;
GRANT ALL ON public.ai_library TO service_role;
