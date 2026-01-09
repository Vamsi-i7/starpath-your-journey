import { useState } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { EnhancedMentorChat } from '@/components/ai-tools/EnhancedMentorChat';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAIGenerate } from '@/hooks/useAIGenerate';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Zap, Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AIMentorPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { generate, isGenerating } = useAIGenerate();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([]);

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'lifetime';

  const handleSendMessage = async (message: string, context?: string) => {
    if (!isPremium) {
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: message, timestamp: new Date() }]);
    
    const conversationContext = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const fullContext = context 
      ? `${context}\n\n${conversationContext}`
      : conversationContext;
    
    const result = await generate('mentor', message, fullContext);
    if (result) {
      setMessages(prev => [...prev, { role: 'assistant', content: result, timestamp: new Date() }]);
    }
  };

  if (!isPremium) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5">
        <AppTopbar title="AI Mentor" />
        
        <div className="p-4 sm:p-6">
          {/* Premium Lock Screen */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-1">
              <div className="relative rounded-3xl bg-background/95 backdrop-blur p-8 sm:p-12">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 blur-3xl opacity-50 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-3xl">
                      <Sparkles className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-4 py-1">
                    <Crown className="w-3 h-3 mr-1" />
                    PREMIUM FEATURE
                  </Badge>
                  
                  <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Your Personal AI Mentor
                  </h1>
                  
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Get personalized guidance, study strategies, and motivation from an AI mentor that understands your habits, goals, and learning style.
                  </p>
                </div>

                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold">Context-Aware</h3>
                    <p className="text-sm text-muted-foreground">
                      Knows your habits, goals, and progress
                    </p>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold">Personalized</h3>
                    <p className="text-sm text-muted-foreground">
                      Tailored advice just for you
                    </p>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold">24/7 Available</h3>
                    <p className="text-sm text-muted-foreground">
                      Always here when you need help
                    </p>
                  </div>
                </div>

                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate('/app/subscription')}
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Premium
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/app/subscription')}
                  >
                    View Plans & Pricing
                  </Button>
                </div>
              </div>
            </div>

            {/* Features List */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">What You'll Get</h2>
              <div className="space-y-4">
                {[
                  'Unlimited conversations with AI Mentor',
                  'Context-aware responses based on your habits',
                  'Personalized study strategies and schedules',
                  'Motivation and accountability support',
                  'Practice problem generation',
                  'Step-by-step problem solving guidance',
                  'Learning path recommendations',
                  'Progress analysis and insights',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Locked Preview */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
                  <p className="text-lg font-semibold">Unlock AI Mentor with Premium</p>
                </div>
              </div>
              <div className="p-6 blur-sm select-none pointer-events-none">
                <div className="h-[600px] bg-muted rounded-xl" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5">
      <AppTopbar title="AI Mentor" />
      
      <div className="p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Premium Badge */}
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
              <Crown className="w-3 h-3 mr-1" />
              PREMIUM
            </Badge>
          </div>

          {/* Chat Interface */}
          <Card className="border-2 border-purple-500/20 shadow-2xl shadow-purple-500/10">
            <div className="p-6">
              <EnhancedMentorChat
                onSendMessage={handleSendMessage}
                messages={messages}
                isGenerating={isGenerating}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
