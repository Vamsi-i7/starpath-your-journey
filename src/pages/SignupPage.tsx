import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle, Check, X } from 'lucide-react';
import { ParallaxBackground } from '@/components/landing/ParallaxBackground';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthText } from '@/lib/passwordStrength';
import { logError } from '@/lib/errorLogger';
import { getDisplayErrorMessage } from '@/lib/errorMessages';
import { motion, AnimatePresence } from 'framer-motion';

const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();

  // Real-time password strength validation
  const passwordStrength = validatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

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

    if (!passwordStrength.isValid) {
      toast({
        title: 'Password requirements not met',
        description: 'Please ensure your password meets all requirements listed below',
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
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className="pl-10 pr-10 bg-card/50 border-border/50 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  <AnimatePresence>
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 mt-3"
                      >
                        {/* Strength Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Password strength</span>
                            <span className={`font-medium ${
                              passwordStrength.level === 'weak' ? 'text-red-500' :
                              passwordStrength.level === 'fair' ? 'text-orange-500' :
                              passwordStrength.level === 'good' ? 'text-yellow-500' :
                              passwordStrength.level === 'strong' ? 'text-blue-500' :
                              'text-green-500'
                            }`}>
                              {getPasswordStrengthText(passwordStrength.level)}
                            </span>
                          </div>
                          <div className="h-2 bg-card/80 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength.score}%` }}
                              transition={{ duration: 0.3 }}
                              className={`h-full rounded-full ${getPasswordStrengthColor(passwordStrength.level)} transition-colors`}
                            />
                          </div>
                        </div>

                        {/* Requirements List */}
                        <div className="space-y-2 p-3 bg-card/30 rounded-lg border border-border/30">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Password must contain:</p>
                          {passwordStrength.requirements.map((req) => (
                            <motion.div
                              key={req.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2 text-xs"
                            >
                              {req.met ? (
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                              )}
                              <span className={req.met ? 'text-green-500' : 'text-muted-foreground'}>
                                {req.label}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 pr-10 bg-card/50 border-border/50 focus:border-primary transition-all ${
                        confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-500/50' : 'border-red-500/50') : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  <AnimatePresence>
                    {confirmPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-2 text-xs mt-2"
                      >
                        {passwordsMatch ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-green-500">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-red-500" />
                            <span className="text-red-500">Passwords don't match</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
