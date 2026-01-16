import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeName = 
  | 'cosmic-focus' 
  | 'aurora-light' 
  | 'neo-glass' 
  | 'solar-drive' 
  | 'monochrome-pro' 
  | 'zen-garden';

export interface ThemeInfo {
  id: ThemeName;
  name: string;
  description: string;
  colorMode: 'light' | 'dark';
  preview: {
    background: string;
    primary: string;
    accent: string;
    card: string;
  };
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'cosmic-focus',
    name: 'Cosmic Focus',
    description: 'Deep space immersion for distraction-free productivity',
    colorMode: 'dark',
    preview: {
      background: 'hsl(230, 30%, 6%)',
      primary: 'hsl(250, 85%, 65%)',
      accent: 'hsl(280, 75%, 60%)',
      card: 'hsl(230, 25%, 10%)',
    },
  },
  {
    id: 'aurora-light',
    name: 'Aurora Light',
    description: 'Clean, breathable workspace for extended daily use',
    colorMode: 'light',
    preview: {
      background: 'hsl(220, 20%, 97%)',
      primary: 'hsl(250, 85%, 60%)',
      accent: 'hsl(280, 80%, 60%)',
      card: 'hsl(0, 0%, 100%)',
    },
  },
  {
    id: 'neo-glass',
    name: 'Neo-Glass',
    description: 'Modern premium SaaS aesthetic with depth',
    colorMode: 'dark',
    preview: {
      background: 'hsl(225, 25%, 8%)',
      primary: 'hsl(200, 100%, 50%)',
      accent: 'hsl(280, 100%, 65%)',
      card: 'hsl(225, 20%, 12%)',
    },
  },
  {
    id: 'solar-drive',
    name: 'Solar Drive',
    description: 'Energetic and motivational for habit momentum',
    colorMode: 'dark',
    preview: {
      background: 'hsl(30, 20%, 6%)',
      primary: 'hsl(35, 95%, 55%)',
      accent: 'hsl(15, 90%, 55%)',
      card: 'hsl(30, 15%, 11%)',
    },
  },
  {
    id: 'monochrome-pro',
    name: 'Monochrome Pro',
    description: 'Distraction-free editorial aesthetic',
    colorMode: 'dark',
    preview: {
      background: 'hsl(0, 0%, 4%)',
      primary: 'hsl(0, 0%, 95%)',
      accent: 'hsl(0, 0%, 80%)',
      card: 'hsl(0, 0%, 9%)',
    },
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden',
    description: 'Nature-inspired calm for mental wellness',
    colorMode: 'dark',
    preview: {
      background: 'hsl(150, 15%, 8%)',
      primary: 'hsl(150, 50%, 45%)',
      accent: 'hsl(40, 45%, 55%)',
      card: 'hsl(150, 12%, 12%)',
    },
  },
];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeInfo: ThemeInfo;
  resolvedColorMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'starpath-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
      if (stored && THEMES.find(t => t.id === stored)) {
        return stored;
      }
      // Check system preference for initial theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'cosmic-focus' : 'aurora-light';
    }
    return 'cosmic-focus';
  });

  const themeInfo = THEMES.find(t => t.id === theme) || THEMES[0];
  const resolvedColorMode = themeInfo.colorMode;

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove all theme classes and data attributes
    THEMES.forEach(t => {
      root.classList.remove(`theme-${t.id}`);
    });
    root.classList.remove('dark', 'light');
    
    // Set data-theme attribute
    root.setAttribute('data-theme', theme);
    
    // Add color mode class for Tailwind dark mode
    root.classList.add(resolvedColorMode);
    
    // Store preference
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, resolvedColorMode]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeInfo, resolvedColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
