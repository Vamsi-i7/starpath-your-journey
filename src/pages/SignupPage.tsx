import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { ParallaxBackground } from '@/components/landing/ParallaxBackground';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validatePassword } from '@/lib/passwordValidation';
import { logError } from '@/lib/errorLogger';
import { getDisplayErrorMessage } from '@/lib/errorMessages';

const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();

  // Pre-fill email if coming from AuthEntryPage
  useEffect(() => {
    const state = location.state as { email?: string };
    if (state?.email) {
      setEmail(state.email);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords don\'t match',
        description: 'Please make sure your passwords match',
        variant: 'destructive',
      });
      return;
    }

    const { valid, message } = validatePassword(password);
    if (!valid) {
      toast({
        title: 'Weak password',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    const { error, data } = await signUp(email, password, username);
    
    if (error) {
      // Log detailed error for debugging
      console.error('Signup Error Details:', {
        message: error.message,
        name: error.name,
        fullError: JSON.stringify(error, null, 2)
      });
      logError('Signup', error);
      const errorMsg = error.message?.toLowerCase() || '';
      
      // Check if user already exists
      if (errorMsg.includes('already registered') || 
          errorMsg.includes('already exists') || 
          errorMsg.includes('duplicate')) {
        toast({
          title: 'Account already exists',
          description: 'This email is already registered. Please sign in instead.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Show the actual error message for debugging
      toast({
        title: 'Signup failed',
        description: error.message || getDisplayErrorMessage(error, 'auth'),
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Check if user needs email confirmation or is already confirmed
    if (data?.user) {
      if (data.user.confirmed_at || data.session) {
        // User is auto-confirmed (email confirmation disabled in Supabase)
        toast({
          title: 'Account created!',
          description: 'Welcome to StarPath! Redirecting to dashboard...',
        });
        // Navigate to app - the auth state change will handle the rest
        setTimeout(() => {
          navigate('/app');
        }, 1000);
        setIsLoading(false);
        return;
      } else {
        // Email confirmation is required
        setEmailSent(true);
        setIsLoading(false);
        return;
      }
    }

    // Fallback - show email confirmation screen
    setEmailSent(true);
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 dark">
      <ParallaxBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="p-8 rounded-2xl glass-dark border border-border/20">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                Check your email
              </h1>
              <p className="text-muted-foreground">
                We've sent a verification link to <span className="text-foreground font-medium">{email}</span>.
                Please click the link to verify your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder.
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-4">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    Create account
                  </h1>
                  <p className="text-sm text-muted-foreground">Start your journey to better habits</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="StarExplorer"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-card/50 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-card/50 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-card/50 border-border/50 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-card/50 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-xl glow mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
