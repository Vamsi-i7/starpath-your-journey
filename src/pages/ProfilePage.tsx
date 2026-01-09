import { AppTopbar } from '@/components/app/AppTopbar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, Copy, Check, Loader2, Save, X, Camera, Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/safeClient';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { validatePassword } from '@/lib/passwordValidation';
import { AvatarCropper } from '@/components/profile/AvatarCropper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ProfilePage = () => {
  const { profile, user, updateProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  
  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Copy state
  const [copied, setCopied] = useState(false);
  
  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const usernameChanged = username !== (profile.username || '');
      const bioChanged = bio !== (profile.bio || '');
      setHasChanges(usernameChanged || bioChanged);
    }
  }, [username, bio, profile]);

  const handleCopyUserCode = async () => {
    if (profile?.user_code) {
      await navigator.clipboard.writeText(profile.user_code);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'User ID copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
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

    if (username.length > 50) {
      toast({
        title: 'Username too long',
        description: 'Username must be less than 50 characters.',
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
      setHasChanges(false);
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

  const handleCancelChanges = () => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
    setHasChanges(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Create object URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
    setShowCropper(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setShowCropper(false);
    setIsUploadingAvatar(true);

    try {
      const fileName = `avatar.jpg`;
      const filePath = `${user.id}/${fileName}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(filesToDelete);
      }

      // Upload cropped avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting parameter
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: avatarUrl });
      await refreshProfile();

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      // Clean up object URL
      if (cropperImage) {
        URL.revokeObjectURL(cropperImage);
        setCropperImage(null);
      }
    }
  };

  const handleCropperClose = () => {
    setShowCropper(false);
    if (cropperImage) {
      URL.revokeObjectURL(cropperImage);
      setCropperImage(null);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return;

    setIsUploadingAvatar(true);
    try {
      // Delete avatar from storage
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(filesToDelete);
      }

      // Update profile to remove avatar URL
      await updateProfile({ avatar_url: null });
      await refreshProfile();

      toast({
        title: 'Avatar removed',
        description: 'Your profile picture has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter a new email address.',
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast({
        title: 'Verification email sent',
        description: 'Please check your new email to confirm the change.',
      });
      setEmailDialogOpen(false);
      setNewEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePassword = async () => {
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
        email: profile?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: 'Incorrect password',
          description: 'Current password is incorrect.',
          variant: 'destructive',
        });
        setIsChangingPassword(false);
        return;
      }

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

  return (
    <>
      {/* Avatar Cropper Modal */}
      {cropperImage && (
        <AvatarCropper
          imageSrc={cropperImage}
          open={showCropper}
          onClose={handleCropperClose}
          onCropComplete={handleCropComplete}
        />
      )}

      <div className="min-h-screen pb-20">
      <AppTopbar title="Profile" />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* User ID Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <Avatar className="w-20 h-20 border-4 border-primary/30">
                <AvatarImage 
                  src={profile?.avatar_url || undefined} 
                  alt={profile?.username || 'User avatar'} 
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground">
                  {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                {profile?.username}
              </h2>
              <p className="text-sm text-muted-foreground">Level {profile?.level || 1}</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  {isUploadingAvatar ? 'Processing...' : 'Change photo'}
                </button>
                {profile?.avatar_url && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-xl bg-card/50 border border-border/30">
            <Shield className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Your Unique User ID</p>
              <p className="font-mono font-bold text-foreground">{profile?.user_code || 'Generating...'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyUserCode}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="w-4 h-4 text-xp" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            You can use this User ID to log in instead of your email
          </p>
        </div>

        {/* Profile Information */}
        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Profile Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                maxLength={50}
                className="mt-1" 
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <Label>Bio</Label>
              <Textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                className="mt-1 resize-none" 
                placeholder="Tell us about yourself..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">{bio.length}/200 characters</p>
            </div>
            
            {hasChanges && (
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCancelChanges}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Email Settings */}
        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Email Address</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Current Email</Label>
              <Input 
                value={profile?.email || user?.email || ''} 
                disabled
                className="mt-1 opacity-60" 
              />
            </div>
            
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Change Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Email Address</DialogTitle>
                  <DialogDescription>
                    A verification link will be sent to your new email address.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>New Email Address</Label>
                    <Input 
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="newemail@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleChangeEmail}
                    disabled={isChangingEmail}
                  >
                    {isChangingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Password Settings */}
        <div className="p-6 rounded-2xl bg-card border border-border/30">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Password</h3>
          </div>
          
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and choose a new one.
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
      </div>
    </div>
    </>
  );
};

export default ProfilePage;