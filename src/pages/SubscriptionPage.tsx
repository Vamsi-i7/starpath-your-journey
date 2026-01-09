import { useState } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/contexts/AuthContext';
import {
  Crown,
  Zap,
  Sparkles,
  Check,
  Star,
  Infinity,
  Coins,
  TrendingUp,
  Shield,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

const SUBSCRIPTION_PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    tier: 'free',
    credits: 0,
    monthlyCredits: 0,
    badge: null,
    description: 'Perfect for getting started',
    features: [
      '10 saved items in library',
      'Basic AI Tools access',
      'Manual habit tracking',
      'Basic analytics',
      'Community support',
    ],
    limitations: [
      'No AI Mentor access',
      'No PDF exports',
      'Library auto-deletes in 7 days',
      'Purchase credits to use AI tools',
    ],
  },
  {
    name: 'Basic',
    price: 9.99,
    period: 'month',
    tier: 'basic',
    credits: 50,
    monthlyCredits: 50,
    badge: <Star className="w-4 h-4" />,
    description: 'Great for regular users',
    popular: false,
    features: [
      '50 AI credits per month',
      '50 saved items in library',
      'All AI Tools (Notes, Flashcards, Roadmap)',
      'Library auto-deletes in 30 days',
      'Priority support',
      'Export to TXT/Markdown',
    ],
    limitations: [
      'No AI Mentor access',
      'No PDF exports',
      'Limited credits',
    ],
  },
  {
    name: 'Premium',
    price: 19.99,
    period: 'month',
    tier: 'premium',
    credits: 500,
    monthlyCredits: 500,
    badge: <Crown className="w-4 h-4" />,
    description: 'For power users and students',
    popular: true,
    features: [
      '500 AI credits per month',
      'Unlimited library storage',
      'AI Mentor - Full Access',
      'All AI Tools with priority',
      'PDF Export (Premium)',
      'Library auto-deletes in 90 days',
      'Advanced analytics',
      'Priority generation speed',
      'Exclusive features',
      'Premium support',
    ],
    limitations: [],
  },
  {
    name: 'Lifetime',
    price: 199.99,
    period: 'one-time',
    tier: 'lifetime',
    credits: 1000,
    monthlyCredits: 1000,
    badge: <Infinity className="w-4 h-4" />,
    description: 'Best value - Pay once, use forever',
    popular: false,
    features: [
      '1000 AI credits per month',
      'Everything in Premium',
      'Lifetime access',
      'All future updates',
      'Never pay again',
      'VIP support',
      'Early access to features',
    ],
    limitations: [],
  },
];

const CREDIT_PACKAGES_DATA = [
  {
    name: 'Starter Pack',
    credits: 50,
    bonus: 0,
    price: 4.99,
    popular: false,
    icon: Coins,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Popular Pack',
    credits: 150,
    bonus: 10,
    price: 12.99,
    popular: true,
    icon: TrendingUp,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Power Pack',
    credits: 350,
    bonus: 50,
    price: 24.99,
    popular: false,
    icon: Zap,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    name: 'Ultimate Pack',
    credits: 1000,
    bonus: 200,
    price: 59.99,
    popular: false,
    icon: Gift,
    gradient: 'from-green-500 to-emerald-500',
  },
];

const AI_TOOL_COSTS = [
  { name: 'Notes Generator', cost: 5, icon: '📝', description: 'Generate comprehensive notes from any topic' },
  { name: 'Flashcards', cost: 10, icon: '🎴', description: 'Create interactive study flashcards' },
  { name: 'Roadmap', cost: 15, icon: '🗺️', description: 'Build complete learning roadmaps' },
  { name: 'AI Mentor Chat', cost: 3, icon: '💬', description: 'Per message with your AI mentor' },
];

