import { useState } from 'react';
import { AlertCircle, Info, Shield, Zap, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIUsageTermsProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AIUsageTerms({ open, onAccept, onDecline }: AIUsageTermsProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            AI Tools - Terms of Use & Limitations
          </DialogTitle>
          <DialogDescription>
            Please read and accept these terms before using our AI features
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {/* Important Notice */}
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-600 dark:text-amber-400">
                <strong>Important:</strong> AI-generated content is for educational purposes only 
                and may contain inaccuracies. Always verify important information.
              </AlertDescription>
            </Alert>

            {/* Usage Limits Section */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                AI Usage Limits
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>Free Users:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                  <li>10 AI credits (one-time starter bonus)</li>
                  <li>Limited to 15 AI requests per minute</li>
                  <li>Basic AI features only</li>
                </ul>
                <p className="mt-3"><strong>Pro/Premium Subscribers:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                  <li>100-500 AI credits per month (auto-renewed)</li>
                  <li>Priority processing</li>
                  <li>Full access to AI Mentor</li>
                </ul>
              </div>
            </div>

            {/* Credit Costs */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-500" />
                Credit Costs Per Feature
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium">Notes Generator</p>
                  <p className="text-muted-foreground">5 credits per generation</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium">Flashcards</p>
                  <p className="text-muted-foreground">10 credits per set</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium">Learning Roadmap</p>
                  <p className="text-muted-foreground">15 credits per roadmap</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium">AI Mentor Chat</p>
                  <p className="text-muted-foreground">3 credits per message</p>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-3">
              <h3 className="font-semibold">Terms & Conditions</h3>
              <div className="text-sm text-muted-foreground space-y-3">
                <p>
                  <strong>1. Content Accuracy:</strong> AI-generated content is created using 
                  machine learning models and may not always be accurate, complete, or up-to-date. 
                  Users are responsible for verifying any information before relying on it.
                </p>
                <p>
                  <strong>2. Appropriate Use:</strong> You agree to use AI features only for 
                  legitimate educational purposes. Generating harmful, illegal, misleading, or 
                  inappropriate content is strictly prohibited.
                </p>
                <p>
                  <strong>3. Data Privacy:</strong> Your prompts and generated content may be 
                  processed by third-party AI services. Do not input sensitive personal information, 
                  passwords, or confidential data.
                </p>
                <p>
                  <strong>4. Credit Usage:</strong> Credits are non-refundable once used. 
                  Unused credits in subscription plans do not roll over to the next month. 
                  Credits purchased separately may have different terms.
                </p>
                <p>
                  <strong>5. Rate Limiting:</strong> To ensure fair usage, AI features are 
                  rate-limited. Excessive usage may result in temporary restrictions.
                </p>
                <p>
                  <strong>6. Service Availability:</strong> AI features depend on third-party 
                  services and may occasionally be unavailable due to maintenance or outages. 
                  We do not guarantee 100% uptime.
                </p>
                <p>
                  <strong>7. Intellectual Property:</strong> You retain rights to your input 
                  prompts. Generated content is provided for your personal educational use. 
                  Commercial use may require additional permissions.
                </p>
                <p>
                  <strong>8. Modifications:</strong> We reserve the right to modify AI features, 
                  credit costs, and these terms at any time. Continued use after changes 
                  constitutes acceptance of new terms.
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-600 dark:text-blue-400">
                <strong>Disclaimer:</strong> StarPath is not responsible for any decisions 
                made based on AI-generated content. The AI is a tool to assist learning, 
                not a substitute for professional advice or thorough research.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Checkbox 
              id="accept-terms" 
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <label 
              htmlFor="accept-terms" 
              className="text-sm cursor-pointer select-none"
            >
              I have read and agree to the AI usage terms and limitations
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onDecline}>
              Decline
            </Button>
            <Button 
              onClick={onAccept} 
              disabled={!accepted}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept & Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage AI terms acceptance
export function useAITermsAcceptance() {
  const [showTerms, setShowTerms] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const hasAcceptedTerms = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('starpath-ai-terms-accepted') === 'true';
  };

  const acceptTerms = () => {
    localStorage.setItem('starpath-ai-terms-accepted', 'true');
    localStorage.setItem('starpath-ai-terms-accepted-date', new Date().toISOString());
  };

  const requireTermsAcceptance = (action: () => void) => {
    if (hasAcceptedTerms()) {
      action();
    } else {
      setPendingAction(() => action);
      setShowTerms(true);
    }
  };

  const handleAccept = () => {
    acceptTerms();
    setShowTerms(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleDecline = () => {
    setShowTerms(false);
    setPendingAction(null);
  };

  return {
    showTerms,
    setShowTerms,
    requireTermsAcceptance,
    handleAccept,
    handleDecline,
    hasAcceptedTerms,
  };
}

// Simple banner component showing AI limitations
export function AILimitationsBanner() {
  return (
    <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="text-sm">
        <span className="font-medium">AI Limitations:</span> Content is generated by AI and may 
        contain errors. Always verify important information. Rate limited to 15 requests/minute.
      </AlertDescription>
    </Alert>
  );
}
