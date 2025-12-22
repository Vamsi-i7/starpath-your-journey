import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ChatFriend {
  id: string;
  username: string;
  avatar_url: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export const useChat = (selectedFriendId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch friends list for chat sidebar
  const { data: chatFriends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['chat-friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get accepted friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      const friends: ChatFriend[] = [];
      
      for (const friendship of friendships || []) {
        const friendId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
        
        // Get friend profile
        const { data: profileData } = await supabase
          .rpc('get_friend_profile', { friend_id: friendId });

        if (profileData && profileData.length > 0) {
          const profile = profileData[0];
          
          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          friends.push({
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            lastMessage: lastMsg?.content,
            lastMessageTime: lastMsg?.created_at
          });
        }
      }

      // Sort by last message time
      return friends.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
    },
    enabled: !!user?.id
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', user?.id, selectedFriendId],
    queryFn: async () => {
      if (!user?.id || !selectedFriendId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedFriendId}),and(sender_id.eq.${selectedFriendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user?.id && !!selectedFriendId
  });

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('New message received:', newMessage);

          // Check if message is relevant to current user
          if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
            // Invalidate messages for the specific conversation
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            // Invalidate chat friends to update last message
            queryClient.invalidateQueries({ queryKey: ['chat-friends'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat-friends'] });
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  return {
    chatFriends,
    messages,
    isLoading: friendsLoading || messagesLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending
  };
};
