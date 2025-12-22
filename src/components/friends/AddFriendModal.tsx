import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2 } from 'lucide-react';

interface FriendProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  user_code: string | null;
  bio: string | null;
}

interface AddFriendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (userCode: string) => void;
  onSendRequest: (friendId: string) => void;
  searchResult: FriendProfile | null;
  isSearching: boolean;
  isSending: boolean;
  onClear: () => void;
}

export const AddFriendModal = ({
  open,
  onOpenChange,
  onSearch,
  onSendRequest,
  searchResult,
  isSearching,
  isSending,
  onClear
}: AddFriendModalProps) => {
  const [userCode, setUserCode] = useState('');

  const handleSearch = () => {
    onSearch(userCode);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setUserCode('');
      onClear();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your friend's user code to send them a friend request.
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter user code (e.g., ABC123)"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value.toUpperCase())}
              className="flex-1"
              maxLength={10}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !userCode.trim()}
              variant="secondary"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {searchResult && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={searchResult.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {searchResult.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{searchResult.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Level {searchResult.level} • {searchResult.user_code}
                  </p>
                </div>
                <Button
                  onClick={() => onSendRequest(searchResult.id)}
                  disabled={isSending}
                  size="sm"
                  className="gap-2"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
