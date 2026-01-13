import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export function LoadingPulse({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
      <div className="w-3 h-3 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
      <div className="w-3 h-3 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export function LoadingBar({ className, progress }: { className?: string; progress?: number }) {
  return (
    <div className={cn("w-full h-1 bg-muted rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 animate-shimmer"
        style={{ width: progress ? `${progress}%` : '100%' }}
      />
    </div>
  );
}
