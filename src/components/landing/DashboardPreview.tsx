import { useTheme } from '@/contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Target, 
  Trophy, 
  Star, 
  BarChart3, 
  Settings,
  Check,
  Flame,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardPreview() {
  const { resolvedColorMode } = useTheme();

  const mockHabits = [
    { name: 'Morning Meditation', icon: '🧘', completed: true, streak: 12 },
    { name: 'Read 30 minutes', icon: '📚', completed: true, streak: 8 },
    { name: 'Exercise', icon: '💪', completed: false, streak: 5 },
    { name: 'Learn Spanish', icon: '🇪🇸', completed: false, streak: 3 },
  ];

  const mockNav = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Target, label: 'Habits', active: false },
    { icon: Trophy, label: 'Goals', active: false },
    { icon: Star, label: 'Constellation', active: false },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            See Your Dashboard in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Preview how your personalized dashboard will look. Try changing the theme and accent color above!
          </p>
        </div>

        {/* Dashboard Preview Container */}
        <div className="relative">
          {/* Browser Chrome */}
          <div className="rounded-2xl overflow-hidden border border-border/50 shadow-elevated">
            {/* Browser Header */}
            <div className="bg-card/80 backdrop-blur-sm border-b border-border/30 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-streak/60" />
                <div className="w-3 h-3 rounded-full bg-xp/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-background/50 rounded-lg px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                  <span className="opacity-50">🔒</span>
                  starpath.app/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="bg-background flex" style={{ height: '400px' }}>
              {/* Mini Sidebar */}
              <div className="w-48 bg-card/50 border-r border-border/30 p-3 hidden sm:block">
                <div className="flex items-center gap-2 mb-6 p-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Star className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-sm text-foreground">StarPath</span>
                </div>
                <nav className="space-y-1">
                  {mockNav.map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                        item.active 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-card/50"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-4 overflow-hidden">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-card rounded-xl p-3 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Habits</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">4</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4 text-xp" />
                      <span className="text-xs text-muted-foreground">Done</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">2/4</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-border/30 hidden md:block">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-4 h-4 text-streak" />
                      <span className="text-xs text-muted-foreground">Streak</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">28</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-border/30 hidden md:block">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-star" />
                      <span className="text-xs text-muted-foreground">XP</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">2,450</p>
                  </div>
                </div>

                {/* Habits List */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Today's Habits</h3>
                  {mockHabits.map((habit, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                        habit.completed 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-card border-border/30"
                      )}
                    >
                      <span className="text-lg">{habit.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          habit.completed ? "text-foreground" : "text-foreground"
                        )}>
                          {habit.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Flame className="w-3 h-3 text-streak" />
                          {habit.streak} day streak
                        </p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors",
                        habit.completed 
                          ? "bg-primary border-primary" 
                          : "border-border"
                      )}>
                        {habit.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Gamification */}
              <div className="w-48 bg-card/30 border-l border-border/30 p-3 hidden lg:block">
                <div className="bg-card rounded-xl p-3 border border-border/30 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs">
                      J
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">John</p>
                      <p className="text-xs text-muted-foreground">Level 12</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">650 / 1000 XP</p>
                </div>

                <div className="bg-card rounded-xl p-3 border border-border/30">
                  <p className="text-xs font-medium text-foreground mb-2">Recent Achievements</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-star/20 flex items-center justify-center">
                        <Trophy className="w-3 h-3 text-star" />
                      </div>
                      <span className="text-xs text-muted-foreground">First Week</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Star className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Habit Master</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-3xl -z-10 opacity-50" />
        </div>

        {/* Caption */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ✨ This preview updates live as you change theme and accent colors
        </p>
      </div>
    </section>
  );
}
