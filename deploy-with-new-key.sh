#!/bin/bash
# Deploy Edge Functions with New OpenRouter API Key

set -e

echo "🚀 Deploying Edge Functions with New API Key"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# New OpenRouter API Key
OPENROUTER_KEY="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"

echo -e "${BLUE}📋 Step 1: Setting OpenRouter API Key in Supabase Secrets${NC}"
echo "Key: sk-or-v1-b2b...c5b"
supabase secrets set OPENROUTER_API_KEY="$OPENROUTER_KEY"
echo -e "${GREEN}✅ API Key set successfully!${NC}"
echo ""

echo -e "${BLUE}📋 Step 2: Verifying other required secrets${NC}"
echo "Checking existing secrets..."
supabase secrets list
echo ""

echo -e "${BLUE}📋 Step 3: Deploying AI Generate Function${NC}"
supabase functions deploy ai-generate --no-verify-jwt
echo -e "${GREEN}✅ ai-generate deployed!${NC}"
echo ""

echo -e "${BLUE}📋 Step 4: Deploying AI Coach Function${NC}"
supabase functions deploy ai-coach --no-verify-jwt
echo -e "${GREEN}✅ ai-coach deployed!${NC}"
echo ""

echo -e "${BLUE}📋 Step 5: Deploying Payment Functions${NC}"
supabase functions deploy razorpay-webhook --no-verify-jwt
supabase functions deploy create-razorpay-order --no-verify-jwt
supabase functions deploy verify-razorpay-payment --no-verify-jwt
echo -e "${GREEN}✅ Payment functions deployed!${NC}"
echo ""

echo -e "${BLUE}📋 Step 6: Deploying Utility Functions${NC}"
supabase functions deploy delete-user --no-verify-jwt
supabase functions deploy check-user-exists --no-verify-jwt
echo -e "${GREEN}✅ Utility functions deployed!${NC}"
echo ""

echo -e "${GREEN}🎉 All Edge Functions Deployed Successfully!${NC}"
echo ""
echo "📊 Deployment Summary:"
echo "  ✅ OpenRouter API Key: Updated"
echo "  ✅ AI Generate: Deployed (with optimized FREE models)"
echo "  ✅ AI Coach: Deployed (with DeepSeek R1)"
echo "  ✅ Payment Functions: Deployed (3)"
echo "  ✅ Utility Functions: Deployed (2)"
echo ""
echo "🧪 Next Steps:"
echo "  1. Test AI tools in your app"
echo "  2. Check function logs: supabase functions logs ai-generate"
echo "  3. Monitor usage at: https://openrouter.ai/activity"
echo ""
echo "💰 Cost: $0.00 (using 100% FREE models)"
echo ""
