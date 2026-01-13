# 🔗 Razorpay Webhook Configuration Guide

## Step-by-Step Guide to Get Your Webhook URL and Configure Razorpay

---

## Part 1: Get Your Supabase Project URL

### Method 1: From Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Login with your account
   - Select your project: "starpath-your-journey" (or whatever you named it)

2. **Find Your Project URL**:
   - Look at the left sidebar
   - Click on **"Project Settings"** (gear icon at bottom)
   - Click on **"API"** tab
   - Find **"Project URL"** section
   - Your URL will look like: `https://abcdefghijklmnop.supabase.co`

3. **Construct Your Webhook URL**:
   ```
   Your Webhook URL = Your Project URL + /functions/v1/razorpay-webhook
   
   Example:
   If Project URL is: https://abcdefghijklmnop.supabase.co
   Then Webhook URL is: https://abcdefghijklmnop.supabase.co/functions/v1/razorpay-webhook
   ```

### Method 2: From Your .env Files (Alternative)

1. **Check your .env file** or **.env.local**:
   ```bash
   cat .env | grep SUPABASE_URL
   # or
   cat .env.local | grep SUPABASE_URL
   ```

2. **Look for**:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   ```

3. **Your webhook URL**:
   ```
   https://your-project-ref.supabase.co/functions/v1/razorpay-webhook
   ```

---

## Part 2: Configure Webhook in Razorpay Dashboard

### Step 1: Login to Razorpay Dashboard

1. Go to: https://dashboard.razorpay.com/
2. Login with your Razorpay account
3. Make sure you're in **Live Mode** (toggle at top right)

### Step 2: Navigate to Webhooks Section

1. In the left sidebar, scroll down to **"Settings"**
2. Under Settings, find **"Webhooks"**
3. Click on **"Webhooks"**

### Step 3: Add New Webhook

1. Click **"+ Add New Webhook"** button (usually blue button at top right)

2. **Fill in the form**:

   **Webhook URL**:
   ```
   https://your-project-ref.supabase.co/functions/v1/razorpay-webhook
   ```
   (Use the URL you got from Part 1)

   **Active Events**: Select these events:
   ```
   ☑️ payment.authorized
   ☑️ payment.captured
   ☑️ payment.failed
   ☑️ subscription.activated
   ☑️ subscription.charged
   ☑️ subscription.completed
   ☑️ subscription.cancelled
   ☑️ subscription.paused
   ☑️ subscription.resumed
   ☑️ subscription.pending
   ☑️ subscription.halted
   ☑️ order.paid
   ```

   **OR**: Click **"Select All"** to be safe

   **Alert Email** (optional):
   ```
   your-email@example.com
   ```
   (Razorpay will email you if webhook fails)

3. Click **"Create Webhook"** button

### Step 4: Get Webhook Secret

After creating the webhook, Razorpay will show you:

1. **Webhook Secret** - This is important!
   ```
   Example: whsec_AbCdEfGhIjKlMnOpQrStUv1234567890
   ```

2. **COPY THIS SECRET** - You'll need it!

---

## Part 3: Add Webhook Secret to Supabase

### Step 1: Go to Supabase Dashboard

1. Visit: https://supabase.com/dashboard
2. Select your project
3. Click **"Edge Functions"** in left sidebar
4. Click **"Manage secrets"** (or "Secrets" tab)

### Step 2: Add Webhook Secret

Add a new secret:

**Name**: `RAZORPAY_WEBHOOK_SECRET`

**Value**: The webhook secret from Razorpay (from Part 2, Step 4)
```
whsec_AbCdEfGhIjKlMnOpQrStUv1234567890
```

Click **"Add Secret"** or **"Save"**

---

## Part 4: Update Edge Function to Use Webhook Secret

The function is already set up to use the secret! Check:

**File**: `supabase/functions/razorpay-webhook/index.ts`

It should have code like:
```typescript
const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

// Verify webhook signature
const isValid = Razorpay.validateWebhookSignature(
  JSON.stringify(body),
  signature,
  webhookSecret
);
```

If this code is already there, **you're done!** ✅

---

## Part 5: Test Your Webhook

### Method 1: Use Razorpay Test Webhook (Recommended)

1. In Razorpay Dashboard → Webhooks
2. Find your webhook
3. Click **"Send Test Webhook"** or **"Test"** button
4. Select an event (e.g., "payment.captured")
5. Click **"Send"**
6. Check the response - should see `200 OK`

### Method 2: Make a Test Payment

1. Use Razorpay test mode
2. Make a ₹1 payment
3. Check Supabase logs:
   - Go to: Supabase Dashboard → Logs → Edge Functions
   - Look for `razorpay-webhook` function logs
   - Should see webhook received and processed

---

## 🔍 Quick Reference

### Your Webhook Configuration

```yaml
Webhook URL: https://[YOUR-PROJECT-REF].supabase.co/functions/v1/razorpay-webhook

Environment Variables Needed in Supabase:
- RAZORPAY_KEY_ID: Your live key (rzp_live_XXXXX)
- RAZORPAY_KEY_SECRET: Your live secret
- RAZORPAY_WEBHOOK_SECRET: From Razorpay webhook setup

Events to Enable:
- All payment.* events
- All subscription.* events
- All order.* events
```

---

## ❓ Troubleshooting

### Issue: "Webhook URL not reachable"

**Solution**:
1. Make sure your edge function is deployed:
   ```bash
   supabase functions deploy razorpay-webhook
   ```
2. Check if URL is accessible:
   ```bash
   curl https://your-project.supabase.co/functions/v1/razorpay-webhook
   ```
3. Verify CORS headers are set in the function

### Issue: "Webhook signature verification failed"

**Solution**:
1. Check `RAZORPAY_WEBHOOK_SECRET` is set correctly in Supabase
2. Make sure you copied the FULL secret from Razorpay
3. No extra spaces or line breaks in the secret

### Issue: "Can't find webhook in Razorpay dashboard"

**Solution**:
1. Make sure you're in the correct mode (Test vs Live)
2. Check Settings → Webhooks (not API Keys)
3. You might need webhook permissions - contact Razorpay support

---

## 📝 Checklist

Before going live:

- [ ] Got Supabase project URL
- [ ] Constructed webhook URL correctly
- [ ] Created webhook in Razorpay dashboard
- [ ] Selected all payment/subscription events
- [ ] Copied webhook secret from Razorpay
- [ ] Added RAZORPAY_WEBHOOK_SECRET to Supabase
- [ ] Tested webhook with "Send Test Webhook"
- [ ] Made test payment and verified webhook received
- [ ] Checked Supabase logs for webhook processing

---

## 🎯 Summary Commands

```bash
# 1. Get your Supabase URL
echo $VITE_SUPABASE_URL
# or check .env file

# 2. Your webhook URL format
https://YOUR-PROJECT-REF.supabase.co/functions/v1/razorpay-webhook

# 3. Test webhook is accessible
curl https://YOUR-PROJECT-REF.supabase.co/functions/v1/razorpay-webhook

# 4. Check webhook function is deployed
supabase functions list
```

---

## ✅ You're Done!

Your webhook is now configured and ready to receive Razorpay events! 🎉

When a payment happens:
1. Razorpay processes payment
2. Razorpay sends webhook to your URL
3. Your edge function receives and verifies signature
4. Updates subscription/credits in database
5. Returns success to Razorpay

