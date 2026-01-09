import { Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoadingProgressProps {
  message?: string;
}

const loadingMessages = [
  'Analyzing your request...',
  'Consulting AI knowledge base...',
  'Generating content...',
  'Polishing the results...',
  'Almost ready...',
];

export function LoadingProgress({ message }: LoadingProgressProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Cycle through messages
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Stop at 90% until actually complete
        return prev + Math.random() * 15;
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <Sparkles className="w-6 h-6 text-accent absolute top-0 right-0 animate-pulse" />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-foreground animate-pulse">
          {message || loadingMessages[currentMessage]}
        </p>
        
        {/* Progress bar */}
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          This may take a few moments...
        </p>
      </div>
    </div>
  );
}
