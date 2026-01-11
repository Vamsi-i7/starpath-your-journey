# 🔑 Environment Variables - Detailed Explanation

## Overview
These environment variables allow your frontend application to communicate with Supabase (your backend database and authentication system) and Razorpay (payment processing).

---

## 📋 Required Variables for Vercel

### 1. VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://ryzhsfmqopywoymghmdp.supabase.co
```

**What it does:**
- This is the **base URL** of your Supabase project
- Every database query, authentication request, and API call goes through this URL
- It tells your app WHERE to connect to access your backend

**Why it's needed:**
- Without this, your app doesn't know where your database is located
- It's like a street address for your backend services

**Security:**
- ✅ **Safe to expose** in frontend code (it's meant to be public)
- Your data is still protected by RLS (Row Level Security) policies

---

### 2. VITE_SUPABASE_PUBLISHABLE_KEY
```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5emhzZm1xb3B5d295bWdobWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjIwMjIsImV4cCI6MjA4MzYzODAyMn0.DQADOrMNm3eT4iuo6_9AAVoKPuB-k9aUd7hg-2oIcBs
```

**What it does:**
- This is your **anonymous public key** (also called "anon key")
- It authenticates your frontend app to make requests to Supabase
- It's a JWT (JSON Web Token) that proves your app is allowed to access your Supabase project

**Why it's needed:**
- Every API request to Supabase needs this key in the header
- Without it, Supabase will reject all requests from your app
- It enables:
  - User authentication (sign up, sign in)
  - Database queries
  - Edge function calls
  - File storage access

**Security:**
- ✅ **Safe to expose** in frontend code (designed to be public)
- It has limited permissions (read-only by default)
- Your RLS policies protect the actual data
- Cannot perform admin operations

**Technical details:**
- Decoded JWT contains:
  ```json
  {
    "iss": "supabase",
    "ref": "ryzhsfmqopywoymghmdp",
    "role": "anon",
    "iat": 1768062022,
    "exp": 2083638022
  }
  ```
- Role: "anon" (anonymous user)
- Expires: 2083 (valid for ~10 years)

---

### 3. VITE_SUPABASE_PROJECT_ID
```
Name: VITE_SUPABASE_PROJECT_ID
Value: ryzhsfmqopywoymghmdp
```

**What it does:**
- This is your **unique project identifier** in Supabase
- It's extracted from your Supabase URL: `https://[PROJECT_ID].supabase.co`
- Used for:
  - Constructing API endpoints
  - Identifying your project in logs
  - Building storage URLs
  - Referencing your specific Supabase instance

**Why it's needed:**
- Some parts of the app need to construct URLs dynamically
- Example: Storage bucket URLs like `https://ryzhsfmqopywoymghmdp.supabase.co/storage/v1/object/public/avatars/...`
- Helps with debugging (identifying which project is being used)

