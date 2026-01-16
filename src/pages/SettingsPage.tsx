import { AppTopbar } from '@/components/app/AppTopbar';
import { ExportDataSection } from '@/components/settings/ExportDataSection';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { 
  Bell, Lock, Trash2, Loader2, HelpCircle, Palette, 
  BarChart3, Mail, Package, RefreshCw, ExternalLink, Shield, User, 
  Eye, EyeOff, Globe, KeyRound, AlertTriangle, LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/safeClient';
import { validatePassword, getPasswordStrength } from '@/lib/passwordValidation';
import { useTutorial } from '@/components/onboarding/WelcomeTutorial';
import { AnalyticsGuide } from '@/components/analytics/AnalyticsGuide';
import { cn } from '@/lib/utils';
import { isAdmin } from '@/lib/adminAuth';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from '@/components/ui/dialog';


const SettingsPage = () => {
  const { profile, user, updateProfile, signOut, refreshProfile } = useAuth();
  const { theme: currentTheme, themeInfo } = useTheme();
  const { toast } = useToast();
  const { resetTutorial } = useTutorial();
  const navigate = useNavigate();
  const [showAnalyticsGuide, setShowAnalyticsGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const userIsAdmin = isAdmin(profile);
  const isGoogleUser = user?.app_metadata?.provider === 'google' || 
                       user?.identities?.some(i => i.provider === 'google') || false;
  
  // Profile state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [failedPasswordAttempts, setFailedPasswordAttempts] = useState(0);
  const [passwordLockoutUntil, setPasswordLockoutUntil] = useState<Date | null>(null);
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setNotifications(profile.notification_enabled ?? true);
      setIsPublicProfile(profile.is_public ?? true);
    }
  }, [profile]);
  
  useEffect(() => {
    if (isGoogleUser && user && profile) {
      const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
      const needsSync = (googleAvatar && !profile.avatar_url) || (googleName && !profile.full_name);
      if (needsSync) handleSyncGoogleProfile();
    }
  }, [isGoogleUser, user, profile]);

  const handleSyncGoogleProfile = async () => {
    if (!user || !isGoogleUser) return;
    setIsSyncingGoogle(true);
    try {
      const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
      const updates: Record<string, string | null> = {};
      if (googleAvatar) updates.avatar_url = googleAvatar;
      if (googleName) { updates.full_name = googleName; setFullName(googleName); }
      if (Object.keys(updates).length > 0) {
        await updateProfile(updates as any);
        toast({ title: 'Profile synced', description: 'Your profile has been updated with your Google account info.' });
      }
    } catch {
      toast({ title: 'Sync failed', description: 'Could not sync with Google account.', variant: 'destructive' });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast({ title: 'Username required', description: 'Please enter a username.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ username: username.trim(), full_name: fullName.trim() || null, bio: bio.trim() || null } as any);
      toast({ title: 'Profile updated', description: 'Your changes have been saved successfully.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    if (newEmail === profile?.email) {
      toast({ title: 'Same email', description: 'The new email is the same as your current email.', variant: 'destructive' });
      return;
    }
    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({ title: 'Verification email sent', description: 'Please check your new email and click the confirmation link.' });
      setEmailDialogOpen(false);
      setNewEmail('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to change email.', variant: 'destructive' });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  const handleChangePassword = async () => {
    if (passwordLockoutUntil && new Date() < passwordLockoutUntil) {
      const minutesLeft = Math.ceil((passwordLockoutUntil.getTime() - Date.now()) / 60000);
      toast({ title: 'Too many attempts', description: `Please try again in ${minutesLeft} minute(s).`, variant: 'destructive' });
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'All fields required', description: 'Please fill in all password fields.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please make sure your passwords match.', variant: 'destructive' });
      return;
    }
    if (newPassword === currentPassword) {
      toast({ title: 'Same password', description: 'New password must be different.', variant: 'destructive' });
      return;
    }
    const { valid, message } = validatePassword(newPassword);
    if (!valid) {
      toast({ title: 'Weak password', description: message, variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: profile?.email || '', password: currentPassword });
      if (signInError) {
        const newAttempts = failedPasswordAttempts + 1;
        setFailedPasswordAttempts(newAttempts);
        if (newAttempts >= 3) {
          const lockout = new Date(); lockout.setMinutes(lockout.getMinutes() + 15);
          setPasswordLockoutUntil(lockout);
          toast({ title: 'Too many failed attempts', description: 'Password change locked for 15 minutes.', variant: 'destructive' });
        } else {
          toast({ title: 'Verification failed', description: `${3 - newAttempts} attempt(s) remaining.`, variant: 'destructive' });
        }
        setIsChangingPassword(false);
        return;
      }
      setFailedPasswordAttempts(0);
      setPasswordLockoutUntil(null);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password changed', description: 'Your password has been updated successfully.' });
      setPasswordDialogOpen(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setShowCurrentPassword(false); setShowNewPassword(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to change password.', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    setNotifications(enabled);
    setIsSavingSettings(true);
    try {
      await updateProfile({ notification_enabled: enabled } as any);
      toast({ title: enabled ? 'Notifications enabled' : 'Notifications disabled' });
    } catch {
      setNotifications(!enabled);
      toast({ title: 'Error', description: 'Failed to update settings.', variant: 'destructive' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePrivacyChange = async (enabled: boolean) => {
    setIsPublicProfile(enabled);
    setIsSavingSettings(true);
    try {
      await updateProfile({ is_public: enabled } as any);
      toast({ title: 'Privacy updated', description: enabled ? 'Your profile is now public.' : 'Your profile is now private.' });
    } catch {
      setIsPublicProfile(!enabled);
      toast({ title: 'Error', description: 'Failed to update privacy settings.', variant: 'destructive' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' }); return; }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete account');
      await signOut();
      toast({ title: 'Account deleted', description: 'Your account and all data have been permanently deleted.' });
      window.location.href = '/';
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete account.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 pb-20">
      <AppTopbar title="Settings" />
      <AnalyticsGuide open={showAnalyticsGuide} onClose={() => setShowAnalyticsGuide(false)} />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-16 h-16 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{profile?.full_name || profile?.username || 'User'}</h1>
              {isGoogleUser && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                  Google
                </Badge>
              )}
              {userIsAdmin && <Badge className="bg-primary">Admin</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4 hidden sm:inline" />Profile</TabsTrigger>
            <TabsTrigger value="account" className="gap-2"><KeyRound className="w-4 h-4 hidden sm:inline" />Account</TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2"><Palette className="w-4 h-4 hidden sm:inline" />Preferences</TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2"><Shield className="w-4 h-4 hidden sm:inline" />Privacy</TabsTrigger>
          </TabsList>
          
          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-6">
            {isGoogleUser && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                  </div>
                  <div>
                    <p className="font-medium">Connected to Google</p>
                    <p className="text-sm text-muted-foreground">Your profile syncs with your Google account</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSyncGoogleProfile} disabled={isSyncingGoogle} className="gap-2">
                  {isSyncingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sync Now
                </Button>
              </div>
            )}
            
            <div className="p-6 rounded-2xl bg-card/50 border border-border/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Profile Information</h3>
                  <p className="text-xs text-muted-foreground">Update your personal details</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your unique username" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="mt-1" disabled={isGoogleUser} />
                    {isGoogleUser && <p className="text-xs text-muted-foreground mt-1">Synced from Google account</p>}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." className="mt-1 min-h-[100px] resize-none" maxLength={500} />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/500</p>
                </div>
                
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                  {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* ACCOUNT TAB */}
          <TabsContent value="account" className="space-y-6">
            {/* Email Section */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Email Address</h3>
                  <p className="text-xs text-muted-foreground">Manage your email address</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Current Email</Label>
                  <Input value={profile?.email || ''} disabled className="mt-1 opacity-60" />
                </div>
                
                {isGoogleUser ? (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/20">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Email is managed by your Google account and cannot be changed here.
                    </p>
                  </div>
                ) : (
                  <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                    <Button variant="outline" onClick={() => setEmailDialogOpen(true)} className="gap-2">
                      <Mail className="w-4 h-4" /> Change Email
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Email Address</DialogTitle>
                        <DialogDescription>Enter your new email address. You'll need to verify it before the change takes effect.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>New Email Address</Label>
                          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email" className="mt-1" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangeEmail} disabled={isChangingEmail}>
                          {isChangingEmail ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Verification'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
            
            {/* Password Section */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Password</h3>
                  <p className="text-xs text-muted-foreground">Update your password</p>
                </div>
              </div>
              
              {isGoogleUser ? (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/20">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    You signed in with Google. Password is managed by your Google account.
                  </p>
                </div>
              ) : (
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <Button variant="outline" onClick={() => setPasswordDialogOpen(true)} className="gap-2">
                    <Lock className="w-4 h-4" /> Change Password
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Current Password</Label>
                        <div className="relative mt-1">
                          <Input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="pr-10" />
                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label>New Password</Label>
                        <div className="relative mt-1">
                          <Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="pr-10" />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {passwordStrength && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Password strength</span>
                              <span className={cn(passwordStrength.score >= 3 ? 'text-green-500' : passwordStrength.score >= 2 ? 'text-amber-500' : 'text-red-500')}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <Progress value={passwordStrength.score * 25} className={cn("h-1", passwordStrength.score >= 3 ? '[&>div]:bg-green-500' : passwordStrength.score >= 2 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500')} />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label>Confirm New Password</Label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="mt-1" />
                        {confirmPassword && newPassword !== confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                        {isChangingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Changing...</> : 'Change Password'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {/* Admin Access */}
            {userIsAdmin && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border-2 border-primary/30 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl flex items-center gap-2">Admin Access <Badge className="bg-primary">ADMIN</Badge></h3>
                    <p className="text-sm text-muted-foreground">Full system control panel</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/app/admin/verify')} className="w-full bg-gradient-to-r from-primary to-accent gap-2 h-12 font-semibold">
                  <Shield className="w-5 h-5" /> Access Admin Dashboard
                </Button>
              </div>
            )}
            
            {/* Sign Out Section */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/20 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sign Out</h3>
                  <p className="text-xs text-muted-foreground">Sign out from your account on this device</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/20">
                <div>
                  <p className="text-sm text-foreground font-medium">Signed in as</p>
                  <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="gap-2 border-muted-foreground/30 hover:bg-muted hover:border-muted-foreground/50">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <LogOut className="w-5 h-5" /> Sign out of StarPath?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You'll need to sign in again to access your habits, goals, and progress. Your data will be safely stored.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={async () => {
                          await signOut();
                          navigate('/');
                        }}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Sign Out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>
          
          {/* PREFERENCES TAB */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Theme & Appearance */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Theme</h3>
                  <p className="text-xs text-muted-foreground">Choose a theme that fits your style</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Currently using <span className="font-medium text-foreground">{themeInfo.name}</span> ({themeInfo.colorMode} mode)
                </p>
                <ThemeSelector />
              </div>
            </div>
            
            {/* Notifications */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Notifications</h3>
                  <p className="text-xs text-muted-foreground">Manage notification preferences</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-medium">In-App Notifications</span>
                    <p className="text-xs text-muted-foreground">Receive notifications for achievements, messages, and friend requests</p>
                  </div>
                </div>
                <Switch checked={notifications} onCheckedChange={handleNotificationsChange} disabled={isSavingSettings} />
              </div>
            </div>
            
            {/* Help & Tutorials */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/20 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Help & Tutorials</h3>
                  <p className="text-xs text-muted-foreground">Get started with guides</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="gap-2" onClick={() => { resetTutorial(); toast({ title: 'Tutorial reset', description: 'Go to Dashboard to see the tutorial again.' }); }}>
                  <HelpCircle className="w-4 h-4" /> Replay Welcome Tutorial
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setShowAnalyticsGuide(true)}>
                  <BarChart3 className="w-4 h-4" /> Replay Analytics Guide
                </Button>
              </div>
            </div>
            
            {/* Support Links */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Support & Policies</h3>
                  <p className="text-xs text-muted-foreground">Contact us and view policies</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-between group" onClick={() => window.open('/app/contact', '_blank')}>
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /><span>Contact Us</span></div>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
                <Button variant="outline" className="w-full justify-between group" onClick={() => window.open('/app/shipping-policy', '_blank')}>
                  <div className="flex items-center gap-3"><Package className="w-4 h-4 text-primary" /><span>Shipping Policy</span></div>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
                <Button variant="outline" className="w-full justify-between group" onClick={() => window.open('/app/cancellation-refund', '_blank')}>
                  <div className="flex items-center gap-3"><RefreshCw className="w-4 h-4 text-primary" /><span>Cancellations & Refunds</span></div>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* PRIVACY TAB */}
          <TabsContent value="privacy" className="space-y-6">
            {/* Profile Visibility */}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Profile Visibility</h3>
                  <p className="text-xs text-muted-foreground">Control who can see your profile</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-medium">Public Profile</span>
                    <p className="text-xs text-muted-foreground">Allow other users to see your profile, achievements, and activity</p>
                  </div>
                </div>
                <Switch checked={isPublicProfile} onCheckedChange={handlePrivacyChange} disabled={isSavingSettings} />
              </div>
            </div>
            
            {/* Export Data */}
            <ExportDataSection />
            
            {/* Danger Zone */}
            <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-destructive">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">Irreversible account actions</p>
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Permanently Delete Account?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p className="font-semibold text-foreground">This action is IRREVERSIBLE and will permanently destroy:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>All your habits and completion history</li>
                        <li>All your goals and tasks</li>
                        <li>Your XP, level, streaks, and achievements</li>
                        <li>All session history and analytics data</li>
                        <li>All AI-generated content and library items</li>
                        <li>Your profile and all personal data</li>
                      </ul>
                      <p className="font-medium text-destructive">There is NO way to recover your account or data after deletion.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel, Keep My Account</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : 'Yes, Delete Everything'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
