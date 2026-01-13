#!/bin/bash
# Pre-push check to catch issues before CI/CD
# Add to .git/hooks/pre-push for automatic checking

set -e

echo "🔍 Running pre-push checks..."

# Check if tsx is installed
if ! npm list tsx &> /dev/null; then
    echo "❌ tsx is not installed. Installing..."
    npm install --save-dev tsx
fi

# Run type check
echo "📝 Type checking..."
npx tsc --noEmit

# Run linter
echo "🎨 Linting code..."
npm run lint || true

# Check for schema changes
if git diff --cached --name-only | grep -qE "(supabase/migrations|scripts/validate-schema.ts)"; then
    echo "⚠️  Schema changes detected. Running schema validation..."
    
    if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        echo "⚠️  Supabase credentials not set. Skipping schema validation."
        echo "   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to validate."
    else
        npm run schema:validate || {
            echo "❌ Schema validation failed!"
            echo "   Fix schema issues before pushing."
            exit 1
        }
    fi
fi

# Run unit tests
echo "🧪 Running unit tests..."
npm run test:unit || {
    echo "❌ Unit tests failed!"
    echo "   Fix tests before pushing."
    exit 1
}

echo "✅ All pre-push checks passed!"
