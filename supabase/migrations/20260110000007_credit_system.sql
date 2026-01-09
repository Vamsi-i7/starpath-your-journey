-- Credit System for AI Tools
-- Tracks user credits for AI generation and premium features

-- Add credits column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credits_purchased INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create credit transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'subscription_grant')),
  description TEXT,
  tool_type TEXT CHECK (tool_type IN ('notes', 'flashcards', 'roadmap', 'mentor', NULL)),
  cost_per_use INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_created_at_idx ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS credit_transactions_type_idx ON public.credit_transactions(transaction_type);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit transactions"
  ON public.credit_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_tool_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT ai_credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if user has enough credits
  IF current_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.profiles
  SET 
    ai_credits = ai_credits - p_amount,
    credits_used_this_month = credits_used_this_month + p_amount
  WHERE id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    tool_type,
    cost_per_use
  ) VALUES (
    p_user_id,
    -p_amount,
    'usage',
    p_description,
    p_tool_type,
    p_amount
  );
  
  RETURN TRUE;
END;
$$;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add credits
  UPDATE public.profiles
  SET 
    ai_credits = ai_credits + p_amount,
    total_credits_purchased = CASE 
      WHEN p_transaction_type = 'purchase' THEN total_credits_purchased + p_amount
      ELSE total_credits_purchased
    END
  WHERE id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description
  ) VALUES (
    p_user_id,
    p_amount,
    p_transaction_type,
    p_description
  );
  
  RETURN TRUE;
END;
$$;

-- Function to grant monthly credits based on subscription
CREATE OR REPLACE FUNCTION public.grant_subscription_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  credits_to_grant INTEGER;
BEGIN
  FOR user_record IN 
    SELECT id, subscription_tier, last_credit_reset
    FROM public.profiles
    WHERE subscription_tier IS NOT NULL
      AND (last_credit_reset IS NULL OR last_credit_reset < NOW() - INTERVAL '1 month')
  LOOP
    -- Determine credits based on tier
    CASE user_record.subscription_tier
      WHEN 'basic' THEN credits_to_grant := 50;
      WHEN 'premium' THEN credits_to_grant := 500;
      WHEN 'lifetime' THEN credits_to_grant := 1000;
      ELSE credits_to_grant := 0;
    END CASE;
    
    IF credits_to_grant > 0 THEN
      -- Add credits
      PERFORM public.add_credits(
        user_record.id,
        credits_to_grant,
        'subscription_grant',
        'Monthly subscription credits'
      );
      
      -- Reset usage counter
      UPDATE public.profiles
      SET 
        last_credit_reset = NOW(),
        credits_used_this_month = 0
      WHERE id = user_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Create credit packages table for purchase options
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default credit packages
INSERT INTO public.credit_packages (name, credits, price_usd, bonus_credits, sort_order) VALUES
  ('Starter Pack', 50, 4.99, 0, 1),
  ('Popular Pack', 150, 12.99, 10, 2),
  ('Power Pack', 350, 24.99, 50, 3),
  ('Ultimate Pack', 1000, 59.99, 200, 4)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "Anyone can view active credit packages"
  ON public.credit_packages
  FOR SELECT
  USING (is_active = TRUE);

-- Create credit costs table
CREATE TABLE IF NOT EXISTS public.ai_tool_costs (
  tool_type TEXT PRIMARY KEY CHECK (tool_type IN ('notes', 'flashcards', 'roadmap', 'mentor')),
  credits_per_use INTEGER NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default costs
INSERT INTO public.ai_tool_costs (tool_type, credits_per_use, description) VALUES
  ('notes', 5, 'Generate comprehensive notes'),
  ('flashcards', 10, 'Generate interactive flashcards'),
  ('roadmap', 15, 'Generate learning roadmap'),
  ('mentor', 3, 'AI Mentor conversation message')
ON CONFLICT (tool_type) DO NOTHING;

-- Enable RLS
ALTER TABLE public.ai_tool_costs ENABLE ROW LEVEL SECURITY;

-- Anyone can view costs
CREATE POLICY "Anyone can view AI tool costs"
  ON public.ai_tool_costs
  FOR SELECT
  USING (TRUE);

-- Grant permissions
GRANT ALL ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_packages TO authenticated;
GRANT ALL ON public.ai_tool_costs TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits TO authenticated;
