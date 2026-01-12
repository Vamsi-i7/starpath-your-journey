# 🚨 DATABASE SCHEMA MISMATCH REPORT

**Date**: January 13, 2026  
**Severity**: HIGH  
**Status**: Multiple table name mismatches found

---

## 🎯 CRITICAL FINDINGS

### **Major Issue: Table Name Inconsistencies**

The code references tables with DIFFERENT NAMES than what exists in `FINAL_DATABASE_SCHEMA.sql`:

| Code Uses | Schema Has | Status | Impact |
|-----------|------------|--------|--------|
| `session_history` | `sessions` | ⚠️ **MISMATCH** | Session tracking may fail |
| `library_items` | `ai_library` | ⚠️ **MISMATCH** | AI content storage may fail |
| `credits_usage` | `credit_transactions` | ⚠️ **MISMATCH** | Credit tracking may fail |
| `friends` | `friendships` | ⚠️ **MISMATCH** | Friend feature may fail |
| `friend_requests` | (not found) | ❌ **MISSING** | Friend requests broken |
| `tasks` | `tasks` | ✅ MATCH | Working (after fix) |

---

## 📊 COMPLETE TABLE AUDIT

### Tables Used in Code (32 unique)
```
achievements, activity_comments, activity_feed, activity_likes, 
ai_generation_history, ai_generations, ai_library, avatars, 
chat_groups, credit_transactions, credits, credits_usage, 
daily_challenges, error_logs, friend_challenges, friendships, 
goals, group_members, group_messages, habit_categories, 
habit_completions, habits, library_items, messages, notifications, 
profiles, public_profiles, session_history, subscriptions, tasks, 
user_achievements, user_challenge_progress
```

### Tables in FINAL_DATABASE_SCHEMA.sql (25 unique)
```
achievements, activity_feed, ai_generations, ai_library, 
categories, challenge_participants, challenges, 
credit_transactions, credits, daily_challenges, friendships, 
goals, habit_completions, habits, notifications, payments, 
profiles, razorpay_subscriptions, sessions, subscriptions, 
tasks, user_achievements, user_challenge_progress, 
user_razorpay_customers
```

---

## ❌ CRITICAL MISMATCHES

### 1. **session_history vs sessions**
**Code expects**: `session_history`
```typescript
// src/hooks/useSessionHistory.ts
await supabase.from('session_history').select('*')
```

**Schema has**: `sessions`
```sql
CREATE TABLE IF NOT EXISTS public.sessions (...)
```

**Fix Required**: Rename table OR update code to use `sessions`

---

### 2. **library_items vs ai_library**
**Code expects**: `library_items`
```typescript
// src/hooks/useLibrary.ts
await supabase.from('library_items').select('*')
```

**Schema has**: `ai_library`
```sql
CREATE TABLE IF NOT EXISTS public.ai_library (...)
```

**Fix Required**: Rename table OR update code to use `ai_library`

---

### 3. **credits_usage vs credit_transactions**
**Code expects**: `credits_usage`
```typescript
// src/hooks/useCredits.ts
await supabase.from('credits_usage').insert({...})
```

**Schema has**: `credit_transactions`
```sql
CREATE TABLE IF NOT EXISTS public.credit_transactions (...)
```

**Fix Required**: Rename table OR update code to use `credit_transactions`

---

### 4. **friend_requests - MISSING**
**Code expects**: `friend_requests`
```typescript
// src/hooks/useFriends.ts
await supabase.from('friend_requests').select('*')
```

**Schema has**: ❌ **NOT FOUND**

**Fix Required**: Add `friend_requests` table to schema

---

### 5. **friends vs friendships**
**Code expects**: `friends`
```typescript
// src/hooks/useFriends.ts
await supabase.from('friends').select('*')
```

**Schema has**: `friendships`
```sql
CREATE TABLE IF NOT EXISTS public.friendships (...)
```

**Fix Required**: Update code to use `friendships`

---

## 🔍 ADDITIONAL FINDINGS

### Tables in Code but NOT in Schema
- `activity_comments`
- `activity_likes`
- `ai_generation_history`
- `avatars`
- `chat_groups`
- `error_logs`
- `friend_challenges`
- `group_members`
- `group_messages`
- `habit_categories`
- `messages`
- `public_profiles`

**Status**: These may be:
1. Future features not yet in schema
2. Removed features with leftover code
3. Tables that need to be added to schema

