#!/usr/bin/env tsx
/**
 * CI Environment Check Script
 * Validates that all required environment variables and dependencies are present
 */

import { createClient } from '@supabase/supabase-js';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEnvironment() {
  log('blue', '\n╔════════════════════════════════════════╗');
  log('blue', '║   CI ENVIRONMENT CHECK                ║');
  log('blue', '╚════════════════════════════════════════╝\n');

  let hasErrors = false;

  // Check Node version
  log('blue', '1️⃣  Checking Node.js version...');
  console.log(`   Node version: ${process.version}`);
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
  if (nodeVersion >= 18) {
    log('green', '   ✅ Node.js version is compatible\n');
  } else {
    log('red', '   ❌ Node.js version is too old (need 18+)\n');
    hasErrors = true;
  }

  // Check environment variables
  log('blue', '2️⃣  Checking environment variables...');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl) {
    log('green', `   ✅ VITE_SUPABASE_URL is set (length: ${supabaseUrl.length})`);
  } else {
    log('red', '   ❌ VITE_SUPABASE_URL is not set');
    hasErrors = true;
  }

  if (supabaseKey) {
    log('green', `   ✅ VITE_SUPABASE_ANON_KEY is set (length: ${supabaseKey.length})\n`);
  } else {
    log('red', '   ❌ VITE_SUPABASE_ANON_KEY is not set\n');
    hasErrors = true;
  }

  // Test Supabase connection
  if (supabaseUrl && supabaseKey) {
    log('blue', '3️⃣  Testing Supabase connection...');
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Try a simple query
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          log('yellow', '   ⚠️  Connected, but profiles table might not exist');
          log('yellow', `   Error: ${error.message}\n`);
        } else {
          log('red', `   ❌ Connection error: ${error.message}\n`);
          hasErrors = true;
        }
      } else {
        log('green', '   ✅ Successfully connected to Supabase\n');
      }
    } catch (error: any) {
      log('red', `   ❌ Connection failed: ${error.message}\n`);
      hasErrors = true;
    }
  }

  // Check package dependencies
  log('blue', '4️⃣  Checking critical dependencies...');
  try {
    await import('@supabase/supabase-js');
    log('green', '   ✅ @supabase/supabase-js is installed');
  } catch {
    log('red', '   ❌ @supabase/supabase-js is not installed');
    hasErrors = true;
  }

  try {
    await import('vitest');
    log('green', '   ✅ vitest is installed\n');
  } catch {
    log('red', '   ❌ vitest is not installed\n');
    hasErrors = true;
  }

  // Summary
  log('blue', '╔════════════════════════════════════════╗');
  log('blue', '║   SUMMARY                             ║');
  log('blue', '╚════════════════════════════════════════╝\n');

  if (hasErrors) {
    log('red', '❌ Environment check FAILED');
    log('red', 'Please fix the issues above before running CI/CD\n');
    process.exit(1);
  } else {
    log('green', '✅ Environment check PASSED');
    log('green', 'All systems ready for CI/CD\n');
    process.exit(0);
  }
}

checkEnvironment().catch((error) => {
  log('red', `\n❌ Unexpected error: ${error.message}\n`);
  process.exit(1);
});
