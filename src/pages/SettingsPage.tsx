import { AppTopbar } from '@/components/app/AppTopbar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Lock, Trash2, Loader2, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/safeClient';
import { validatePassword } from '@/lib/passwordValidation';
import { useTutorial } from '@/components/onboarding/WelcomeTutorial';
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

const SettingsPage = () => {
  const { profile, theme, toggleTheme, updateProfile, signOut } = useAuth();
  const { toast } = useToast();
  const { resetTutorial } = useTutorial();
  const [notifications, setNotifications] = useState(true);
  
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
    }
  }, [profile]);

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
      // Delete user's profile data first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile?.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // Sign out the user
      await signOut();
      
      toast({
        title: 'Account deleted',
        description: 'Your account has been deleted. You will be redirected.',
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppTopbar title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <h3 className="font-semibold text-foreground mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={email} 
                disabled
                className="mt-1 opacity-60" 
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label>Bio</Label>
              <Input 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                className="mt-1" 
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-streak" />}
              <span className="text-foreground">Dark Mode</span>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </div>

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

        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/30">
          <h3 className="font-semibold text-destructive mb-4">Danger Zone</h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                    'Delete Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;