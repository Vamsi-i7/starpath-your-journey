# 🔐 Google OAuth Setup - Step by Step Guide

## ⏱️ Total Time: 15 minutes

---

## 📋 What You'll Get

After setup, users can:
- ✅ Sign in with one click
- ✅ No password needed
- ✅ Profile picture automatically set
- ✅ Email verified by default
- ✅ Faster signup (2 seconds vs 2 minutes)

**Cost**: FREE forever ✅

---

## 🚀 Step-by-Step Setup

### Step 1: Go to Google Cloud Console (2 min)
1. Visit: **https://console.cloud.google.com**
2. Sign in with your Google account
3. Accept terms if prompted

---

### Step 2: Create a Project (2 min)
1. Click the **project dropdown** at the top (says "Select a project")
2. Click **"NEW PROJECT"** button
3. Enter project details:
   - **Project name**: `StarPath` (or your app name)
   - **Organization**: Leave as default
4. Click **"CREATE"**
5. Wait ~30 seconds for project creation
6. You'll see a notification when done

---

### Step 3: Enable Google+ API (2 min)
1. Make sure your new project is selected (check top dropdown)
2. In the search bar at top, type: **"Google+ API"**
3. Click on **"Google+ API"** in results
4. Click the blue **"ENABLE"** button
5. Wait ~10 seconds for it to enable
6. You'll see "API enabled" confirmation

---

### Step 4: Configure OAuth Consent Screen (4 min)

1. In left sidebar, click **"OAuth consent screen"**
2. Select user type:
   - Choose **"External"** ✅
   - Click **"CREATE"**

#### Fill in the form:

**App information**:
- **App name**: `StarPath` (your app name)
- **User support email**: Your email (select from dropdown)
- **App logo**: (optional - skip for now, add later)

**App domain** (scroll down):
- **Application home page**: `https://starpath.app` (or your domain)
- **Application privacy policy**: `https://starpath.app/privacy`
- **Application terms of service**: `https://starpath.app/terms`

