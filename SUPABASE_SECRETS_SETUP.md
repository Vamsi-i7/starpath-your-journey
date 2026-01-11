# 🔑 Supabase Secrets Setup Guide

## ⚠️ CRITICAL: Add Secrets Before Deploying Edge Functions

Your edge functions **WILL NOT WORK** without these secrets configured in Supabase.

---

## 📋 Required Secrets

### 1. OpenRouter API Key (AI Features)
```
Secret Name: OPENROUTER_API_KEY
Secret Value: YOUR_OPENROUTER_API_KEY_HERE
```
✅ **Already added to .env file**

### 2. Razorpay Keys (Payment Features)
```
Secret Name: RAZORPAY_KEY_ID
Secret Value: YOUR_RAZORPAY_TEST_KEY_HERE

Secret Name: RAZORPAY_KEY_SECRET
Secret Value: [Get from Razorpay Dashboard]

Secret Name: RAZORPAY_WEBHOOK_SECRET
Secret Value: [Get from Razorpay Dashboard after creating webhook]
```

---

## 🚀 How to Add Secrets to Supabase

### Method 1: Supabase Dashboard (Recommended)

1. **Go to Edge Functions Settings**
   - URL: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/settings/functions
   - Or navigate: Dashboard → Project Settings → Edge Functions

2. **Add Each Secret**
   - Click "Add Secret" button
   - Enter secret name (exact case-sensitive match)
   - Paste secret value
   - Click "Save"

3. **Verify Secrets Are Set**
   - You should see each secret listed
   - Values will be hidden for security

### Method 2: Supabase CLI

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_SUPABASE_PROJECT_ID

# Set secrets one by one
npx supabase secrets set OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE

npx supabase secrets set RAZORPAY_KEY_ID=YOUR_RAZORPAY_TEST_KEY_HERE

# Add Razorpay secret when you have it
# npx supabase secrets set RAZORPAY_KEY_SECRET=your_secret_here

# List all secrets to verify
npx supabase secrets list
```

---

## 🔍 How Edge Functions Access Secrets

Your edge functions access these secrets using `Deno.env.get()`:

```typescript
// In supabase/functions/ai-coach/index.ts
const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

// In supabase/functions/create-razorpay-order/index.ts
const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
```

---

## ✅ Verification Checklist

After adding secrets, verify:

- [ ] **OPENROUTER_API_KEY** is set in Supabase Dashboard
- [ ] Secret shows up in secrets list (value hidden)
- [ ] No typos in secret name (case-sensitive!)
- [ ] Razorpay keys added (if using payments)

---

## 🚨 Common Issues

### Issue: "OPENROUTER_API_KEY is not defined"
**Cause**: Secret not added to Supabase or wrong name  
**Fix**: 
1. Check spelling: `OPENROUTER_API_KEY` (all caps, underscore)
2. Add via Dashboard or CLI
3. Redeploy edge functions after adding

### Issue: "Failed to fetch from OpenRouter"
**Cause**: Invalid API key  
**Fix**: 
1. Verify API key is correct
2. Check OpenRouter dashboard: https://openrouter.ai/keys
3. Ensure key has credits/quota

### Issue: Edge function works locally but not in production
**Cause**: Secrets not deployed to production  
**Fix**: 
1. Secrets must be added in Supabase Dashboard (not just .env)
2. .env is for local development only
3. Production uses Supabase-hosted secrets

---

## 🔐 Security Best Practices

✅ **DO:**
- Add secrets via Supabase Dashboard
- Use different keys for test/production
- Rotate keys periodically
- Keep .env in .gitignore

❌ **DON'T:**
- Commit secrets to Git
- Share secrets in public channels
- Use production keys in development
- Hardcode secrets in code

---

## 📝 Next Steps After Adding Secrets

1. ✅ Secrets added to Supabase
2. ⏳ Deploy edge functions (see DEPLOYMENT_CHECKLIST.md)
3. ⏳ Test AI features work
4. ⏳ Deploy to Vercel

---

## 🧪 Test AI Features After Deployment

Once secrets are added and functions deployed, test:

```bash
# Test AI Coach (should return an affirmation)
curl -X POST https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/ai-coach \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"type":"affirmation","context":{"level":5,"xp":1000}}'

# Test AI Generate (should return study notes)
curl -X POST https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/ai-generate \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","prompt":"Explain React Hooks"}'
```

Expected: JSON response with AI-generated content  
If error: Check secrets are set correctly

---

**Status**: ✅ OPENROUTER_API_KEY added to .env  
**Next**: Add to Supabase Secrets using Dashboard or CLI  
**Time**: 5 minutes
