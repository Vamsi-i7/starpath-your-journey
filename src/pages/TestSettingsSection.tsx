// Minimal test to verify the Support & Policies section renders
import { Button } from '@/components/ui/button';
import { Mail, Package, RefreshCw, ExternalLink } from 'lucide-react';

export const SupportPoliciesSection = () => {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/30">
      <h3 className="font-semibold text-foreground mb-4">Support & Policies</h3>
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-between group hover:bg-primary/5"
          onClick={() => window.open('/app/contact', '_blank')}
        >
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-primary" />
            <div className="text-left">
              <span className="font-medium">Contact Us</span>
              <p className="text-xs text-muted-foreground">Get in touch with our support team</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-between group hover:bg-primary/5"
          onClick={() => window.open('/app/shipping-policy', '_blank')}
        >
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-primary" />
            <div className="text-left">
              <span className="font-medium">Shipping Policy</span>
              <p className="text-xs text-muted-foreground">Learn about our digital service delivery</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-between group hover:bg-primary/5"
          onClick={() => window.open('/app/cancellation-refund', '_blank')}
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-primary" />
            <div className="text-left">
              <span className="font-medium">Cancellations & Refunds</span>
              <p className="text-xs text-muted-foreground">View our refund and cancellation policy</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </div>
    </div>
  );
};
