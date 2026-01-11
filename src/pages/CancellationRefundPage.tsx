import { AppTopbar } from '@/components/app/AppTopbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, DollarSign, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const CancellationRefundPage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppTopbar title="Cancellation & Refund Policy" showBackButton />
      
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Card className="border-border/30 shadow-lg">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <RefreshCw className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Cancellation & Refund Policy</CardTitle>
                <CardDescription className="text-base">
                  Your rights and our commitments regarding cancellations and refunds
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Introduction */}
            <div>
              <p className="text-muted-foreground leading-relaxed">
                At StarPath, we strive to provide the best experience for our users. This policy 
                outlines our cancellation and refund procedures for subscriptions and credit purchases.
              </p>
            </div>

            {/* Subscription Cancellation */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <XCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-3">
                    Subscription Cancellation
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-semibold text-foreground mb-2">How to Cancel</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        You can cancel your subscription at any time through:
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Your account Settings → Subscription section</li>
                        <li>• Or by contacting support at <a href="mailto:clawzer96@gmail.com" className="text-primary hover:underline">clawzer96@gmail.com</a></li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-semibold text-foreground mb-2">What Happens After Cancellation</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Your subscription remains active until the end of your current billing period</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>You keep access to all premium features until your subscription expires</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>No further charges will be made after cancellation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>Your account will automatically revert to the free plan after expiry</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Policy */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-3">
                    Refund Policy
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        7-Day Money-Back Guarantee
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        We offer a <strong className="text-foreground">7-day money-back guarantee</strong> for 
                        new subscription purchases. If you're not satisfied with our service, you can request 
                        a full refund within 7 days of your initial purchase.
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Applies to first-time subscription purchases only</p>
                        <p>• Must be requested within 7 days of purchase</p>
                        <p>• Full refund, no questions asked</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-semibold text-foreground mb-2">After 7 Days</h4>
                      <p className="text-sm text-muted-foreground">
                        After the 7-day period, subscriptions are generally non-refundable. However, we may 
                        consider refund requests on a case-by-case basis for:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground ml-4">
                        <li>• Technical issues preventing service use</li>
                        <li>• Duplicate charges or billing errors</li>
                        <li>• Extenuating circumstances (evaluated individually)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Credits */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">AI Credits Policy</h3>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong className="text-foreground">AI Credit purchases are non-refundable</strong> once 
                      they have been added to your account, as they represent immediate access to consumable 
                      digital services.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      However, if you experience technical issues preventing credit usage, please contact support 
                      and we'll work to resolve the issue.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Time */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    Refund Processing Time
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Approved refunds are processed within:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">3-5 business days</strong> for processing on our end</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">5-10 business days</strong> for the refund to appear in your account (depending on your payment provider)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How to Request */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">How to Request a Refund</h3>
              <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                <p className="text-sm text-muted-foreground">
                  To request a refund, please contact our support team with:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Your account email address</li>
                  <li>• Transaction ID or payment reference</li>
                  <li>• Reason for refund request</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Email:</strong>{' '}
                    <a 
                      href="mailto:clawzer96@gmail.com"
                      className="text-primary hover:underline"
                    >
                      clawzer96@gmail.com
                    </a>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We typically respond within 24-48 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Fair Use */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <h3 className="font-semibold text-foreground text-lg mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Fair Use Policy
                </h3>
                <p className="text-sm text-muted-foreground">
                  We reserve the right to deny refund requests that we determine to be fraudulent or 
                  abusive. This includes repeated subscription purchases followed by refund requests, 
                  or attempts to exploit our refund policy.
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="pt-6 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                Last updated: January 12, 2026
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                We reserve the right to update this policy at any time. Continued use of our service 
                constitutes acceptance of any changes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CancellationRefundPage;
