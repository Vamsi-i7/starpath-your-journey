import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  searchError?: string | null;
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
  searchError,
  onClear
}: AddFriendModalProps) => {
  const [userCode, setUserCode] = useState('');

  const handleSearch = () => {
    if (!userCode.trim()) return;
    onSearch(userCode.trim());
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setUserCode('');
      onClear();
    }
    onOpenChange(isOpen);
  };

  const formatUserCode = (value: string) => {
    // Remove any non-alphanumeric characters and uppercase
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Enter your friend's user code to send them a friend request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert variant="default" className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              User codes look like <span className="font-mono font-semibold">SP30CD77</span>. 
              You can find your code in your Profile page.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Input
              placeholder="e.g. SP30CD77"
              value={userCode}
              onChange={(e) => setUserCode(formatUserCode(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 font-mono uppercase tracking-wider"
              maxLength={10}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || userCode.length < 6}
              variant="secondary"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

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
                    Level {searchResult.level} • <span className="font-mono">{searchResult.user_code}</span>
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