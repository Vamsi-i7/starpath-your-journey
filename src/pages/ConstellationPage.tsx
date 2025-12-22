import { useState, useEffect, useRef, useCallback } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Star, Zap, Heart, TrendingUp } from 'lucide-react';

interface StarNode {
  id: string;
  x: number;
  y: number;
  size: number;
  brightness: number;
  habitName: string;
  streak: number;
  isCompleted: boolean;
  color: string;
}

interface ConstellationStats {
  totalStars: number;
  brightStars: number;
  totalStreak: number;
  completionRate: number;
}

const ConstellationPage = () => {
  const { habits, isLoading: habitsLoading, getTodayString } = useHabits();
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStar, setHoveredStar] = useState<StarNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Calculate canvas size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.min(rect.width - 48, 1000),
          height: Math.min(600, window.innerHeight - 300),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Generate stars from habits
  const stars: StarNode[] = habits.map((habit, index) => {
    const angle = (index / Math.max(habits.length, 1)) * Math.PI * 2;
    const radius = 100 + (habit.streak * 5) + Math.sin(index * 1.5) * 50;
    const today = getTodayString();
    const isCompleted = habit.completedDates.includes(today);
    
    // Color based on habit color
    const colorMap: Record<string, string> = {
      primary: 'hsl(250, 85%, 65%)',
      secondary: 'hsl(220, 15%, 55%)',
      streak: 'hsl(35, 95%, 55%)',
      destructive: 'hsl(350, 85%, 60%)',
    };
    
    return {
      id: habit.id,
      x: canvasSize.width / 2 + Math.cos(angle) * radius,
      y: canvasSize.height / 2 + Math.sin(angle) * radius,
      size: 6 + Math.min(habit.streak * 0.8, 20),
      brightness: isCompleted ? 1 : 0.3,
      habitName: habit.name,
      streak: habit.streak,
      isCompleted,
      color: colorMap[habit.color] || colorMap.primary,
    };
  });

  // Calculate constellation stats
  const stats: ConstellationStats = {
    totalStars: habits.length,
    brightStars: habits.filter(h => h.completedDates.includes(getTodayString())).length,
    totalStreak: habits.reduce((sum, h) => sum + h.streak, 0),
    completionRate: habits.length > 0 
      ? Math.round((habits.filter(h => h.completedDates.includes(getTodayString())).length / habits.length) * 100)
      : 0,
  };

  // Animated drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.02;
    const time = timeRef.current;

    // Clear with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, 'hsl(230, 30%, 6%)');
    bgGradient.addColorStop(0.5, 'hsl(250, 40%, 10%)');
    bgGradient.addColorStop(1, 'hsl(280, 35%, 8%)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle background stars
    for (let i = 0; i < 100; i++) {
      const bx = (Math.sin(i * 234.5) * 0.5 + 0.5) * canvas.width;
      const by = (Math.cos(i * 123.4) * 0.5 + 0.5) * canvas.height;
      const bSize = 0.5 + Math.sin(time + i) * 0.3;
      const bOpacity = 0.2 + Math.sin(time * 0.5 + i * 0.1) * 0.1;
      
      ctx.beginPath();
      ctx.arc(bx, by, bSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${bOpacity})`;
      ctx.fill();
    }

    // Draw constellation lines
    ctx.lineWidth = 1;
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const dist = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
        if (dist < 180) {
          const opacity = Math.max(0, (180 - dist) / 180) * 0.4;
          const bothCompleted = stars[i].isCompleted && stars[j].isCompleted;
          
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.strokeStyle = bothCompleted 
            ? `rgba(139, 92, 246, ${opacity})` 
            : `rgba(100, 100, 140, ${opacity * 0.5})`;
          ctx.stroke();
        }
      }
    }

    // Draw stars
    stars.forEach(star => {
      const twinkle = 0.9 + Math.sin(time * 2 + parseFloat(star.id.replace(/\D/g, '') || '0') * 0.1) * 0.1;
      const currentBrightness = star.brightness * twinkle;
      
      // Outer glow
      const glowRadius = star.size * 3;
      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowRadius);
      glow.addColorStop(0, star.isCompleted 
        ? `rgba(250, 204, 21, ${currentBrightness * 0.6})` 
        : `rgba(150, 150, 180, ${currentBrightness * 0.3})`);
      glow.addColorStop(0.5, star.isCompleted 
        ? `rgba(250, 204, 21, ${currentBrightness * 0.2})` 
        : `rgba(150, 150, 180, ${currentBrightness * 0.1})`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Star core
      const coreGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size);
      coreGradient.addColorStop(0, `rgba(255, 255, 255, ${currentBrightness})`);
      coreGradient.addColorStop(0.4, star.isCompleted 
        ? `rgba(250, 230, 150, ${currentBrightness * 0.8})` 
        : `rgba(180, 180, 200, ${currentBrightness * 0.5})`);
      coreGradient.addColorStop(1, star.isCompleted 
        ? `rgba(250, 204, 21, ${currentBrightness * 0.3})` 
        : `rgba(120, 120, 150, ${currentBrightness * 0.2})`);
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Inner bright point
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${currentBrightness})`;
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(draw);
  }, [stars, canvasSize]);

  useEffect(() => {
    if (!habitsLoading) {
      draw();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, habitsLoading]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x: e.clientX, y: e.clientY });

    const hovered = stars.find(star => Math.hypot(star.x - x, star.y - y) < star.size + 15);
    setHoveredStar(hovered || null);
  };

  if (habitsLoading) {
    return (
      <div className="min-h-screen">
        <AppTopbar title="Constellation" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppTopbar title="Constellation" />
      <div className="p-6">
        <p className="text-muted-foreground mb-6">
          Your habits form a constellation. Completed habits shine bright! Build streaks to grow your stars.
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalStars}</p>
              <p className="text-xs text-muted-foreground">Total Stars</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-star/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-star" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.brightStars}</p>
              <p className="text-xs text-muted-foreground">Shining Today</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-streak/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-streak" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalStreak}</p>
              <p className="text-xs text-muted-foreground">Total Streak Days</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-heart/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-heart" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Today's Progress</p>
            </div>
          </div>
        </div>

        {/* Constellation Canvas */}
        <div 
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden border border-border/30"
        >
          {habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-b from-background to-card">
              <Star className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-foreground">Your constellation awaits</p>
              <p className="text-sm text-muted-foreground">Create habits to see them as stars in your sky</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="w-full cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredStar(null)}
            />
          )}
          
          {hoveredStar && (
            <div 
              className="fixed z-50 px-4 py-3 rounded-xl bg-card/95 backdrop-blur-sm border border-border shadow-elevated pointer-events-none"
              style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
            >
              <p className="font-semibold text-foreground">{hoveredStar.habitName}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-sm ${hoveredStar.isCompleted ? 'text-xp' : 'text-muted-foreground'}`}>
                  {hoveredStar.isCompleted ? '✓ Done today' : 'Not done yet'}
                </span>
                <span className="text-sm text-streak">🔥 {hoveredStar.streak} day streak</span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-star" />
            <span>Completed today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span>Not completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Bigger stars = longer streaks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstellationPage;