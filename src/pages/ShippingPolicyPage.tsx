import { AppTopbar } from '@/components/app/AppTopbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, MapPin, AlertCircle } from 'lucide-react';

const ShippingPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppTopbar title="Shipping Policy" showBackButton />
      
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Card className="border-border/30 shadow-lg">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Shipping Policy</CardTitle>
                <CardDescription className="text-base">
                  Digital Service - No Physical Shipping Required
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Introduction */}
            <div>
              <p className="text-muted-foreground leading-relaxed">
                StarPath is a fully digital platform providing habit tracking, goal management, 
                and AI-powered educational tools. As we offer digital services and subscriptions, 
                no physical products are shipped to customers.
              </p>
            </div>

            {/* Digital Service Delivery */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    Instant Digital Delivery
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Upon successful payment, your subscription or credits are activated immediately 
                    and available in your account. You can start using premium features right away 
                    without any waiting period.
                  </p>
                </div>
              </div>
            </div>

            {/* Access Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    How to Access Your Purchase
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        <strong className="text-foreground">Subscription:</strong> Access premium features 
                        immediately after payment confirmation. Your subscription status is updated in real-time.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        <strong className="text-foreground">AI Credits:</strong> Credits are added to your 
                        account balance instantly and can be used for AI-powered tools right away.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>
                        <strong className="text-foreground">Account Access:</strong> Log in from any device 
                        with internet connectivity to access your services.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Service Availability */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Service Availability</h3>
              <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold">✓</span>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">24/7 Access:</strong> Our platform is available 
                    round the clock from anywhere in the world.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold">✓</span>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Multi-Device:</strong> Access your account from 
                    desktop, tablet, or mobile devices.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold">✓</span>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Cloud Storage:</strong> All your data is securely 
                    stored and synced across devices.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Requirements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Technical Requirements</h3>
              <p className="text-muted-foreground leading-relaxed">
                To use StarPath services, you need:
              </p>
              <ul className="space-y-2 text-muted-foreground ml-4">
                <li>• A stable internet connection</li>
                <li>• A modern web browser (Chrome, Firefox, Safari, or Edge)</li>
                <li>• A registered account with valid email address</li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    Need Help?
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    If you experience any issues accessing your purchased services or have questions 
                    about service delivery, please contact our support team:
                  </p>
                  <a 
                    href="mailto:clawzer96@gmail.com"
                    className="text-primary hover:underline font-medium"
                  >
                    clawzer96@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="pt-6 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                Last updated: January 12, 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
