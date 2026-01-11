# Razorpay Setup Instructions

## ✅ Integration Complete - Awaiting Your API Keys

### What's Been Built:
1. ✅ Razorpay SDK integration
2. ✅ Payment order creation (Edge Function)
3. ✅ Payment verification (Edge Function)
4. ✅ Database schema for payment orders
5. ✅ React hooks for easy payment processing
6. ✅ Integrated into Subscription page
7. ✅ Supports both subscriptions and credit purchases

### Required Actions:

#### 1. Get Your Razorpay API Keys
Visit: https://dashboard.razorpay.com/app/keys
- Get **Key ID** (starts with "YOUR_RAZORPAY_TEST_KEY_HERE" or "YOUR_RAZORPAY_LIVE_KEY_HERE")
- Get **Key Secret**

#### 2. Add Keys to .env File
```bash
# Add these to your .env file:
VITE_RAZORPAY_KEY_ID=YOUR_RAZORPAY_TEST_KEY_HERE_KEY_ID
RAZORPAY_KEY_SECRET=your_key_secret_here
```

#### 3. Add Keys to Supabase Edge Functions
```bash
# Set these in Supabase Dashboard > Edge Functions > Secrets:
RAZORPAY_KEY_ID=YOUR_RAZORPAY_TEST_KEY_HERE_KEY_ID
RAZORPAY_KEY_SECRET=your_key_secret_here
```

#### 4. Deploy Edge Functions
```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

#### 5. Run Database Migration
```bash
npx supabase db push
```

### How It Works:
1. User clicks "Upgrade Now" or "Buy Credits"
2. System creates Razorpay order via Edge Function
3. Razorpay checkout modal opens
4. User completes payment
5. System verifies payment signature
6. Credits/subscription granted automatically

### Testing:
Use Razorpay test cards:
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002

**Ready for your API keys!**
