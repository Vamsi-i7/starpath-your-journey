import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/safeClient';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('OAuth callback error:', error);
          toast.error('Authentication failed');
          navigate('/login');
          return;
        }

        if (session) {
          toast.success('Successfully signed in!');
          navigate('/app');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('Something went wrong');
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
        <p className="text-lg text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
