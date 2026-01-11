# 🔐 URGENT: API Key Rotation Required

## ⚠️ SECURITY ALERT

Your API keys have been exposed in the `.env` file. You MUST rotate all keys immediately.

## 🚨 Action Items (DO THIS NOW)

### 1. Supabase Keys
1. Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api
2. Click "Generate new anon key" 
3. Update `VITE_SUPABASE_ANON_KEY` in your production environment
4. The service role key should also be regenerated

### 2. OpenRouter API Key
1. Go to: https://openrouter.ai/keys
2. **DELETE** the old key: `YOUR_OPENROUTER_API_KEY_HERE`
3. Generate a new key
4. Update `OPENROUTER_API_KEY` in Supabase Edge Function secrets

### 3. Razorpay Keys
1. Go to: https://dashboard.razorpay.com/app/keys
2. Regenerate both Test and Live keys
3. Update `VITE_RAZORPAY_KEY_ID` (frontend)
4. Update `RAZORPAY_KEY_SECRET` (backend - Supabase secrets)
5. Regenerate webhook secret

### 4. Update Environment Variables

#### For Local Development:
```bash
# Create a new .env file (it's now in .gitignore)
cp .env.production.example .env
# Then fill in with your NEW rotated keys
```

#### For Supabase Edge Functions:
```bash
# Update secrets for edge functions
supabase secrets set OPENROUTER_API_KEY=your_new_key
supabase secrets set RAZORPAY_KEY_SECRET=your_new_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_new_webhook_secret
```

#### For Vercel/Production:
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Update all the keys with new values
4. Redeploy the application

### 5. Clean Git History (Optional but Recommended)

If you want to remove the exposed keys from Git history:

```bash
# WARNING: This rewrites Git history - coordinate with your team
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if you're sure)
git push origin --force --all
```

Or use BFG Repo-Cleaner (easier):
```bash
# Install BFG
brew install bfg  # Mac
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clean the repo
bfg --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

## 📋 Verification Checklist

- [ ] All old API keys have been deleted from provider dashboards
- [ ] New keys generated and tested
- [ ] `.env` file added to `.gitignore`
- [ ] `.env` file removed from Git tracking
- [ ] Production environment variables updated (Vercel/hosting)
- [ ] Supabase Edge Function secrets updated
- [ ] Application tested with new keys
- [ ] Team members notified of key rotation
- [ ] Documentation files cleaned of exposed keys
- [ ] Git history cleaned (optional)

## 🔒 Going Forward

**NEVER commit `.env` files to Git!**

Always use:
- `.env.example` files with placeholder values
- Environment variables in CI/CD platforms
- Secret management tools (Supabase Vault, Vercel Env Vars, etc.)

## 📞 Questions?

If you need help with key rotation, contact:
- Supabase Support: https://supabase.com/support
- Razorpay Support: https://razorpay.com/support
- OpenRouter Support: https://openrouter.ai/docs
