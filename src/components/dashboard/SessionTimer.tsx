import { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const XP_PER_MINUTE = 2;

export function SessionTimer() {
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(sessionSeconds / 60);
  const seconds = sessionSeconds % 60;
  const xpEarned = minutes * XP_PER_MINUTE;

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Session Time</p>
              <p className="text-lg font-bold text-foreground font-mono">
                {formatTime(minutes, seconds)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/20">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">XP Earned</p>
              <p className="text-lg font-bold text-foreground">
                +{xpEarned} XP
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
