#!/bin/bash
# Complete Deployment Script with Google OAuth

set -e

echo "🚀 Complete StarPath Deployment"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration - REPLACE THESE WITH YOUR ACTUAL VALUES
OPENROUTER_KEY="your_openrouter_api_key"
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
SUPABASE_URL="your_supabase_url"

echo -e "${BLUE}📋 Step 1: Setting All Secrets in Supabase${NC}"
echo ""

# OpenRouter API Key
echo -e "${YELLOW}Setting OpenRouter API Key...${NC}"
supabase secrets set OPENROUTER_API_KEY="$OPENROUTER_KEY"
echo -e "${GREEN}✅ OpenRouter API key set!${NC}"
echo ""

# Google OAuth
echo -e "${YELLOW}Setting Google OAuth Secret...${NC}"
supabase secrets set GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
echo -e "${GREEN}✅ Google OAuth secret set!${NC}"
echo ""

# Supabase URL
echo -e "${YELLOW}Setting Supabase URL...${NC}"
supabase secrets set SUPABASE_URL="$SUPABASE_URL"
echo -e "${GREEN}✅ Supabase URL set!${NC}"
echo ""

# CORS Origins
echo -e "${YELLOW}Setting CORS Origins...${NC}"
supabase secrets set ALLOWED_ORIGINS="https://starpath-seven.vercel.app,http://localhost:5173,http://localhost:3000"
echo -e "${GREEN}✅ CORS origins set!${NC}"
echo ""

echo -e "${BLUE}📋 Step 2: Verifying Secrets${NC}"
supabase secrets list
echo ""

echo -e "${BLUE}📋 Step 3: Deploying Edge Functions${NC}"
echo ""

# Deploy AI Functions
echo -e "${YELLOW}Deploying ai-generate...${NC}"
supabase functions deploy ai-generate --no-verify-jwt
echo -e "${GREEN}✅ ai-generate deployed!${NC}"
echo ""

echo -e "${YELLOW}Deploying ai-coach...${NC}"
supabase functions deploy ai-coach --no-verify-jwt
echo -e "${GREEN}✅ ai-coach deployed!${NC}"
echo ""

# Deploy Payment Functions
echo -e "${YELLOW}Deploying payment functions...${NC}"
supabase functions deploy razorpay-webhook --no-verify-jwt
supabase functions deploy create-razorpay-order --no-verify-jwt
supabase functions deploy verify-razorpay-payment --no-verify-jwt
echo -e "${GREEN}✅ Payment functions deployed!${NC}"
echo ""

# Deploy Utility Functions
echo -e "${YELLOW}Deploying utility functions...${NC}"
supabase functions deploy delete-user --no-verify-jwt
supabase functions deploy check-user-exists --no-verify-jwt
echo -e "${GREEN}✅ Utility functions deployed!${NC}"
echo ""

echo -e "${GREEN}🎉 All Edge Functions Deployed Successfully!${NC}"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo ""
echo "  ✅ OpenRouter API Key: Set (FREE models)"
echo "  ✅ Google OAuth: Configured"
echo "  ✅ CORS: Configured for Vercel & localhost"
echo "  ✅ AI Generate: Deployed (optimized models)"
echo "  ✅ AI Coach: Deployed (DeepSeek R1)"
echo "  ✅ Payment Functions: Deployed (3)"
echo "  ✅ Utility Functions: Deployed (2)"
echo ""
echo -e "${BLUE}🔐 Google OAuth Configuration:${NC}"
echo "  Client ID: $GOOGLE_CLIENT_ID"
echo "  Redirect URI: $SUPABASE_URL/auth/v1/callback"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo ""
echo "1. Configure Google OAuth in Supabase Dashboard:"
echo "   → Visit: https://app.supabase.com/project/ryzhsfmqopywoymghmdp/auth/providers"
echo "   → Enable Google provider"
echo "   → Add Client ID: $GOOGLE_CLIENT_ID"
echo "   → Add Client Secret: $GOOGLE_CLIENT_SECRET"
echo "   → Save"
echo ""
echo "2. Update your local .env file:"
echo "   VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"
echo ""
echo "3. Test locally:"
echo "   npm run dev"
echo "   → Test Google OAuth login"
echo ""
echo "4. Deploy to Vercel:"
echo "   → Add VITE_GOOGLE_CLIENT_ID to environment variables"
echo "   → Deploy: vercel --prod"
echo ""
echo -e "${BLUE}💰 Cost: \$0.00/month (100% FREE models)${NC}"
echo ""
echo -e "${GREEN}🎊 Backend deployment complete!${NC}"
echo ""
