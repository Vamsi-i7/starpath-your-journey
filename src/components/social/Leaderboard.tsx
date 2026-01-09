import { useState } from 'react';
import { Trophy, Medal, Award, Crown, Zap, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { cn } from '@/lib/utils';

const rankIcons = {
  1: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  2: { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/10' },
  3: { icon: Award, color: 'text-amber-700', bg: 'bg-amber-700/10' },
};

export function Leaderboard() {
  const [timeframe, setTimeframe] = useState<'all_time' | 'weekly'>('all_time');
  const { entries, isLoading, currentUserRank } = useLeaderboard(timeframe);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 sm:p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Timeframe Selector */}
      <Card className="p-3 sm:p-4">
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all_time" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">All Time</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">This Week</span>
              <span className="sm:hidden">Week</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>

      {/* Current User Rank Card */}
      {currentUserRank && (
        <Card className="p-4 sm:p-6 bg-primary/5 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold text-primary">#{currentUserRank}</span>
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">Your Rank</p>
                <p className="text-xs text-muted-foreground">
                  {timeframe === 'weekly' ? 'This week' : 'All time'}
                </p>
              </div>
            </div>
            <Zap className="w-8 h-8 text-primary" />
          </div>
        </Card>
      )}

      {/* Top 3 Podium (Desktop) */}
      {entries.length >= 3 && (
        <div className="hidden md:grid grid-cols-3 gap-4 mb-6">
          {/* 2nd Place */}
          <Card className={cn(
            "p-6 text-center relative order-2",
            entries[1]?.is_current_user && "ring-2 ring-primary"
          )}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gray-400 text-white">
                <Medal className="w-3 h-3 mr-1" />
                2nd
              </Badge>
            </div>
            <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-gray-400">
              <AvatarImage src={entries[1]?.avatar_url} />
              <AvatarFallback>{entries[1]?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="font-bold">{entries[1]?.display_name}</p>
            <p className="text-xs text-muted-foreground">@{entries[1]?.username}</p>
            <p className="text-2xl font-bold text-primary mt-2">{entries[1]?.score}</p>
          </Card>

          {/* 1st Place */}
          <Card className={cn(
            "p-6 text-center relative order-1 scale-110",
            entries[0]?.is_current_user && "ring-2 ring-primary"
          )}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-yellow-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                1st
              </Badge>
            </div>
            <Avatar className="w-24 h-24 mx-auto mb-3 border-4 border-yellow-500 ring-4 ring-yellow-500/20">
              <AvatarImage src={entries[0]?.avatar_url} />
              <AvatarFallback>{entries[0]?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="font-bold text-lg">{entries[0]?.display_name}</p>
            <p className="text-xs text-muted-foreground">@{entries[0]?.username}</p>
            <p className="text-3xl font-bold text-yellow-500 mt-2">{entries[0]?.score}</p>
          </Card>

          {/* 3rd Place */}
          <Card className={cn(
            "p-6 text-center relative order-3",
            entries[2]?.is_current_user && "ring-2 ring-primary"
          )}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-amber-700 text-white">
                <Award className="w-3 h-3 mr-1" />
                3rd
              </Badge>
            </div>
            <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-amber-700">
              <AvatarImage src={entries[2]?.avatar_url} />
              <AvatarFallback>{entries[2]?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="font-bold">{entries[2]?.display_name}</p>
            <p className="text-xs text-muted-foreground">@{entries[2]?.username}</p>
            <p className="text-2xl font-bold text-primary mt-2">{entries[2]?.score}</p>
          </Card>
        </div>
      )}

      {/* Full Leaderboard List */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-border/40">
          {entries.map((entry, index) => {
            const rankInfo = rankIcons[entry.rank as keyof typeof rankIcons];
            const RankIcon = rankInfo?.icon;

            return (
              <div
                key={entry.user_id}
                className={cn(
                  "p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-muted/30 transition-colors",
                  entry.is_current_user && "bg-primary/5 border-l-4 border-primary"
                )}
              >
                {/* Rank */}
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0",
                  rankInfo ? rankInfo.bg : "bg-muted"
                )}>
                  {RankIcon ? (
                    <RankIcon className={cn("w-5 h-5 sm:w-6 sm:h-6", rankInfo.color)} />
                  ) : (
                    <span className={cn(
                      "text-sm sm:text-base",
                      entry.is_current_user ? "text-primary" : "text-muted-foreground"
                    )}>
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-border flex-shrink-0">
                  <AvatarImage src={entry.avatar_url} />
                  <AvatarFallback>
                    {entry.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-semibold text-sm sm:text-base truncate",
                    entry.is_current_user && "text-primary"
                  )}>
                    {entry.display_name}
                    {entry.is_current_user && (
                      <span className="text-xs ml-2 text-muted-foreground">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{entry.username}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg sm:text-xl font-bold text-primary">
                    {entry.score.toLocaleString()}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Lv. {entry.level}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {entries.length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No leaderboard data yet. Start completing habits!
          </p>
        </Card>
      )}
    </div>
  );
}
