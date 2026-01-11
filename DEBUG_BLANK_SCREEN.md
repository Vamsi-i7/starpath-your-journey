# 🔍 Debug Blank Screen on Vercel

## Step 1: Check Browser Console for Errors

1. Open https://starpath-seven.vercel.app in your browser
2. Press `F12` (or right-click → Inspect)
3. Click the **Console** tab
4. Look for red error messages

### Common Errors:

**Error: "VITE_SUPABASE_URL is not defined"**
→ Environment variables missing

**Error: "Failed to fetch"**
→ Environment variables wrong or CORS issue

**Error: "supabaseUrl is required"**
→ Environment variables not loaded

---

## Step 2: Verify Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Click **"starpath-seven"** project
3. Click **Settings**
4. Click **Environment Variables**

### ✅ You Should See These 4 Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_RAZORPAY_KEY_ID`

### ❌ If Missing or Wrong:
Add/fix them, then redeploy.

---

## Step 3: Check Build Logs

1. Go to: https://vercel.com/dashboard
2. Click **"starpath-seven"** project
3. Click **Deployments** tab
4. Click the latest deployment
5. Look for:
   - ✅ "Build completed"
   - ❌ Any red error messages

---

## Step 4: Framework Settings Explained

### Build Command: `npm run build`
**What it does:** Compiles your React/Vite app into production files
**Should be:** `npm run build`
**Override:** ✅ ON (correct)

### Output Directory: `dist`
**What it does:** Where the compiled files are saved
**Should be:** `dist` (Vite's default output folder)
**Override:** ✅ ON (correct)

### Install Command: (empty)
**What it does:** Installs dependencies (npm install)
**Should be:** Empty (Vercel auto-detects)
**Override:** ❌ OFF (correct)

### Development Command: (empty)
**What it does:** Runs local dev server
**Should be:** Empty (not needed for production)
**Override:** ❌ OFF (correct)

**Your settings are CORRECT!** ✅

---

## Step 5: Force Fresh Deployment

### Method 1: CLI (Recommended)

Run these commands:

```bash
# Clear any cache
rm -rf .vercel
rm -rf dist
rm -rf node_modules/.vite

# Fresh deployment
vercel --prod --force
```

The `--force` flag ensures a completely fresh build.

### Method 2: Dashboard

1. Go to: https://vercel.com/dashboard
2. Click **"starpath-seven"**
3. Click **Deployments**
4. Click the **latest deployment**
5. Click **"⋮"** (three dots) → **"Redeploy"**
6. **UNCHECK** "Use existing Build Cache"
7. Click **"Redeploy"**

---

## Step 6: Check Network Tab

After deployment:

1. Open https://starpath-seven.vercel.app
2. Press `F12`
3. Go to **Network** tab
4. Refresh the page
5. Look for:
   - ✅ `index.html` loads (200 status)
   - ✅ `.js` files load (200 status)
   - ❌ Any failed requests (red)

---

## Common Issues & Fixes

### Issue 1: Environment Variables Not in Build

**Symptom:** Blank screen, console error about missing env vars

**Fix:**
1. Verify variables are in Vercel Dashboard
2. Make sure they're set to "All Environments" or "Production"
3. Redeploy WITHOUT cache

**Commands:**
```bash
vercel --prod --force
```

### Issue 2: Build Cache Contains Old Code

**Symptom:** Old version showing, env vars not applied

**Fix:**
Clear cache and redeploy:
```bash
rm -rf .vercel
vercel --prod
```

### Issue 3: Wrong Environment Selected

**Symptom:** Variables added but not working

**Fix:**
1. Check variables are for "Production" environment
2. If added to "Preview" only, add to "Production"
3. Redeploy

### Issue 4: Typo in Variable Names

**Symptom:** App can't find variables

**Fix:**
Check exact names (case-sensitive):
- `VITE_SUPABASE_URL` (not `VITE_SUPABASE_URI`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (not `VITE_SUPABASE_ANON_KEY`)

### Issue 5: Variable Values Have Extra Spaces

**Symptom:** Connection fails

**Fix:**
Remove any spaces before/after values:
- ❌ ` https://ryzhsfmqopywoymghmdp.supabase.co ` (spaces)
- ✅ `https://ryzhsfmqopywoymghmdp.supabase.co` (no spaces)

---

## Step 7: Manual Verification

Check if environment variables are in the build:

1. Go to deployment URL
2. Right-click → View Page Source
3. Search for "supabase" in the source code
4. You should see references to your Supabase URL

If you see `undefined` or nothing → env vars not included

---

## Step 8: Test Locally First

Before deploying again, test locally:

```bash
# Build for production locally
npm run build

# Preview the production build
npm run preview

# Open http://localhost:4173
# Should work perfectly (uses .env file)
```

If it works locally but not on Vercel → env vars issue

---

## Quick Fix Checklist

- [ ] Environment variables added in Vercel Dashboard
- [ ] Variables set to "Production" or "All Environments"
- [ ] Variable names exactly: `VITE_SUPABASE_URL`, etc.
- [ ] No extra spaces in variable values
- [ ] Redeployed AFTER adding variables
- [ ] Build cache disabled during redeploy
- [ ] Checked browser console for errors
- [ ] Checked build logs for errors

---

## Emergency Fix: Complete Reset

If nothing works, do a complete reset:

```bash
# 1. Remove Vercel cache
rm -rf .vercel

# 2. Clean local build
rm -rf dist
rm -rf node_modules/.vite

# 3. Verify environment variables in Dashboard
# Go to Vercel Dashboard → Settings → Environment Variables

# 4. Fresh deployment
vercel --prod --force

# 5. Wait 2-3 minutes for build

# 6. Open URL in incognito window (bypass browser cache)
```

---

## What to Send Me for Help

If still blank, please send:

1. **Browser console errors:**
   - Open F12 → Console tab
   - Copy any red error messages

2. **Build logs:**
   - Vercel Dashboard → Deployments → Latest → Build Logs
   - Any errors shown

3. **Environment variables screenshot:**
   - Vercel Dashboard → Settings → Environment Variables
   - Just show variable names (not values)

4. **Network tab:**
   - F12 → Network tab
   - Any failed requests (red)

---

## Next Steps

Try this now:

```bash
vercel --prod --force
```

This will force a completely fresh build with no cache.

Then:
1. Wait for deployment to complete
2. Open URL in **incognito window** (to bypass browser cache)
3. Check browser console (F12)
4. Report back with any errors!

---

**Let's get this working!** 🚀
