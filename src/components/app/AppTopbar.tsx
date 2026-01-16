import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface AppTopbarProps {
  title: string;
}

export function AppTopbar({ title }: AppTopbarProps) {
  const { profile } = useAuth();
  const { theme, setTheme, resolvedColorMode } = useTheme();

  // Quick toggle between light/dark themes
  const toggleTheme = () => {
    if (resolvedColorMode === 'dark') {
      setTheme('aurora-light');
    } else {
      setTheme('cosmic-focus');
    }
  };



  return (
    <header className="sticky top-0 z-50 h-16 sm:h-18 flex items-center justify-between px-4 sm:px-8 border-b border-border/20 bg-background/80 backdrop-blur-2xl shadow-sm">
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent items-center justify-center text-white font-bold shadow-lg">
          C
        </div>
        <div>
          <h1 
            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Track. Achieve. Succeed.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="relative text-muted-foreground hover:text-foreground hover:bg-card/80 w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all"
          title={resolvedColorMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {resolvedColorMode === 'dark' ? (
            <Sun className="w-5 h-5 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
          )}
        </Button>

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-1 pr-3 sm:pr-4 rounded-full hover:bg-card/80 transition-all border border-border/30 hover:border-primary/30">
              <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-primary/20 ring-2 ring-background">
                <AvatarImage 
                  src={profile?.avatar_url || undefined} 
                  alt={profile?.username || 'User'} 
                />
                <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground font-bold text-sm">
                  {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-foreground">{profile?.username || 'User'}</div>
                <div className="text-xs text-muted-foreground">View profile</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{profile?.username}</span>
                <span className="text-sm text-muted-foreground font-normal">{profile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/settings">Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
