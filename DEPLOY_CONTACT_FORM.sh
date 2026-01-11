#!/bin/bash

# Contact Form Deployment Script
# This script sets up Resend email integration and deploys the contact-us function

echo "======================================"
echo "Contact Form Email Setup & Deployment"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if Supabase CLI is installed
echo "Step 1: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Step 2: Check if logged in to Supabase
echo "Step 2: Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Supabase${NC}"
    echo "Please run: supabase login"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated with Supabase${NC}"
echo ""

# Step 3: Apply database migration
echo "Step 3: Applying database migration..."
echo "This creates the contact_submissions table..."
if supabase db push; then
    echo -e "${GREEN}✓ Database migration applied${NC}"
else
    echo -e "${RED}✗ Failed to apply migration${NC}"
    echo "You may need to link your project first:"
    echo "supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi
echo ""

# Step 4: Set Resend API key
echo "Step 4: Setting Resend API key..."
if supabase secrets set RESEND_API_KEY=re_WJmjMH5q_CkCAEkxNZDkGmAd7SRZSgn3c; then
    echo -e "${GREEN}✓ RESEND_API_KEY set${NC}"
else
    echo -e "${RED}✗ Failed to set RESEND_API_KEY${NC}"
    exit 1
fi
echo ""

# Step 5: Set admin email
echo "Step 5: Setting admin email..."
if supabase secrets set ADMIN_EMAIL=clawzer96@gmail.com; then
    echo -e "${GREEN}✓ ADMIN_EMAIL set${NC}"
else
    echo -e "${RED}✗ Failed to set ADMIN_EMAIL${NC}"
    exit 1
fi
echo ""

# Step 6: Set email from address
echo "Step 6: Setting email from address..."
if supabase secrets set EMAIL_FROM="StarPath <onboarding@resend.dev>"; then
    echo -e "${GREEN}✓ EMAIL_FROM set${NC}"
else
    echo -e "${RED}✗ Failed to set EMAIL_FROM${NC}"
    exit 1
fi
echo ""

# Step 7: Deploy contact-us function
echo "Step 7: Deploying contact-us edge function..."
if supabase functions deploy contact-us; then
    echo -e "${GREEN}✓ contact-us function deployed${NC}"
else
    echo -e "${RED}✗ Failed to deploy function${NC}"
    exit 1
fi
echo ""

# Success!
echo "======================================"
echo -e "${GREEN}✓ Contact Form Setup Complete!${NC}"
echo "======================================"
echo ""
echo "What was configured:"
echo "  ✓ Database table: contact_submissions"
echo "  ✓ Resend API key: re_WJmj...Sgn3c"
echo "  ✓ Admin email: clawzer96@gmail.com"
echo "  ✓ Email from: StarPath <onboarding@resend.dev>"
echo "  ✓ Edge function: contact-us deployed"
echo ""
echo "Next steps:"
echo "  1. Test the contact form at: /app/contact"
echo "  2. Check email delivery in Resend dashboard"
echo "  3. View submissions in Supabase database"
echo ""
echo "To verify deployment:"
echo "  supabase functions list"
echo "  supabase secrets list"
echo ""
echo "To view logs:"
echo "  supabase functions logs contact-us"
echo ""
