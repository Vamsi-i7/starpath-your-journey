import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, UserMinus, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FriendProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  user_code: string | null;
  bio: string | null;
}

interface FriendCardProps {
  profile: FriendProfile;
  friendshipId: string;
  type: 'friend' | 'pending' | 'sent';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export const FriendCard = ({
  profile,
  friendshipId,
  type,
  onAccept,
  onReject,
  onRemove
}: FriendCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {profile.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{profile.username}</p>
          <p className="text-sm text-muted-foreground">
            Level {profile.level} • {profile.user_code}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {type === 'friend' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/app/chats?user=${profile.id}`)}
                className="text-muted-foreground hover:text-primary"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove?.(friendshipId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <UserMinus className="w-5 h-5" />
              </Button>
            </>
          )}

          {type === 'pending' && (
            <>
              <Button
                variant="default"
                size="icon"
                onClick={() => onAccept?.(friendshipId)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onReject?.(friendshipId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}

          {type === 'sent' && (
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
              Pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
