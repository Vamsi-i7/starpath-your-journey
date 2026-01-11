#!/bin/bash
# Deploy Edge Functions with New Security Middleware
# Run this script to deploy all edge functions with security enhancements

set -e

echo "🚀 Deploying Edge Functions with Security Enhancements..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found!${NC}"
    echo "Install it with: npm install -g supabase"
    echo "Or use npx: npx supabase functions deploy"
    exit 1
fi

# Check if logged in
echo -e "${BLUE}📋 Checking Supabase authentication...${NC}"
supabase projects list || {
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo "Run: supabase login"
    exit 1
}

# Deploy AI Generate Function
echo -e "${BLUE}📦 Deploying ai-generate function...${NC}"
supabase functions deploy ai-generate \
    --project-ref YOUR_PROJECT_REF \
    --no-verify-jwt || echo "❌ Failed to deploy ai-generate"

# Deploy AI Coach Function
echo -e "${BLUE}📦 Deploying ai-coach function...${NC}"
supabase functions deploy ai-coach \
    --project-ref YOUR_PROJECT_REF \
    --no-verify-jwt || echo "❌ Failed to deploy ai-coach"

# Deploy Razorpay Webhook
echo -e "${BLUE}📦 Deploying razorpay-webhook function...${NC}"
supabase functions deploy razorpay-webhook \
    --project-ref YOUR_PROJECT_REF \
    --no-verify-jwt || echo "❌ Failed to deploy razorpay-webhook"

# Deploy Create Razorpay Order
echo -e "${BLUE}📦 Deploying create-razorpay-order function...${NC}"
supabase functions deploy create-razorpay-order \
    --project-ref YOUR_PROJECT_REF \
    --no-verify-jwt || echo "❌ Failed to deploy create-razorpay-order"

# Deploy Verify Razorpay Payment
echo -e "${BLUE}📦 Deploying verify-razorpay-payment function...${NC}"
supabase functions deploy verify-razorpay-payment \
    --project-ref YOUR_PROJECT_REF \
    --no-verify-jwt || echo "❌ Failed to deploy verify-razorpay-payment"

# Deploy Delete User
echo -e "${BLUE}📦 Deploying delete-user function...${NC}"
supabase functions deploy delete-user \
    --project-ref YOUR_PROJECT_REF \
    --no-verify-jwt || echo "❌ Failed to deploy delete-user"

# Deploy Check User Exists
echo -e "${BLUE}📦 Deploying check-user-exists function...${NC}"
supabase functions deploy check-user-exists \
    --project-ref YOUR_PROJECT_REF \
    --no-verify-jwt || echo "❌ Failed to deploy check-user-exists"

echo ""
echo -e "${GREEN}✅ Edge Functions Deployment Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "1. Verify functions are running: supabase functions list"
echo "2. Check logs: supabase functions logs <function-name>"
echo "3. Test endpoints with authentication"
echo ""
echo "🔧 Set Environment Secrets:"
echo "supabase secrets set OPENROUTER_API_KEY=your_key"
echo "supabase secrets set RAZORPAY_KEY_SECRET=your_secret"
echo "supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret"
echo "supabase secrets set ALLOWED_ORIGINS=https://starpath.app"
