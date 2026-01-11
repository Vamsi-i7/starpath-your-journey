# 🚀 Complete Deployment Instructions

## Prerequisites

1. **Supabase CLI** installed
   ```bash
   npm install -g supabase
   # Or use: npx supabase
   ```

2. **Supabase Account** with project created
   - Get your project ref from: https://app.supabase.com/project/YOUR_PROJECT/settings/general

3. **API Keys Ready** (see API_KEYS_REQUIRED.md)

---

## Step 1: Deploy Edge Functions

### Option A: Using the Deployment Script
```bash
# Edit the script to add your project ref
nano deploy-edge-functions-secure.sh
# Change YOUR_PROJECT_REF to your actual project ref

# Run the script
./deploy-edge-functions-secure.sh
```

### Option B: Manual Deployment
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy individual functions
supabase functions deploy ai-generate
supabase functions deploy ai-coach
supabase functions deploy razorpay-webhook
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
supabase functions deploy delete-user
supabase functions deploy check-user-exists
```

---

## Step 2: Set Environment Secrets

### Required Secrets for Edge Functions
```bash
# OpenRouter API (for AI features)
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY

# Razorpay (for payments)
supabase secrets set RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET
supabase secrets set RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# CORS Configuration
supabase secrets set ALLOWED_ORIGINS=https://starpath.app,https://www.starpath.app

# Supabase (auto-configured but verify)
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Optional: OAuth Secrets
supabase secrets set GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_SECRET
supabase secrets set GITHUB_CLIENT_SECRET=YOUR_GITHUB_SECRET

# Optional: Email Service
supabase secrets set SENDGRID_API_KEY=SG.YOUR_SENDGRID_KEY
```

### Verify Secrets
```bash
supabase secrets list
```

---

## Step 3: Deploy Frontend to Vercel

### Environment Variables for Vercel
```bash
# Frontend Environment Variables
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
VITE_APP_URL=https://starpath.app

# Optional: OAuth
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
VITE_GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID

# Optional: Sentry
VITE_SENTRY_DSN=https://YOUR_SENTRY_DSN
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or use Vercel Dashboard:
# 1. Connect your GitHub repo
# 2. Add environment variables
# 3. Deploy
```

---

## Step 4: Configure Webhooks

### Razorpay Webhook Setup
1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Add webhook URL: `https://YOUR_PROJECT.supabase.co/functions/v1/razorpay-webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.charged`
   - `subscription.cancelled`
4. Copy webhook secret and add to Supabase secrets

---

## Step 5: Test Deployment

### Test Edge Functions
```bash
# Test AI Generate (requires auth token)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notes",
    "prompt": "Test prompt"
  }'

# Test AI Coach
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-coach \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "motivation",
    "context": {}
  }'

# Test Rate Limiting (make 11 requests in 1 minute)
# Should get 429 on 11th request
```

### Test Frontend
```bash
# Build locally
npm run build
npm run preview

# Test features:
# 1. Login/Signup
# 2. Dashboard loads
# 3. Habits creation
# 4. Goals creation
# 5. AI tools work
# 6. Subscription page
```

---

## Step 6: Monitor Deployment

### Check Function Logs
```bash
# View logs for specific function
supabase functions logs ai-generate --tail

# View all function logs
supabase functions logs --tail
```

### Check Function Status
```bash
supabase functions list
```

### Monitor Errors
```bash
# If Sentry is set up, check dashboard at:
# https://sentry.io/organizations/YOUR_ORG/issues/
```

---

## Troubleshooting

### Edge Functions Not Deploying
```bash
# Make sure you're logged in
supabase login

# Link to correct project
supabase link --project-ref YOUR_PROJECT_REF

# Check function syntax
deno run --allow-net --allow-env supabase/functions/ai-generate/index.ts
```

### Rate Limiting Not Working
- Verify authentication is working (JWT tokens valid)
- Check function logs for errors
- Ensure user ID is being extracted correctly

### CORS Errors
- Add your domain to `ALLOWED_ORIGINS` secret
- Verify domain matches exactly (with/without www)
- Check browser console for specific CORS error

### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check webhook secret matches
- Test webhook with Razorpay test mode
- Check function logs for signature verification errors

### AI Features Not Working
- Verify `OPENROUTER_API_KEY` is set correctly
- Check OpenRouter dashboard for API usage/limits
- Test API key independently: https://openrouter.ai/playground
- Check function logs for API errors

---

## Production Checklist

- [ ] All edge functions deployed
- [ ] All secrets configured
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Webhooks configured
- [ ] Database migrations applied
- [ ] Row Level Security enabled
- [ ] Rate limiting tested
- [ ] Authentication tested
- [ ] Payment flow tested
- [ ] AI tools tested
- [ ] Error tracking working
- [ ] Monitoring dashboards set up
- [ ] Custom domain configured (optional)
- [ ] SSL certificate verified

---

## Useful Commands

```bash
# View function logs
supabase functions logs <function-name> --tail

# List all functions
supabase functions list

# Delete a function
supabase functions delete <function-name>

# Update secrets
supabase secrets set KEY=value

# View all secrets
supabase secrets list

# Test function locally
supabase functions serve <function-name>

# View project details
supabase projects list
```

---

## Next Steps After Deployment

1. **Monitor Performance**
   - Check function execution times
   - Monitor error rates
   - Track API usage

2. **Set Up Alerts**
   - Error rate thresholds
   - Rate limit violations
   - Failed payment webhooks

3. **Scale if Needed**
   - Upgrade Supabase plan
   - Optimize edge functions
   - Add caching where appropriate

4. **Regular Maintenance**
   - Review security logs weekly
   - Update dependencies monthly
   - Audit API keys quarterly

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Razorpay Docs: https://razorpay.com/docs
- OpenRouter Docs: https://openrouter.ai/docs
- Project Issues: Create an issue in your repo
