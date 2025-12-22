-- Add notifications_enabled column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'achievement', 'friend_request', 'message', 'habit_reminder'
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  related_id uuid, -- Optional: ID of related entity (achievement, friendship, message, etc.)
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to auto-create notification on friend request
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_username text;
BEGIN
  -- Get sender's username
  SELECT username INTO sender_username FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification for the friend receiving the request
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    NEW.friend_id,
    'friend_request',
    'New Friend Request',
    sender_username || ' wants to be your friend!',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for friend request notifications
CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request();

-- Create function to notify on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_username text;
BEGIN
  -- Get sender's username
  SELECT username INTO sender_username FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Create notification for the receiver
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    NEW.receiver_id,
    'message',
    'New Message',
    sender_username || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for message notifications
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();

-- Create function to notify on achievement earned
CREATE OR REPLACE FUNCTION public.notify_achievement_earned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_name text;
  achievement_desc text;
BEGIN
  -- Get achievement details
  SELECT name, description INTO achievement_name, achievement_desc 
  FROM public.achievements WHERE id = NEW.achievement_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    NEW.user_id,
    'achievement',
    'Achievement Unlocked!',
    achievement_name || ' - ' || achievement_desc,
    NEW.achievement_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for achievement notifications
CREATE TRIGGER on_achievement_earned
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_achievement_earned();