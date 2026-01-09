import { AlertCircle, Sparkles, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useRateLimiter } from '@/hooks/useRateLimiter';

export function UsageLimitBanner() {
  const navigate = useNavigate();
  const { isLimited, remainingRequests, timeUntilReset, maxRequests } = useRateLimiter();

  if (isLimited) {
    const hoursUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60));
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>AI Generation Limit Reached</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            You've used all {maxRequests} requests this hour. Resets in {hoursUntilReset}h.
          </span>
          <Button size="sm" onClick={() => navigate('/app/subscription')} className="ml-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade for More
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (remainingRequests <= 5) {
    return (
      <Alert className="mb-4 bg-orange-500/10 border-orange-500/30">
        <Clock className="h-4 w-4 text-orange-500" />
        <AlertTitle className="text-orange-500">Low on Requests</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-orange-500">
            {remainingRequests} of {maxRequests} AI requests remaining this hour.
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => navigate('/app/subscription')}
            className="ml-4 border-orange-500 text-orange-500 hover:bg-orange-500/10"
          >
            Upgrade to Premium
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
