# 🐛 Sentry Error Tracking Setup Guide

## What is Sentry?

Sentry helps you:
- Track errors in production
- Get notified of issues immediately
- See stack traces and user context
- Monitor performance
- Debug faster with session replay

**Cost**: Free tier (5,000 errors/month) - More than enough to start!

---

## 📋 Setup Steps (10 minutes)

### Step 1: Create Sentry Account
1. Go to: https://sentry.io/signup/
2. Sign up with:
   - Email
   - Google account ✅ (recommended)
   - GitHub account
3. Verify your email

### Step 2: Create Organization
1. Choose organization name: `StarPath` or your company name
2. Select plan: **Developer (Free)** ✅
3. Click "Create Organization"

### Step 3: Create Project
1. Click "Create Project"
2. Select platform: **React** ✅
3. Set alert frequency: **On every new issue** ✅
4. Project name: `starpath-frontend`
5. Click "Create Project"

### Step 4: Get Your DSN
After creating the project, you'll see:
```
https://XXXXXX@oYYYYYY.ingest.sentry.io/ZZZZZZZ
```

**This is your DSN (Data Source Name)** - Copy it!

---

## 🔧 Configuration

### Already Installed ✅
Your project already has Sentry installed:
```json
"@sentry/react": "^7.x.x"
```

### Already Integrated ✅
Sentry is integrated in `src/lib/errorTracking.ts`:
- Automatic error capture
- User context tracking
- Performance monitoring
- Session replay

### Just Add Your DSN

#### Option 1: Local Development (.env)
```bash
# Add to your .env file
VITE_SENTRY_DSN=https://XXXXXX@oYYYYYY.ingest.sentry.io/ZZZZZZZ
```

#### Option 2: Vercel Production
```bash
# Add environment variable in Vercel dashboard
# Settings → Environment Variables → Add
Name: VITE_SENTRY_DSN
Value: https://XXXXXX@oYYYYYY.ingest.sentry.io/ZZZZZZZ
```

---

## 🧪 Testing Sentry Integration

### Test 1: Trigger a Test Error
Add this to any page temporarily:
```typescript
// Test Sentry (remove after testing)
import { captureError } from '@/lib/errorTracking';

const TestError = () => {
  const testSentry = () => {
    captureError(
      new Error('Test error from StarPath!'),
      { component: 'TestComponent', action: 'testing' },
      'high'
    );
  };

  return <button onClick={testSentry}>Test Sentry</button>;
};
```

### Test 2: Cause a Real Error
```typescript
// This will cause an error and Sentry will catch it
const BuggyComponent = () => {
  const data = null;
  return <div>{data.something}</div>; // Will error!
};
```

### Test 3: Check Sentry Dashboard
1. Go to: https://sentry.io/organizations/YOUR_ORG/issues/
2. You should see your test error
3. Click on it to see:
   - Stack trace
   - User context
   - Browser info
   - Breadcrumbs (what led to error)

---

## 📊 Sentry Dashboard Overview

### Issues Tab
- See all errors
- Filter by severity, status, user
- Assign to team members
- Mark as resolved

### Performance Tab
- API response times
- Page load times
- Slow transactions

### Releases Tab
- Track errors by version
- See which release introduced bugs
- Monitor deployment health

### Alerts Tab
- Set up notifications
- Email, Slack, Discord integration
- Custom alert rules

---

## 🔔 Set Up Alerts

### Email Alerts (Default ✅)
- Automatically enabled
- Get notified on new issues
- Daily/weekly summaries

### Slack Integration (Optional)
1. Go to: Settings → Integrations → Slack
2. Connect your Slack workspace
3. Choose channel for notifications
4. Set alert rules

### Discord Integration (Optional)
1. Go to: Settings → Integrations → Discord
2. Add webhook URL from Discord
3. Set alert rules

---

## 🎯 What's Already Configured

### Automatic Error Capture ✅
```typescript
// Unhandled errors automatically sent to Sentry
window.addEventListener('error', handler);
window.addEventListener('unhandledrejection', handler);
```

### User Context ✅
```typescript
// When user logs in, context is set
setUser({ id, username, email });

// When user logs out, context is cleared
clearUser();
```

### Custom Error Tracking ✅
```typescript
// Use anywhere in your code
import { captureError } from '@/lib/errorTracking';

try {
  // Your code
} catch (error) {
  captureError(error, {
    component: 'MyComponent',
    action: 'submitForm',
    additionalData: { formData }
  }, 'high');
}
```

### Performance Monitoring ✅
```typescript
// Tracks:
// - Page load times
// - API response times
// - Component render times
```

### Session Replay ✅
```typescript
// Records user sessions when errors occur
// Privacy: Text and media masked by default
```

---

## 🔒 Privacy & Security

