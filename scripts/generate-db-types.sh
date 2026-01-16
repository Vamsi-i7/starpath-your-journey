#!/bin/bash

# ============================================================================
# Generate TypeScript types from Supabase database schema
# This ensures type safety between frontend code and database
# ============================================================================

set -e

echo "🔧 Generating TypeScript types from database schema..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if we're using local or remote database
if [ -f ".env.local" ]; then
    echo "📡 Using local Supabase instance..."
    supabase gen types typescript --local > src/types/database.generated.ts
elif [ -n "$VITE_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "☁️  Using remote Supabase instance..."
    supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > src/types/database.generated.ts
else
    echo "⚠️  No Supabase connection found. Using schema introspection..."
    
    # Fallback: Generate types from FINAL_DATABASE_SCHEMA.sql
    echo "📝 Generating types from FINAL_DATABASE_SCHEMA.sql..."
    node scripts/schema-to-types.js
fi

echo "✅ Types generated at: src/types/database.generated.ts"
echo ""
echo "💡 Usage:"
echo "   import { Database } from '@/types/database.generated';"
echo "   import { supabase } from '@/integrations/supabase/safeClient';"
echo ""
echo "   const { data } = await supabase"
echo "     .from('tasks')"
echo "     .select('*')"
echo "     .returns<Database['public']['Tables']['tasks']['Row'][]>();"
echo ""
echo "🎉 Done!"
