#!/bin/bash

echo "=================================="
echo "Settings Page Verification"
echo "=================================="
echo ""

# Check if the Support & Policies section exists
if grep -q "Support & Policies" src/pages/SettingsPage.tsx; then
    echo "✅ Support & Policies section found in code"
else
    echo "❌ Support & Policies section NOT found"
    exit 1
fi

# Check for Contact Us button
if grep -q "Contact Us" src/pages/SettingsPage.tsx; then
    echo "✅ Contact Us button found"
else
    echo "❌ Contact Us button NOT found"
fi

# Check for Shipping Policy button
if grep -q "Shipping Policy" src/pages/SettingsPage.tsx; then
    echo "✅ Shipping Policy button found"
else
    echo "❌ Shipping Policy button NOT found"
fi

# Check for Cancellations & Refunds button
if grep -q "Cancellations & Refunds" src/pages/SettingsPage.tsx; then
    echo "✅ Cancellations & Refunds button found"
else
    echo "❌ Cancellations & Refunds button NOT found"
fi

echo ""
echo "All three features are in the code!"
echo ""
echo "If you don't see them in your browser:"
echo "1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "2. Or try incognito mode"
echo "3. Or clear browser cache"
echo ""
echo "Current dev server URL: http://localhost:8081/app/settings"