### Tables in Schema but NOT in Code
- `categories`
- `challenge_participants`
- `challenges`
- `payments`
- `razorpay_subscriptions`
- `user_razorpay_customers`

**Status**: These may be:
1. Backend-only tables
2. Unused legacy tables
3. Future features

---

## 💉 RECOMMENDED FIXES

### **Option A: Update Code to Match Schema (RECOMMENDED)**

**Pros**:
- Schema is source of truth
- No database changes needed
- Faster deployment

**Changes Required**:
```typescript
// 1. Update session_history → sessions
// src/hooks/useSessionHistory.ts
- .from('session_history')
+ .from('sessions')

// 2. Update library_items → ai_library
// src/hooks/useLibrary.ts
- .from('library_items')
+ .from('ai_library')

// 3. Update credits_usage → credit_transactions
// src/hooks/useCredits.ts
- .from('credits_usage')
+ .from('credit_transactions')

// 4. Update friends → friendships
// src/hooks/useFriends.ts
- .from('friends')
+ .from('friendships')

// 5. Add friend_requests table to schema
// OR update code to use friendships table with status column
```

### **Option B: Update Schema to Match Code**

**Pros**:
- Code doesn't need changes
- Matches developer expectations

**Cons**:
- Requires database migrations
- Risk if production DB already uses different names

**Changes Required**:
```sql
-- Rename tables in database
ALTER TABLE sessions RENAME TO session_history;
ALTER TABLE ai_library RENAME TO library_items;
ALTER TABLE credit_transactions RENAME TO credits_usage;
ALTER TABLE friendships RENAME TO friends;

-- Add missing table
CREATE TABLE friend_requests (...);
```

---

## 🚀 IMMEDIATE ACTION PLAN

### **Step 1: Verify Actual Database Tables**
Run this SQL to see what's actually in production:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Step 2: Choose Fix Strategy**
- If production DB matches schema → Fix code (Option A)
- If production DB matches code → Fix schema (Option B)
- If mismatch → Need migration

### **Step 3: Implement Fixes**
Based on findings, implement chosen option

### **Step 4: Run Validation**
```bash
npm run schema:validate
npm run test:integration
```

---

## 🧪 TESTING CHECKLIST

After implementing fixes:

- [ ] All database operations succeed
- [ ] Session tracking works
- [ ] Library/AI content saves correctly
- [ ] Credits system works
- [ ] Friend system functional
- [ ] Friend requests work
- [ ] No 404/table not found errors
- [ ] Integration tests pass

---

## 📋 FILES TO UPDATE

### If Option A (Update Code):
1. `src/hooks/useSessionHistory.ts` - Change to `sessions`
2. `src/hooks/useLibrary.ts` - Change to `ai_library`
3. `src/hooks/useCredits.ts` - Change to `credit_transactions`
4. `src/hooks/useFriends.ts` - Change to `friendships`
5. Search codebase for `friend_requests` and fix
6. Update any React Query keys

### If Option B (Update Schema):
1. `FINAL_DATABASE_SCHEMA.sql` - Rename tables
2. Create migration files for renames
3. Add `friend_requests` table

---

## 🔒 PREVENTION

To prevent this in the future:

1. ✅ Run `npm run schema:validate` in CI/CD
2. ✅ Generate TypeScript types from DB: `npm run schema:types`
3. ✅ Run integration tests before deployment
4. ✅ Keep FINAL_DATABASE_SCHEMA.sql as single source of truth
5. ✅ Document table name conventions

---

## 📊 IMPACT ASSESSMENT

### Severity: HIGH

**Affected Features**:
- ❌ Session tracking (if using session_history)
- ❌ AI Library (if using library_items)
- ❌ Credits system (if using credits_usage)
- ❌ Friend system (if using friends/friend_requests)

**User Impact**:
- Features may be completely broken
- Data may not be persisting
- Silent failures possible

**Risk Level**: HIGH - Multiple core features potentially affected

---

## ✅ SUCCESS CRITERIA

Fix is complete when:

1. ✅ All table names consistent between code and schema
2. ✅ `npm run schema:validate` passes
3. ✅ `npm run test:integration` passes
4. ✅ All features working in staging
5. ✅ No console errors about missing tables

---

**🚨 URGENT: Verify production database table names immediately and implement appropriate fixes!**

*Report generated by: Schema Auditor*  
*Date: January 13, 2026*
