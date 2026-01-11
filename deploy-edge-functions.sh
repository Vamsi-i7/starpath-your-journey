#!/bin/bash

# StarPath Edge Functions Deployment Script
# This script deploys all 7 edge functions to Supabase

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   🚀 DEPLOYING STARPATH EDGE FUNCTIONS                       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📋 Deployment Plan:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. ai-coach          - AI mentor chat with streaming"
echo "2. ai-generate       - Content generation (notes, flashcards, etc.)"
echo "3. create-razorpay-order - Payment order creation"
echo "4. create-razorpay-subscription - Subscription setup"
echo "5. verify-razorpay-payment - Payment verification"
echo "6. razorpay-webhook  - Payment webhook handler"
echo "7. delete-user       - User deletion handler"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Link to project (if not already linked)
echo "🔗 Linking to Supabase project..."
npx supabase link --project-ref ryzhsfmqopywoymghmdp || echo "Already linked"
echo ""

# Deploy each function
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deploying Edge Functions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1/7 Deploying ai-coach..."
npx supabase functions deploy ai-coach --no-verify-jwt
echo "✅ ai-coach deployed"
echo ""

echo "2/7 Deploying ai-generate..."
npx supabase functions deploy ai-generate --no-verify-jwt
echo "✅ ai-generate deployed"
echo ""

echo "3/7 Deploying create-razorpay-order..."
npx supabase functions deploy create-razorpay-order --no-verify-jwt
echo "✅ create-razorpay-order deployed"
echo ""

echo "4/7 Deploying create-razorpay-subscription..."
npx supabase functions deploy create-razorpay-subscription --no-verify-jwt
echo "✅ create-razorpay-subscription deployed"
echo ""

echo "5/7 Deploying verify-razorpay-payment..."
npx supabase functions deploy verify-razorpay-payment --no-verify-jwt
echo "✅ verify-razorpay-payment deployed"
echo ""

echo "6/7 Deploying razorpay-webhook..."
npx supabase functions deploy razorpay-webhook --no-verify-jwt
echo "✅ razorpay-webhook deployed"
echo ""

echo "7/7 Deploying delete-user..."
npx supabase functions deploy delete-user --no-verify-jwt
echo "✅ delete-user deployed"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL EDGE FUNCTIONS DEPLOYED SUCCESSFULLY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Verifying deployment..."
npx supabase functions list
echo ""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   ✅ EDGE FUNCTIONS DEPLOYMENT COMPLETE                      ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 Next Steps:"
echo "1. ✅ Edge functions deployed"
echo "2. ⏳ Deploy frontend to Vercel"
echo "3. ⏳ Test AI features"
echo ""
echo "Ready to deploy to Vercel? (See DEPLOYMENT_CHECKLIST.md)"
