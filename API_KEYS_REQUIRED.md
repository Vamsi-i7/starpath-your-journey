# 🔑 Complete API Keys & Configuration Guide

This document lists **ALL** API keys and configuration required for your StarPath application.

---

## 📋 Quick Reference

| Service | Required For | Cost | Where to Get |
|---------|-------------|------|--------------|
| Supabase | Database, Auth, Storage | Free tier available | https://supabase.com |
| OpenRouter | AI Features (all AI tools) | Pay-per-use (~$0.001/req) | https://openrouter.ai |
| Razorpay | Payment Processing | 2% transaction fee | https://razorpay.com |
| Google OAuth | Social Login (optional) | Free | https://console.cloud.google.com |
| GitHub OAuth | Social Login (optional) | Free | https://github.com/settings/developers |
| Sentry | Error Tracking (optional) | Free tier available | https://sentry.io |

---

## 1. 🗄️ Supabase (REQUIRED)

### What it's for:
- User authentication & authorization
- Database (PostgreSQL)
- Real-time subscriptions
- File storage
- Edge Functions hosting

### How to Get:
1. Go to https://supabase.com
2. Create account and new project
3. Wait 2-3 minutes for project setup
4. Get keys from: Project Settings → API

### Keys Needed:

#### Frontend (.env):
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Backend (Supabase Secrets):
```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Important Notes:
- ⚠️ **Service Role Key** has admin access - NEVER expose to frontend
- ✅ **Anon Key** is safe for frontend use (Row Level Security protects data)
- 🔒 Keys are project-specific and cannot be reused

---

## 2. 🤖 OpenRouter (REQUIRED for AI Features)

### What it's for:
- AI Tools: Notes Generator, Summary, Flashcards, Quiz
- Essay Checker, Math Solver, Language Practice
- Roadmap Creator, Mind Map Generator
- AI Coach & Mentor Chat

### How to Get:
1. Go to https://openrouter.ai
2. Sign up (can use Google/GitHub)
3. Add credits: $5 minimum (lasts ~5000 AI requests)
4. Generate API key: https://openrouter.ai/keys

### Keys Needed:

#### Backend Only (Supabase Secrets):
```bash
OPENROUTER_API_KEY=sk-or-v1-YOUR_64_CHARACTER_KEY_HERE
```

### Cost Estimate:
- Using FREE models (Gemini 2.0 Flash, etc.)
- ~$0.001 per request (with fallbacks)
- $5 = ~5000 AI generations
- Premium models cost more (not used by default)

### Models Used:
1. **Primary**: `google/gemini-2.0-flash-exp:free` (Best quality, free)
2. **Secondary**: `nvidia/nemotron-nano-12b-v2-vl:free` (Good backup, free)
3. **Fallback**: `xiaomi/mimo-v2-flash:free` (Basic, free)

### Important Notes:
- ⚠️ **NEVER** expose in frontend (VITE_ prefix)
- ✅ Only set as Supabase Edge Function secret
- 📊 Monitor usage at: https://openrouter.ai/activity
- 💰 Set spending limits at: https://openrouter.ai/settings/limits

---

## 3. 💳 Razorpay (REQUIRED for Payments)

### What it's for:
- Subscription payments (Basic, Premium, Lifetime)
- One-time credit purchases
- Recurring billing (optional)
- Refunds & invoices

### How to Get:
1. Go to https://razorpay.com
2. Sign up with business details
3. Complete KYC (required for live mode)
4. Get keys from: Settings → API Keys

### Keys Needed:

#### Frontend (.env):
```bash
# Test Mode (for development)
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID

# Live Mode (for production)
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
```

#### Backend (Supabase Secrets):
```bash
# Test Mode
RAZORPAY_KEY_SECRET=YOUR_TEST_SECRET_KEY
RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET

# Live Mode
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET_KEY
RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

### Webhook Setup:
1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Add webhook URL: `https://YOUR_PROJECT.supabase.co/functions/v1/razorpay-webhook`
3. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ subscription.charged
   - ✅ subscription.cancelled
   - ✅ subscription.paused
4. Copy webhook secret and save to Supabase secrets

### Cost:
- **Transaction Fee**: 2% (India) or 3% (International)
- **Setup Fee**: ₹0 (Free)
- **Monthly Fee**: ₹0 (Pay only for transactions)

