import { Check, Crown, Sparkles, Zap, Star, Infinity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { useRazorpay } from '@/hooks/useRazorpay';

interface Plan {
  name: string;
  price: number;
  tier: string;
  features: string[];
  popular?: boolean;
}

interface PricingCardsProps {
  onSelectPlan?: (tier: string, price: number) => void;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: 0,
    tier: 'free',
    features: [
      '10 saved items in library',
      'Basic AI Tools access',
      'Manual habit tracking',
      'Basic analytics',
    ],
  },
  {
    name: 'Pro',
    price: 299,
    tier: 'pro',
    features: [
      '50 AI credits per month',
      '50 saved items in library',
      'All AI Tools',
      'Priority support',
      'Export to TXT/Markdown',
    ],
  },
  {
    name: 'Premium',
    price: 599,
    tier: 'premium',
    popular: true,
    features: [
      '500 AI credits per month',
      'Unlimited library storage',
      'AI Mentor - Full Access',
      'PDF Export',
      'Advanced analytics',
      'Priority support',
    ],
  },
];

const tierIcons: Record<string, any> = {
  free: Sparkles,
  pro: Star,
  premium: Crown,
};

const tierColors: Record<string, string> = {
  free: 'from-gray-500 to-gray-600',
  pro: 'from-blue-500 to-blue-600',
  premium: 'from-purple-500 to-purple-600',
};

export function PricingCards({ onSelectPlan }: PricingCardsProps) {
  const { currentTier, isLoading } = useSubscription();
  const { purchaseSubscription, isProcessing } = useRazorpay();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-40 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const handleSelectPlan = async (tier: string, price: number) => {
    if (onSelectPlan) {
      onSelectPlan(tier, price);
    } else if (tier !== 'free') {
      await purchaseSubscription(tier, price);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map((plan) => {
        const Icon = tierIcons[plan.tier] || Sparkles;
        const isCurrentPlan = currentTier === plan.tier;
        const isPremium = plan.popular;

        return (
          <Card
            key={plan.tier}
            className={cn(
              "relative overflow-hidden transition-all",
              isPremium && "border-2 border-purple-500 shadow-xl scale-105",
              isCurrentPlan && "ring-2 ring-primary"
            )}
          >
            {isPremium && (
              <div className="absolute top-0 right-0">
                <Badge className="rounded-tl-none rounded-br-none bg-purple-500">
                  MOST POPULAR
                </Badge>
              </div>
            )}

            <div className={cn(
              "p-6 bg-gradient-to-br",
              tierColors[plan.tier]
            )}>
              <Icon className="w-12 h-12 text-white mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="text-white">
                <div className="text-3xl font-bold">
                  {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                </div>
                {plan.price > 0 && (
                  <div className="text-sm opacity-90">per month</div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.tier, plan.price)}
                disabled={isCurrentPlan || isProcessing}
                className={cn(
                  "w-full",
                  isPremium && "bg-gradient-to-r from-purple-500 to-purple-600"
                )}
                variant={plan.tier === 'free' ? 'outline' : 'default'}
              >
                {isCurrentPlan ? 'Current Plan' : plan.tier === 'free' ? 'Free Plan' : 'Upgrade Now'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
