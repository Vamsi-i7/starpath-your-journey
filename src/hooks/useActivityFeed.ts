import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ActivityItem {
  activity_id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  activity_type: string;
  activity_data: Record<string, any>;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  created_at: string;
}

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const useActivityFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchActivities = async (pageNum: number = 0) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_friend_activity_feed', {
        p_user_id: user.id,
        p_limit: 20,
        p_offset: pageNum * 20,
      });

      if (error) throw error;

      if (pageNum === 0) {
        setActivities(data || []);
      } else {
        setActivities(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data || []).length === 20);
      setPage(pageNum);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error fetching activity feed:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to load activity feed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(0);
  }, [user]);

  const likeActivity = async (activityId: string) => {
    if (!user) return;

    try {
      // Check if already liked
      const activity = activities.find(a => a.activity_id === activityId);
      if (!activity) return;

      if (activity.user_has_liked) {
        // Unlike
        const { error } = await supabase
          .from('activity_likes')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setActivities(prev => prev.map(a =>
          a.activity_id === activityId
            ? { ...a, like_count: a.like_count - 1, user_has_liked: false }
            : a
        ));
      } else {
        // Like
        const { error } = await supabase
          .from('activity_likes')
          .insert({ activity_id: activityId, user_id: user.id });

        if (error) throw error;

        // Update local state
        setActivities(prev => prev.map(a =>
          a.activity_id === activityId
            ? { ...a, like_count: a.like_count + 1, user_has_liked: true }
            : a
        ));

        // Update like count in activity_feed
        await supabase
          .from('activity_feed')
          .update({ like_count: activity.like_count + 1 })
          .eq('id', activityId);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error liking activity:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to like activity',
        variant: 'destructive',
      });
    }
  };

  const commentOnActivity = async (activityId: string, commentText: string) => {
    if (!user || !commentText.trim()) return;

    try {
      const { error } = await supabase
        .from('activity_comments')
        .insert({
          activity_id: activityId,
          user_id: user.id,
          comment_text: commentText.trim(),
        });

      if (error) throw error;

      // Update comment count
      setActivities(prev => prev.map(a =>
        a.activity_id === activityId
          ? { ...a, comment_count: a.comment_count + 1 }
          : a
      ));

      await supabase
        .from('activity_feed')
        .update({ comment_count: supabase.rpc('increment', { x: 1 }) })
        .eq('id', activityId);

      toast({
        title: 'Success',
        description: 'Comment posted',
      });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error commenting:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchActivities(page + 1);
    }
  };

  return {
    activities,
    isLoading,
    hasMore,
    fetchActivities,
    likeActivity,
    commentOnActivity,
    loadMore,
    refresh: () => fetchActivities(0),
  };
};
