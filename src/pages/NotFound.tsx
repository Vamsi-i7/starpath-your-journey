import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn("404: Page not found:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="text-center max-w-md space-y-8">
        {/* Animated 404 */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl animate-pulse" />
          <h1 
            className="relative text-9xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            404
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">
            Lost in space? 🚀
          </h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved to a different galaxy.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/app">
              <Sparkles className="w-4 h-4" />
              Open App
            </Link>
          </Button>
        </div>

        {/* Fun decoration */}
        <div className="flex justify-center gap-2 text-2xl opacity-50">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>⭐</span>
          <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🌙</span>
          <span className="animate-bounce" style={{ animationDelay: '200ms' }}>✨</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🌟</span>
          <span className="animate-bounce" style={{ animationDelay: '400ms' }}>💫</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
