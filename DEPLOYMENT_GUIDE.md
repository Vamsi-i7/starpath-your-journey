# 🚀 Starpath Deployment Guide

This guide walks you through deploying Edge Functions, configuring secrets, and ensuring your database is properly set up.

---

## 📋 Prerequisites

1. **Supabase CLI installed**
   ```bash
   # macOS
   brew install supabase/tap/supabase

   # Windows (using scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase

   # npm (cross-platform)
   npm install -g supabase
   ```

2. **Your Supabase project reference ID**
   - Find it in: Supabase Dashboard → Project Settings → General → Reference ID
   - It looks like: `ryzhsfmqopywoymghmdp`

---

## 🔐 Step 1: Login to Supabase CLI

```bash
supabase login
```

This will open a browser window to authenticate. Follow the prompts.

---

## 🔗 Step 2: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID.

You'll be prompted for your database password (the one you set when creating the project).

---

## 🗄️ Step 3: Run Database Migration

Apply the new migration to ensure `user_code` generation works:

```bash
supabase db push
```

Or run the SQL directly in the Supabase Dashboard:
1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy the contents of `supabase/migrations/20260111000003_fix_user_code_and_profile_fields.sql`
3. Click **Run**

---

## ⚡ Step 4: Deploy Edge Functions

Deploy all edge functions with a single command:

```bash
supabase functions deploy ai-generate
supabase functions deploy ai-coach
supabase functions deploy create-razorpay-order
supabase functions deploy create-razorpay-subscription
supabase functions deploy verify-razorpay-payment
supabase functions deploy razorpay-webhook
supabase functions deploy delete-user
```

Or deploy all at once:

```bash
supabase functions deploy
```

---

## 🔑 Step 5: Configure Secrets

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `OPENROUTER_API_KEY` | `sk-or-v1-xxxxx...` | Your OpenRouter API key for AI features |
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxx` or `rzp_live_xxxxx` | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | `xxxxxxxxxxxxx` | Razorpay Key Secret |
| `RAZORPAY_PLAN_ID_PRO_MONTHLY` | `plan_xxxxx` | Razorpay Plan ID for Pro Monthly |
| `RAZORPAY_PLAN_ID_PRO_YEARLY` | `plan_xxxxx` | Razorpay Plan ID for Pro Yearly |
| `RAZORPAY_PLAN_ID_PREMIUM_MONTHLY` | `plan_xxxxx` | Razorpay Plan ID for Premium Monthly |
| `RAZORPAY_PLAN_ID_PREMIUM_YEARLY` | `plan_xxxxx` | Razorpay Plan ID for Premium Yearly |
| `RAZORPAY_WEBHOOK_SECRET` | `xxxxxxxxxxxxx` | Webhook secret from Razorpay Dashboard |

### Option B: Via CLI

```bash
# AI Features
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Razorpay (Test Mode)
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your-secret-here

# Razorpay Plan IDs (create these in Razorpay Dashboard first)
supabase secrets set RAZORPAY_PLAN_ID_PRO_MONTHLY=plan_xxxxx
supabase secrets set RAZORPAY_PLAN_ID_PRO_YEARLY=plan_xxxxx
supabase secrets set RAZORPAY_PLAN_ID_PREMIUM_MONTHLY=plan_xxxxx
supabase secrets set RAZORPAY_PLAN_ID_PREMIUM_YEARLY=plan_xxxxx

# Razorpay Webhook Secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

---

## 🔔 Step 6: Configure Razorpay Webhook

1. Go to **Razorpay Dashboard** → **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Configure:
   - **Webhook URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook`
   - **Secret**: Generate one and save it as `RAZORPAY_WEBHOOK_SECRET` in Supabase secrets
   - **Active Events**: Select these events:
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.completed`
     - `subscription.updated`
     - `subscription.pending`
     - `subscription.halted`
     - `subscription.cancelled`
     - `payment.captured`
     - `payment.failed`

4. Click **Create Webhook**

---

## 📧 Step 7: Configure Email (SMTP)

For production email delivery (not going to spam):

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Go to **Project Settings** → **Authentication** → **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure with your email provider:

### Using Resend (Recommended):
```
Host: smtp.resend.com
Port: 465
Username: resend
Password: re_xxxxx (your Resend API key)
Sender email: noreply@yourdomain.com
```

### Using SendGrid:
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.xxxxx (your SendGrid API key)
Sender email: noreply@yourdomain.com
```

---

## ✅ Step 8: Verify Deployment

### Test Edge Functions:

```bash
# Test AI Generate (requires auth token)
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-generate' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"type": "test"}'
```

### Check Function Logs:

```bash
supabase functions logs ai-generate
supabase functions logs ai-coach
```

Or view in Dashboard: **Edge Functions** → Select function → **Logs**

---

## 🐛 Troubleshooting

### Edge Functions return CORS error
- Ensure `OPENROUTER_API_KEY` is set in secrets
- Check function logs for specific errors

### User code not generating
- Run the migration SQL in Step 3
- Check if `handle_new_user` trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```

### Payments not working
- Verify all Razorpay secrets are set
- Check if you're using test vs live keys consistently
- View webhook logs in Razorpay Dashboard

### Emails going to spam
- Configure custom SMTP (Step 7)
- Verify your sender domain with your email provider

---

## 📊 Quick Status Check

Run this SQL in Supabase SQL Editor to check your setup:

```sql
-- Check if user_code generation function exists
SELECT EXISTS(
  SELECT 1 FROM pg_proc WHERE proname = 'generate_user_code'
) as user_code_function_exists;

-- Check if trigger exists
SELECT EXISTS(
  SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
) as signup_trigger_exists;

-- Check users without user_code
SELECT COUNT(*) as users_without_code 
FROM public.profiles 
WHERE user_code IS NULL;

-- Check profile fields
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name IN ('user_code', 'hearts', 'max_hearts', 'total_habits_completed');
```

---

## 🎉 Done!

Your Starpath app should now be fully functional with:
- ✅ AI features (notes, flashcards, roadmaps, mentor chat)
- ✅ User codes for friend system
- ✅ Razorpay payments and subscriptions
- ✅ Proper email delivery

If you encounter issues, check the function logs and ensure all secrets are properly configured.
