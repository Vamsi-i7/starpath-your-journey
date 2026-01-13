import { useState } from 'react';
import { AdminUser } from '@/hooks/useAdminUserManagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Coins, CreditCard, Ban, CheckCircle } from 'lucide-react';

interface EditUserModalProps {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onGrantCredits: (userId: string, amount: number, reason: string) => Promise<boolean>;
  onDeductCredits: (userId: string, amount: number, reason: string) => Promise<boolean>;
  onUpdateSubscription: (userId: string, planType: string, status: string) => Promise<boolean>;
  onSetStatus: (userId: string, status: 'active' | 'disabled' | 'suspended', reason?: string) => Promise<boolean>;
}

export function EditUserModal({
  user,
  open,
  onClose,
  onGrantCredits,
  onDeductCredits,
  onUpdateSubscription,
  onSetStatus,
}: EditUserModalProps) {
  const [activeTab, setActiveTab] = useState('credits');
  const [isLoading, setIsLoading] = useState(false);
  
  // Credit management
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [showCreditConfirm, setShowCreditConfirm] = useState(false);
  const [creditAction, setCreditAction] = useState<'grant' | 'deduct'>('grant');

  // Subscription management
  const [subscriptionPlan, setSubscriptionPlan] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [showSubscriptionConfirm, setShowSubscriptionConfirm] = useState(false);

  // Account status
  const [accountStatus, setAccountStatus] = useState<'active' | 'disabled' | 'suspended'>('active');
  const [statusReason, setStatusReason] = useState('');
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  if (!user) return null;

  const handleCreditAction = () => {
    const amount = parseInt(creditAmount);
    if (!amount || amount <= 0) return;
    setShowCreditConfirm(true);
  };

  const confirmCreditAction = async () => {
    setIsLoading(true);
    const amount = parseInt(creditAmount);
    
    const success = creditAction === 'grant'
      ? await onGrantCredits(user.id, amount, creditReason)
      : await onDeductCredits(user.id, amount, creditReason);

    setIsLoading(false);
    setShowCreditConfirm(false);
    
    if (success) {
      setCreditAmount('');
      setCreditReason('');
    }
  };

  const handleSubscriptionUpdate = () => {
    if (!subscriptionPlan || !subscriptionStatus) return;
    setShowSubscriptionConfirm(true);
  };

  const confirmSubscriptionUpdate = async () => {
    setIsLoading(true);
    const success = await onUpdateSubscription(user.id, subscriptionPlan, subscriptionStatus);
    setIsLoading(false);
    setShowSubscriptionConfirm(false);
    
    if (success) {
      setSubscriptionPlan('');
      setSubscriptionStatus('');
    }
  };

  const handleStatusChange = () => {
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = async () => {
    setIsLoading(true);
    const success = await onSetStatus(user.id, accountStatus, statusReason || undefined);
    setIsLoading(false);
    setShowStatusConfirm(false);
    
    if (success) {
      setStatusReason('');
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
            <DialogDescription>
              {user.full_name || user.username} ({user.email})
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="status">Account Status</TabsTrigger>
            </TabsList>

            {/* Credits Tab */}
            <TabsContent value="credits" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Current Balance</div>
                <div className="text-2xl font-bold">{user.ai_credits.toLocaleString()} credits</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total purchased: {user.total_credits_purchased.toLocaleString()} | 
                  Used this month: {user.credits_used_this_month.toLocaleString()}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter credit amount"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    min="1"
                  />
                </div>

                <div>
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="Why are you making this change?"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setCreditAction('grant');
                      handleCreditAction();
                    }}
                    disabled={!creditAmount || parseInt(creditAmount) <= 0}
                    className="flex-1"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Grant Credits
                  </Button>
                  <Button
                    onClick={() => {
                      setCreditAction('deduct');
                      handleCreditAction();
                    }}
                    disabled={!creditAmount || parseInt(creditAmount) <= 0}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Deduct Credits
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Current Subscription</div>
                <div className="text-xl font-bold capitalize">{user.subscription_plan}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Status: {user.subscription_status}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Plan Type</Label>
                  <Select value={subscriptionPlan} onValueChange={setSubscriptionPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSubscriptionUpdate}
                  disabled={!subscriptionPlan || !subscriptionStatus}
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Update Subscription
                </Button>
              </div>
            </TabsContent>

            {/* Account Status Tab */}
            <TabsContent value="status" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Current Status</div>
                <div className="text-xl font-bold capitalize">{user.account_status}</div>
                {user.disabled_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Disabled: {new Date(user.disabled_at).toLocaleString()}
                    {user.disabled_reason && ` - ${user.disabled_reason}`}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label>New Status</Label>
                  <Select value={accountStatus} onValueChange={(v: any) => setAccountStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {accountStatus !== 'active' && (
                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      placeholder="Explain why this account is being disabled/suspended..."
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <Button
                  onClick={handleStatusChange}
                  disabled={accountStatus === user.account_status}
                  variant={accountStatus === 'active' ? 'default' : 'destructive'}
                  className="w-full"
                >
                  {accountStatus === 'active' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Enable Account
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-2" />
                      {accountStatus === 'disabled' ? 'Disable' : 'Suspend'} Account
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Action Confirmation */}
      <AlertDialog open={showCreditConfirm} onOpenChange={setShowCreditConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {creditAction === 'grant' ? 'Grant' : 'Deduct'} Credits
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {creditAction} {creditAmount} credits{' '}
              {creditAction === 'grant' ? 'to' : 'from'} {user.email}?
              {creditReason && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>Reason:</strong> {creditReason}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreditAction} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${creditAction === 'grant' ? 'Grant' : 'Deduct'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subscription Update Confirmation */}
      <AlertDialog open={showSubscriptionConfirm} onOpenChange={setShowSubscriptionConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Subscription Update</AlertDialogTitle>
            <AlertDialogDescription>
              Update subscription for {user.email} to {subscriptionPlan} ({subscriptionStatus})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubscriptionUpdate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Update'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation */}
      <AlertDialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={accountStatus !== 'active' ? 'text-destructive' : ''}>
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              Change {user.email}'s account status to <strong>{accountStatus}</strong>?
              {statusReason && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>Reason:</strong> {statusReason}
                </div>
              )}
              {accountStatus !== 'active' && (
                <div className="mt-2 text-destructive font-medium">
                  This user will not be able to access their account.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange} 
              disabled={isLoading}
              className={accountStatus !== 'active' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Change'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
