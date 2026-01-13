import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/safeClient';
import { setAdminVerified } from '@/lib/adminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, AlertCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * AdminVerifyPage - Secondary authentication for admin access
 * Requires admin to re-enter their password before accessing admin features
 * Implements rate limiting and security best practices
 */
export default function AdminVerifyPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  // Where to redirect after successful verification
  const from = (location.state as any)?.from?.pathname || '/app/admin/dashboard';

  // Check if currently locked out
  const isLockedOut = lockoutUntil && new Date() < lockoutUntil;

  useEffect(() => {
    // Update lockout status every second
    if (isLockedOut) {
      const interval = setInterval(() => {
        if (lockoutUntil && new Date() >= lockoutUntil) {
          setLockoutUntil(null);
          setAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLockedOut, lockoutUntil]);

  const getRemainingLockoutTime = (): string => {
    if (!lockoutUntil) return '';
    const now = Date.now();
    const remaining = Math.ceil((lockoutUntil.getTime() - now) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check lockout
    if (isLockedOut) {
      setError(`Too many attempts. Please wait ${getRemainingLockoutTime()}`);
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (!profile?.email) {
      setError('Unable to verify identity');
      return;
    }

    setIsVerifying(true);

    try {
      // Verify password by attempting sign-in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password,
      });

      if (signInError) {
        // Failed attempt
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        // Lock after 5 failed attempts
        if (newAttempts >= 5) {
          const lockout = new Date();
          lockout.setMinutes(lockout.getMinutes() + 15);
          setLockoutUntil(lockout);
          setError('Too many failed attempts. Locked for 15 minutes.');
          
          toast({
            title: 'Account locked',
            description: 'Too many failed verification attempts. Try again in 15 minutes.',
            variant: 'destructive',
          });
        } else {
          setError(`Incorrect password. ${5 - newAttempts} attempts remaining.`);
        }

        setPassword('');
        setIsVerifying(false);
        return;
      }

      // Success - mark as verified
      setAdminVerified();
      
      toast({
        title: 'Verification successful',
        description: 'Admin access granted.',
      });

      // Redirect to intended destination
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Verification Required</CardTitle>
          <CardDescription className="text-base">
            Please re-enter your password to access admin features
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLockedOut && (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Locked out for security. Try again in {getRemainingLockoutTime()}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isVerifying || isLockedOut}
                autoFocus
                autoComplete="current-password"
              />
              <p className="text-xs text-muted-foreground">
                Logged in as: {profile?.email}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/app')}
                disabled={isVerifying}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isVerifying || isLockedOut || !password}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </div>

            {attempts > 0 && attempts < 5 && !isLockedOut && (
              <p className="text-xs text-center text-muted-foreground">
                {attempts} failed attempt{attempts > 1 ? 's' : ''}. 
                {' '}{5 - attempts} remaining before lockout.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
