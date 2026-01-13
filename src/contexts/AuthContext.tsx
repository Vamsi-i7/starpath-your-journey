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

export interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  status: 'online' | 'offline';
  level: number;
}

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'default' | 'blue' | 'violet' | 'emerald' | 'rose' | 'amber';

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
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Theme utilities
const getSystemTheme = (): ThemeMode => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

const getStoredTheme = (): ThemeMode | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('starpath-theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  }
  return null;
};

const setStoredTheme = (theme: ThemeMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('starpath-theme', theme);
  }
};

const getStoredAccent = (): AccentColor => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('starpath-accent');
    if (['default', 'blue', 'violet', 'emerald', 'rose', 'amber'].includes(stored || '')) {
      return stored as AccentColor;
    }
  }
  return 'default';
};

const setStoredAccent = (accent: AccentColor) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('starpath-accent', accent);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize theme from localStorage or system preference
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = getStoredTheme();
    return stored ?? getSystemTheme();
  });

  // Initialize accent from localStorage
  const [accent, setAccentState] = useState<AccentColor>(getStoredAccent);
  
  const { toast } = useToast();

  // Apply theme and accent to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove old theme classes
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    setStoredTheme(theme);
    
    // Remove old accent classes
    root.classList.remove('accent-blue', 'accent-violet', 'accent-emerald', 'accent-rose', 'accent-amber');
    if (accent !== 'default') {
      root.classList.add(`accent-${accent}`);
    }
    setStoredAccent(accent);
  }, [theme, accent]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      const stored = getStoredTheme();
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
  };

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
    
    // If user has Google profile picture but it's not in the database, update it
    if (currentUser?.user_metadata) {
      const googleAvatar = currentUser.user_metadata.avatar_url || currentUser.user_metadata.picture;
      const googleFullName = currentUser.user_metadata.full_name || currentUser.user_metadata.name;
      
      // Update profile with Google data if missing
      if (googleAvatar && !data.avatar_url) {
        await supabase
          .from('profiles')
          .update({ avatar_url: googleAvatar })
          .eq('id', userId);
        data.avatar_url = googleAvatar;
      }
      
      if (googleFullName && !data.full_name) {
        await supabase
          .from('profiles')
          .update({ full_name: googleFullName })
          .eq('id', userId);
        data.full_name = googleFullName;
      }
      
      // If username is missing, use email or full name
      if (!data.username) {
        const fallbackUsername = googleFullName?.split(' ')[0] || data.email?.split('@')[0] || 'User';
        await supabase
          .from('profiles')
          .update({ username: fallbackUsername })
          .eq('id', userId);
        data.username = fallbackUsername;
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
      theme,
      toggleTheme,
      setTheme,
      accent,
      setAccent,
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