**Authorized domains**:
- Click **"ADD DOMAIN"**
- Enter: `starpath.app` (your domain without https://)
- Click **"ADD DOMAIN"** again
- Enter: `supabase.co` (for Supabase auth)

**Developer contact information**:
- Enter your email address

Click **"SAVE AND CONTINUE"**

#### Scopes (next screen):
1. Click **"ADD OR REMOVE SCOPES"**
2. In the filter box, search for:
   - Type "email" and select: **`.../auth/userinfo.email`** ✅
   - Type "profile" and select: **`.../auth/userinfo.profile`** ✅
   - Type "openid" and select: **`openid`** ✅
3. Click **"UPDATE"** at bottom
4. Click **"SAVE AND CONTINUE"**

#### Test users (next screen):
1. Click **"ADD USERS"**
2. Enter your email address
3. Add any other test users' emails (optional)
4. Click **"ADD"**
5. Click **"SAVE AND CONTINUE"**

#### Summary (last screen):
1. Review your settings
2. Click **"BACK TO DASHBOARD"**

---

### Step 5: Create OAuth 2.0 Credentials (3 min)

1. In left sidebar, click **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at top
3. Select **"OAuth 2.0 Client ID"**

#### Configure OAuth client:

**Application type**:
- Select: **"Web application"** ✅

**Name**:
- Enter: `StarPath Web Client`

**Authorized JavaScript origins**:
Click **"ADD URI"** and add these (one at a time):
```
http://localhost:5173
http://localhost:3000
https://starpath.app
https://www.starpath.app
```

**Authorized redirect URIs**:
Click **"ADD URI"** and add these (IMPORTANT!):
```
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback
```

⚠️ **IMPORTANT**: Replace `YOUR_SUPABASE_PROJECT_REF` with your actual project reference!

**How to find your Supabase project ref**:
1. Go to: https://app.supabase.com
2. Open your project
3. Look at the URL: `https://app.supabase.com/project/XXXXX`
4. The XXXXX part is your project ref
5. Use: `https://XXXXX.supabase.co/auth/v1/callback`

**Example**:
- If project ref is `ryzhsfmqopywoymghmdp`
- Redirect URI is: `https://ryzhsfmqopywoymghmdp.supabase.co/auth/v1/callback`

Click **"CREATE"**

---

### Step 6: Copy Your Credentials (1 min)

You'll see a popup with:
- **Client ID**: `XXXXXXXXX.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-XXXXXXXXXXXXXX`

**COPY BOTH!** You'll need them in next steps.

**✋ Don't close this yet!** If you do, you can access them again from the Credentials page.

---

### Step 7: Enable Google in Supabase (2 min)

1. Go to: **https://app.supabase.com**
2. Open your project
3. Navigate to: **Authentication** → **Providers**
4. Find **"Google"** in the list
5. Toggle it **ON** (switch should turn green)
6. Fill in:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
7. **Redirect URL** is shown - make sure you added it to Google Console
8. Click **"Save"**

---

### Step 8: Add to Your Application (1 min)

#### For Local Development:

Open your `.env` file and add:
```bash
VITE_GOOGLE_CLIENT_ID=XXXXXXXXX.apps.googleusercontent.com
```

⚠️ **Only add Client ID to .env** - NOT the secret!

#### For Production (Vercel):

1. Go to your Vercel dashboard
2. Open your project
3. Go to: **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `VITE_GOOGLE_CLIENT_ID`
   - **Value**: `XXXXXXXXX.apps.googleusercontent.com`
5. Click **"Save"**
6. Redeploy your app

---

## 🧪 Testing (2 min)

### Test Locally:
1. Make sure `.env` has the Client ID
2. Restart your dev server:
   ```bash
   npm run dev
   ```
3. Go to: http://localhost:5173/login
4. Click **"Continue with Google"**
5. Select your Google account
6. Grant permissions
7. Should redirect back and login ✅

### Test in Production:
1. Deploy your app to Vercel
2. Make sure `VITE_GOOGLE_CLIENT_ID` is in environment variables
3. Visit your live site
4. Click **"Continue with Google"**
5. Login and verify ✅

---

## ✅ Verification Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Configured OAuth consent screen
- [ ] Added authorized domains (your domain + supabase.co)
- [ ] Created OAuth 2.0 credentials
- [ ] Added redirect URIs (Supabase callback + localhost)
- [ ] Copied Client ID and Secret
- [ ] Enabled Google in Supabase dashboard
- [ ] Added credentials to Supabase
- [ ] Added `VITE_GOOGLE_CLIENT_ID` to .env
- [ ] Tested locally - works ✅
- [ ] Added to Vercel environment variables
- [ ] Tested in production - works ✅

---

## 🎯 What Happens During Login

1. User clicks "Continue with Google"
2. Redirected to Google login page
3. User selects Google account
4. Grants permissions (email, profile)
5. Google redirects to: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
6. Supabase creates/updates user account
7. Supabase redirects back to your app
8. User is logged in! ✅

**Duration**: ~5 seconds total

---

## 📊 User Data You'll Receive

From Google OAuth:
- ✅ **Email address** (verified)
- ✅ **Full name** (First + Last)
- ✅ **Profile picture URL**
- ✅ **Google User ID** (unique identifier)

This data is automatically saved to your `profiles` table in Supabase.

---

## 🔒 Security & Privacy

### What Google Shares:
- Email (if user grants permission)
- Name (if user grants permission)
- Profile picture (if user grants permission)

### What Google DOESN'T Share:
- ❌ Password
- ❌ Gmail contents
- ❌ Calendar events
- ❌ Drive files
- ❌ Contacts

**You only get what you requested (email + profile)** ✅

---

## 🐛 Troubleshooting

### Error: "Redirect URI Mismatch"
**Fix**: 
1. Check the exact URI in the error message
2. Go to Google Cloud Console → Credentials
3. Click your OAuth client
4. Add the exact URI shown in error
5. Wait 5 minutes and try again

**Common mistake**: 
- Missing `/auth/v1/callback` at the end
- Using http instead of https
- Wrong project reference

### Error: "Access Blocked: This app isn't verified"
**Fix**:
- Add yourself as a test user in OAuth consent screen
- Or publish the app (instant for basic scopes)

**To publish**:
1. Go to OAuth consent screen
2. Click "PUBLISH APP"
3. Confirm
4. For basic scopes (email + profile): Instant approval ✅

### Error: "Invalid Client ID"
**Fix**:
- Verify Client ID is correct in Supabase
- Check `VITE_GOOGLE_CLIENT_ID` in .env
- Rebuild app: `npm run build`
- Restart dev server: `npm run dev`

### OAuth Works Locally but Not in Production
**Fix**:
- Add production domain to Authorized JavaScript origins
- Add production callback to Authorized redirect URIs
- Set `VITE_GOOGLE_CLIENT_ID` in Vercel
- Redeploy app

---

## 📈 OAuth App Status

### Development Mode (Default):
- Works for test users you added
- Shows "This app isn't verified" warning
- Good for testing ✅

### Production Mode (Published):
- Works for ALL Google users
- No warning shown
- Required for public launch

### How to Publish:
1. OAuth consent screen → Click "PUBLISH APP"
2. For basic scopes (email + profile): Instant ✅
3. For sensitive scopes: Review needed (1-2 weeks)

**Your app uses basic scopes = Instant publishing!** ✅

---

## 💡 Pro Tips

1. **Test with multiple Google accounts** to ensure it works for everyone
2. **Add your domain to OAuth consent screen** for better user trust
3. **Publish your app** before launch to remove "unverified" warning
4. **Monitor OAuth usage** in Google Cloud Console
5. **Keep Client Secret secure** - only in Supabase, never in frontend

---

## 📞 Quick Reference

### Important Links:
| Resource | URL |
|----------|-----|
| Google Cloud Console | https://console.cloud.google.com |
| OAuth Consent Screen | https://console.cloud.google.com/apis/credentials/consent |
| Credentials | https://console.cloud.google.com/apis/credentials |
| Supabase Auth Providers | https://app.supabase.com/project/YOUR_PROJECT/auth/providers |

### Key Values:
| Item | Value |
|------|-------|
| Client ID location | Frontend (.env) |
| Client Secret location | Supabase only |
| Redirect URI format | `https://PROJECT_REF.supabase.co/auth/v1/callback` |
| Scopes needed | email, profile, openid |

---

## 🎉 Benefits After Setup

### For Users:
- ✅ Sign up in 5 seconds
- ✅ No password to remember
- ✅ Email automatically verified
- ✅ Profile picture set
- ✅ Trusted authentication

### For You:
- ✅ Higher conversion rate
- ✅ Less support requests
- ✅ Fewer fake accounts
- ✅ Better UX
- ✅ FREE forever

---

## 📝 After You Provide Keys

Send me:
```
Client ID: XXXXXXXXX.apps.googleusercontent.com
Client Secret: GOCSPX-XXXXXXXXXXXXXX
```

I will:
1. ✅ Add them to your configuration
2. ✅ Update deployment scripts
3. ✅ Test the integration
4. ✅ Verify it works in both dev and production
5. ✅ Confirm Google OAuth is functional

---

**Ready to set up? Follow Step 1 above!** 🚀

**Need help?** Send me the Client ID and Secret when you have them.

**Estimated time**: 15 minutes for complete setup
