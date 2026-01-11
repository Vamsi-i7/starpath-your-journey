# 📧 Email Configuration Guide for Supabase

## Current Issue
"Error sending recovery email" - Supabase default email has rate limits and may not work reliably.

---

## 🚀 Quick Fix: Reset Password via Dashboard

### Method 1: Manual Password Reset (Recommended - 2 minutes)

1. **Go to Supabase Auth Users:**
   https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/auth/users

2. **Find your user:**
   - Look for your email in the list
   - Or use the search box

3. **Reset Password:**
   - Click the **"..."** menu (three dots) on the right
   - Select **"Reset Password"**
   - Copy the reset link that appears
   - Paste it in your browser
   - Set your new password

✅ **This works immediately without email!**

---

## 🔍 Method 2: Find Your Email via SQL

If you forgot your email:

1. **Go to SQL Editor:**
   https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/editor

2. **Run this query:**
   ```sql
   -- See all users
   SELECT email, created_at FROM auth.users ORDER BY created_at DESC;
   ```

3. **Find your account:**
   - Look for your email
   - Note the email address

4. **Use Method 1 to reset**

---

## 📧 Method 3: Configure Custom Email Provider (For Production)

To enable forgot password, sign-up emails, etc., you need a custom email provider.

### Option A: Resend (Recommended - Free tier, easy setup)

**Why Resend:**
- ✅ 3,000 emails/month free
- ✅ Easy setup (5 minutes)
- ✅ Modern, developer-friendly
- ✅ Good deliverability

**Setup Steps:**

1. **Create Resend Account:**
   - Go to: https://resend.com/signup
   - Sign up with email or GitHub

2. **Get API Key:**
   - Dashboard → API Keys
   - Click "Create API Key"
   - Copy the key (starts with `re_`)

3. **Configure in Supabase:**
   - Go to: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/settings/auth
   - Scroll to **"SMTP Settings"**
   - Toggle **"Enable Custom SMTP"**
   - Fill in:
     ```
     SMTP Host: smtp.resend.com
     SMTP Port: 587
     Username: resend
     Password: [Your API Key]
     Sender Email: noreply@yourdomain.com (or use Resend's test domain)
     Sender Name: StarPath
     ```

4. **Test:**
   - Click "Save"
   - Try forgot password again
   - Check email (including spam folder)

---

### Option B: SendGrid (Popular, reliable)

**Why SendGrid:**
- ✅ 100 emails/day free
- ✅ Very reliable
- ✅ Good analytics

**Setup Steps:**

1. **Create SendGrid Account:**
   - Go to: https://signup.sendgrid.com/
   - Sign up (requires phone verification)

2. **Get API Key:**
   - Settings → API Keys
   - Create API Key with "Mail Send" permission
   - Copy the key (starts with `SG.`)

3. **Configure in Supabase:**
   - Go to: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/settings/auth
   - Scroll to **"SMTP Settings"**
   - Toggle **"Enable Custom SMTP"**
   - Fill in:
     ```
     SMTP Host: smtp.sendgrid.net
     SMTP Port: 587
     Username: apikey
     Password: [Your SendGrid API Key]
     Sender Email: noreply@yourdomain.com
     Sender Name: StarPath
     ```

4. **Verify Sender:**
   - SendGrid requires sender verification
   - Go to Settings → Sender Authentication
   - Verify your email or domain

---

### Option C: Gmail SMTP (Quick test only, not for production)

**Warning:** Gmail has strict limits (100-500 emails/day) and may mark you as spam.

**Setup Steps:**

1. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Supabase"
   - Copy the 16-character password

3. **Configure in Supabase:**
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   Username: your-gmail@gmail.com
   Password: [16-character app password]
   Sender Email: your-gmail@gmail.com
   Sender Name: StarPath
   ```

⚠️ **Not recommended for production!**

---

## 🔧 Supabase Email Settings

After configuring SMTP, also check these settings:

### Go to Auth Settings:
https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/settings/auth

### Enable These Features:

**Email Confirmations:**
- ✅ "Enable email confirmations" - OFF for testing, ON for production
  - If ON: Users must confirm email before signing in
  - If OFF: Users can sign in immediately

**Email Templates:**
Customize these templates:
- Confirmation email
- Magic link email
- Password recovery email
- Email change confirmation

**Redirect URLs:**
Add your Vercel URL:
- Site URL: `https://starpath-seven.vercel.app`
- Redirect URLs:
  ```
  https://starpath-seven.vercel.app/**
  https://starpath-seven.vercel.app/auth/callback
  http://localhost:8080/** (for local development)
  ```

---

## 🧪 Testing Email Setup

After configuration:

### Test 1: Password Recovery
1. Go to: https://starpath-seven.vercel.app/forgot-password
2. Enter your email
3. Click "Send Reset Link"
4. Check inbox (and spam folder)
5. Click reset link
6. Set new password

### Test 2: Sign Up
1. Sign up with a new email
2. Check if confirmation email arrives
3. Verify email confirmation works

### Test 3: Check Logs
1. Go to: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/logs/edge-logs
2. Filter for "auth" logs
3. Look for email sending success/failure

---

## 🐛 Troubleshooting

### Email Not Received

**Check 1: Spam Folder**
- Email might be in spam
- Mark as "Not Spam"
- Add sender to contacts

**Check 2: Email Logs**
- Supabase Dashboard → Logs
- Look for email sending errors
- Check SMTP authentication errors

**Check 3: SMTP Credentials**
- Verify API key is correct
- Check username is correct
- Ensure no extra spaces

**Check 4: Sender Verification**
- Some providers require sender verification
- Check provider dashboard for verification status

### "SMTP Authentication Failed"

**Fix:**
1. Double-check API key/password
2. Ensure no extra spaces in credentials
3. Verify SMTP host and port are correct
4. Check if API key has correct permissions

### "Too Many Requests"

**Cause:** Using Supabase default email (rate limited)

**Fix:** Configure custom SMTP provider (see above)

---

## 📊 Email Provider Comparison

| Provider | Free Tier | Setup Time | Reliability | Best For |
|----------|-----------|------------|-------------|----------|
| **Resend** | 3,000/mo | 5 min | ⭐⭐⭐⭐⭐ | Modern apps |
| **SendGrid** | 100/day | 10 min | ⭐⭐⭐⭐⭐ | Production |
| **AWS SES** | 62,000/mo | 20 min | ⭐⭐⭐⭐⭐ | High volume |
| **Mailgun** | 5,000/mo | 10 min | ⭐⭐⭐⭐ | Developers |
| **Gmail** | 100-500/day | 5 min | ⭐⭐ | Testing only |

---

## 🎯 Recommended: Resend for StarPath

**For your StarPath app, I recommend Resend:**
- ✅ Easy to set up
- ✅ 3,000 emails/month free (more than enough for starting)
- ✅ Good deliverability
- ✅ Modern dashboard
- ✅ Developer-friendly

**Setup takes only 5 minutes!**

---

## 💡 Quick Recovery for Now

**Don't want to set up email yet?**

**Temporary workaround:**
1. Reset password via Supabase Dashboard (Method 1 above)
2. Write down your new password
3. Configure email later when needed

**This works perfectly for testing and development!**

---

## 📝 Summary

**Immediate Fix (Now):**
→ Reset password via Supabase Dashboard (2 minutes)

**Production Fix (Later):**
→ Configure Resend SMTP (5 minutes)

**Email is not required for the app to work - it's only needed for:**
- Password recovery
- Email verification (if enabled)
- Magic link login (if you add it later)

---

**Need help setting up email? Let me know which provider you prefer!**
