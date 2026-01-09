import { AppTopbar } from '@/components/app/AppTopbar';
import { useAuth, AccentColor } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Lock, Trash2, Loader2, HelpCircle, Palette, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/safeClient';
import { validatePassword } from '@/lib/passwordValidation';
import { useTutorial } from '@/components/onboarding/WelcomeTutorial';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ACCENT_COLORS: { id: AccentColor; name: string; color: string }[] = [
  { id: 'default', name: 'Purple', color: 'hsl(250 85% 60%)' },
  { id: 'blue', name: 'Blue', color: 'hsl(220 90% 56%)' },
  { id: 'violet', name: 'Violet', color: 'hsl(270 80% 60%)' },
  { id: 'emerald', name: 'Emerald', color: 'hsl(160 84% 39%)' },
  { id: 'rose', name: 'Rose', color: 'hsl(350 89% 60%)' },
  { id: 'amber', name: 'Amber', color: 'hsl(38 92% 50%)' },
];

const SettingsPage = () => {
  const { profile, theme, toggleTheme, accent, setAccent, updateProfile, signOut } = useAuth();
  const { toast } = useToast();
  const { resetTutorial } = useTutorial();
  const [notifications, setNotifications] = useState(profile?.notifications_enabled ?? true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  
  // Profile form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Rate limiting for password attempts
  const [failedPasswordAttempts, setFailedPasswordAttempts] = useState(0);
  const [passwordLockoutUntil, setPasswordLockoutUntil] = useState<Date | null>(null);
  
  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setBio(profile.bio || '');
      setNotifications(profile.notifications_enabled ?? true);
    }
  }, [profile]);

  const handleNotificationsChange = async (enabled: boolean) => {
    setNotifications(enabled);
    setIsSavingNotifications(true);
    try {
      await updateProfile({ notifications_enabled: enabled } as any);
      toast({
        title: enabled ? 'Notifications enabled' : 'Notifications disabled',
        description: enabled ? 'You will receive notifications.' : 'You will not receive notifications.',
      });
    } catch (error) {
      setNotifications(!enabled); // Revert on error
      toast({
        title: 'Error',
        description: 'Failed to update notification preference.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!username.trim()) {
      toast({
        title: 'Username required',
        description: 'Please enter a username.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        username: username.trim(),
        bio: bio.trim() || null,
      });
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Check rate limiting lockout
    if (passwordLockoutUntil && new Date() < passwordLockoutUntil) {
      const minutesLeft = Math.ceil((passwordLockoutUntil.getTime() - Date.now()) / 60000);
      toast({
        title: 'Too many attempts',
        description: `Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        variant: 'destructive',
      });
      return;
    }

    if (!currentPassword) {
      toast({
        title: 'Current password required',
        description: 'Please enter your current password.',
        variant: 'destructive',
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Password required',
        description: 'Please enter your new password.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    const { valid, message } = validatePassword(newPassword);
    if (!valid) {
      toast({
        title: 'Weak password',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });

      if (signInError) {
        // Track failed attempts for rate limiting
        const newAttempts = failedPasswordAttempts + 1;
        setFailedPasswordAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          const lockout = new Date();
          lockout.setMinutes(lockout.getMinutes() + 15);
          setPasswordLockoutUntil(lockout);
          toast({
            title: 'Too many failed attempts',
            description: 'Password change locked for 15 minutes.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Verification failed',
            description: `Unable to verify. ${3 - newAttempts} attempt${3 - newAttempts > 1 ? 's' : ''} remaining.`,
            variant: 'destructive',
          });
        }
        setIsChangingPassword(false);
        return;
      }
      
      // Reset attempts on successful verification
      setFailedPasswordAttempts(0);
      setPasswordLockoutUntil(null);

      // Now update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Call edge function to delete all user data and auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to delete your account.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }

      // Sign out locally
      await signOut();
      
      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been permanently deleted.',
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Delete account error:', error);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppTopbar title="Settings" />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 bg-background" 
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={email} 
                disabled
                className="mt-1 opacity-60 bg-background" 
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label>Bio</Label>
              <Input 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 bg-background" 
              />
            </div>
            <Button 
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Appearance</h3>
          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-streak" />}
                <div>
                  <span className="text-foreground font-medium">Dark Mode</span>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                </div>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>

            {/* Accent Color */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-5 h-5 text-primary" />
                <div>
                  <span className="text-foreground font-medium">Accent Color</span>
                  <p className="text-xs text-muted-foreground">Choose your preferred accent color</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setAccent(color.id)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2",
                      accent === color.id 
                        ? "border-foreground scale-110" 
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                  >
                    {accent === color.id && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Notifications</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <span className="text-foreground font-medium">In-App Notifications</span>
                <p className="text-xs text-muted-foreground">Receive notifications for achievements, messages, and friend requests</p>
              </div>
            </div>
            <Switch 
              checked={notifications} 
              onCheckedChange={handleNotificationsChange}
              disabled={isSavingNotifications}
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Help</h3>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              resetTutorial();
              toast({
                title: 'Tutorial reset',
                description: 'Go to Dashboard to see the tutorial again.',
              });
            }}
          >
            <HelpCircle className="w-4 h-4" /> Replay Welcome Tutorial
          </Button>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Security</h3>
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Lock className="w-4 h-4" /> Change Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your new password below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Current Password</Label>
                  <Input 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Hidden Account Management - expandable section */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-2 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">›</span>
            Advanced account options
          </summary>
          <div className="mt-4 p-6 rounded-2xl bg-destructive/5 border border-destructive/20">
            <h3 className="font-semibold text-destructive/80 mb-4 text-sm">Danger Zone</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 gap-2">
                  <Trash2 className="w-3 h-3" /> Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">⚠️ Permanently Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p className="font-semibold text-foreground">
                      This action is IRREVERSIBLE and will permanently destroy:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>All your habits and completion history</li>
                      <li>All your goals and tasks</li>
                      <li>Your XP, level, streaks, and achievements</li>
                      <li>All session history and analytics data</li>
                      <li>Friend connections and chat messages</li>
                      <li>Your profile and all personal data</li>
                    </ul>
                    <p className="font-medium text-destructive">
                      There is NO way to recover your account or data after deletion.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel, Keep My Account</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete Everything'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </details>
      </div>
    </div>
  );
};

export default SettingsPage;
