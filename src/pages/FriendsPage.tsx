import { useState } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useAuth } from '@/contexts/AuthContext';
import { Users, UserPlus, Clock, Send, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFriends } from '@/hooks/useFriends';
import { AddFriendModal } from '@/components/friends/AddFriendModal';
import { FriendCard } from '@/components/friends/FriendCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const FriendsPage = () => {
  const { profile } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    friends,
    pendingRequests,
    sentRequests,
    searchResult,
    isSearching,
    isLoading,
    searchByUserCode,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    isSending,
    clearSearchResult
  } = useFriends();

  const copyUserCode = () => {
    if (profile?.user_code) {
      navigator.clipboard.writeText(profile.user_code);
      setCopied(true);
      toast.success('User code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen">
      <AppTopbar title="Friends" />
      <div className="p-6 space-y-6">
        {/* Profile Card with User Code */}
        {profile && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary-foreground glow">
                {profile.username.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">{profile.username}</h2>
                <p className="text-muted-foreground text-sm sm:text-base">{profile.bio}</p>
                <p className="text-sm text-primary mt-1">Level {profile.level} • {profile.total_habits_completed} habits completed</p>
              </div>
              <div className="w-full sm:w-auto">
                <p className="text-xs text-muted-foreground mb-1">Your User Code</p>
                <Button 
                  variant="outline" 
                  onClick={copyUserCode}
                  className="gap-2 w-full sm:w-auto font-mono text-lg"
                >
                  {profile.user_code || 'N/A'}
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Friend Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Manage Friends</h3>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <UserPlus className="w-5 h-5" /> Add Friend
          </Button>
        </div>

        {/* Tabs for Friends, Requests, Sent */}
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Friends</span>
              {friends.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">{friends.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
              {pendingRequests.length > 0 && (
                <span className="ml-1 text-xs bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Sent</span>
              {sentRequests.length > 0 && (
                <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{sentRequests.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : friends.length > 0 ? (
              friends.map((friendship) => (
                friendship.friend_profile && (
                  <FriendCard
                    key={friendship.id}
                    profile={friendship.friend_profile}
                    friendshipId={friendship.id}
                    type="friend"
                    onRemove={removeFriend}
                  />
                )
              ))
            ) : (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border/50">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No friends yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Share your user code or add friends to compete!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                request.requester_profile && (
                  <FriendCard
                    key={request.id}
                    profile={request.requester_profile}
                    friendshipId={request.id}
                    type="pending"
                    onAccept={acceptRequest}
                    onReject={rejectRequest}
                  />
                )
              ))
            ) : (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border/50">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : sentRequests.length > 0 ? (
              sentRequests.map((request) => (
                request.friend_profile && (
                  <FriendCard
                    key={request.id}
                    profile={request.friend_profile}
                    friendshipId={request.id}
                    type="sent"
                  />
                )
              ))
            ) : (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border/50">
                <Send className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No sent requests</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddFriendModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSearch={searchByUserCode}
        onSendRequest={sendRequest}
        searchResult={searchResult}
        isSearching={isSearching}
        isSending={isSending}
        onClear={clearSearchResult}
      />
    </div>
  );
};

export default FriendsPage;
