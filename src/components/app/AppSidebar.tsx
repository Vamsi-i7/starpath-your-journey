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
  ChevronLeft,
  ChevronRight,
  User,
  Award,
  X,
  Sparkles,
  CreditCard,
  Library,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import clawzerLogo from '@/assets/clawzer-logo.png';
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests';
import { useSidebar } from '@/contexts/SidebarContext';

interface AppSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Target, label: 'Habits', path: '/app/habits' },
  { icon: Trophy, label: 'Goals', path: '/app/goals' },
  { icon: Star, label: 'Constellation', path: '/app/constellation' },
  { icon: Award, label: 'Achievements', path: '/app/achievements' },
  { icon: BarChart3, label: 'Analytics', path: '/app/analytics' },
  { icon: MessageCircle, label: 'Chats', path: '/app/chats' },
  { icon: Users, label: 'Friends', path: '/app/friends', hasBadge: true },
  { icon: Sparkles, label: 'AI Tools', path: '/app/ai-tools' },
  { icon: MessageCircle, label: 'AI Mentor', path: '/app/ai-mentor', isPremium: true },
  { icon: Library, label: 'Library', path: '/app/library' },
  { icon: CreditCard, label: 'Subscription', path: '/app/subscription' },
];

export function AppSidebar({ isMobileOpen = false, onMobileClose }: AppSidebarProps) {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const pendingRequestsCount = usePendingFriendRequests();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = () => {
    // Close mobile menu when navigating
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 glass border-r border-border/30",
        // Desktop styles
        "hidden lg:flex",
        isCollapsed ? "lg:w-20" : "lg:w-64",
        // Mobile styles - slide in from left
        isMobileOpen && "!flex w-72 animate-slide-in-left"
      )}
    >
      {/* Mobile close button */}
      <button
        onClick={onMobileClose}
        className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-card/50 text-muted-foreground"
        aria-label="Close menu"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 p-5 border-b border-border/30">
        <img 
          src={clawzerLogo} 
          alt="StarPath" 
          className="h-10 w-auto flex-shrink-0 rounded-xl"
        />
        {(!isCollapsed || isMobileOpen) && (
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
          const showBadge = item.hasBadge && pendingRequestsCount > 0;
          const isPremium = item.isPremium;
          const hasPremiumAccess = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'lifetime';
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive: navIsActive }) => {
                // Use NavLink's isActive prop for accurate detection
                const activeState = navIsActive || isActive;
                
                // Determine styling based on premium status and active state
                let classes = "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative ";
                
                if (isPremium && !hasPremiumAccess) {
                  // Premium locked - gradient background
                  classes += "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-blue-500/20";
                } else if (activeState) {
                  // Active state - primary background
                  classes += "bg-primary text-primary-foreground glow";
                } else {
                  // Default state
                  classes += "text-muted-foreground hover:text-foreground hover:bg-card/50";
                }
                
                return classes;
              }}
            >
              <div className="relative">
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isPremium && !hasPremiumAccess 
                    ? "text-purple-500" 
                    : isActive 
                      ? "text-primary-foreground" 
                      : ""
                )} />
                {showBadge && (isCollapsed && !isMobileOpen) && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </span>
                )}
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <span className="font-medium flex-1">{item.label}</span>
              )}
              {isPremium && !hasPremiumAccess && (!isCollapsed || isMobileOpen) && (
                <Crown className="w-4 h-4 text-purple-500" />
              )}
              {isPremium && hasPremiumAccess && (!isCollapsed || isMobileOpen) && (
                <Crown className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-purple-500")} />
              )}
              {(!isCollapsed || isMobileOpen) && showBadge && (
                <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
                  {pendingRequestsCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/30 space-y-1">
        <NavLink
          to="/app/profile"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
            location.pathname === '/app/profile'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          )}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span className="font-medium">Profile</span>}
        </NavLink>

        <NavLink
          to="/app/settings"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
            location.pathname === '/app/settings'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span className="font-medium">Settings</span>}
        </NavLink>

        <button
          onClick={() => {
            handleLogout();
            handleNavClick();
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span className="font-medium">Logout</span>}
        </button>

        {profile && (
          <div className={cn(
            "mt-3 p-3 rounded-xl bg-card/30 border border-border/20", 
            isCollapsed && !isMobileOpen && "p-2"
          )}>
            <div className="flex items-center gap-3">
              <Avatar className={cn(
                "border-2 border-primary/30", 
                isCollapsed && !isMobileOpen ? "w-8 h-8" : "w-10 h-10"
              )}>
                <AvatarImage 
                  src={profile.avatar_url || undefined} 
                  alt={profile.username} 
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {(!isCollapsed || isMobileOpen) && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">{profile.username}</p>
                  <p className="text-xs text-muted-foreground">Level {profile.level}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop collapse button - hidden on mobile */}
      <button
        onClick={toggleCollapse}
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
