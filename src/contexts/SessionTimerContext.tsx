import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SessionTimerContextType {
  sessionSeconds: number;
  isRunning: boolean;
  xpEarned: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setTime: (minutes: number, seconds: number) => void;
  formatTime: () => string;
}

const XP_PER_MINUTE = 2;

const SessionTimerContext = createContext<SessionTimerContextType | undefined>(undefined);

export function SessionTimerProvider({ children }: { children: ReactNode }) {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setSessionSeconds(0);
    setIsRunning(true);
  }, []);

  const setTime = useCallback((minutes: number, seconds: number) => {
    setSessionSeconds(minutes * 60 + seconds);
  }, []);

  const formatTime = useCallback(() => {
    const mins = Math.floor(sessionSeconds / 60);
    const secs = sessionSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [sessionSeconds]);

  const xpEarned = Math.floor(sessionSeconds / 60) * XP_PER_MINUTE;

  return (
    <SessionTimerContext.Provider
      value={{
        sessionSeconds,
        isRunning,
        xpEarned,
        start,
        stop,
        reset,
        setTime,
        formatTime,
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
