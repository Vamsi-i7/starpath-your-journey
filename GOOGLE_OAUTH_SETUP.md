# 🔐 Google OAuth Setup Guide

## What is Google OAuth?

Allows users to sign in with their Google account:
- ✅ No password needed
- ✅ Faster signup (one click)
- ✅ More secure
- ✅ Better user experience
- ✅ **Completely FREE**

---

## 📋 Setup Steps (15 minutes)

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com

### Step 2: Create a New Project (or use existing)
1. Click project dropdown at top
2. Click "New Project"
3. Enter project name: `StarPath` or your app name
4. Click "Create"
5. Wait for project to be created (~30 seconds)

### Step 3: Enable Google+ API
1. In the search bar, type: "Google+ API"
2. Click "Google+ API"
3. Click "Enable"
4. Wait for it to enable (~10 seconds)

### Step 4: Configure OAuth Consent Screen
1. Go to: APIs & Services → OAuth consent screen
2. Choose user type: **External** ✅
3. Click "Create"

#### Fill in the form:
- **App name**: StarPath (or your app name)
- **User support email**: Your email
- **App logo**: (optional - upload your logo)
- **App domain**: 
  - Homepage: `https://starpath.app` (or your domain)
  - Privacy policy: `https://starpath.app/privacy`
  - Terms of service: `https://starpath.app/terms`
- **Authorized domains**: 
  - Add: `starpath.app` (your domain)
  - Add: `supabase.co` (for Supabase auth)
- **Developer contact**: Your email

Click "Save and Continue"

#### Scopes:
- Click "Add or Remove Scopes"
- Select:
  - ✅ `.../auth/userinfo.email`
  - ✅ `.../auth/userinfo.profile`
  - ✅ `openid`
- Click "Update"
- Click "Save and Continue"

#### Test Users (for development):
- Add your email
- Add test users' emails
- Click "Save and Continue"

Click "Back to Dashboard"

### Step 5: Create OAuth 2.0 Credentials
1. Go to: APIs & Services → Credentials
2. Click "Create Credentials"
3. Select "OAuth 2.0 Client ID"
4. Application type: **Web application** ✅
5. Name: `StarPath Web Client`

#### Authorized JavaScript origins:
Add these URLs:
```
http://localhost:5173
http://localhost:3000
https://your-domain.com
https://www.your-domain.com
```

#### Authorized redirect URIs:
Add these URLs (IMPORTANT!):
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback
```

**Replace `YOUR_PROJECT_REF` with your actual Supabase project reference!**

Example: `https://ryzhsfmqopywoymghmdp.supabase.co/auth/v1/callback`

6. Click "Create"

### Step 6: Copy Your Credentials
You'll see a popup with:
- **Client ID**: `XXXXXXXXX.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-XXXXXXXXXXXXXX`

**Copy both! You'll need them.**

---

## 🔧 Configure in Supabase

### Step 1: Go to Supabase Dashboard
Visit: https://app.supabase.com/project/YOUR_PROJECT/auth/providers

### Step 2: Enable Google Provider
1. Find "Google" in the list
2. Toggle it ON ✅
3. Fill in:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
4. **Redirect URL** is shown here - make sure you added it to Google Console
5. Click "Save"

---

## 🔧 Configure in Your Application

### Frontend (.env)
```bash
# Add to your .env file
VITE_GOOGLE_CLIENT_ID=XXXXXXXXX.apps.googleusercontent.com
```

**Note**: Only Client ID goes in frontend, NOT the secret!

### Vercel Production (Environment Variables)
```bash
# Add in Vercel dashboard:
# Settings → Environment Variables
VITE_GOOGLE_CLIENT_ID=XXXXXXXXX.apps.googleusercontent.com
```

### Your App is Already Configured! ✅
The Google OAuth button is already implemented in:
- `src/pages/LoginPage.tsx`
- `src/pages/SignupPage.tsx`
- Uses Supabase's `signInWithOAuth` method

---

## 🧪 Testing Google OAuth

### Test Locally:
1. Start your app: `npm run dev`
2. Go to: http://localhost:5173/login
3. Click "Continue with Google"
4. Select Google account
5. Grant permissions
6. Should redirect back and login ✅

### Test in Production:
1. Deploy to Vercel
2. Go to your domain
3. Click "Continue with Google"
4. Login and verify ✅

---

## 🔄 What Happens During OAuth

1. User clicks "Continue with Google"
2. Redirects to Google login page
3. User selects account and grants permissions
4. Google redirects back to: `YOUR_PROJECT.supabase.co/auth/v1/callback`
5. Supabase creates/updates user in database
6. Supabase redirects to your app
7. User is logged in ✅

---

## 📊 User Data You Get

