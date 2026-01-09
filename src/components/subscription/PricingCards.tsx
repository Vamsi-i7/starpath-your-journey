import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import type { SubscriptionPlan } from '@/hooks/useSubscription';

interface PricingCardsProps {
  onSelectPlan?: (plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly' | 'lifetime') => void;
}

const tierIcons = {
  free: Sparkles,
  premium: Zap,
  pro: Crown,
  lifetime: Crown,
};

const tierColors = {
  free: 'from-gray-500 to-gray-600',
  premium: 'from-purple-500 to-purple-600',
  pro: 'from-amber-500 to-amber-600',
  lifetime: 'from-pink-500 to-pink-600',
};

export function PricingCards({ onSelectPlan }: PricingCardsProps) {
  const { plans, currentTier, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-40 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const getFeatureList = (features: Record<string, any>): string[] => {
    const featureDescriptions: Record<string, string> = {
      max_habits: 'habits',
      max_goals: 'goals',
      analytics_range: 'Analytics',
      ai_coaching_daily: 'AI coaching requests/day',
      habit_categories: 'categories',
      export_data: 'Data export',
      custom_themes: 'Custom themes',
      priority_support: 'Priority support',
      ad_free: 'Ad-free experience',
      advanced_statistics: 'Advanced statistics',
      habit_templates: 'Habit templates',
      predictive_analytics: 'Predictive analytics',
      habit_automations: 'Habit automations',
      integrations: 'App integrations',
      team_accounts: 'Team accounts',
      white_label: 'White-label option',
      api_access: 'API access',
      early_access: 'Early access to features',
      founder_badge: 'Founder badge',
    };

    return Object.entries(features)
      .filter(([key, value]) => value === true || value === 'unlimited' || 
              (typeof value === 'string' && !['max_', 'ai_'].some(prefix => key.startsWith(prefix))))
      .map(([key, value]) => {
        if (key.startsWith('max_')) {
          return `${value === 'unlimited' ? 'Unlimited' : value} ${featureDescriptions[key] || key}`;
        }
        return featureDescriptions[key] || key;
      });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => {
        const Icon = tierIcons[plan.tier as keyof typeof tierIcons] || Sparkles;
        const isCurrentPlan = currentTier === plan.tier;
        const isPro = plan.tier === 'pro';
        const features = getFeatureList(plan.features);

        return (
          <Card
            key={plan.id}
            className={cn(
              "relative overflow-hidden transition-all",
              isPro && "border-2 border-amber-500 shadow-xl scale-105",
              isCurrentPlan && "ring-2 ring-primary"
            )}
          >
            {isPro && (
              <div className="absolute top-0 right-0">
                <Badge className="rounded-tl-none rounded-br-none bg-amber-500">
                  MOST POPULAR
                </Badge>
              </div>
            )}

            <div className={cn(
              "p-6 bg-gradient-to-br",
              tierColors[plan.tier as keyof typeof tierColors]
            )}>
              <Icon className="w-12 h-12 text-white mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="text-white">
                {plan.tier === 'free' ? (
                  <div className="text-3xl font-bold">$0</div>
                ) : plan.tier === 'lifetime' ? (
                  <div>
                    <div className="text-3xl font-bold">${plan.price_lifetime}</div>
                    <div className="text-sm opacity-90">one-time</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold">${plan.price_monthly}</div>
                    <div className="text-sm opacity-90">per month</div>
                    <div className="text-xs opacity-75 mt-1">
                      or ${plan.price_yearly}/year (save ${((plan.price_monthly * 12) - plan.price_yearly).toFixed(0)})
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Features */}
              <ul className="space-y-2">
                {features.slice(0, 8).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
                {features.length > 8 && (
                  <li className="text-sm text-muted-foreground">
                    + {features.length - 8} more features
                  </li>
                )}
              </ul>

              {/* Action Button */}
              <div className="space-y-2">
                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : plan.tier === 'free' ? (
                  <Button variant="outline" disabled className="w-full">
                    Free Plan
                  </Button>
                ) : (
                  <>
                    {plan.tier === 'lifetime' ? (
                      <Button
                        onClick={() => onSelectPlan?.(plan, 'lifetime')}
                        className="w-full bg-gradient-to-r from-pink-500 to-pink-600"
                      >
                        Get Lifetime Access
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => onSelectPlan?.(plan, 'monthly')}
                          className={cn(
                            "w-full",
                            isPro && "bg-gradient-to-r from-amber-500 to-amber-600"
                          )}
                        >
                          Start Monthly
                        </Button>
                        <Button
                          onClick={() => onSelectPlan?.(plan, 'yearly')}
                          variant="outline"
                          className="w-full"
                        >
                          Start Yearly (Save {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%)
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
