import { useState, useEffect, useRef, useCallback } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import { Loader2, Star, Zap, Heart, TrendingUp, Flag, Target } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type NodeType = 'habit' | 'goal';
type NodeShape = 'circle' | 'diamond' | 'square' | 'hexagon';

interface StarNode {
  id: string;
  x: number;
  y: number;
  size: number;
  brightness: number;
  name: string;
  streak: number;
  isCompleted: boolean;
  color: string;
  type: NodeType;
  shape: NodeShape;
  progress?: number;
}

interface ConstellationStats {
  totalStars: number;
  brightStars: number;
  totalStreak: number;
  completionRate: number;
  totalGoals: number;
  completedGoals: number;
}

const ConstellationPage = () => {
  const { habits, isLoading: habitsLoading, getTodayString } = useHabits();
  const { goals, isLoading: goalsLoading } = useGoals();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStar, setHoveredStar] = useState<StarNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [viewMode, setViewMode] = useState<'all' | 'habits' | 'goals'>('all');
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

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
  const habitStars: StarNode[] = habits.map((habit, index) => {
    const angle = (index / Math.max(habits.length, 1)) * Math.PI * 2;
    const radius = 100 + (habit.streak * 5) + Math.sin(index * 1.5) * 50;
    const today = getTodayString();
    const isCompleted = habit.completedDates.includes(today);
    
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
      name: habit.name,
      streak: habit.streak,
      isCompleted,
      color: colorMap[habit.color] || colorMap.primary,
      type: 'habit' as NodeType,
      shape: 'circle' as NodeShape,
    };
  });

  // Generate stars from goals
  const goalStars: StarNode[] = goals.map((goal, index) => {
    const angle = (index / Math.max(goals.length, 1)) * Math.PI * 2 + Math.PI / 4;
    const radius = 150 + (goal.progress * 0.5) + Math.cos(index * 2) * 40;
    const isCompleted = goal.status === 'completed';
    
    // Different shapes based on goal type
    const shapeMap: Record<string, NodeShape> = {
      short_term: 'diamond',
      long_term: 'hexagon',
    };
    
    // Different colors based on goal status
    const colorMap: Record<string, string> = {
      active: 'hsl(200, 85%, 60%)',
      completed: 'hsl(140, 70%, 50%)',
      at_risk: 'hsl(35, 95%, 55%)',
    };
    
    return {
      id: goal.id,
      x: canvasSize.width / 2 + Math.cos(angle) * radius,
      y: canvasSize.height / 2 + Math.sin(angle) * radius,
      size: 10 + (goal.progress * 0.1),
      brightness: goal.progress > 50 ? 0.9 : 0.4 + (goal.progress * 0.005),
      name: goal.title,
      streak: goal.tasks.filter(t => t.completed).length,
      isCompleted,
      color: colorMap[goal.status] || colorMap.active,
      type: 'goal' as NodeType,
      shape: shapeMap[goal.goal_type] || 'square',
      progress: goal.progress,
    };
  });

  // Combine based on view mode
  const stars: StarNode[] = viewMode === 'habits' 
    ? habitStars 
    : viewMode === 'goals' 
      ? goalStars 
      : [...habitStars, ...goalStars];

  // Calculate constellation stats
  const stats: ConstellationStats = {
    totalStars: habits.length,
    brightStars: habits.filter(h => h.completedDates.includes(getTodayString())).length,
    totalStreak: habits.reduce((sum, h) => sum + h.streak, 0),
    completionRate: habits.length > 0 
      ? Math.round((habits.filter(h => h.completedDates.includes(getTodayString())).length / habits.length) * 100)
      : 0,
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
  };

  // Draw shape helper
  const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, shape: NodeShape, fillStyle: CanvasGradient | string) => {
    ctx.beginPath();
    ctx.fillStyle = fillStyle;
    
    switch (shape) {
      case 'diamond':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        break;
      case 'square':
        ctx.rect(x - size * 0.7, y - size * 0.7, size * 1.4, size * 1.4);
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 6;
          const px = x + size * Math.cos(angle);
          const py = y + size * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      default:
        ctx.arc(x, y, size, 0, Math.PI * 2);
    }
    ctx.fill();
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
          const sameType = stars[i].type === stars[j].type;
          
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          
          if (sameType) {
            ctx.strokeStyle = bothCompleted 
              ? `rgba(139, 92, 246, ${opacity})` 
              : `rgba(100, 100, 140, ${opacity * 0.5})`;
          } else {
            // Different type connection (habit-goal)
            ctx.strokeStyle = `rgba(100, 180, 200, ${opacity * 0.3})`;
            ctx.setLineDash([5, 5]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
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
      
      if (star.type === 'goal') {
        glow.addColorStop(0, star.isCompleted 
          ? `rgba(100, 200, 150, ${currentBrightness * 0.6})` 
          : `rgba(100, 150, 200, ${currentBrightness * 0.3})`);
        glow.addColorStop(0.5, star.isCompleted 
          ? `rgba(100, 200, 150, ${currentBrightness * 0.2})` 
          : `rgba(100, 150, 200, ${currentBrightness * 0.1})`);
      } else {
        glow.addColorStop(0, star.isCompleted 
          ? `rgba(250, 204, 21, ${currentBrightness * 0.6})` 
          : `rgba(150, 150, 180, ${currentBrightness * 0.3})`);
        glow.addColorStop(0.5, star.isCompleted 
          ? `rgba(250, 204, 21, ${currentBrightness * 0.2})` 
          : `rgba(150, 150, 180, ${currentBrightness * 0.1})`);
      }
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Star core with shape
      const coreGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size);
      coreGradient.addColorStop(0, `rgba(255, 255, 255, ${currentBrightness})`);
      
      if (star.type === 'goal') {
        coreGradient.addColorStop(0.4, star.isCompleted 
          ? `rgba(150, 230, 180, ${currentBrightness * 0.8})` 
          : `rgba(150, 180, 220, ${currentBrightness * 0.5})`);
        coreGradient.addColorStop(1, star.isCompleted 
          ? `rgba(100, 200, 150, ${currentBrightness * 0.3})` 
          : `rgba(100, 150, 200, ${currentBrightness * 0.2})`);
      } else {
        coreGradient.addColorStop(0.4, star.isCompleted 
          ? `rgba(250, 230, 150, ${currentBrightness * 0.8})` 
          : `rgba(180, 180, 200, ${currentBrightness * 0.5})`);
        coreGradient.addColorStop(1, star.isCompleted 
          ? `rgba(250, 204, 21, ${currentBrightness * 0.3})` 
          : `rgba(120, 120, 150, ${currentBrightness * 0.2})`);
      }
      
      drawShape(ctx, star.x, star.y, star.size, star.shape, coreGradient);

      // Inner bright point
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${currentBrightness})`;
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(draw);
  }, [stars, canvasSize]);

  useEffect(() => {
    if (!habitsLoading && !goalsLoading) {
      draw();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, habitsLoading, goalsLoading]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x: e.clientX, y: e.clientY });

    const hovered = stars.find(star => Math.hypot(star.x - x, star.y - y) < star.size + 15);
    setHoveredStar(hovered || null);
  };

  if (habitsLoading || goalsLoading) {
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
        <p className="text-muted-foreground mb-4">
          Your habits and goals form a constellation. Completed items shine bright! Different shapes represent different types.
        </p>

        {/* View Mode Tabs */}
        <div className="mb-6">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'habits' | 'goals')}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="habits">Habits Only</TabsTrigger>
              <TabsTrigger value="goals">Goals Only</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalStars}</p>
              <p className="text-xs text-muted-foreground">Habit Stars</p>
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
              <p className="text-xs text-muted-foreground">Total Streaks</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-heart/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-heart" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Today's Rate</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Flag className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalGoals}</p>
              <p className="text-xs text-muted-foreground">Goal Stars</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completedGoals}</p>
              <p className="text-xs text-muted-foreground">Goals Done</p>
            </div>
          </div>
        </div>

        {/* Constellation Canvas */}
        <div 
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden border border-border/30"
        >
          {stars.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-b from-background to-card">
              <Star className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-foreground">Your constellation awaits</p>
              <p className="text-sm text-muted-foreground">Create habits and goals to see them as stars</p>
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                  {hoveredStar.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {hoveredStar.shape === 'circle' ? '●' : hoveredStar.shape === 'diamond' ? '◆' : hoveredStar.shape === 'hexagon' ? '⬡' : '■'}
                </span>
              </div>
              <p className="font-semibold text-foreground">{hoveredStar.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-sm ${hoveredStar.isCompleted ? 'text-xp' : 'text-muted-foreground'}`}>
                  {hoveredStar.isCompleted ? '✓ Complete' : 'In progress'}
                </span>
                {hoveredStar.type === 'habit' && (
                  <span className="text-sm text-streak">🔥 {hoveredStar.streak} day streak</span>
                )}
                {hoveredStar.type === 'goal' && hoveredStar.progress !== undefined && (
                  <span className="text-sm text-accent">{hoveredStar.progress}% progress</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-star" />
            <span>Habit (circle)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rotate-45 bg-accent" />
            <span>Short-term Goal (diamond)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            <span>Long-term Goal (hexagon)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Brighter = More progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstellationPage;
