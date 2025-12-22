import { useState, useEffect, useRef } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useApp } from '@/contexts/AppContext';

interface StarNode {
  id: string;
  x: number;
  y: number;
  size: number;
  brightness: number;
  habitName: string;
  streak: number;
}

const ConstellationPage = () => {
  const { habits, getTodayString } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredStar, setHoveredStar] = useState<StarNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const stars: StarNode[] = habits.map((habit, index) => {
    const angle = (index / habits.length) * Math.PI * 2;
    const radius = 150 + Math.random() * 100;
    const today = getTodayString();
    const isCompleted = habit.completedDates.includes(today);
    
    return {
      id: habit.id,
      x: 400 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius,
      size: 8 + habit.streak * 0.5,
      brightness: isCompleted ? 1 : 0.4,
      habitName: habit.name,
      streak: habit.streak,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dist = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw stars
      stars.forEach(star => {
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2);
        gradient.addColorStop(0, `rgba(250, 204, 21, ${star.brightness})`);
        gradient.addColorStop(0.5, `rgba(250, 204, 21, ${star.brightness * 0.5})`);
        gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fill();
      });
    };

    draw();
  }, [stars]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x: e.clientX, y: e.clientY });

    const hovered = stars.find(star => Math.hypot(star.x - x, star.y - y) < star.size + 10);
    setHoveredStar(hovered || null);
  };

  return (
    <div className="min-h-screen">
      <AppTopbar title="Constellation" />
      <div className="p-6">
        <p className="text-muted-foreground mb-6">Your habits form a constellation. Completed habits shine bright!</p>
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-background to-card border border-border/30">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full max-w-4xl mx-auto cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredStar(null)}
          />
          {hoveredStar && (
            <div 
              className="fixed z-50 px-4 py-2 rounded-lg bg-card border border-border shadow-lg pointer-events-none"
              style={{ left: mousePos.x + 10, top: mousePos.y + 10 }}
            >
              <p className="font-medium text-foreground">{hoveredStar.habitName}</p>
              <p className="text-sm text-muted-foreground">{hoveredStar.streak} day streak</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConstellationPage;
