import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/adminAuth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute - Protects admin-only routes
 * Ensures user is authenticated AND is an admin
 * Shows appropriate error messages for unauthorized access
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show 403 Forbidden if authenticated but not admin
  if (!isAdmin(profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full space-y-6">
          <Alert variant="destructive" className="border-2">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>You do not have permission to access this area.</p>
              <p className="text-sm">This section is restricted to administrators only.</p>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/app">Go to Dashboard</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/app/settings">Settings</Link>
            </Button>
          </div>

          {import.meta.env.DEV && (
            <div className="text-xs text-muted-foreground text-center p-3 bg-muted/30 rounded border">
              Dev Info: Access denied for {profile?.email}
            </div>
          )}
        </div>
      </div>
    );
  }

  // User is authenticated and is admin - render protected content
  return <>{children}</>;
}
