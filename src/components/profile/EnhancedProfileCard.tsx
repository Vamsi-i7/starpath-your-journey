import { Edit, MapPin, Globe, Calendar, Crown, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface EnhancedProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  website?: string;
  level: number;
  xp: number;
  current_streak: number;
  longest_streak: number;
  total_habits_completed: number;
  total_goals_completed: number;
  is_premium: boolean;
  premium_tier: string;
  member_since: string;
  last_active?: string;
}

interface EnhancedProfileCardProps {
  profile: EnhancedProfile;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onAddFriend?: () => void;
  isFriend?: boolean;
}

export function EnhancedProfileCard({
  profile,
  isOwnProfile = false,
  onEdit,
  onAddFriend,
  isFriend = false,
}: EnhancedProfileCardProps) {
  const xpProgress = (profile.xp % 500) / 500 * 100;
  const nextLevel = profile.level + 1;

  const tierBadge = {
    free: { label: 'Free', color: 'bg-gray-500' },
    premium: { label: '⭐ Premium', color: 'bg-purple-500' },
    pro: { label: '👑 Pro', color: 'bg-amber-500' },
    lifetime: { label: '💎 Lifetime', color: 'bg-pink-500' },
  };

  const badge = tierBadge[profile.premium_tier as keyof typeof tierBadge] || tierBadge.free;

  return (
    <Card className="overflow-hidden">
      {/* Header with Gradient */}
      <div className={cn(
        "h-32 bg-gradient-to-br relative",
        profile.is_premium 
          ? "from-purple-500 via-pink-500 to-amber-500" 
          : "from-primary to-accent"
      )}>
        {profile.is_premium && (
          <div className="absolute top-4 right-4">
            <Badge className={cn("text-white", badge.color)}>
              {badge.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="px-4 sm:px-6 pb-6">
        {/* Avatar & Basic Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-4">
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-card ring-4 ring-background">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              {profile.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {profile.display_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              </div>
              {isOwnProfile && (
                <Button onClick={onEdit} size="sm" variant="outline" className="gap-2 w-full sm:w-auto">
                  <Edit className="w-4 h-4" />
                  <span className="sm:inline">Edit Profile</span>
                </Button>
              )}
              {!isOwnProfile && !isFriend && (
                <Button onClick={onAddFriend} size="sm" className="gap-2 w-full sm:w-auto">
                  <Star className="w-4 h-4" />
                  Add Friend
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-4">
            {profile.bio}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm text-muted-foreground">
          {profile.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <a 
                href={profile.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Website
              </a>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {format(new Date(profile.member_since), 'MMM yyyy')}</span>
          </div>
        </div>

        {/* Level & XP Progress */}
        <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Level {profile.level}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {profile.xp % 500} / 500 XP
            </span>
          </div>
          <Progress value={xpProgress} className="h-2 mb-1" />
          <p className="text-xs text-muted-foreground text-right">
            {500 - (profile.xp % 500)} XP to Level {nextLevel}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-card border border-border/40 text-center">
            <p className="text-2xl font-bold text-foreground">
              {profile.total_habits_completed}
            </p>
            <p className="text-xs text-muted-foreground">Habits</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border/40 text-center">
            <p className="text-2xl font-bold text-foreground">
              {profile.total_goals_completed}
            </p>
            <p className="text-xs text-muted-foreground">Goals</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border/40 text-center">
            <p className="text-2xl font-bold text-streak">
              {profile.current_streak}🔥
            </p>
            <p className="text-xs text-muted-foreground">Streak</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border/40 text-center">
            <p className="text-2xl font-bold text-amber-500">
              {profile.xp}
            </p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
        </div>

        {/* Longest Streak Highlight */}
        {profile.longest_streak > 7 && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <p className="text-sm font-medium text-center">
              🏆 Longest Streak: <span className="text-orange-500 font-bold">{profile.longest_streak} days</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
