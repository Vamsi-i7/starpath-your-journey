import { AppTopbar } from '@/components/app/AppTopbar';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Moon, Sun, Bell, Lock, Trash2 } from 'lucide-react';

const SettingsPage = () => {
  const { user, theme, toggleTheme } = useApp();
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen">
      <AppTopbar title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">
        {/* Profile */}
        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Profile</h3>
          <div className="space-y-4">
            <div><Label>Username</Label><Input defaultValue={user?.username} className="mt-1" /></div>
            <div><Label>Email</Label><Input defaultValue={user?.email} className="mt-1" /></div>
            <div><Label>Bio</Label><Input defaultValue={user?.bio} className="mt-1" /></div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
          </div>
        </div>

        {/* Appearance */}
        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-streak" />}
              <span className="text-foreground">Dark Mode</span>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Notifications</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <span className="text-foreground">Push Notifications</span>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        </div>

        {/* Security */}
        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Security</h3>
          <Button variant="outline" className="gap-2"><Lock className="w-4 h-4" /> Change Password</Button>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/30">
          <h3 className="font-semibold text-destructive mb-4">Danger Zone</h3>
          <Button variant="destructive" className="gap-2"><Trash2 className="w-4 h-4" /> Delete Account</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
