import { useState, useEffect, useCallback, useRef } from 'react';
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

interface TypingUser {
  oderId: string;
  odername: string;
  typing_to: string;
}

export const useChat = (selectedFriendId: string | null) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isTyping, setIsTyping] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  // Presence channel for typing indicators
  useEffect(() => {
    if (!user?.id || !selectedFriendId || !profile?.username) return;

    // Create a unique channel for this conversation
    const channelName = `typing:${[user.id, selectedFriendId].sort().join('-')}`;
    
    const channel = supabase.channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence sync:', state);
        
        // Check if friend is typing
        let friendTyping = false;
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            if (presence.user_id === selectedFriendId && presence.typing_to === user?.id) {
              friendTyping = true;
            }
          });
        });
        setFriendIsTyping(friendTyping);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Presence join:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Presence leave:', key, leftPresences);
        // Check if the leaving user was the friend who was typing
        leftPresences.forEach((presence: any) => {
          if (presence.user_id === selectedFriendId) {
            setFriendIsTyping(false);
          }
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Presence channel subscribed');
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      presenceChannelRef.current = null;
    };
  }, [user?.id, selectedFriendId, profile?.username]);

  // Function to broadcast typing status
  const setTyping = useCallback((typing: boolean) => {
    if (!presenceChannelRef.current || !user?.id || !selectedFriendId || !profile?.username) return;

    if (typing) {
      presenceChannelRef.current.track({
        user_id: user.id,
        username: profile.username,
        typing_to: selectedFriendId,
        online_at: new Date().toISOString()
      });
    } else {
      presenceChannelRef.current.untrack();
    }
    
    setIsTyping(typing);
  }, [user?.id, selectedFriendId, profile?.username]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [isTyping, setTyping]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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
      // Stop typing indicator when message is sent
      setTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
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
    isSending: sendMessageMutation.isPending,
    friendIsTyping,
    handleTyping
  };
};
