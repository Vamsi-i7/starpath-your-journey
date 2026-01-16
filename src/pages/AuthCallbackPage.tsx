import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/safeClient';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Completing sign in...');
        
        // Check for error in URL hash (OAuth errors)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          toast.error(errorDescription || 'Authentication failed');
          navigate('/login');
          return;
        }

        // Handle the OAuth callback - Supabase will automatically exchange the code
        // Listen for auth state change which fires after successful OAuth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            toast.success('Successfully signed in!');
            navigate('/app');
          } else if (event === 'USER_UPDATED') {
            // Password recovery completed
            navigate('/app');
          }
        });

        // Also check if session already exists (in case auth state already changed)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Authentication failed');
          navigate('/login');
          subscription.unsubscribe();
          return;
        }

        if (session) {
          toast.success('Successfully signed in!');
          navigate('/app');
          subscription.unsubscribe();
          return;
        }

        // If no session yet, wait a bit for the auth state change
        setTimeout(() => {
          // Final check
          supabase.auth.getSession().then(({ data: { session: finalSession } }) => {
            if (finalSession) {
              toast.success('Successfully signed in!');
              navigate('/app');
            } else {
              toast.error('Authentication timeout. Please try again.');
              navigate('/login');
            }
            subscription.unsubscribe();
          });
        }, 5000);

      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('Something went wrong');
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
        <p className="text-lg text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