export default function NewSubscriptionPage() {
  const { profile } = useAuth();
  const { credits, packages, toolCosts } = useCredits();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentTier = profile?.subscription_tier || 'free';

  const handleSubscribe = async (planTier: string) => {
    setSelectedPlan(planTier);
    // Implement Stripe integration here
    toast.info('Redirecting to payment...', {
      description: 'This feature will be connected to Stripe soon!',
    });
    setTimeout(() => setSelectedPlan(null), 2000);
  };

  const handleBuyCredits = async (packageData: any) => {
    // Implement credit purchase
    toast.info('Redirecting to payment...', {
      description: 'Credit purchase will be integrated with Stripe!',
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5">
      <AppTopbar title="Subscription & Credits" />

      <div className="p-4 sm:p-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-purple-500" />
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Upgrade Your Experience
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a plan that fits your needs or buy credits for flexible AI usage
            </p>
            
            {/* Current Credits Display */}
            <Card className="max-w-md mx-auto border-2 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">Your Credits</p>
                      <p className="text-2xl font-bold">{credits}</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                    {currentTier.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="subscriptions" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="subscriptions">
                <Crown className="w-4 h-4 mr-2" />
                Subscriptions
              </TabsTrigger>
              <TabsTrigger value="credits">
                <Coins className="w-4 h-4 mr-2" />
                Buy Credits
              </TabsTrigger>
            </TabsList>

            {/* Subscription Plans */}
            <TabsContent value="subscriptions" className="space-y-8 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isCurrentPlan = currentTier === plan.tier;
                  const Icon = plan.badge;

                  return (
                    <Card
                      key={plan.name}
                      className={`relative overflow-hidden transition-all hover:shadow-2xl ${
                        plan.popular
                          ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20'
                          : 'border'
                      } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                          MOST POPULAR
                        </div>
                      )}

                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="flex items-center gap-2">
                            {Icon && <span className="text-purple-500">{Icon}</span>}
                            {plan.name}
                          </CardTitle>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">${plan.price}</span>
                            <span className="text-muted-foreground">/{plan.period}</span>
                          </div>
                          {plan.monthlyCredits > 0 && (
                            <Badge variant="outline" className="mt-2">
                              <Coins className="w-3 h-3 mr-1" />
                              {plan.monthlyCredits} credits/month
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          className={`w-full ${
                            plan.popular
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                              : ''
                          }`}
                          disabled={isCurrentPlan || selectedPlan === plan.tier}
                          onClick={() => handleSubscribe(plan.tier)}
                        >
                          {isCurrentPlan ? (
                            'Current Plan'
                          ) : selectedPlan === plan.tier ? (
                            'Processing...'
                          ) : (
                            <>
                              {plan.tier === 'free' ? 'Current Plan' : 'Upgrade Now'}
                              {plan.tier !== 'free' && <ArrowRight className="w-4 h-4 ml-2" />}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* AI Tool Costs */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6 text-center">How Credits Work</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {AI_TOOL_COSTS.map((tool, index) => (
                    <Card key={index} className="text-center">
                      <CardContent className="p-6 space-y-2">
                        <div className="text-4xl mb-2">{tool.icon}</div>
                        <h4 className="font-semibold">{tool.name}</h4>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                          <Coins className="w-3 h-3 mr-1" />
                          {tool.cost} credits
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Credit Packages */}
            <TabsContent value="credits" className="space-y-8 mt-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Buy Credits Once, Use Anytime</h3>
                <p className="text-muted-foreground">No subscription needed - credits never expire</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {CREDIT_PACKAGES_DATA.map((pkg, index) => {
                  const Icon = pkg.icon;
                  const totalCredits = pkg.credits + pkg.bonus;

                  return (
                    <Card
                      key={index}
                      className={`relative overflow-hidden transition-all hover:shadow-2xl ${
                        pkg.popular ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20' : ''
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                          BEST VALUE
                        </div>
                      )}

                      <CardHeader>
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center mx-auto mb-4`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-center">{pkg.name}</CardTitle>
                        <div className="text-center space-y-2">
                          <div className="text-3xl font-bold">${pkg.price}</div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2">
                              <Coins className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{pkg.credits} credits</span>
                            </div>
                            {pkg.bonus > 0 && (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                <Gift className="w-3 h-3 mr-1" />
                                +{pkg.bonus} bonus
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total: {totalCredits} credits
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <Button
                          className={`w-full bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white border-0`}
                          onClick={() => handleBuyCredits(pkg)}
                        >
                          Buy Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Benefits */}
              <Card className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                      <Shield className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <h4 className="font-semibold mb-1">Never Expire</h4>
                      <p className="text-sm text-muted-foreground">Use credits whenever you need them</p>
                    </div>
                    <div>
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <h4 className="font-semibold mb-1">Flexible Usage</h4>
                      <p className="text-sm text-muted-foreground">Use on any AI tool you want</p>
                    </div>
                    <div>
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-cyan-500" />
                      <h4 className="font-semibold mb-1">Better Value</h4>
                      <p className="text-sm text-muted-foreground">Bigger packs = bigger bonuses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
