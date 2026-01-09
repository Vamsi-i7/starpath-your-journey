import { useState } from 'react';
import { Clock, Sparkles, Play, Pause, RotateCcw, Settings, Timer, Coffee, Save, Sofa } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSessionTimer } from '@/contexts/SessionTimerContext';
import { toast } from 'sonner';

export function SessionTimer() {
  const {
    sessionSeconds,
    isRunning,
    xpEarned,
    mode,
    pomodoroPhase,
    workDuration,
    breakDuration,
    longBreakDuration,
    cyclesBeforeLongBreak,
    pomodoroCount,
    start,
    stop,
    reset,
    setTime,
    formatTime,
    setMode,
    setWorkDuration,
    setBreakDuration,
    setLongBreakDuration,
    setCyclesBeforeLongBreak,
    saveSession,
    formatPomodoroTime,
  } = useSessionTimer();

  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [customWorkDuration, setCustomWorkDuration] = useState(workDuration.toString());
  const [customBreakDuration, setCustomBreakDuration] = useState(breakDuration.toString());
  const [customLongBreakDuration, setCustomLongBreakDuration] = useState(longBreakDuration.toString());
  const [customCycles, setCustomCycles] = useState(cyclesBeforeLongBreak.toString());

  const handleSetTime = () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    setTime(mins, secs);
    setCustomMinutes('');
    setCustomSeconds('');
  };

  const handleSaveSession = async () => {
    if (sessionSeconds < 60) {
      toast.error('Session must be at least 1 minute to save');
      return;
    }
    await saveSession();
    toast.success('Session saved!');
    reset();
  };

  const handleUpdatePomodoro = () => {
    const work = parseInt(customWorkDuration) || 25;
    const brk = parseInt(customBreakDuration) || 5;
    const longBrk = parseInt(customLongBreakDuration) || 15;
    const cycles = parseInt(customCycles) || 4;
    setWorkDuration(work);
    setBreakDuration(brk);
    setLongBreakDuration(longBrk);
    setCyclesBeforeLongBreak(cycles);
    toast.success('Pomodoro settings updated');
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Mode Tabs */}
          <div className="flex items-center justify-between">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'focus' | 'pomodoro')}>
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="focus" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Focus
                </TabsTrigger>
                <TabsTrigger value="pomodoro" className="text-xs">
                  <Timer className="w-3 h-3 mr-1" />
                  Pomodoro
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === 'pomodoro' && (
              <Badge variant={pomodoroPhase === 'work' ? 'default' : 'secondary'} className="gap-1">
                {pomodoroPhase === 'work' ? (
                  <>
                    <Timer className="w-3 h-3" />
                    Work
                  </>
                ) : pomodoroPhase === 'long_break' ? (
                  <>
                    <Sofa className="w-3 h-3" />
                    Long Break
                  </>
                ) : (
                  <>
                    <Coffee className="w-3 h-3" />
                    Break
                  </>
                )}
                {pomodoroCount > 0 && ` #${pomodoroCount}`}
              </Badge>
            )}
          </div>

          {/* Timer Display */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  mode === 'pomodoro' && pomodoroPhase === 'long_break' 
                    ? 'bg-accent/20' 
                    : mode === 'pomodoro' && pomodoroPhase === 'break' 
                      ? 'bg-secondary/20' 
                      : 'bg-primary/20'
                }`}>
                  {mode === 'pomodoro' && pomodoroPhase === 'long_break' ? (
                    <Sofa className="w-4 h-4 text-accent" />
                  ) : mode === 'pomodoro' && pomodoroPhase === 'break' ? (
                    <Coffee className="w-4 h-4 text-secondary-foreground" />
                  ) : (
                    <Clock className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {mode === 'pomodoro' ? 'Time Left' : 'Session Time'}
                  </p>
                  <p className="text-lg font-bold text-foreground font-mono">
                    {mode === 'pomodoro' ? formatPomodoroTime() : formatTime()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent/20">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                  <p className="text-lg font-bold text-foreground">+{xpEarned} XP</p>
                </div>
              </div>

              {mode === 'focus' && (
                <div className="text-xs text-muted-foreground">
                  Total: {formatTime()}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="icon"
                onClick={isRunning ? stop : start}
                className="h-9 w-9"
                title={isRunning ? 'Pause timer' : 'Start timer'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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

              <Button
                variant="outline"
                size="icon"
                onClick={handleSaveSession}
                className="h-9 w-9"
                title="Save session"
              >
                <Save className="w-4 h-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" title="Settings">
                    <Settings className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-4">
                    {mode === 'focus' && (
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
                    )}

                    {mode === 'pomodoro' && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Pomodoro Settings</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Work (min)</label>
                            <Input
                              type="number"
                              min="1"
                              max="120"
                              value={customWorkDuration}
                              onChange={(e) => setCustomWorkDuration(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Break (min)</label>
                            <Input
                              type="number"
                              min="1"
                              max="60"
                              value={customBreakDuration}
                              onChange={(e) => setCustomBreakDuration(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Long Break (min)</label>
                            <Input
                              type="number"
                              min="5"
                              max="60"
                              value={customLongBreakDuration}
                              onChange={(e) => setCustomLongBreakDuration(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Cycles before long break</label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={customCycles}
                              onChange={(e) => setCustomCycles(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <Button onClick={handleUpdatePomodoro} className="w-full" size="sm">
                          Update Settings
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
