import { AppTopbar } from '@/components/app/AppTopbar';
import { useApp } from '@/contexts/AppContext';
import { Users, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FriendsPage = () => {
  const { friends, user } = useApp();

  return (
    <div className="min-h-screen">
      <AppTopbar title="Friends" />
      <div className="p-6 space-y-6">
        {/* User Profile Card */}
        {user && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground glow">
                {user.username.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{user.username}</h2>
                <p className="text-muted-foreground">{user.bio}</p>
                <p className="text-sm text-primary mt-1">Level {user.level} • {user.totalHabitsCompleted} habits completed</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Your Friends</h3>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <UserPlus className="w-5 h-5" /> Add Friend
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <div key={friend.id} className="p-5 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center text-xl font-bold text-foreground">
                    {friend.username.charAt(0)}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${friend.status === 'online' ? 'bg-xp' : 'bg-muted'}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{friend.username}</h4>
                  <p className="text-sm text-muted-foreground">Level {friend.level}</p>
                </div>
                <Button size="icon" variant="ghost">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
