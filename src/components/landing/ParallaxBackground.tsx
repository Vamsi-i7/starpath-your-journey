import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { resolvedColorMode } = useTheme();
  const [stars] = useState<Star[]>(() => 
    Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.5 + 0.1,
    }))
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isDark = resolvedColorMode === 'dark';

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none transition-colors duration-300"
      style={{
        background: isDark 
          ? 'linear-gradient(180deg, hsl(230 30% 6%) 0%, hsl(250 40% 10%) 50%, hsl(280 35% 8%) 100%)'
          : 'linear-gradient(180deg, hsl(220 20% 97%) 0%, hsl(230 25% 94%) 50%, hsl(240 20% 92%) 100%)',
      }}
    >
      {/* Nebula effects - only visible in dark mode */}
      {isDark && (
        <>
          <div 
            className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[100px]"
            style={{
              background: 'radial-gradient(circle, hsl(250 85% 60% / 0.4) 0%, transparent 70%)',
              left: '10%',
              top: '20%',
              transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
          <div 
            className="absolute w-[600px] h-[600px] rounded-full opacity-25 blur-[80px]"
            style={{
              background: 'radial-gradient(circle, hsl(280 80% 65% / 0.4) 0%, transparent 70%)',
              right: '15%',
              top: '40%',
              transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[60px]"
            style={{
              background: 'radial-gradient(circle, hsl(320 75% 60% / 0.3) 0%, transparent 70%)',
              left: '50%',
              bottom: '10%',
              transform: `translate(${mousePosition.x * 25}px, ${mousePosition.y * 25}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
        </>
      )}

      {/* Light mode subtle gradient orbs */}
      {!isDark && (
        <>
          <div 
            className="absolute w-[600px] h-[600px] rounded-full opacity-40 blur-[120px]"
            style={{
              background: 'radial-gradient(circle, hsl(250 85% 80% / 0.3) 0%, transparent 70%)',
              left: '20%',
              top: '10%',
              transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-[100px]"
            style={{
              background: 'radial-gradient(circle, hsl(280 70% 85% / 0.3) 0%, transparent 70%)',
              right: '10%',
              bottom: '20%',
              transform: `translate(${mousePosition.x * -12}px, ${mousePosition.y * -12}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
        </>
      )}

      {/* Stars - only visible in dark mode */}
      {isDark && stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: `hsl(45 95% 75% / ${star.opacity})`,
            boxShadow: `0 0 ${star.size * 2}px hsl(45 100% 75% / ${star.opacity * 0.5})`,
            transform: `translate(${mousePosition.x * star.speed * 30}px, ${mousePosition.y * star.speed * 30}px)`,
            transition: 'transform 0.2s ease-out',
            animationDelay: `${star.id * 0.05}s`,
          }}
        />
      ))}

      {/* Constellation lines - only in dark mode */}
      {isDark && (
        <svg 
          className="absolute inset-0 w-full h-full opacity-20"
          style={{
            transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
            transition: 'transform 0.4s ease-out',
          }}
        >
          <line x1="20%" y1="30%" x2="35%" y2="25%" stroke="hsl(250 85% 70%)" strokeWidth="0.5" />
          <line x1="35%" y1="25%" x2="45%" y2="35%" stroke="hsl(250 85% 70%)" strokeWidth="0.5" />
          <line x1="45%" y1="35%" x2="55%" y2="30%" stroke="hsl(250 85% 70%)" strokeWidth="0.5" />
          <line x1="60%" y1="60%" x2="75%" y2="55%" stroke="hsl(280 80% 65%)" strokeWidth="0.5" />
          <line x1="75%" y1="55%" x2="85%" y2="65%" stroke="hsl(280 80% 65%)" strokeWidth="0.5" />
          <line x1="15%" y1="70%" x2="25%" y2="80%" stroke="hsl(320 75% 60%)" strokeWidth="0.5" />
          <line x1="25%" y1="80%" x2="40%" y2="75%" stroke="hsl(320 75% 60%)" strokeWidth="0.5" />
        </svg>
      )}

      {/* Floating orbs - adapt to theme */}
      <div 
        className="absolute w-4 h-4 rounded-full animate-float"
        style={{
          background: 'hsl(var(--primary))',
          boxShadow: isDark ? '0 0 20px hsl(var(--primary) / 0.6)' : '0 0 15px hsl(var(--primary) / 0.3)',
          left: '20%',
          top: '30%',
          transform: `translate(${mousePosition.x * 40}px, ${mousePosition.y * 40}px)`,
          transition: 'transform 0.15s ease-out, background 0.3s ease',
        }}
      />
      <div 
        className="absolute w-3 h-3 rounded-full animate-float"
        style={{
          background: 'hsl(var(--accent))',
          boxShadow: isDark ? '0 0 15px hsl(var(--accent) / 0.6)' : '0 0 10px hsl(var(--accent) / 0.3)',
          right: '25%',
          top: '40%',
          animationDelay: '1s',
          transform: `translate(${mousePosition.x * -35}px, ${mousePosition.y * -35}px)`,
          transition: 'transform 0.15s ease-out, background 0.3s ease',
        }}
      />
      <div 
        className="absolute w-2 h-2 rounded-full animate-float"
        style={{
          background: 'hsl(var(--star))',
          boxShadow: isDark ? '0 0 10px hsl(var(--star) / 0.6)' : '0 0 8px hsl(var(--star) / 0.3)',
          left: '60%',
          bottom: '30%',
          animationDelay: '2s',
          transform: `translate(${mousePosition.x * 50}px, ${mousePosition.y * 50}px)`,
          transition: 'transform 0.15s ease-out, background 0.3s ease',
        }}
      />
    </div>
  );
}