### What Sentry Captures:
- ✅ Error messages
- ✅ Stack traces
- ✅ User ID (but NOT email by default)
- ✅ Browser info
- ✅ URL/route
- ✅ Breadcrumbs (actions before error)

### What Sentry DOESN'T Capture:
- ❌ Passwords
- ❌ Credit card numbers
- ❌ Personal data (masked)
- ❌ Session tokens (filtered)

### Data Scrubbing (Automatic):
- Passwords filtered
- Credit cards filtered
- API keys filtered
- Sensitive data masked

---

## 💰 Free Tier Limits

### What You Get (Free Forever):
- ✅ 5,000 errors/month
- ✅ 10,000 performance events/month
- ✅ 50 replay sessions/month
- ✅ 1 project
- ✅ 30 days data retention
- ✅ Slack/Discord integrations
- ✅ Basic alerts

### When to Upgrade:
- **Team Plan** ($26/mo): More errors, longer retention, more team members
- **Business Plan** ($80/mo): Unlimited projects, advanced features

**For a startup, free tier is perfect!** ✅

---

## 🚀 Production Best Practices

### 1. Source Maps (For Better Stack Traces)
```bash
# In vite.config.ts - already configured ✅
build: {
  sourcemap: true,
}

# Upload source maps to Sentry (optional)
# Add to package.json:
"scripts": {
  "build": "vite build && sentry-cli sourcemaps upload --org YOUR_ORG --project starpath-frontend ./dist"
}
```

### 2. Release Tracking
```typescript
// Set release version
Sentry.init({
  dsn: "...",
  release: "starpath@1.0.0",
});
```

### 3. Environment Tags
```typescript
// Already configured ✅
Sentry.init({
  environment: import.meta.env.MODE, // 'development' or 'production'
});
```

### 4. Custom Tags
```typescript
// Add custom tags to errors
Sentry.setTag("feature", "ai-tools");
Sentry.setTag("plan", "premium");
```

---

## 📈 Monitoring Dashboard

### Key Metrics to Watch:
1. **Error Rate**: Errors per user session
2. **Affected Users**: How many users hit errors
3. **New Issues**: Newly introduced bugs
4. **Regressions**: Old bugs that came back
5. **Crash Rate**: % of sessions that crash

### Set Up Custom Dashboard:
1. Go to: Dashboards → Create Dashboard
2. Add widgets:
   - Error count over time
   - Top errors
   - Users affected
   - Browser breakdown
   - Performance metrics

---

## 🔧 Integration Status

### ✅ Already Done:
- Sentry package installed
- Error tracking implemented
- User context tracking
- Performance monitoring
- Session replay configured
- Privacy settings applied

### 📝 You Need to Do:
1. Create Sentry account (5 min)
2. Get DSN (1 min)
3. Add DSN to `.env` (1 min)
4. Deploy to production (already know how)
5. Test error tracking (2 min)

---

## 🆘 Troubleshooting

### Errors Not Showing in Sentry
1. Check DSN is correct in `.env`
2. Verify Sentry is enabled: `environment: 'production'`
3. Check browser console for Sentry errors
4. Ensure you've rebuilt app after adding DSN

### Too Many Errors
1. Increase sample rate to reduce noise
2. Filter out non-critical errors
3. Use `beforeSend` to filter events
4. Group similar errors together

### Source Maps Not Working
1. Ensure `sourcemap: true` in `vite.config.ts`
2. Upload source maps to Sentry
3. Check release version matches

---

## ✅ Quick Setup Checklist

- [ ] Create Sentry account at https://sentry.io
- [ ] Create organization
- [ ] Create React project
- [ ] Copy DSN
- [ ] Add `VITE_SENTRY_DSN` to `.env`
- [ ] Add DSN to Vercel environment variables
- [ ] Rebuild and test locally
- [ ] Deploy to production
- [ ] Trigger test error
- [ ] Verify error appears in Sentry dashboard
- [ ] Set up alerts (email/Slack)
- [ ] Create custom dashboard (optional)

---

## 📞 Quick Reference

| Task | Link |
|------|------|
| Sign up | https://sentry.io/signup/ |
| Dashboard | https://sentry.io/organizations/YOUR_ORG/ |
| Projects | https://sentry.io/organizations/YOUR_ORG/projects/ |
| Settings | https://sentry.io/organizations/YOUR_ORG/settings/ |
| Docs | https://docs.sentry.io/platforms/javascript/guides/react/ |

---

## 🎉 Benefits You'll Get

1. **Instant Notifications**: Know about errors before users complain
2. **Better Debugging**: Full stack traces and context
3. **User Impact**: See how many users affected
4. **Performance Insights**: Find slow pages/APIs
5. **Release Tracking**: Know which deploy broke what
6. **Team Collaboration**: Assign and track fixes

---

**Ready to set up Sentry?**

It takes just 10 minutes and will save you hours of debugging! 🚀

Go to https://sentry.io/signup/ and follow the steps above.