### Test Cards:
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
Name: Any name
```

### Important Notes:
- ⚠️ Start with **Test Mode** for development
- ⚠️ Complete KYC before activating **Live Mode**
- ✅ Test webhook signature verification
- 🔒 Never expose Key Secret to frontend

---

## 4. 🔐 Google OAuth (OPTIONAL)

### What it's for:
- "Sign in with Google" button
- Faster user onboarding
- No password required

### How to Get:
1. Go to https://console.cloud.google.com
2. Create new project (or use existing)
3. Enable "Google+ API"
4. Go to: Credentials → Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback (for development)
   ```

### Keys Needed:

#### Frontend (.env):
```bash
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

#### Supabase Dashboard:
1. Go to: Authentication → Providers → Google
2. Enable Google provider
3. Add Client ID and Client Secret
4. Save

#### Backend (Supabase Secrets):
```bash
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_CLIENT_SECRET
```

### Important Notes:
- ✅ Free forever
- ✅ No usage limits
- ⚠️ Must verify domain ownership for production

---

## 5. 🐙 GitHub OAuth (OPTIONAL)

### What it's for:
- "Sign in with GitHub" button
- Developer-friendly login

### How to Get:
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in details:
   - **Name**: StarPath
   - **Homepage URL**: https://starpath.app
   - **Authorization callback URL**: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Generate Client Secret

### Keys Needed:

#### Frontend (.env):
```bash
VITE_GITHUB_CLIENT_ID=YOUR_CLIENT_ID
```

#### Supabase Dashboard:
1. Go to: Authentication → Providers → GitHub
2. Enable GitHub provider
3. Add Client ID and Client Secret
4. Save

#### Backend (Supabase Secrets):
```bash
GITHUB_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

### Important Notes:
- ✅ Free forever
- ✅ No usage limits
- ⚠️ Users must have public email on GitHub profile

---

## 6. 🐛 Sentry (OPTIONAL but Recommended)

### What it's for:
- Error tracking & monitoring
- Performance monitoring
- User feedback collection
- Release tracking

### How to Get:
1. Go to https://sentry.io
2. Create account and organization
3. Create new project (React)
4. Copy DSN

### Keys Needed:

#### Frontend (.env):
```bash
VITE_SENTRY_DSN=https://YOUR_KEY@o123456.ingest.sentry.io/7654321
```

### Integration:
Already set up in `src/lib/errorTracking.ts` - just add the DSN!

### Cost:
- **Free Tier**: 5,000 errors/month
- **Team Plan**: $26/month (50,000 errors)
- **Business**: $80/month (100,000 errors)

### Important Notes:
- ✅ Free tier is enough for most apps
- ✅ Helps debug production issues
- ✅ Source maps upload for better stack traces
- ⚠️ Can be added later (not critical for launch)

---

## 7. 📧 SendGrid (OPTIONAL)

### What it's for:
- Password reset emails
- Welcome emails
- Notification emails
- Marketing emails

### How to Get:
1. Go to https://sendgrid.com
2. Sign up (free tier: 100 emails/day)
3. Verify sender identity
4. Create API key

### Keys Needed:

#### Backend (Supabase Secrets):
```bash
SENDGRID_API_KEY=SG.YOUR_API_KEY
EMAIL_FROM=noreply@starpath.app
```

### Cost:
- **Free**: 100 emails/day (3,000/month)
- **Essentials**: $19.95/month (50,000 emails)
- **Pro**: $89.95/month (100,000 emails)

### Important Notes:
- ⚠️ Supabase handles auth emails by default (no SendGrid needed)
- ✅ Only needed for custom transactional emails
- ✅ Verify sender domain for better deliverability

---

## 8. 🌐 CORS Configuration

### Keys Needed:

#### Backend (Supabase Secrets):
```bash
# Development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Production
ALLOWED_ORIGINS=https://starpath.app,https://www.starpath.app

# Both (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,https://starpath.app,https://www.starpath.app
```

### Important Notes:
- ✅ Security feature to prevent unauthorized API access
- ⚠️ Must include ALL domains (with/without www)
- ⚠️ Don't forget staging environments

---

## 📝 Complete .env Template

