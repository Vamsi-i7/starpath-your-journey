import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FriendProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  user_code: string | null;
  bio: string | null;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string | null;
  created_at: string;
  friend_profile?: FriendProfile;
  requester_profile?: FriendProfile;
}

export const useFriends = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchResult, setSearchResult] = useState<FriendProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Subscribe to realtime changes on friendships table
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('friendships-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        (payload) => {
          console.log('Friendships realtime update:', payload);
          
          // Check if this change involves the current user
          const newRecord = payload.new as Friendship | null;
          const oldRecord = payload.old as Friendship | null;
          
          const isRelevant = 
            (newRecord?.user_id === user.id || newRecord?.friend_id === user.id) ||
            (oldRecord?.user_id === user.id || oldRecord?.friend_id === user.id);
          
          if (isRelevant) {
            // Invalidate all friend-related queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
            queryClient.invalidateQueries({ queryKey: ['sent-requests'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Fetch accepted friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get friendships where current user is involved and status is accepted
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // Fetch friend profiles
      const friendsWithProfiles: Friendship[] = [];
      for (const friendship of friendships || []) {
        const friendId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
        
        const { data: profileData } = await supabase
          .rpc('get_friend_profile', { friend_id: friendId });

        if (profileData && profileData.length > 0) {
          friendsWithProfiles.push({
            ...friendship,
            friend_profile: profileData[0] as FriendProfile
          });
        }
      }

      return friendsWithProfiles;
    },
    enabled: !!user?.id
  });

  // Fetch pending requests (where I'm the friend_id - someone sent me a request)
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['pending-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Fetch requester profiles
      const requestsWithProfiles: Friendship[] = [];
      for (const friendship of friendships || []) {
        const { data: profileData } = await supabase
          .rpc('get_friend_profile', { friend_id: friendship.user_id });

        if (profileData && profileData.length > 0) {
          requestsWithProfiles.push({
            ...friendship,
            requester_profile: profileData[0] as FriendProfile
          });
        }
      }

      return requestsWithProfiles;
    },
    enabled: !!user?.id
  });

  // Fetch sent requests (where I'm the user_id - I sent the request)
  const { data: sentRequests = [], isLoading: sentLoading } = useQuery({
    queryKey: ['sent-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Fetch friend profiles
      const requestsWithProfiles: Friendship[] = [];
      for (const friendship of friendships || []) {
        const { data: profileData } = await supabase
          .rpc('get_friend_profile', { friend_id: friendship.friend_id });

        if (profileData && profileData.length > 0) {
          requestsWithProfiles.push({
            ...friendship,
            friend_profile: profileData[0] as FriendProfile
          });
        }
      }

      return requestsWithProfiles;
    },
    enabled: !!user?.id
  });

  // Search user by user_code
  const searchByUserCode = async (userCode: string) => {
    if (!userCode.trim()) {
      toast.error('Please enter a user code');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, xp, user_code, bio')
        .eq('user_code', userCode.toUpperCase().trim())
        .maybeSingle();

      if (error || !data) {
        toast.error('User not found');
        setSearchResult(null);
      } else if (data.id === user?.id) {
        toast.error("You can't add yourself as a friend");
        setSearchResult(null);
      } else {
        setSearchResult(data as FriendProfile);
      }
    } catch (err) {
      toast.error('Error searching for user');
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('Already friends');
        } else if (existing.status === 'pending') {
          throw new Error('Friend request already pending');
        }
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Friend request sent!');
      setSearchResult(null);
      queryClient.invalidateQueries({ queryKey: ['sent-requests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send request');
    }
  });

  // Accept friend request
  const acceptRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Friend request accepted!');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
    onError: () => {
      toast.error('Failed to accept request');
    }
  });

  // Reject friend request
  const rejectRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('Friend request rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
    onError: () => {
      toast.error('Failed to reject request');
    }
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('Friend removed');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => {
      toast.error('Failed to remove friend');
    }
  });

  return {
    friends,
    pendingRequests,
    sentRequests,
    searchResult,
    isSearching,
    isLoading: friendsLoading || requestsLoading || sentLoading,
    searchByUserCode,
    sendRequest: sendRequestMutation.mutate,
    acceptRequest: acceptRequestMutation.mutate,
    rejectRequest: rejectRequestMutation.mutate,
    removeFriend: removeFriendMutation.mutate,
    isSending: sendRequestMutation.isPending,
    clearSearchResult: () => setSearchResult(null)
  };
};
