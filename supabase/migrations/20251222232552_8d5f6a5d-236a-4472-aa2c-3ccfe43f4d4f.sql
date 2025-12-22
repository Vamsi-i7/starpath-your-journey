-- Enable REPLICA IDENTITY FULL for realtime updates
ALTER TABLE public.friendships REPLICA IDENTITY FULL;

-- Add friendships table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;