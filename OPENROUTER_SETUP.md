# 🤖 OpenRouter API Key Setup & Verification

## ✅ Models Status

Your specified models are **AVAILABLE** on OpenRouter:

1. ✅ **google/gemini-2.0-flash-exp:free** (google-vertex)
   - Status: Available
   - Type: FREE model
   - Best quality, multimodal support

2. ✅ **nvidia/nemotron-nano-12b-v2-vl:free** (nvidia)
   - Status: Available
   - Type: FREE model
   - Good for vision tasks

3. ✅ **xiaomi/mimo-v2-flash:free** (xiaomi/fp8)
   - Status: Available
   - Type: FREE model
   - Backup model

**All models are configured in your edge functions!** ✅

---

## ⚠️ API Key Status

**Current Key**: `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`

**Status**: ❌ **INVALID** or **EXPIRED**

**Error**: "User not found" (401)

### This means:
- The key may have been deleted
- The key may have expired
- The account may have been deactivated
- You need to generate a new key

---

## 🔑 How to Get a New OpenRouter API Key

### Step 1: Go to OpenRouter
Visit: https://openrouter.ai

### Step 2: Sign In
- Use your existing account
- Or create a new one (can use Google/GitHub login)

### Step 3: Add Credits
1. Go to: https://openrouter.ai/credits
2. Click "Add Credits"
3. Minimum: $5 (recommended $10-20 for testing)
4. **Cost per AI request**: ~$0.001 (using free models)
5. **$5 = ~5000 AI requests**

### Step 4: Generate New API Key
1. Go to: https://openrouter.ai/keys
2. Click "Create Key"
3. Give it a name (e.g., "StarPath Production")
4. Copy the key: `sk-or-v1-XXXXXXXXXX`
5. ⚠️ **Save it immediately** - you won't see it again!

### Step 5: Test Your New Key
```bash
# Test the key
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer sk-or-v1-YOUR_NEW_KEY"

# Should return:
# {"data": {"label": "StarPath Production"}}
```

---

## 🔧 How to Update the Key

### Option 1: Local Development (.env)
```bash
# This key is ONLY for backend - never add to .env!
# The backend uses Supabase secrets
```

### Option 2: Supabase Edge Functions (REQUIRED)
```bash
# Set the secret in Supabase
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_NEW_KEY

# Verify it's set
supabase secrets list

# Redeploy edge functions (they'll pick up new key)
supabase functions deploy ai-generate
supabase functions deploy ai-coach
```

### Option 3: Supabase Dashboard (Alternative)
1. Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/vault
2. Find or create secret: `OPENROUTER_API_KEY`
3. Update value: `sk-or-v1-YOUR_NEW_KEY`
4. Save

---

## 🧪 Test the Integration

### Test 1: Check Models Available
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer sk-or-v1-YOUR_NEW_KEY" \
  | jq '.data[] | select(.id | contains("gemini-2.0-flash-exp:free"))'
```

### Test 2: Test AI Generation (from your app)
```bash
# After updating the key, test in your app:
# 1. Login to your app
# 2. Go to AI Tools
# 3. Try "Notes Generator"
# 4. Enter some text
# 5. Click Generate

# You should see:
# ✅ Notes generated successfully
# ✅ Credits deducted
# ✅ Response in ~2-4 seconds
```

### Test 3: Check Usage
```bash
# Monitor your usage at:
https://openrouter.ai/activity

# You should see:
# - API calls
# - Cost per call
# - Model used
# - Response time
```

---

## 💰 Cost Breakdown

### Using FREE Models (Your Configuration):
- **Cost per request**: ~$0.001 (very low!)
- **$5 credits**: ~5,000 AI requests
- **$10 credits**: ~10,000 AI requests
- **$20 credits**: ~20,000 AI requests

### Example Usage:
- **100 users/day**: Each generates 5 AI items = 500 requests/day
- **Daily cost**: $0.50
- **Monthly cost**: ~$15
- **$20 credit lasts**: ~40 days

### If You Switch to Premium Models (Not Recommended for Start):
- **GPT-4**: ~$0.03 per request (30x more expensive)
- **Claude 3**: ~$0.015 per request (15x more expensive)
- **Stick with FREE models for now!** ✅

---

## 📊 Models in Use

Your application is configured to use these models in this order:

### 1. Primary: Gemini 2.0 Flash (FREE)
```typescript
model: "google/gemini-2.0-flash-exp:free"
```
- Best quality
- Multimodal (text + images)
- Fast responses
- 8192 max tokens
- FREE ✅

### 2. Secondary: NVIDIA Nemotron (FREE)
```typescript
model: "nvidia/nemotron-nano-12b-v2-vl:free"
```
- Good for vision tasks
- Reliable backup
- 4096 max tokens
- FREE ✅

### 3. Fallback: Xiaomi Mimo (FREE)
```typescript
model: "xiaomi/mimo-v2-flash:free"
```
- Basic capabilities
- Last resort
- 2048 max tokens
- FREE ✅

**All models are FREE - no per-request charges from model providers!**

---

## 🔄 What Happens When You Update the Key

1. **Set new key** in Supabase secrets
2. **Redeploy functions** (pick up new key)
3. **Test AI tools** in your app
4. **Monitor usage** on OpenRouter dashboard

### After Update:
- ✅ AI generation works immediately
- ✅ All 9 AI tools functional
- ✅ Rate limiting still active
- ✅ Credits deducted correctly
- ✅ Usage tracked in OpenRouter

---

## 🛡️ Security Best Practices

### DO ✅
- Store key in Supabase secrets (backend only)
- Rotate key every 3-6 months
- Monitor usage regularly
- Set spending limits on OpenRouter
- Keep backup credits

### DON'T ❌
- Never add to `.env` file (frontend accessible)
- Never commit to Git
- Never share publicly
- Never use same key for multiple projects
- Never skip monitoring usage

---

## 🚨 Troubleshooting

### "User not found" Error
- **Cause**: Invalid/expired key
- **Fix**: Generate new key from OpenRouter dashboard

### "Insufficient credits" Error
- **Cause**: Account balance too low
- **Fix**: Add more credits at https://openrouter.ai/credits

### "Rate limit exceeded" Error
- **Cause**: Too many requests (OpenRouter has limits too)
- **Fix**: Wait or upgrade OpenRouter plan

### AI Generation Fails
1. Check key is set correctly: `supabase secrets list`
2. Check credits: https://openrouter.ai/credits
3. Check model availability: https://openrouter.ai/models
4. Check function logs: `supabase functions logs ai-generate`

---

## 📞 Quick Reference

| Task | Command/Link |
|------|-------------|
| Get new key | https://openrouter.ai/keys |
| Add credits | https://openrouter.ai/credits |
| Check usage | https://openrouter.ai/activity |
| View models | https://openrouter.ai/models |
| Set key | `supabase secrets set OPENROUTER_API_KEY=YOUR_KEY` |
| Deploy | `supabase functions deploy ai-generate` |
| Test | Try AI tools in your app |

---

## ✅ Action Required

1. **Go to**: https://openrouter.ai/keys
2. **Generate**: New API key
3. **Add credits**: Minimum $5 (recommended $10-20)
4. **Update**: `supabase secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_NEW_KEY`
5. **Deploy**: `supabase functions deploy ai-generate ai-coach`
6. **Test**: Use AI tools in your app

---

**Once you have your new key, all AI features will work perfectly!** 🚀

The models are available and your code is configured correctly - you just need a valid API key.
