import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { Menu, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pullDistance, isRefreshing, handlers } = usePullToRefresh();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      {/* Mobile menu button - fixed at top */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/30 text-foreground"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <AppSidebar 
        isMobileOpen={isMobileMenuOpen} 
        onMobileClose={closeMobileMenu}
      />

      {/* Main content */}
      <main 
        {...handlers}
        className={cn(
          "flex-1 transition-all duration-300 overflow-x-hidden",
          "lg:ml-64" // Only add margin on desktop
        )}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {/* Pull to refresh indicator */}
        <div 
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-30 flex items-center justify-center transition-all duration-200 lg:hidden",
            pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
          )}
          style={{
            top: Math.max(pullDistance - 40, 8),
          }}
        >
          <div className={cn(
            "w-10 h-10 rounded-full bg-card border border-border/30 flex items-center justify-center shadow-lg",
            isRefreshing && "animate-pulse"
          )}>
            <Loader2 
              className={cn(
                "w-5 h-5 text-primary transition-transform",
                isRefreshing ? "animate-spin" : ""
              )} 
              style={{
                transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : undefined
              }}
            />
          </div>
        </div>
        
        <Outlet />
      </main>
    </div>
  );
}
