import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/safeClient";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function AuthEntryPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const checkUserExists = async (email: string): Promise<{ exists: boolean; userInfo?: any }> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-user-exists', {
        body: { email }
      });

      if (error) {
        console.error('Error checking user existence:', error);
        return { exists: false };
      }

      return data;
    } catch (error) {
      console.error('Unexpected error checking user:', error);
      return { exists: false };
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Check if user exists
      const { exists, userInfo } = await checkUserExists(trimmedEmail);

      if (exists) {
        // User exists - route to sign-in with pre-filled email
        // User exists, route to sign-in
        navigate('/login', { 
          state: { 
            email: trimmedEmail,
            userInfo: userInfo
          } 
        });
      } else {
        // User doesn't exist - route to sign-up with pre-filled email
        // New user, route to sign-up
        navigate('/signup', { 
          state: { 
            email: trimmedEmail 
          } 
        });
      }
    } catch (error) {
      console.error('Error during authentication flow:', error);
      toast.error("Unable to continue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to StarPath</CardTitle>
          <CardDescription className="text-center">
            Enter your email to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleContinue}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-10"
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Continue'
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              We'll automatically sign you in or create an account
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
