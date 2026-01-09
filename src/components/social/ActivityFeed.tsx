import { useState } from 'react';
import { Heart, MessageCircle, Trophy, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const activityIcons = {
  habit_completed: Trophy,
  goal_completed: Target,
  achievement_unlocked: Zap,
  streak_milestone: TrendingUp,
  level_up: Zap,
  challenge_won: Trophy,
  challenge_started: Users,
  friend_added: Users,
};

const activityColors = {
  habit_completed: 'text-emerald-500',
  goal_completed: 'text-blue-500',
  achievement_unlocked: 'text-amber-500',
  streak_milestone: 'text-orange-500',
  level_up: 'text-purple-500',
  challenge_won: 'text-pink-500',
  challenge_started: 'text-cyan-500',
  friend_added: 'text-green-500',
};

export function ActivityFeed() {
  const { activities, isLoading, hasMore, likeActivity, commentOnActivity, loadMore, refresh } = useActivityFeed();
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  const getActivityMessage = (activity: any) => {
    switch (activity.activity_type) {
      case 'habit_completed':
        return `completed a habit`;
      case 'goal_completed':
        return `achieved a goal: "${activity.activity_data.goal_title}"`;
      case 'achievement_unlocked':
        return `unlocked achievement: ${activity.activity_data.achievement_name}`;
      case 'streak_milestone':
        return `reached a ${activity.activity_data.days}-day streak! 🔥`;
      case 'level_up':
        return `leveled up to Level ${activity.activity_data.level}!`;
      case 'challenge_won':
        return `won a challenge!`;
      case 'challenge_started':
        return `started a new challenge`;
      case 'friend_added':
        return `became friends with someone`;
      default:
        return 'had an activity';
    }
  };

  const handleComment = (activityId: string) => {
    const text = commentInputs[activityId];
    if (text?.trim()) {
      commentOnActivity(activityId, text);
      setCommentInputs({ ...commentInputs, [activityId]: '' });
    }
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 sm:p-6 animate-pulse">
            <div className="flex gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-8 sm:p-12 text-center">
        <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
        <p className="text-sm text-muted-foreground">
          Add friends to see their activities here!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.activity_type as keyof typeof activityIcons] || Trophy;
        const iconColor = activityColors[activity.activity_type as keyof typeof activityColors] || 'text-primary';

        return (
          <Card key={activity.activity_id} className="p-4 sm:p-6 hover:border-primary/30 transition-colors">
            {/* Activity Header */}
            <div className="flex gap-3 sm:gap-4 mb-3">
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <AvatarImage src={activity.avatar_url} />
                <AvatarFallback>
                  {activity.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base">
                      {activity.display_name}
                      <span className="text-muted-foreground font-normal ml-2">
                        {getActivityMessage(activity)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{activity.username} · {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className={cn("flex-shrink-0", iconColor)}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Metadata */}
            {activity.activity_data && Object.keys(activity.activity_data).length > 0 && (
              <div className="mb-3 p-3 rounded-lg bg-muted/30">
                {activity.activity_data.xp_earned && (
                  <Badge variant="secondary" className="gap-1 mb-2">
                    <Zap className="w-3 h-3" />
                    +{activity.activity_data.xp_earned} XP
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likeActivity(activity.activity_id)}
                className={cn(
                  "gap-1 sm:gap-2 h-8 px-2 sm:px-3",
                  activity.user_has_liked && "text-red-500"
                )}
              >
                <Heart className={cn("w-4 h-4", activity.user_has_liked && "fill-current")} />
                <span className="text-xs sm:text-sm">{activity.like_count}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments({ ...showComments, [activity.activity_id]: !showComments[activity.activity_id] })}
                className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs sm:text-sm">{activity.comment_count}</span>
              </Button>
            </div>

            {/* Comment Input */}
            {showComments[activity.activity_id] && (
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={commentInputs[activity.activity_id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [activity.activity_id]: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment(activity.activity_id)}
                  className="flex-1 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleComment(activity.activity_id)}
                  disabled={!commentInputs[activity.activity_id]?.trim()}
                >
                  Post
                </Button>
              </div>
            )}
          </Card>
        );
      })}

      {/* Load More */}
      {hasMore && !isLoading && (
        <Button
          onClick={loadMore}
          variant="outline"
          className="w-full"
        >
          Load More Activities
        </Button>
      )}

      {isLoading && activities.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      )}
    </div>
  );
}
