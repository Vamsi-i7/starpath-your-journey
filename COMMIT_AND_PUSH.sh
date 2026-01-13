#!/bin/bash

echo "🧹 Cleaning up workflows..."
echo ""

# Show what's being done
echo "📋 Changes to commit:"
echo "  ✅ New file: .github/workflows/ci.yml (clean, single workflow)"
echo "  ✅ New file: WORKFLOWS_RESET.md (documentation)"
echo "  ❌ Deleted: 4 old workflow files"
echo ""

# Add all changes
git add .

# Commit
git commit -m "chore: Reset workflows - single clean CI/CD pipeline

- Deleted 4 redundant workflows
- Created single ci.yml with 5 jobs
- Cleaner Actions tab (1 workflow instead of 4)
- All checks in one place
- Integration tests skipped (as intended)"

echo ""
echo "✅ Committed!"
echo ""
echo "🚀 Pushing to GitHub..."

# Push
git push origin main

echo ""
echo "✅ DONE!"
echo ""
echo "📊 Next steps:"
echo "1. Go to: https://github.com/YOUR-USERNAME/YOUR-REPO/actions"
echo "2. Watch the new 'CI/CD Pipeline' workflow run"
echo "3. See all 5 jobs in one clean workflow"
echo ""
echo "🎉 Your CI/CD is now clean and simple!"
