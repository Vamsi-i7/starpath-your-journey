import { useState } from 'react';
import { Clock, Sparkles, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSessionTimer } from '@/contexts/SessionTimerContext';

export function SessionTimer() {
  const { sessionSeconds, isRunning, xpEarned, start, stop, reset, setTime, formatTime } = useSessionTimer();
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');

  const handleSetTime = () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    setTime(mins, secs);
    setCustomMinutes('');
    setCustomSeconds('');
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Session Time</p>
                <p className="text-lg font-bold text-foreground font-mono">
                  {formatTime()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent/20">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">XP Earned</p>
                <p className="text-lg font-bold text-foreground">
                  +{xpEarned} XP
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={isRunning ? stop : start}
              className="h-9 w-9"
              title={isRunning ? 'Pause timer' : 'Start timer'}
            >
              {isRunning ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={reset}
              className="h-9 w-9"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  title="Set custom time"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Set Custom Time</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Minutes</label>
                      <Input
                        type="number"
                        min="0"
                        max="999"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <span className="text-lg font-bold mt-5">:</span>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Seconds</label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={customSeconds}
                        onChange={(e) => setCustomSeconds(e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSetTime} className="w-full" size="sm">
                    Set Time
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
