import { AppTopbar } from '@/components/app/AppTopbar';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { User, Mail, Loader2, Camera, Upload, Trash2, Trophy, Flame, Star, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/safeClient';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AvatarCropper } from '@/components/profile/AvatarCropper';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

const ProfilePage = () => {
  const { profile, user, updateProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Calculate XP progress to next level
  const xpPerLevel = 500;
  const currentXp = profile?.xp || 0;
  const xpProgress = (currentXp / xpPerLevel) * 100;

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

      <div className="min-h-screen pb-20 bg-background">
        <AppTopbar title="Profile" />
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
          
          {/* Profile Header Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar with upload */}
              <div className="relative group">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-primary/30 shadow-lg">
                  <AvatarImage 
                    src={profile?.avatar_url || undefined} 
                    alt={profile?.username || 'User avatar'} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-3xl font-bold text-primary-foreground">
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
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {profile?.username || 'User'}
                </h2>
                {profile?.bio && (
                  <p className="text-muted-foreground mt-1 text-sm">{profile.bio}</p>
                )}
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
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

            {/* Level Progress */}
            <div className="mt-6 p-4 rounded-xl bg-card/50 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Level {profile?.level || 1}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {currentXp} / {xpPerLevel} XP
                </span>
              </div>
              <Progress value={xpProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {xpPerLevel - currentXp} XP to next level
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{profile?.total_xp || 0}</div>
              <div className="text-xs text-muted-foreground">Total XP</div>
            </div>
            
            <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{profile?.streak || 0}</div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
            </div>
            
            <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                <Star className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{profile?.longest_streak || 0}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
            
            <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{profile?.total_habits_completed || 0}</div>
              <div className="text-xs text-muted-foreground">Habits Completed</div>
            </div>
          </div>

          {/* Profile Information - View Only */}
          <div className="p-6 rounded-2xl bg-card border border-border/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Profile Information</h3>
                <p className="text-xs text-muted-foreground">Your account details</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/20">
                <div className="text-xs text-muted-foreground mb-1">Username</div>
                <div className="font-medium text-foreground">{profile?.username || 'Not set'}</div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Mail className="w-3 h-3" />
                  Email Address
                </div>
                <div className="font-medium text-foreground">{profile?.email || user?.email || 'Not set'}</div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30 border border-border/20">
                <div className="text-xs text-muted-foreground mb-1">Member Since</div>
                <div className="font-medium text-foreground">
                  {profile?.created_at 
                    ? format(new Date(profile.created_at), 'MMMM d, yyyy')
                    : 'Unknown'}
                </div>
              </div>

              {profile?.bio && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/20">
                  <div className="text-xs text-muted-foreground mb-1">Bio</div>
                  <div className="text-foreground">{profile.bio}</div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 p-3 rounded-lg bg-muted/20 border border-border/10">
              💡 To change your email, password, or other account settings, go to <span className="font-medium text-primary">Settings → Account</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