**Security:**
- ✅ **Safe to expose** (it's public information)
- Just an identifier, not a secret key

---

### 4. VITE_RAZORPAY_KEY_ID
```
Name: VITE_RAZORPAY_KEY_ID
Value: rzp_test_S2Ivb345JHSj6w
```

**What it does:**
- This is your **Razorpay Test Key ID** (public key)
- Used to initialize the Razorpay payment checkout modal
- Identifies your Razorpay merchant account

**Why it's needed:**
- Required to open the Razorpay payment interface
- Links payments to your Razorpay account
- Without it, users cannot make payments or subscribe

**Current Status:**
- 🧪 **TEST MODE** - You're using test credentials (see `rzp_test_` prefix)
- Test mode means:
  - Real money is NOT processed
  - You can use test card numbers to simulate payments
  - Perfect for development and testing

**When to use LIVE keys:**
- After testing is complete and you're ready to accept real payments
- Replace `rzp_test_...` with `rzp_live_...`
- Get live keys from Razorpay Dashboard

**Security:**
- ✅ **Safe to expose** in frontend (it's meant to be public)
- This is the KEY ID, not the KEY SECRET
- The secret key is safely stored in Supabase secrets (backend only)

**Test Card Numbers (for testing payments):**
```
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

---

## 🔐 Security Architecture

### Public (Frontend) vs Secret (Backend)

**✅ Safe in Frontend:**
- `VITE_SUPABASE_URL` - Public URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Anonymous key with limited permissions
- `VITE_SUPABASE_PROJECT_ID` - Just an identifier
- `VITE_RAZORPAY_KEY_ID` - Public merchant identifier

**🔒 Secret (Backend Only - Stored in Supabase):**
- `OPENROUTER_API_KEY` - AI service key (already added to Supabase)
- `RAZORPAY_KEY_SECRET` - Payment verification key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access key

### Why This is Secure

1. **Row Level Security (RLS):**
   - Even with public keys, users can only access their own data
   - Database policies enforce "users can only see their own habits/goals"
   - Example: `user_id = auth.uid()` in every policy

2. **Separate Concerns:**
   - Frontend handles UI and basic queries
   - Backend (edge functions) handles sensitive operations
   - Payments are verified server-side using secret keys

3. **Limited Permissions:**
   - Anonymous key can't delete tables, modify schemas, or access admin functions
   - Service role key never touches the frontend

---

## 📝 Adding to Vercel Dashboard

### Step-by-Step with Descriptions

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Add Variable 1:**
```
Name: VITE_SUPABASE_URL
Value: https://ryzhsfmqopywoymghmdp.supabase.co
Environment: Production ✓
Description: Supabase project URL - base endpoint for all backend API calls
```

**Add Variable 2:**
```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5emhzZm1xb3B5d295bWdobWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjIwMjIsImV4cCI6MjA4MzYzODAyMn0.DQADOrMNm3eT4iuo6_9AAVoKPuB-k9aUd7hg-2oIcBs
Environment: Production ✓
Description: Supabase anonymous public key - authenticates frontend API requests
```

**Add Variable 3:**
```
Name: VITE_SUPABASE_PROJECT_ID
Value: ryzhsfmqopywoymghmdp
Environment: Production ✓
Description: Supabase project identifier - used for storage URLs and logging
```

**Add Variable 4:**
```
Name: VITE_RAZORPAY_KEY_ID
Value: rzp_test_S2Ivb345JHSj6w
Environment: Production ✓
Description: Razorpay test key - enables payment checkout (test mode)
```

---

## 🧪 Testing After Deployment

Once variables are added and you redeploy, test:

**1. Landing Page Loads:**
- Should show StarPath landing page (not blank screen)

**2. Authentication Works:**
- Sign up with email
- Log in
- Session persists

**3. Database Queries Work:**
- Create a habit
- Complete a habit
- View analytics

**4. AI Features Work:**
- AI chat responds
- Generate study notes

**5. Payment Modal Opens:**
- Go to subscription page
- Click "Upgrade"
- Razorpay modal should open

---

## ❓ FAQ

**Q: Why does VITE_ prefix matter?**
A: Vite only exposes env vars with `VITE_` prefix to the browser. Without it, the variable is ignored.

**Q: Can I use the same keys locally and in production?**
A: Yes! These are the same keys. Your `.env` file already has them.

**Q: What if I change these keys?**
A: You'd need to:
1. Update in Vercel Dashboard
2. Redeploy the app
3. Update `.env` locally

**Q: Are these keys sensitive?**
A: The ones in Vercel (public keys) are safe to expose. The ones in Supabase secrets (like OPENROUTER_API_KEY) are sensitive.

---

## 🎯 Summary

| Variable | Purpose | Security | Required? |
|----------|---------|----------|-----------|
| VITE_SUPABASE_URL | Backend API endpoint | ✅ Public | ✅ Yes |
| VITE_SUPABASE_PUBLISHABLE_KEY | Auth token for API | ✅ Public | ✅ Yes |
| VITE_SUPABASE_PROJECT_ID | Project identifier | ✅ Public | ✅ Yes |
| VITE_RAZORPAY_KEY_ID | Payment gateway ID | ✅ Public | ✅ Yes |

**All 4 are required for the app to function.**

Without them → Blank screen 📵  
With them → Fully functional app! 🚀

---

**Ready to add them? Follow the instructions above!** 🎉
