import { Coins, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCredits } from '@/hooks/useCredits';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';

interface CreditDisplayProps {
  showDetails?: boolean;
  toolType?: 'notes' | 'flashcards' | 'roadmap' | 'mentor' | 'quiz' | 'essay' | 'math' | 'mindmap' | 'summary' | 'language';
}

export function CreditDisplay({ showDetails = true, toolType }: CreditDisplayProps) {
  const navigate = useNavigate();
  const { credits, getCost, userCredits } = useCredits();
  const { currentTier, isPremium } = useSubscription();

  const cost = toolType ? getCost(toolType) : 0;
  const canAfford = !toolType || credits >= cost;
  const usagePercent = isPremium ? Math.min((credits / 500) * 100, 100) : 0;

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Coins className="w-4 h-4 text-purple-500" />
        <span className="font-semibold">{credits}</span>
        <span className="text-muted-foreground">credits</span>
      </div>
    );
  }

  return (
    <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Credits</p>
                <p className="text-xl font-bold">{credits}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/app/subscription')}
              className="border-purple-500/30 hover:bg-purple-500/10"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Get More
            </Button>
          </div>

          {/* Cost Info */}
          {toolType && (
            <div className={`p-3 rounded-lg ${canAfford ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <div className="flex items-center justify-between text-sm">
                <span className={canAfford ? 'text-green-600' : 'text-red-600'}>
                  This will cost {cost} credits
                </span>
                {!canAfford && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          )}

          {/* Progress Bar (for subscription users) */}
          {isPremium && userCredits && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Credits Used</span>
                <span>{userCredits.total_spent || 0} total spent</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
            </div>
          )}

          {/* Low Credits Warning */}
          {credits < 20 && (
            <div className="flex items-center gap-2 text-xs text-orange-500 bg-orange-500/10 p-2 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Running low on credits! Consider upgrading or buying more.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