From Google OAuth, you'll receive:
- ✅ Email address
- ✅ Full name
- ✅ Profile picture URL
- ✅ Google User ID
- ❌ NO password (OAuth handles auth)

This data is automatically saved in your Supabase `profiles` table.

---

## 🔒 Security & Privacy

### What Google Knows:
- User logged into your app
- Date/time of login
- User's email (what they shared)

### What You Get:
- Email (if user grants permission)
- Name (if user grants permission)
- Profile picture (if user grants permission)

### What You DON'T Get:
- Google password
- Gmail contents
- Google Drive files
- Calendar events
- Contacts

**You only get what you requested in scopes!** ✅

---

## 🎯 OAuth Consent Screen Status

### Development Mode (Default):
- Only works for test users you added
- Shows "This app isn't verified" warning
- Good for testing ✅

### Production Mode (After Verification):
- Works for ALL Google users
- No warning shown
- **Required before public launch**

### How to Get Verified:
1. Go to: OAuth consent screen
2. Click "Publish App"
3. If requesting sensitive scopes:
   - Submit for verification
   - Google reviews (1-2 weeks)
4. If only requesting basic scopes (email, profile):
   - Instant approval ✅
   - No review needed

**For your app (email + profile only): Instant approval!** ✅

---

## 💡 Best Practices

### DO ✅
- Use Google OAuth for faster signup
- Only request necessary scopes (email, profile)
- Test with multiple Google accounts
- Keep Client Secret secure (Supabase only)
- Monitor OAuth usage in Google Console

### DON'T ❌
- Don't expose Client Secret in frontend
- Don't request unnecessary scopes
- Don't skip testing OAuth flow
- Don't forget to publish app before launch

---

## 🆘 Troubleshooting

### "Redirect URI Mismatch" Error
**Fix**: Make sure you added the EXACT redirect URI to Google Console:
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

### "Access Blocked: This app isn't verified"
**Fix**: 
- Add yourself as test user in OAuth consent screen
- Or publish the app (instant for basic scopes)

### "Invalid Client ID"
**Fix**:
- Check Client ID is correct in Supabase
- Verify `VITE_GOOGLE_CLIENT_ID` in .env
- Rebuild frontend after adding env variable

### OAuth Works Locally but Not in Production
**Fix**:
- Add production domain to Authorized JavaScript origins
- Add production redirect URI
- Set `VITE_GOOGLE_CLIENT_ID` in Vercel

### User Data Not Saved
**Fix**:
- Check Supabase functions logs
- Verify profiles table exists
- Check RLS policies allow insert

---

## 📈 Monitoring OAuth Usage

### Google Cloud Console:
1. Go to: APIs & Services → Credentials
2. Click on your OAuth client
3. See:
   - Number of users
   - Login attempts
   - Error rate

### Supabase Dashboard:
1. Go to: Authentication → Users
2. Filter by provider: Google
3. See all Google OAuth users

---

## ✅ Setup Checklist

- [ ] Create Google Cloud project
- [ ] Enable Google+ API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 credentials
- [ ] Copy Client ID and Secret
- [ ] Enable Google in Supabase
- [ ] Add Client ID and Secret to Supabase
- [ ] Add `VITE_GOOGLE_CLIENT_ID` to .env
- [ ] Add Supabase redirect URI to Google Console
- [ ] Test locally
- [ ] Add to Vercel environment variables
- [ ] Test in production
- [ ] Publish OAuth app (remove test users limitation)

---

## 🚀 After Setup

Once Google OAuth is working:
1. ✅ Users can sign in with one click
2. ✅ No password to remember
3. ✅ Faster signup flow
4. ✅ More secure (Google handles auth)
5. ✅ Profile picture automatically set
6. ✅ Email verified by default

---

## 📞 Quick Reference

| Task | Link |
|------|------|
| Google Cloud Console | https://console.cloud.google.com |
| OAuth Consent Screen | https://console.cloud.google.com/apis/credentials/consent |
| Credentials | https://console.cloud.google.com/apis/credentials |
| Supabase Auth Providers | https://app.supabase.com/project/YOUR_PROJECT/auth/providers |

---

## 🎉 Benefits of Google OAuth

### For Users:
- ✅ Sign up in 2 clicks
- ✅ No password to remember
- ✅ No email verification needed
- ✅ Auto-filled profile info
- ✅ Trusted authentication

### For You:
- ✅ Higher conversion rate
- ✅ Less password reset requests
- ✅ Fewer fake accounts
- ✅ More user data (name, picture)
- ✅ Better user experience

---

**Ready to set up Google OAuth?**

Follow the steps above and your users will thank you! 🚀

**Estimated Time**: 15 minutes  
**Cost**: FREE forever ✅  
**Complexity**: Easy (guided by UI) ✅