### Frontend (.env)
```bash
# ===== REQUIRED =====

# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Razorpay
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID

# Application URL
VITE_APP_URL=http://localhost:5173

# ===== OPTIONAL =====

# Google OAuth
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com

# GitHub OAuth
VITE_GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID

# Sentry Error Tracking
VITE_SENTRY_DSN=https://YOUR_KEY@sentry.io/PROJECT_ID
```

### Backend (Supabase Secrets)
```bash
# Set these with: supabase secrets set KEY=value

# ===== REQUIRED =====

# OpenRouter (AI Features)
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY

# Razorpay (Payments)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_SECRET
RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Supabase (auto-configured)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://starpath.app

# ===== OPTIONAL =====

# OAuth
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_SECRET
GITHUB_CLIENT_SECRET=YOUR_SECRET

# Email
SENDGRID_API_KEY=SG.YOUR_KEY
EMAIL_FROM=noreply@starpath.app
```

---

## 🚀 Setup Order

Follow this order for smooth setup:

1. **Supabase** (10 min)
   - Create project
   - Copy URL and Anon Key
   - Run migrations

2. **OpenRouter** (5 min)
   - Sign up
   - Add $5 credits
   - Generate API key

3. **Razorpay** (15 min)
   - Sign up
   - Get test mode keys
   - Setup webhook (after deploying edge functions)

4. **Deploy Application** (10 min)
   - Deploy frontend to Vercel
   - Deploy edge functions to Supabase
   - Set all secrets

5. **Test Everything** (15 min)
   - Test authentication
   - Test AI features
   - Test payment flow (test mode)

6. **Optional: OAuth** (10 min each)
   - Setup Google OAuth
   - Setup GitHub OAuth

7. **Optional: Sentry** (5 min)
   - Create project
   - Add DSN to .env

**Total Time: ~45 minutes** (without optional services)

---

## ✅ Verification Checklist

- [ ] Supabase project created and migrations run
- [ ] OpenRouter API key added and tested
- [ ] Razorpay test keys configured
- [ ] Webhook URL configured in Razorpay
- [ ] All frontend env variables set
- [ ] All backend secrets set
- [ ] Edge functions deployed
- [ ] AI tools working
- [ ] Payment flow tested (test mode)
- [ ] OAuth providers working (if enabled)
- [ ] Error tracking working (if enabled)

---

## 🆘 Troubleshooting

### "OpenRouter API key invalid"
- Check key starts with `sk-or-v1-`
- Verify key is set in Supabase secrets, not .env
- Check credits balance at https://openrouter.ai

### "Razorpay order creation failed"
- Verify both Key ID and Key Secret are set
- Check you're using matching test/live keys
- Confirm Razorpay account is active

### "CORS error when calling API"
- Add your domain to `ALLOWED_ORIGINS`
- Verify domain matches exactly (http vs https, www vs non-www)
- Redeploy edge functions after changing ALLOWED_ORIGINS

### "Webhook signature verification failed"
- Verify webhook secret matches between Razorpay dashboard and Supabase secrets
- Check webhook URL is correct
- Test in Razorpay test mode first

---

## 💰 Cost Summary

### Minimum to Get Started:
- **Supabase**: $0 (free tier)
- **OpenRouter**: $5 one-time (gets you started)
- **Razorpay**: $0 (pay 2% per transaction)
- **Total**: **$5 to start**

### Monthly Running Costs (Estimated):
- **Supabase Free Tier**: $0/month
  - Up to 500MB database
  - Up to 1GB file storage
  - Up to 2GB bandwidth
  
- **OpenRouter**: $5-20/month depending on AI usage
  - ~5000 AI requests per $5
  - Free models used = lower cost
  
- **Razorpay**: 2% of revenue
  - If you make ₹10,000 = ₹200 fee
  - No monthly fee
  
- **Total**: **~$5-20/month** for a small app

### When to Upgrade:
- **Supabase Pro ($25/mo)**: When you exceed free tier limits
- **OpenRouter Credits**: Add $5-10 when balance is low
- **Razorpay Live**: When ready to accept real payments (complete KYC)

---

**Need Help?**
- Supabase Support: https://supabase.com/support
- OpenRouter Discord: https://discord.gg/openrouter
- Razorpay Support: support@razorpay.com

**Ready to deploy?** See `DEPLOYMENT_INSTRUCTIONS.md`
