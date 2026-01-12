import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';

type TimerMode = 'focus' | 'pomodoro';
type PomodoroPhase = 'work' | 'break' | 'long_break';

interface SessionTimerContextType {
  sessionSeconds: number;
  isRunning: boolean;
  xpEarned: number;
  mode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  cyclesBeforeLongBreak: number;
  pomodoroTimeLeft: number; // in seconds
  pomodoroCount: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setTime: (minutes: number, seconds: number) => void;
  formatTime: () => string;
  setMode: (mode: TimerMode) => void;
  setWorkDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  setLongBreakDuration: (minutes: number) => void;
  setCyclesBeforeLongBreak: (cycles: number) => void;
  saveSession: () => Promise<void>;
  formatPomodoroTime: () => string;
}

const XP_PER_MINUTE = 2;
const DEFAULT_WORK_DURATION = 25;
const DEFAULT_BREAK_DURATION = 5;
const DEFAULT_LONG_BREAK_DURATION = 15;
const DEFAULT_CYCLES_BEFORE_LONG_BREAK = 4;

const SessionTimerContext = createContext<SessionTimerContextType | undefined>(undefined);

export function SessionTimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');
  const [workDuration, setWorkDuration] = useState(DEFAULT_WORK_DURATION);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK_DURATION);
  const [longBreakDuration, setLongBreakDuration] = useState(DEFAULT_LONG_BREAK_DURATION);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(DEFAULT_CYCLES_BEFORE_LONG_BREAK);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(DEFAULT_WORK_DURATION * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const sessionStartRef = useRef<Date>(new Date());

  // Focus mode timer (counts up)
  useEffect(() => {
    if (!isRunning || mode !== 'focus') return;

    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode]);

  // Pomodoro mode timer (counts down)
  useEffect(() => {
    if (!isRunning || mode !== 'pomodoro') return;

    const interval = setInterval(() => {
      setPomodoroTimeLeft(prev => {
        if (prev <= 1) {
          // Phase complete
          if (pomodoroPhase === 'work') {
            // Save work session before switching to break
            if (user) {
              saveSessionToDb('pomodoro_work', workDuration * 60);
            }
            const newCount = pomodoroCount + 1;
            setPomodoroCount(newCount);
            
            // Check if it's time for a long break
            if (newCount > 0 && newCount % cyclesBeforeLongBreak === 0) {
              setPomodoroPhase('long_break');
              return longBreakDuration * 60;
            } else {
              setPomodoroPhase('break');
              return breakDuration * 60;
            }
          } else {
            // Break or long break complete, start new work session
            setPomodoroPhase('work');
            return workDuration * 60;
          }
        }
        return prev - 1;
      });
      // Also track total session time
      setSessionSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, pomodoroPhase, workDuration, breakDuration, longBreakDuration, cyclesBeforeLongBreak, pomodoroCount, user]);

  const saveSessionToDb = async (sessionType: string, durationSeconds: number) => {
    if (!user) return;
    
    const xp = Math.floor(durationSeconds / 60) * XP_PER_MINUTE;
    
    // Use 'sessions' table (matches our database schema)
    await supabase.from('sessions').insert({
      user_id: user.id,
      duration_seconds: durationSeconds,
      xp_earned: xp,
      session_type: sessionType,
      started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    });
  };

  const start = useCallback(() => {
    if (!isRunning) {
      sessionStartRef.current = new Date();
    }
    setIsRunning(true);
  }, [isRunning]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setSessionSeconds(0);
    setPomodoroTimeLeft(workDuration * 60);
    setPomodoroPhase('work');
    setPomodoroCount(0);
    setIsRunning(false);
    sessionStartRef.current = new Date();
  }, [workDuration]);

  const setTime = useCallback((minutes: number, seconds: number) => {
    setSessionSeconds(minutes * 60 + seconds);
  }, []);

  const formatTime = useCallback(() => {
    const mins = Math.floor(sessionSeconds / 60);
    const secs = sessionSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [sessionSeconds]);

  const formatPomodoroTime = useCallback(() => {
    const mins = Math.floor(pomodoroTimeLeft / 60);
    const secs = pomodoroTimeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [pomodoroTimeLeft]);

  const handleSetMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    if (newMode === 'pomodoro') {
      setPomodoroTimeLeft(workDuration * 60);
      setPomodoroPhase('work');
    }
  }, [workDuration]);

  const handleSetWorkDuration = useCallback((minutes: number) => {
    setWorkDuration(minutes);
    if (pomodoroPhase === 'work') {
      setPomodoroTimeLeft(minutes * 60);
    }
  }, [pomodoroPhase]);

  const handleSetBreakDuration = useCallback((minutes: number) => {
    setBreakDuration(minutes);
    if (pomodoroPhase === 'break') {
      setPomodoroTimeLeft(minutes * 60);
    }
  }, [pomodoroPhase]);

  const handleSetLongBreakDuration = useCallback((minutes: number) => {
    setLongBreakDuration(minutes);
    if (pomodoroPhase === 'long_break') {
      setPomodoroTimeLeft(minutes * 60);
    }
  }, [pomodoroPhase]);

  const handleSetCyclesBeforeLongBreak = useCallback((cycles: number) => {
    setCyclesBeforeLongBreak(cycles);
  }, []);

  const saveSession = useCallback(async () => {
    if (!user || sessionSeconds < 60) return;
    
    const sessionType = mode === 'pomodoro' ? `pomodoro_${pomodoroPhase}` : 'focus';
    await saveSessionToDb(sessionType, sessionSeconds);
  }, [user, sessionSeconds, mode, pomodoroPhase]);

  const xpEarned = Math.floor(sessionSeconds / 60) * XP_PER_MINUTE;

  return (
    <SessionTimerContext.Provider
      value={{
        sessionSeconds,
        isRunning,
        xpEarned,
        mode,
        pomodoroPhase,
        workDuration,
        breakDuration,
        longBreakDuration,
        cyclesBeforeLongBreak,
        pomodoroTimeLeft,
        pomodoroCount,
        start,
        stop,
        reset,
        setTime,
        formatTime,
        setMode: handleSetMode,
        setWorkDuration: handleSetWorkDuration,
        setBreakDuration: handleSetBreakDuration,
        setLongBreakDuration: handleSetLongBreakDuration,
        setCyclesBeforeLongBreak: handleSetCyclesBeforeLongBreak,
        saveSession,
        formatPomodoroTime,
      }}
    >
      {children}
    </SessionTimerContext.Provider>
  );
}

export function useSessionTimer() {
  const context = useContext(SessionTimerContext);
  if (!context) {
    throw new Error('useSessionTimer must be used within a SessionTimerProvider');
  }
  return context;
}
