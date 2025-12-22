import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Trophy, 
  Star, 
  BarChart3, 
  MessageCircle, 
  Users, 
  Settings, 
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Target, label: 'Habits', path: '/app/habits' },
  { icon: Trophy, label: 'Goals', path: '/app/goals' },
  { icon: Star, label: 'Constellation', path: '/app/constellation' },
  { icon: Award, label: 'Achievements', path: '/app/achievements' },
  { icon: BarChart3, label: 'Analytics', path: '/app/analytics' },
  { icon: MessageCircle, label: 'Chats', path: '/app/chats' },
  { icon: Users, label: 'Friends', path: '/app/friends' },
];

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 glass border-r border-border/30",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center gap-3 p-5 border-b border-border/30">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 glow">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <span 
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            StarPath
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground glow" 
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-foreground")} />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/30 space-y-1">
        <NavLink
          to="/app/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
            location.pathname === '/app/profile'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          )}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Profile</span>}
        </NavLink>

        <NavLink
          to="/app/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
            location.pathname === '/app/settings'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Settings</span>}
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>

        {profile && !isCollapsed && (
          <div className="mt-3 p-3 rounded-xl bg-card/30 border border-border/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                {profile.username.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate text-sm">{profile.username}</p>
                <p className="text-xs text-muted-foreground">Level {profile.level}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
