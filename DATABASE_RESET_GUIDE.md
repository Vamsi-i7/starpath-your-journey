# 🗑️ Database Reset Guide

## ⚠️ WARNING: This Deletes ALL Data Permanently!

This guide helps you reset your StarPath database to a completely fresh state.

---

## 📋 What Gets Deleted

### ❌ All User Data:
- All user accounts and login credentials
- All profiles and personal information
- All habits and completions
- All goals and tasks
- All session history
- All friendships and social connections
- All messages and chats
- All AI library content
- All payment records
- All subscriptions
- All achievements progress (unlocked achievements)
- All notifications

### ✅ What Stays:
- Database structure (tables, columns, types)
- RLS policies (security rules)
- Edge functions
- Predefined achievement templates
- Database migrations history

---

## 🚀 How to Reset Database

### Step 1: Go to SQL Editor

**URL:** https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID/sql/new

1. Click "New Query" if needed
2. You'll see a blank SQL editor

---

### Step 2: Copy the Reset Script

**Open:** `RESET_DATABASE.sql` file in your project

**Copy the entire file contents** (all SQL queries)

---

### Step 3: Paste and Execute

1. **Paste** the SQL into the Supabase SQL editor
2. **Review** the queries (make absolutely sure!)
3. **Click "Run"** or press `Ctrl/Cmd + Enter`
4. **Wait** for execution (2-5 seconds)

**You'll see:** `Success. X rows affected` messages

---

### Step 4: Verify Everything is Deleted

The script includes a verification query at the end.

**Expected Output:**
```
Users: 0
Profiles: 0
Habits: 0
Goals: 0
Sessions: 0
Friendships: 0
Messages: 0
Library: 0
Payments: 0
Subscriptions: 0
```

✅ **All counts should be 0!**

---

### Step 5: Create New Account

1. Go to: https://starpath-seven.vercel.app/signup
2. Sign up with your email
3. Create new password
4. Start fresh!

---

## 🔒 Security & Safety

### Is This Safe?
✅ **YES** - when done intentionally:
- Only deletes data, not structure
- Preserves all database schemas
- Keeps RLS policies intact
- Edge functions unaffected
- Can immediately create new accounts

### Can I Undo This?
❌ **NO** - This is permanent:
- All data is deleted forever
- No backup unless you created one manually
- Cannot recover deleted users or data

### Should I Backup First?
If you have ANY data you want to keep:

**Backup Method 1: Export Users**
```sql
-- Copy this data before resetting
SELECT * FROM auth.users;
SELECT * FROM profiles;
```

**Backup Method 2: Supabase Dashboard**
1. Go to: Table Editor
2. Export each table to CSV
3. Save locally

---

## 🎯 When to Use This

### ✅ Good Reasons to Reset:
- Testing and development
- Starting fresh after experimentation
- Removing test data before production launch
- Forgot password and locked out (easier than password reset)
- Want to clean up messy test accounts

### ❌ Don't Reset If:
- You have real user data
- App is in production with active users
- You haven't backed up important data
- You just want to delete ONE user (use targeted DELETE instead)

---

## 🔧 Alternative: Delete Specific User Only

If you just want to delete ONE user (not everything):

```sql
-- Replace with actual email
DELETE FROM auth.users WHERE email = 'user@example.com';

-- This will CASCADE delete their data:
-- profiles, habits, goals, sessions, etc. (thanks to foreign keys)
```

This is safer than nuking the entire database!

---

## 📊 What Happens After Reset

### Immediate Effects:
1. ✅ All user sessions logged out
2. ✅ All data cleared
3. ✅ Database ready for new signups
4. ✅ App still works (structure intact)

### What You Can Do:
1. ✅ Sign up immediately
2. ✅ Create new habits
3. ✅ Test all features
4. ✅ Fresh start!

### What Doesn't Change:
1. ✅ Your app is still deployed
2. ✅ Edge functions still work
3. ✅ Environment variables unchanged
4. ✅ Vercel deployment unaffected

---

## 🐛 Troubleshooting

### Error: "permission denied for table auth.users"

**Cause:** Not using service role

**Fix:** 
- Make sure you're in Supabase Dashboard SQL Editor
- Dashboard has correct permissions automatically
- Don't run from your app code

---

### Error: "update or delete violates foreign key constraint"

**Cause:** Deletion order is wrong

**Fix:**
- Use the provided `RESET_DATABASE.sql` script
- It deletes in correct order (child tables first)
- Foreign keys are respected

---

### Some Data Not Deleted

**Check:**
```sql
-- See what's still there
SELECT 'Users:', COUNT(*) FROM auth.users;
SELECT 'Profiles:', COUNT(*) FROM profiles;
```

**Fix:**
- Run the script again
- Or delete specific tables manually

---

### Want to Keep Achievement Templates

**Good news:**
- The reset script doesn't delete the `achievements` table
- This table has 93 predefined achievements
- They're templates, not user data
- Safe to keep!

If you accidentally deleted them, re-run the migration:
```bash
# Run migration that creates achievements
npx supabase db reset
```

---

## 🎓 Technical Details

### Delete Order (Important!)

The script deletes in this order:
1. **Leaf nodes first** (tables with no dependencies)
2. **Then parent tables**
3. **Finally auth.users** (root of all user data)

Example:
```
habit_completions (child) → habits (parent) → profiles → auth.users
```

### Foreign Key Cascades

Some tables have `ON DELETE CASCADE`:
- When you delete a user, their profile auto-deletes
- When you delete a habit, completions auto-delete

But it's safer to explicitly delete in order.

### Why Delete auth.users Last?

`auth.users` is the root table:
- All other tables reference it via `user_id`
- If you delete it first, you get foreign key errors
- Deleting it last ensures clean deletion

---

## 📝 Quick Reference

### Full Reset (Everything)
```bash
# Run RESET_DATABASE.sql in Supabase SQL Editor
```

### Delete One User
```sql
DELETE FROM auth.users WHERE email = 'user@example.com';
```

### Check Counts
```sql
SELECT 'Users:', COUNT(*) FROM auth.users;
SELECT 'Profiles:', COUNT(*) FROM profiles;
SELECT 'Habits:', COUNT(*) FROM habits;
```

### Verify Empty
```sql
SELECT COUNT(*) FROM auth.users; -- Should be 0
```

---

## ⏱️ Time Required

- **Reading this guide:** 5 minutes
- **Executing reset:** 30 seconds
- **Verifying:** 30 seconds
- **Creating new account:** 1 minute

**Total:** ~7 minutes

---

## 🎯 Summary

**To reset database completely:**

1. ✅ Open SQL Editor
2. ✅ Paste RESET_DATABASE.sql
3. ✅ Run the script
4. ✅ Verify all counts = 0
5. ✅ Sign up as new user

**Simple, fast, effective!**

---

## ⚠️ Final Warning

**Before you click "Run":**

- [ ] I understand this deletes ALL data
- [ ] I have backed up anything important
- [ ] I want to start completely fresh
- [ ] I'm ready to create a new account

**If all checkboxes = YES, proceed!**

---

**Need help? Let me know before running the reset!** 🚨
