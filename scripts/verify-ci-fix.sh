#!/bin/bash
# Verification script to ensure all CI/CD fixes are properly applied

echo "🔍 Verifying CI/CD Fixes..."
echo ""

EXIT_CODE=0

# Check 1: tsx dependency
echo "1️⃣  Checking tsx dependency..."
if npm list tsx &> /dev/null; then
    echo "   ✅ tsx is installed"
else
    echo "   ❌ tsx is NOT installed"
    EXIT_CODE=1
fi

# Check 2: CI workflow exists
echo "2️⃣  Checking CI workflow..."
if [ -f ".github/workflows/ci.yml" ]; then
    echo "   ✅ CI workflow exists"
    
    # Check for integration tests job
    if grep -q "integration-tests:" ".github/workflows/ci.yml"; then
        echo "   ✅ Integration tests job found"
    else
        echo "   ❌ Integration tests job NOT found"
        EXIT_CODE=1
    fi
    
    # Check for environment check
    if grep -q "ci:check-env" ".github/workflows/ci.yml"; then
        echo "   ✅ Environment check found"
    else
        echo "   ❌ Environment check NOT found"
        EXIT_CODE=1
    fi
else
    echo "   ❌ CI workflow NOT found"
    EXIT_CODE=1
fi

# Check 3: Required scripts exist
echo "3️⃣  Checking required scripts..."
REQUIRED_SCRIPTS=(
    "scripts/check-ci-env.ts"
    "scripts/validate-schema.ts"
    "scripts/pre-push-check.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo "   ✅ $script exists"
    else
        echo "   ❌ $script NOT found"
        EXIT_CODE=1
    fi
done

# Check 4: NPM scripts
echo "4️⃣  Checking npm scripts..."
REQUIRED_NPM_SCRIPTS=(
    "schema:validate"
    "test:integration"
    "ci:check-env"
    "test:unit"
)

for npm_script in "${REQUIRED_NPM_SCRIPTS[@]}"; do
    if grep -q "\"$npm_script\":" package.json; then
        echo "   ✅ npm script '$npm_script' found"
    else
        echo "   ❌ npm script '$npm_script' NOT found"
        EXIT_CODE=1
    fi
done

# Check 5: PR template
echo "5️⃣  Checking PR template..."
if [ -f ".github/PULL_REQUEST_TEMPLATE.md" ]; then
    echo "   ✅ PR template exists"
else
    echo "   ❌ PR template NOT found"
    EXIT_CODE=1
fi

# Check 6: PR validation workflow
echo "6️⃣  Checking PR validation workflow..."
if [ -f ".github/workflows/validate-pr.yml" ]; then
    echo "   ✅ PR validation workflow exists"
else
    echo "   ❌ PR validation workflow NOT found"
    EXIT_CODE=1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED!"
    echo "   Your CI/CD pipeline is fully fixed and ready."
    echo ""
    echo "Next steps:"
    echo "1. Commit and push these changes"
    echo "2. Verify GitHub Secrets are set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)"
    echo "3. Watch your CI pipeline succeed! 🎉"
else
    echo "❌ SOME CHECKS FAILED"
    echo "   Please review the errors above."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $EXIT_CODE
