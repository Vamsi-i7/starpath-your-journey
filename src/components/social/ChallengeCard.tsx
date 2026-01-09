import { Trophy, Clock, Target, Zap, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { Challenge } from '@/hooks/useChallenges';

interface ChallengeCardProps {
  challenge: Challenge;
  onAccept?: (challengeId: string) => void;
  onDecline?: (challengeId: string) => void;
}

const challengeTypeLabels = {
  habit_count: { label: 'Most Habits', icon: Trophy },
  streak: { label: 'Longest Streak', icon: Zap },
  xp: { label: 'Most XP', icon: Target },
  specific_habit: { label: 'Specific Habit', icon: Target },
  category: { label: 'Category Challenge', icon: Trophy },
};

export function ChallengeCard({ challenge, onAccept, onDecline }: ChallengeCardProps) {
  const { user } = useAuth();
  const isCreator = challenge.creator_id === user?.id;
  const opponent = isCreator ? challenge.challenger : challenge.creator;
  const myProgress = isCreator ? challenge.creator_progress : challenge.challenger_progress;
  const opponentProgress = isCreator ? challenge.challenger_progress : challenge.creator_progress;
  
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const myProgressPercent = (myProgress / challenge.target_value) * 100;
  const opponentProgressPercent = (opponentProgress / challenge.target_value) * 100;
  
  const typeInfo = challengeTypeLabels[challenge.challenge_type as keyof typeof challengeTypeLabels] || challengeTypeLabels.habit_count;
  const TypeIcon = typeInfo.icon;

  return (
    <Card className={cn(
      "p-4 sm:p-6 relative overflow-hidden",
      challenge.status === 'pending' && "border-amber-500/50 bg-amber-500/5",
      challenge.status === 'active' && "border-primary/50",
      challenge.winner_id === user?.id && "border-emerald-500/50 bg-emerald-500/5"
    )}>
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        <Badge variant={
          challenge.status === 'pending' ? 'secondary' :
          challenge.status === 'active' ? 'default' :
          'outline'
        }>
          {challenge.status === 'completed' && challenge.winner_id === user?.id && '🏆 Won'}
          {challenge.status === 'completed' && challenge.winner_id !== user?.id && 'Lost'}
          {challenge.status === 'active' && `${daysLeft}d left`}
          {challenge.status === 'pending' && 'Pending'}
        </Badge>
      </div>

      {/* Challenge Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg">{typeInfo.label}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            First to {challenge.target_value} wins
          </p>
        </div>
      </div>

      {/* Pending Challenge Actions */}
      {challenge.status === 'pending' && !isCreator && (
        <div className="mb-4 p-3 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm mb-3">
            <span className="font-semibold">{challenge.creator?.display_name}</span> challenged you!
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => onAccept?.(challenge.id)}
              size="sm"
              className="flex-1 gap-2"
            >
              <Check className="w-4 h-4" />
              Accept
            </Button>
            <Button
              onClick={() => onDecline?.(challenge.id)}
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
            >
              <X className="w-4 h-4" />
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* Active Challenge Progress */}
      {challenge.status === 'active' && (
        <>
          {/* You */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">You</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">You</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {myProgress} / {challenge.target_value}
              </span>
            </div>
            <Progress value={myProgressPercent} className="h-2" />
          </div>

          {/* Opponent */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                  <AvatarImage src={opponent?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {opponent?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {opponent?.display_name}
                </span>
              </div>
              <span className="text-sm font-bold">
                {opponentProgress} / {challenge.target_value}
              </span>
            </div>
            <Progress value={opponentProgressPercent} className="h-2" />
          </div>

          {/* Time Remaining */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {daysLeft > 0 ? `${daysLeft} days remaining` : 'Ending soon'}
            </span>
          </div>
        </>
      )}

      {/* Completed Challenge */}
      {challenge.status === 'completed' && (
        <div className={cn(
          "p-4 rounded-lg text-center",
          challenge.winner_id === user?.id 
            ? "bg-emerald-500/10 border border-emerald-500/20" 
            : "bg-red-500/10 border border-red-500/20"
        )}>
          <p className="font-semibold mb-1">
            {challenge.winner_id === user?.id ? '🎉 You Won!' : '😔 You Lost'}
          </p>
          <p className="text-sm text-muted-foreground">
            Final: You {myProgress} - {opponentProgress} {opponent?.display_name}
          </p>
        </div>
      )}
    </Card>
  );
}
