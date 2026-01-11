# 🔑 Manual Password Reset via SQL

## When to Use This
When Supabase password recovery emails fail and the dashboard reset doesn't work.

---

## 📋 Step-by-Step Guide

### Step 1: Open SQL Editor

Go to: https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/sql/new

Click "New Query" or use the SQL editor directly.

---

### Step 2: Find Your User ID

**Run this query:**
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

**What you'll see:**
| id | email | created_at |
|----|-------|------------|
| abc-123-def... | your@email.com | 2026-01-11... |

**Copy your user ID** (the long string in the "id" column)

---

### Step 3: Update Your Password

**Run this query** (replace the placeholder values):

```sql
UPDATE auth.users
SET 
  encrypted_password = crypt('YOUR_NEW_PASSWORD', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE id = 'YOUR_USER_ID';
```

**Example with actual values:**
```sql
UPDATE auth.users
SET 
  encrypted_password = crypt('MySecurePassword123!', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
```

**Replace:**
- `YOUR_NEW_PASSWORD` → Your desired password (e.g., `MySecurePassword123!`)
- `YOUR_USER_ID` → The UUID you copied from Step 2

**Click "Run" or press Ctrl/Cmd + Enter**

You should see: `Success. No rows returned`

---

### Step 4: Verify It Worked

**Run this query:**
```sql
SELECT email, updated_at, email_confirmed_at
FROM auth.users 
WHERE id = 'YOUR_USER_ID';
```

**You should see:**
- `updated_at` is recent (current timestamp)
- `email_confirmed_at` is set (not null)

---

### Step 5: Log In

1. Go to: https://starpath-seven.vercel.app/login
2. Enter your **email**
3. Enter your **new password**
4. Click "Sign In"

✅ **You should be able to log in now!**

---

## 🔒 Security Information

### Is This Safe?
✅ **YES!** This is completely safe because:

- `crypt()` is PostgreSQL's built-in password hashing function
- Uses **bcrypt** algorithm (same as Supabase normally uses)
- Password is **never stored in plain text**
- Hash is **one-way** (cannot be reversed)
- Same security level as Supabase's normal password reset

### What Does This Query Do?

```sql
encrypted_password = crypt('YOUR_NEW_PASSWORD', gen_salt('bf'))
```
- `crypt()` → Hashes your password
- `gen_salt('bf')` → Generates a bcrypt salt
- Result: Securely hashed password (example: `$2a$10$N9qo8uLOickgx2ZMRZoMye...`)

```sql
email_confirmed_at = NOW()
```
- Marks your email as confirmed
- Prevents "verify email" prompts

```sql
updated_at = NOW()
```
- Updates the timestamp
- Standard practice for database updates

---

## 🐛 Troubleshooting

### Error: "function crypt() does not exist"

**Cause:** Missing pgcrypto extension

**Fix:**
Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Then try the password update query again.

---

### Error: "permission denied for table auth.users"

**Cause:** Not using service role

**Fix:**
1. Make sure you're logged into Supabase Dashboard
2. The SQL editor in the dashboard has correct permissions
3. Don't run this from your app code

---

### "No rows returned" but still can't log in

**Check 1: Verify user ID is correct**
```sql
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
```

**Check 2: Verify password was updated**
```sql
SELECT email, updated_at, LENGTH(encrypted_password) as password_length
FROM auth.users 
WHERE id = 'YOUR_USER_ID';
```
- `password_length` should be around 60 characters
- `updated_at` should be recent

**Check 3: Clear browser cache**
- Log out completely
- Clear cookies for your domain
- Try in incognito/private window

---

## 📧 Alternative: Create a New Account

If password reset doesn't work, you can create a new account:

1. Go to: https://starpath-seven.vercel.app/signup
2. Use a different email (or add +test to your email: `youremail+test@gmail.com`)
3. Sign up with new credentials

**This works immediately!**

---

## 🔧 Optional: Delete Old Account

If you create a new account and want to remove the old one:

```sql
-- First, find the user ID
SELECT id, email FROM auth.users WHERE email = 'old@email.com';

-- Delete the user (replace with actual ID)
DELETE FROM auth.users WHERE id = 'OLD_USER_ID';
```

---

## 📝 Summary

**Quick Steps:**
1. Go to SQL Editor
2. Find your user ID
3. Run UPDATE query with your new password
4. Log in with new password

**Time Required:** 2-3 minutes

**Security:** Fully secure (bcrypt hashing)

---

## 💡 Pro Tip: Save Your Password

After resetting:
1. Write down your password
2. Or use a password manager (1Password, Bitwarden, LastPass)
3. This prevents future lockouts

---

## 🎯 Need Help?

If you're stuck:
1. Copy the error message
2. Share which step failed
3. I'll help you debug

**You can also just create a new account - that's the fastest solution!**

---

**Choose your path:**
- **Option A**: Reset password via SQL (2 min)
- **Option B**: Create new account (1 min)

Both work perfectly! 🚀
