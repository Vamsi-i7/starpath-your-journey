# 🔧 Complete Fix Implementation Plan

## Priority 1: CRITICAL - Daily Credits System

### Issue
Users not receiving daily free credits

### Solution
Create a comprehensive daily credits system that grants free credits daily

### Implementation Steps

**1. Create Daily Credits Grant Function**
```sql
CREATE OR REPLACE FUNCTION grant_daily_credits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_tier TEXT;
  v_daily_amount INTEGER := 10; -- Default for free tier
  v_last_grant DATE;
BEGIN
  -- Get user's subscription and last grant date
  SELECT subscription_tier, last_daily_credit::DATE
  INTO v_subscription_tier, v_last_grant
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check if already granted today
  IF v_last_grant = CURRENT_DATE THEN
    RETURN FALSE; -- Already granted today
  END IF;
  
  -- Set daily amount based on tier
  IF v_subscription_tier = 'basic' THEN
    v_daily_amount := 20;
  ELSIF v_subscription_tier = 'premium' OR v_subscription_tier = 'lifetime' THEN
    v_daily_amount := 50;
  END IF;
  
  -- Grant the credits
  UPDATE profiles
  SET 
    ai_credits = ai_credits + v_daily_amount,
    last_daily_credit = NOW()
  WHERE id = p_user_id;
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    reason,
    balance_after
  ) VALUES (
    p_user_id,
    v_daily_amount,
    'earn',
    'Daily free credits',
    (SELECT ai_credits FROM profiles WHERE id = p_user_id)
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**2. Update useCredits Hook**
Add daily credit check on mount:
```typescript
useEffect(() => {
  if (user?.id) {
    checkAndGrantDailyCredits();
    fetchData();
  }
}, [user?.id]);

const checkAndGrantDailyCredits = async () => {
  try {
    const { data, error } = await supabase.rpc('grant_daily_credits', {
      p_user_id: user.id
    });
    
    if (data) {
      toast.success('🎉 Daily credits received!');
    }
  } catch (error) {
    console.error('Error granting daily credits:', error);
  }
};
```

**3. Add Welcome Credits for New Users**
Update signup flow to grant 50 welcome credits

---

## Priority 2: HIGH - Fix Subscription Payment Flow

### Issues
1. Double-processing risk between verify-razorpay-payment and webhook
2. No idempotency
3. Credits could be granted twice

### Solution
Add idempotency key and status checks

**1. Update verify-razorpay-payment**
```typescript
// Check if already processed
const { data: existingProcessing } = await supabaseClient
  .from('payment_orders')
  .select('status')
  .eq('order_id', razorpay_order_id)
  .single();

if (existingProcessing?.status === 'completed') {
  return new Response(
    JSON.stringify({ success: true, message: 'Already processed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Add transaction lock
await supabaseClient
  .from('payment_orders')
  .update({ status: 'processing' })
  .eq('order_id', razorpay_order_id);
```

**2. Update Webhook Handler**
Add idempotency check before processing

---

## Priority 3: MEDIUM - Subscription Feature Access Control

### Issue
Need to ensure only paying users get premium features AFTER successful payment

### Solution
Add middleware/guards

**1. Create Subscription Check Hook**
```typescript
export function useSubscription() {
  const { profile } = useAuth();
  
  const hasActiveSubscription = () => {
    if (!profile?.subscription_tier) return false;
    if (profile.subscription_tier === 'free') return false;
    
    // Check if subscription is still valid
    const now = new Date();
    const endDate = profile.subscription_end ? new Date(profile.subscription_end) : null;
    
    if (endDate && now > endDate) {
      return false; // Expired
    }
    
    return true;
  };
  
  const canAccessFeature = (feature: 'mentor' | 'premium-tools' | 'unlimited') => {
    if (!hasActiveSubscription()) return false;
    
    const tier = profile?.subscription_tier;
    
    if (feature === 'mentor') {
      return tier === 'premium' || tier === 'lifetime';
    }
    
    return true;
  };
  
  return {
    hasActiveSubscription: hasActiveSubscription(),
    subscriptionTier: profile?.subscription_tier,
    subscriptionEnd: profile?.subscription_end,
    canAccessFeature,
  };
}
```

**2. Protect AI Mentor Route**
Already implemented correctly in AIMentorPage.tsx (lines 17-163)

---

## Priority 4: MEDIUM - RLS Policy Audit

### Current Status
- 129 RLS policies found
- Most tables have proper policies

### Actions Needed
1. ✅ Audit credit_transactions policies
2. ✅ Audit profiles policies
3. ✅ Verify payment_orders policies
4. ⚠️ Check razorpay_subscriptions policies

---

## Priority 5: LOW - Webhook Configuration

### Tasks
1. Configure webhook URL in Razorpay dashboard (when you provide live keys)
2. Test webhook with Razorpay webhook simulator
3. Add retry logic for failed webhooks
4. Add webhook signature verification logs

---

## Files to Create/Modify

### New Migration File
`supabase/migrations/20260113120000_fix_daily_credits.sql`

### Modified Files
- `src/hooks/useCredits.ts` - Add daily credit check
- `src/hooks/useSubscription.ts` - New file for subscription checks
- `supabase/functions/verify-razorpay-payment/index.ts` - Add idempotency
- `supabase/functions/razorpay-webhook/index.ts` - Add idempotency

