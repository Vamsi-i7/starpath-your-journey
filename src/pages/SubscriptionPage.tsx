import { useState } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/contexts/AuthContext';
import { useRazorpay } from '@/hooks/useRazorpay';
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

// Subscription Plans - Monthly & Yearly options only
const SUBSCRIPTION_PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    tier: 'free',
    monthlyCredits: 10,
    badge: null,
    description: 'Perfect for getting started',
    features: [
      '10 AI credits (one-time)',
      '10 saved items in library',
      'Basic AI Tools access',
      'Manual habit tracking',
      'Basic analytics',
    ],
    limitations: [
      'Limited AI Mentor access',
      'No PDF exports',
      'Library auto-deletes in 7 days',
    ],
  },
  {
    name: 'Pro',
    monthlyPrice: 49,
    yearlyPrice: 399, // ~₹33/month - Save 32%
    tier: 'pro',
    monthlyCredits: 100,
    badge: <Star className="w-4 h-4" />,
    description: 'Great for regular users',
    popular: false,
    features: [
      '100 AI credits per month',
      '50 saved items in library',
      'All AI Tools (Notes, Flashcards, Roadmap)',
      'AI Mentor access',
      'Library auto-deletes in 30 days',
      'Export to TXT/Markdown',
      'Email support',
    ],
    limitations: [
      'No PDF exports',
    ],
  },
  {
    name: 'Premium',
    monthlyPrice: 99,
    yearlyPrice: 799, // ~₹67/month - Save 33%
    tier: 'premium',
    monthlyCredits: 500,
    badge: <Crown className="w-4 h-4" />,
    description: 'For power users and students',
    popular: true,
    features: [
      '500 AI credits per month',
      'Unlimited library storage',
      'AI Mentor - Unlimited access',
      'All AI Tools with priority',
      'PDF Export',
      'Library never expires',
      'Advanced analytics',
      'Priority generation speed',
      'Priority support',
    ],
    limitations: [],
  },
];

// Credit Packages - Monthly & Yearly subscriptions
const CREDIT_PACKAGES_DATA = [
  {
    name: 'Starter',
    credits: 50,
    monthlyPrice: 29,
    yearlyPrice: 249, // ~₹21/month - Save 28%
    popular: false,
    icon: Coins,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Popular',
    credits: 150,
    monthlyPrice: 79,
    yearlyPrice: 699, // ~₹58/month - Save 26%
    popular: true,
    icon: TrendingUp,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Power',
    credits: 350,
    monthlyPrice: 149,
    yearlyPrice: 1299, // ~₹108/month - Save 27%
    popular: false,
    icon: Zap,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    name: 'Ultimate',
    credits: 1000,
    monthlyPrice: 349,
    yearlyPrice: 2999, // ~₹250/month - Save 28%
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
  const { credits } = useCredits();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentTier = 'free'; // Will be fetched from subscription hook

  const { purchaseSubscription, purchaseCredits, isProcessing } = useRazorpay();

  const handleSubscribe = async (planTier: string, monthlyPrice: number, yearlyPrice: number) => {
    if (planTier === 'free') return;
    
    setSelectedPlan(planTier);
    
    const amount = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;
    const duration = billingCycle === 'yearly' ? 12 : 1;
    
    await purchaseSubscription(planTier, amount, duration);
    
    setSelectedPlan(null);
  };

  const [creditBillingCycle, setCreditBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleBuyCredits = async (packageData: any) => {
    const amount = creditBillingCycle === 'yearly' ? packageData.yearlyPrice : packageData.monthlyPrice;
    const duration = creditBillingCycle === 'yearly' ? 12 : 1;
    
    await purchaseCredits(
      packageData.credits,
      0, // No bonus - credits given every month
      amount,
      `${packageData.name} Credit Pack (${creditBillingCycle})`,
      duration
    );
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
              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-4">
                <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    billingCycle === 'yearly' ? 'bg-purple-600' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Yearly
                </span>
                {billingCycle === 'yearly' && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Save up to 33%
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isCurrentPlan = currentTier === plan.tier;
                  const Icon = plan.badge;
                  const displayPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                  const monthlyEquivalent = billingCycle === 'yearly' && plan.yearlyPrice > 0 
                    ? Math.round(plan.yearlyPrice / 12) 
                    : null;

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
                            <span className="text-3xl font-bold">₹{displayPrice}</span>
                            <span className="text-muted-foreground">
                              /{billingCycle === 'yearly' ? 'year' : 'month'}
                            </span>
                          </div>
                          {monthlyEquivalent && (
                            <p className="text-sm text-muted-foreground">
                              ₹{monthlyEquivalent}/month billed yearly
                            </p>
                          )}
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
                          disabled={isCurrentPlan || selectedPlan === plan.tier || isProcessing}
                          onClick={() => handleSubscribe(plan.tier, plan.monthlyPrice, plan.yearlyPrice)}
                        >
                          {isCurrentPlan ? (
                            'Current Plan'
                          ) : selectedPlan === plan.tier || isProcessing ? (
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
                <h3 className="text-2xl font-bold mb-2">Credit Subscriptions</h3>
                <p className="text-muted-foreground">Get credits every month - perfect if you need more than your plan offers</p>
              </div>

              {/* Billing Cycle Toggle for Credits */}
              <div className="flex items-center justify-center gap-4">
                <span className={`text-sm font-medium ${creditBillingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setCreditBillingCycle(creditBillingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    creditBillingCycle === 'yearly' ? 'bg-purple-600' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      creditBillingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${creditBillingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Yearly
                </span>
                {creditBillingCycle === 'yearly' && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Save up to 28%
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {CREDIT_PACKAGES_DATA.map((pkg, index) => {
                  const Icon = pkg.icon;
                  const displayPrice = creditBillingCycle === 'yearly' ? pkg.yearlyPrice : pkg.monthlyPrice;
                  const monthlyEquivalent = creditBillingCycle === 'yearly' 
                    ? Math.round(pkg.yearlyPrice / 12) 
                    : null;

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
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-3xl font-bold">₹{displayPrice}</span>
                            <span className="text-muted-foreground">
                              /{creditBillingCycle === 'yearly' ? 'year' : 'month'}
                            </span>
                          </div>
                          {monthlyEquivalent && (
                            <p className="text-sm text-muted-foreground">
                              ₹{monthlyEquivalent}/month billed yearly
                            </p>
                          )}
                          <div className="space-y-1">
                            <Badge variant="outline" className="mt-2">
                              <Coins className="w-3 h-3 mr-1" />
                              {pkg.credits} credits/month
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <Button
                          className={`w-full bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white border-0`}
                          onClick={() => handleBuyCredits(pkg)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Subscribe'}
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
                      <Coins className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <h4 className="font-semibold mb-1">Monthly Credits</h4>
                      <p className="text-sm text-muted-foreground">Get fresh credits every month automatically</p>
                    </div>
                    <div>
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <h4 className="font-semibold mb-1">Stack with Plans</h4>
                      <p className="text-sm text-muted-foreground">Add to your subscription plan credits</p>
                    </div>
                    <div>
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-cyan-500" />
                      <h4 className="font-semibold mb-1">Save with Yearly</h4>
                      <p className="text-sm text-muted-foreground">Up to 28% off with yearly billing</p>
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
