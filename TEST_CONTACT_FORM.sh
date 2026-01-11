#!/bin/bash

# Contact Form Testing Script
# This script tests the contact form with the Resend integration

echo "======================================"
echo "Testing Contact Form with Resend"
echo "======================================"
echo ""

# Get Supabase URL from environment or prompt
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "Enter your Supabase URL (e.g., https://xxx.supabase.co):"
    read SUPABASE_URL
else
    SUPABASE_URL=$VITE_SUPABASE_URL
fi

# Get anon key
if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "Enter your Supabase anon key:"
    read ANON_KEY
else
    ANON_KEY=$VITE_SUPABASE_ANON_KEY
fi

echo ""
echo "Testing contact-us function at: $SUPABASE_URL"
echo ""

# Test payload
TEST_PAYLOAD='{
  "name": "Test User",
  "email": "test@example.com",
  "subject": "Test Contact Form with Resend",
  "message": "This is a test message to verify the Resend integration is working correctly. If you receive this email at clawzer96@gmail.com, the integration is successful!",
  "userId": null
}'

echo "Sending test request..."
echo ""

# Send request
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/contact-us" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$TEST_PAYLOAD")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✓ Contact form submission successful!"
    echo ""
    echo "Next steps:"
    echo "  1. Check clawzer96@gmail.com inbox for test email"
    echo "  2. Check spam folder if not in inbox"
    echo "  3. Verify email formatting and content"
    echo "  4. Check Supabase database for submission entry"
    echo ""
    echo "To view database entries:"
    echo "  SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 5;"
    echo ""
    echo "To view function logs:"
    echo "  supabase functions logs contact-us"
else
    echo "✗ Contact form submission failed"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verify Resend API key is set: supabase secrets list"
    echo "  2. Check function is deployed: supabase functions list"
    echo "  3. View error logs: supabase functions logs contact-us"
    echo "  4. Verify database migration applied"
fi
echo ""
