import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  joined_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useGroupChat = (selectedGroupId: string | null) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user's groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['chat-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get groups user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map(m => m.group_id);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('chat_groups')
        .select('*')
        .in('id', groupIds)
        .order('updated_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Get member counts
      const groupsWithCounts: GroupChat[] = [];
      for (const group of groupsData || []) {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);
        
        groupsWithCounts.push({
          ...group,
          member_count: count || 0
        });
      }

      return groupsWithCounts;
    },
    enabled: !!user?.id
  });

  // Fetch public groups for discovery
  const { data: publicGroups = [], isLoading: publicGroupsLoading } = useQuery({
    queryKey: ['public-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('chat_groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get member counts and filter out groups user is already in
      const myGroupIds = groups.map(g => g.id);
      const publicGroupsWithCounts: GroupChat[] = [];
      
      for (const group of data || []) {
        if (myGroupIds.includes(group.id)) continue;
        
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);
        
        publicGroupsWithCounts.push({
          ...group,
          member_count: count || 0
        });
      }

      return publicGroupsWithCounts;
    },
    enabled: !!user?.id && groups.length >= 0
  });

  // Fetch members for selected group
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['group-members', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return [];

      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', selectedGroupId);

      if (error) throw error;

      // Fetch profiles for each member
      const membersWithProfiles: GroupMember[] = [];
      for (const member of data || []) {
        const { data: profileData } = await supabase
          .rpc('get_friend_profile', { friend_id: member.user_id });

        membersWithProfiles.push({
          ...member,
          profile: profileData?.[0] ? {
            username: profileData[0].username,
            avatar_url: profileData[0].avatar_url
          } : undefined
        });
      }

      return membersWithProfiles;
    },
    enabled: !!selectedGroupId
  });

  // Fetch messages for selected group
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['group-messages', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return [];

      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', selectedGroupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch sender profiles
      const messagesWithSenders: GroupMessage[] = [];
      const profileCache: Record<string, { username: string; avatar_url: string | null }> = {};

      for (const msg of data || []) {
        if (!profileCache[msg.sender_id]) {
          const { data: profileData } = await supabase
            .rpc('get_friend_profile', { friend_id: msg.sender_id });
          
          if (profileData?.[0]) {
            profileCache[msg.sender_id] = {
              username: profileData[0].username,
              avatar_url: profileData[0].avatar_url
            };
          }
        }

        messagesWithSenders.push({
          ...msg,
          sender: profileCache[msg.sender_id]
        });
      }

      return messagesWithSenders;
    },
    enabled: !!selectedGroupId
  });

  // Subscribe to realtime group messages
  useEffect(() => {
    if (!selectedGroupId) return;

    const channel = supabase
      .channel(`group-messages-${selectedGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${selectedGroupId}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['group-messages', selectedGroupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGroupId, queryClient]);

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description, isPublic }: { name: string; description?: string; isPublic: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: group, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          is_public: isPublic,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      return group;
    },
    onSuccess: () => {
      toast.success('Group created!');
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create group');
    }
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Joined group!');
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      queryClient.invalidateQueries({ queryKey: ['public-groups'] });
    },
    onError: () => {
      toast.error('Failed to join group');
    }
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('Left group');
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
    },
    onError: () => {
      toast.error('Failed to leave group');
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-messages'] });
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  return {
    groups,
    publicGroups,
    members,
    messages,
    isLoading: groupsLoading || publicGroupsLoading,
    messagesLoading,
    membersLoading,
    createGroup: createGroupMutation.mutate,
    isCreating: createGroupMutation.isPending,
    joinGroup: joinGroupMutation.mutate,
    isJoining: joinGroupMutation.isPending,
    leaveGroup: leaveGroupMutation.mutate,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending
  };
};
