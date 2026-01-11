# 🚀 Vercel Deployment Guide

## ✅ Prerequisites Complete
- [x] Code audited and bugs fixed
- [x] Edge functions deployed to Supabase
- [x] OpenRouter API key configured
- [x] Production build tested

---

## 🌐 Deploy to Vercel

### Option 1: Vercel CLI (Fastest - 5 minutes)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No (first time) or Yes (if exists)
# - What's your project's name? starpath (or your choice)
# - In which directory is your code located? ./
# - Want to override settings? No
```

**That's it!** Vercel will:
1. Build your app
2. Deploy to production
3. Give you a live URL

---

### Option 2: GitHub Integration (10 minutes)

#### Step 1: Push to GitHub
```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Production-ready: Audit complete, bugs fixed, edge functions deployed"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/starpath.git

# Push to GitHub
git push -u origin main
```

#### Step 2: Connect to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Step 3: Add Environment Variables
Click "Environment Variables" and add:

```
VITE_SUPABASE_PROJECT_ID=ryzhsfmqopywoymghmdp
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5emhzZm1xb3B5d295bWdobWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjIwMjIsImV4cCI6MjA4MzYzODAyMn0.DQADOrMNm3eT4iuo6_9AAVoKPuB-k9aUd7hg-2oIcBs
VITE_SUPABASE_URL=https://ryzhsfmqopywoymghmdp.supabase.co
VITE_RAZORPAY_KEY_ID=rzp_test_S2Ivb345JHSj6w
```

**Note**: Do NOT add `OPENROUTER_API_KEY` to Vercel - it's already in Supabase secrets

#### Step 4: Deploy
Click "Deploy" and wait 2-3 minutes

---

## 🔧 Vercel Configuration (Automatic via vercel.json)

Your `vercel.json` is already configured:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

This ensures:
- ✅ Client-side routing works
- ✅ Security headers applied
- ✅ All routes redirect to index.html

---

## 🧪 Post-Deployment Testing

### 1. Basic Functionality
Once deployed, test these flows:

**Landing Page**
- [ ] Landing page loads
- [ ] Navigation works
- [ ] CTA buttons work

**Authentication**
- [ ] Sign up with email
- [ ] Verify email (if enabled)
- [ ] Log in
- [ ] Session persists

**Dashboard**
- [ ] Dashboard loads
- [ ] Stats display correctly
- [ ] Today's habits show up

**Habits**
- [ ] Create new habit
- [ ] Complete habit
- [ ] Streak updates
- [ ] Calendar view works

**Analytics** (Fixed!)
- [ ] Analytics page loads without errors
- [ ] Charts display data
- [ ] All views (Today/Week/Month/Year) work

**Session Timer** (Fixed!)
- [ ] Start timer
- [ ] Stop timer
- [ ] Session saves to history
- [ ] XP awarded

**AI Features** (With OpenRouter key)
- [ ] AI Coach responds
- [ ] Generate study notes
- [ ] Generate flashcards
- [ ] Generate roadmap (displays as graph)
- [ ] Export to PDF/Markdown

**Goals**
- [ ] Create goal
- [ ] Add tasks
- [ ] Complete tasks
- [ ] Progress updates

### 2. Test AI Features

```bash
# Get your deployed URL from Vercel
YOUR_URL="https://starpath.vercel.app"

# Test from browser after login:
# 1. Go to AI Tools page
# 2. Try generating study notes
# 3. Try AI mentor chat
# 4. Generate a roadmap and verify graph renders
```

### 3. Check Console for Errors

Open browser DevTools:
- **Console tab**: Should be clean (no red errors)
- **Network tab**: All API calls should return 200/201
- **Application tab**: Check if PWA is registered

---

## 🔒 Post-Deployment Security

### Update Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard/project/ryzhsfmqopywoymghmdp/auth/url-configuration

2. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add:
     ```
     https://your-app.vercel.app/auth/callback
     https://your-app.vercel.app/**
     ```

3. Save changes

---

## 🎨 Custom Domain (Optional)

### Add Custom Domain in Vercel

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your domain (e.g., `starpath.app`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

### Update Supabase URLs

After custom domain is active:
1. Update Supabase redirect URLs
2. Update OAuth callback URLs (when configured)

---

## 📊 Expected Build Output

```
✓ built in 11s
✓ 3.1 MB total bundle size
✓ All chunks optimized
✓ PWA manifest generated
✓ Service worker registered
```

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Symptom**: Build fails with TypeScript errors  
**Fix**: Run locally first:
```bash
npm run build
# Fix any errors shown
git add .
git commit -m "Fix build errors"
git push
```

### Environment Variables Not Working

**Symptom**: App shows "Supabase not configured"  
**Fix**: 
1. Check env vars in Vercel Dashboard
2. Redeploy after adding vars
3. Ensure VITE_ prefix is present

### AI Features Not Working

**Symptom**: AI tools return errors  
**Fix**:
1. Verify OPENROUTER_API_KEY in Supabase secrets
2. Check edge functions are deployed
3. Test edge functions directly with curl

### OAuth Not Working (When Configured)

**Symptom**: OAuth returns "Invalid redirect URI"  
**Fix**:
1. Add Vercel URL to OAuth provider settings
2. Add callback URL to Supabase auth settings
3. Ensure URLs match exactly (no trailing slashes)

---

## 📈 Performance Optimization (Already Done)

✅ **Code Splitting**: Routes split into separate chunks  
✅ **Lazy Loading**: Components load on demand  
✅ **PWA**: Offline support with service worker  
✅ **Image Optimization**: Lazy image loading  
✅ **Caching**: React Query caching enabled  
✅ **Compression**: Gzip enabled by Vercel  

---

## 🚀 Going Live Checklist

Before announcing:

- [ ] All core features tested
- [ ] Analytics dashboard working
- [ ] Session timer working
- [ ] AI features working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] PWA installable
- [ ] Fast page loads (< 3s)
- [ ] SSL certificate active
- [ ] Custom domain configured (if using)
- [ ] Error monitoring set up (optional)
- [ ] Backup strategy in place (optional)

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Deployment Issues**: https://vercel.com/support
- **Build Logs**: Available in Vercel Dashboard
- **Supabase Console**: https://supabase.com/dashboard

---

## 🎯 Success Metrics

After deployment, monitor:
- **Uptime**: Should be 99.9%+
- **Page Load**: < 3 seconds
- **Build Time**: ~1-2 minutes
- **Edge Function Response**: < 500ms (AI may be slower)

---

**Ready to deploy?**

Run: `vercel --prod`

Or push to GitHub and connect via Vercel Dashboard.

**Estimated time**: 10 minutes

🚀 **LET'S GO LIVE!**
