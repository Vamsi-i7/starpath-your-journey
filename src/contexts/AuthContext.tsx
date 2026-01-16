import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/safeClient';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/errorLogger';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  xp: number;
  total_xp: number;
  streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  theme: string;
  notification_enabled: boolean;
  is_public: boolean;
  user_code: string | null;
  hearts: number;
  max_hearts: number;
  total_habits_completed: number;
  created_at: string;
  updated_at: string;
  // Additional fields
  ai_credits: number;
  is_admin: boolean;
  subscription_tier: string | null;
  last_daily_credit: string | null;
  account_status: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: string;
  xp_reward: number;
  streak: number;
  created_at: string;
  completedDates: string[];
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  progress: number;
  deadline: string | null;
  created_at: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
}

// Note: Theme management moved to ThemeContext for better performance
// AuthContext now only handles authentication and user profile

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ data: any; error: Error | null }>;
  signIn: (emailOrUserCode: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      logError('Profile Fetch', error);
      return null;
    }
    
    // If no profile exists yet, return null
    if (!data) return null;
    
    // Get the current user to access metadata (Google profile picture)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // If user has OAuth metadata, sync missing profile data in a single batch update
    if (currentUser?.user_metadata) {
      const googleAvatar = currentUser.user_metadata.avatar_url || currentUser.user_metadata.picture;
      const googleFullName = currentUser.user_metadata.full_name || currentUser.user_metadata.name;
      
      // Collect all updates needed
      const updates: Record<string, string> = {};
      
      if (googleAvatar && !data.avatar_url) {
        updates.avatar_url = googleAvatar;
        data.avatar_url = googleAvatar;
      }
      
      if (googleFullName && !data.full_name) {
        updates.full_name = googleFullName;
        data.full_name = googleFullName;
      }
      
      if (!data.username) {
        const fallbackUsername = googleFullName?.split(' ')[0] || data.email?.split('@')[0] || 'User';
        updates.username = fallbackUsername;
        data.username = fallbackUsername;
      }
      
      // Perform single batch update if there are any changes
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId);
      }
    }
    
    return data as UserProfile | null;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          full_name: username,
        },
      },
    });

    return { data, error: error as Error | null };
  };

  const signIn = async (emailOrUserCode: string, password: string) => {
    // Check if input looks like an email or user code
    const isEmail = emailOrUserCode.includes('@');
    
    let email = emailOrUserCode;
    
    if (!isEmail) {
      // It's a user code, look up the email
      const { data: profileData, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_code', emailOrUserCode.toUpperCase())
        .maybeSingle();
      
      if (lookupError || !profileData?.email) {
        return { error: new Error('Invalid User ID or password') };
      }
      
      email = profileData.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      await refreshProfile();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
