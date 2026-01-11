# OAuth Setup Instructions

## ✅ Integration Complete - Awaiting Your OAuth Credentials

### What's Been Built:
1. ✅ Google OAuth integration
2. ✅ GitHub OAuth integration
3. ✅ OAuth buttons on Login & Signup pages
4. ✅ Redirect URL configuration
5. ✅ Error handling and loading states

### Required Actions:

#### 1. Setup Google OAuth
Visit: https://console.cloud.google.com/apis/credentials

1. Create a new project or select existing
2. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure OAuth consent screen
4. Add Authorized redirect URIs:
   - `http://localhost:8081/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)
5. Copy Client ID

Add to .env:
```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

#### 2. Setup GitHub OAuth
Visit: https://github.com/settings/developers

1. Click "New OAuth App"
2. Fill in details:
   - Application name: StarPath
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/auth/callback`
3. Copy Client ID and generate Client Secret

Add to .env:
```bash
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

#### 3. Configure in Supabase
Visit: Supabase Dashboard → Authentication → Providers

**Google:**
1. Enable Google provider
2. Paste Client ID
3. Paste Client Secret
4. Save

**GitHub:**
1. Enable GitHub provider
2. Paste Client ID
3. Paste Client Secret
4. Save

#### 4. Set Redirect URLs in Supabase
Go to: Supabase Dashboard → Authentication → URL Configuration

Add to "Redirect URLs":
- `http://localhost:8081/auth/callback`
- `https://your-domain.com/auth/callback`

### How It Works:
1. User clicks "Continue with Google/GitHub"
2. OAuth flow starts
3. User authorizes on provider's site
4. Provider redirects to `/auth/callback`
5. User profile created automatically
6. User redirected to dashboard

**Ready for your OAuth credentials!**
