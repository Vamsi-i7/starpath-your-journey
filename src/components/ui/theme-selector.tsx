import { useTheme, THEMES, ThemeName } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Check, Monitor, Sparkles } from 'lucide-react';

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-4", className)}>
      {THEMES.map((themeOption) => {
        const isActive = theme === themeOption.id;
        
        return (
          <button
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id)}
            className={cn(
              "group relative rounded-2xl p-1 transition-all duration-300",
              "hover:scale-[1.02] active:scale-[0.98]",
              isActive 
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                : "hover:ring-1 hover:ring-border"
            )}
          >
            {/* Theme Preview Card */}
            <div 
              className="relative rounded-xl overflow-hidden aspect-[4/3]"
              style={{ backgroundColor: themeOption.preview.background }}
            >
              {/* Mini Dashboard Preview */}
              <div className="absolute inset-0 p-2 flex flex-col">
                {/* Mini Sidebar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1/4 opacity-60"
                  style={{ backgroundColor: themeOption.preview.card }}
                >
                  <div className="p-1.5 space-y-1">
                    {[...Array(4)].map((_, i) => (
                      <div 
                        key={i}
                        className="h-1.5 rounded-full"
                        style={{ 
                          backgroundColor: i === 0 
                            ? themeOption.preview.primary 
                            : `${themeOption.preview.primary}40`,
                          width: i === 0 ? '100%' : '70%'
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Mini Content Area */}
                <div className="ml-[28%] flex-1 flex flex-col gap-1.5 p-1">
                  {/* Header bar */}
                  <div 
                    className="h-2 w-16 rounded-full opacity-80"
                    style={{ backgroundColor: themeOption.preview.primary }}
                  />
                  
                  {/* Cards grid */}
                  <div className="flex gap-1 flex-1">
                    <div 
                      className="flex-1 rounded-md opacity-70"
                      style={{ backgroundColor: themeOption.preview.card }}
                    />
                    <div 
                      className="flex-1 rounded-md opacity-70"
                      style={{ backgroundColor: themeOption.preview.card }}
                    />
                  </div>
                  
                  {/* Bottom card */}
                  <div 
                    className="h-6 rounded-md opacity-60"
                    style={{ backgroundColor: themeOption.preview.card }}
                  >
                    <div 
                      className="h-full rounded-md"
                      style={{ 
                        background: `linear-gradient(90deg, ${themeOption.preview.primary}40 0%, ${themeOption.preview.accent}40 100%)`,
                        width: '60%'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              
              {/* Color mode badge */}
              <div 
                className={cn(
                  "absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider",
                  themeOption.colorMode === 'dark' 
                    ? "bg-black/50 text-white" 
                    : "bg-white/80 text-black"
                )}
              >
                {themeOption.colorMode}
              </div>
            </div>
            
            {/* Theme Info */}
            <div className="p-3 text-left">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  "font-semibold text-sm transition-colors",
                  isActive ? "text-primary" : "text-foreground"
                )}>
                  {themeOption.name}
                </h4>
                {themeOption.id === 'neo-glass' && (
                  <Sparkles className="w-3 h-3 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {themeOption.description}
              </p>
              
              {/* Color swatches */}
              <div className="flex gap-1.5 mt-2">
                <div 
                  className="w-4 h-4 rounded-full border border-border/50"
                  style={{ backgroundColor: themeOption.preview.primary }}
                  title="Primary"
                />
                <div 
                  className="w-4 h-4 rounded-full border border-border/50"
                  style={{ backgroundColor: themeOption.preview.accent }}
                  title="Accent"
                />
                <div 
                  className="w-4 h-4 rounded-full border border-border/50"
                  style={{ backgroundColor: themeOption.preview.card }}
                  title="Card"
                />
                <div 
                  className="w-4 h-4 rounded-full border border-border/50"
                  style={{ backgroundColor: themeOption.preview.background }}
                  title="Background"
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Compact theme selector for quick switching
export function ThemeSelectorCompact({ className }: ThemeSelectorProps) {
  const { theme, setTheme, themeInfo } = useTheme();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {THEMES.map((themeOption) => {
        const isActive = theme === themeOption.id;
        
        return (
          <button
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id)}
            className={cn(
              "relative w-8 h-8 rounded-full transition-all duration-200",
              "hover:scale-110 active:scale-95",
              "ring-offset-background",
              isActive 
                ? "ring-2 ring-primary ring-offset-2" 
                : "ring-1 ring-border hover:ring-primary/50"
            )}
            style={{ backgroundColor: themeOption.preview.background }}
            title={themeOption.name}
          >
            <div 
              className="absolute inset-1 rounded-full"
              style={{ 
                background: `linear-gradient(135deg, ${themeOption.preview.primary} 0%, ${themeOption.preview.accent} 100%)`
              }}
            />
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="w-4 h-4 text-white drop-shadow-md" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
