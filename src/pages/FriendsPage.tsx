import { AppTopbar } from '@/components/app/AppTopbar';
import { useAuth } from '@/contexts/AuthContext';
import { Users, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FriendsPage = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen">
      <AppTopbar title="Friends" />
      <div className="p-6 space-y-6">
        {profile && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground glow">
                {profile.username.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{profile.username}</h2>
                <p className="text-muted-foreground">{profile.bio}</p>
                <p className="text-sm text-primary mt-1">Level {profile.level} • {profile.total_habits_completed} habits completed</p>
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

        <div className="text-center py-12 rounded-2xl border border-dashed border-border/50">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No friends yet. Add some friends to compete!</p>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
