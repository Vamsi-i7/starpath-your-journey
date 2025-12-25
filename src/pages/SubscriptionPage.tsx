import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useSubscription } from '@/hooks/useSubscription';
import { Check, Sparkles, Loader2, Crown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Unlimited habits tracking',
      'Unlimited goals',
      'Basic analytics',
      'Friend connections',
      'Chat with friends',
    ],
    notIncluded: [
      'AI Notes Generator',
      'AI Flashcards',
      'AI Learning Roadmap',
      'AI Mentor',
      'Video/Audio calls',
    ],
  },
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: '₹99',
    period: 'per month',
    popular: true,
    features: [
      'Everything in Free',
      'AI Notes Generator',
      'AI Flashcards Creator',
      'AI Learning Roadmap',
      'AI Mentor for doubts',
      'Video & Audio calls',
      'Priority support',
    ],
    notIncluded: [],
  },
  {
    id: 'yearly',
    name: 'Premium Yearly',
    price: '$99.99',
    period: 'per year',
    savings: 'Save $20',
    features: [
      'Everything in Free',
      'AI Notes Generator',
      'AI Flashcards Creator',
      'AI Learning Roadmap',
      'AI Mentor for doubts',
      'Video & Audio calls',
      'Priority support',
    ],
    notIncluded: [],
  },
];

const SubscriptionPage = () => {
  const { subscription, isPremium, subscribe, cancelSubscription, isLoading } = useSubscription();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    setProcessingPlan(planType);
    await subscribe(planType);
    setProcessingPlan(null);
  };

  const handleCancel = async () => {
    await cancelSubscription();
    setShowCancelDialog(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AppTopbar title="Subscription" />
      
      <div className="p-4 sm:p-6 space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {isPremium ? (
              <span className="flex items-center justify-center gap-2">
                <Crown className="w-8 h-8 text-primary" />
                You're a Premium Member!
              </span>
            ) : (
              'Unlock Your Full Potential'
            )}
          </h2>
          <p className="text-muted-foreground">
            {isPremium
              ? `Your ${subscription?.plan_type} subscription is active.`
              : 'Get access to AI-powered tools and premium features.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan_type === plan.id;
            const isPremiumPlan = plan.id !== 'free';
            
            return (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                {plan.savings && (
                  <Badge className="absolute -top-3 right-4 bg-green-500">
                    {plan.savings}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isPremiumPlan && <Sparkles className="w-5 h-5 text-primary" />}
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <div className="space-y-2">
                      <Button className="w-full" variant="secondary" disabled>
                        Current Plan
                      </Button>
                      {isPremiumPlan && (
                        <Button
                          variant="outline"
                          className="w-full text-destructive"
                          onClick={() => setShowCancelDialog(true)}
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => isPremiumPlan && handleSubscribe(plan.id as 'monthly' | 'yearly')}
                      disabled={processingPlan !== null || plan.id === 'free'}
                    >
                      {processingPlan === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {plan.id === 'free' ? 'Current Plan' : 'Subscribe Now'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground max-w-md mx-auto">
          * This is a demo subscription system. In production, payments would be processed through Stripe.
        </p>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your premium subscription? You'll lose access to AI tools and premium features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionPage;
