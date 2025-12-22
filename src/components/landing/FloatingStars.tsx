import { useEffect, useState, useMemo } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export function FloatingStars() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stars = useMemo(() => {
    const generatedStars: Star[] = [];
    const starCount = 50;

    for (let i = 0; i < starCount; i++) {
      generatedStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.7 + 0.3,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 5,
      });
    }
    return generatedStars;
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `floatStar ${star.duration}s ease-in-out infinite, twinkleStar ${star.duration * 0.5}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
            boxShadow: `0 0 ${star.size * 2}px hsl(var(--primary) / 0.5)`,
          }}
        />
      ))}

      {/* Larger accent stars */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`accent-${i}`}
          className="absolute rounded-full bg-accent"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 3) * 30}%`,
            width: '4px',
            height: '4px',
            opacity: 0.8,
            animation: `floatStar ${5 + i * 0.5}s ease-in-out infinite, twinkleStar ${2 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
            boxShadow: '0 0 8px hsl(var(--accent) / 0.6)',
          }}
        />
      ))}

      <style>{`
        @keyframes floatStar {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-10px) translateX(5px);
          }
          50% {
            transform: translateY(-5px) translateX(-3px);
          }
          75% {
            transform: translateY(-15px) translateX(2px);
          }
        }

        @keyframes twinkleStar {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
