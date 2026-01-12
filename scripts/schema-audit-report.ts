#!/usr/bin/env tsx
/**
 * Quick Schema Audit Report Generator
 * Compares code usage with FINAL_DATABASE_SCHEMA.sql
 */

import * as fs from 'fs';

const schemaFile = 'FINAL_DATABASE_SCHEMA.sql';

// Tables in FINAL_DATABASE_SCHEMA.sql
const schemaTables = [
  'achievements',
  'activity_feed',
  'ai_generations',
  'ai_library',
  'categories',
  'challenge_participants',
  'challenges',
  'credit_transactions',
  'credits',
  'daily_challenges',
  'friendships',
  'goals',
  'habit_completions',
  'habits',
  'notifications',
  'payments',
  'profiles',
  'razorpay_subscriptions',
  'sessions',
  'subscriptions',
  'tasks',
  'user_achievements',
  'user_challenge_progress',
  'user_razorpay_customers',
];

// Tables commonly used in code (from analysis)
const codeUsedTables = [
  'profiles',
  'habits',
  'habit_completions',
  'goals',
  'tasks',
  'session_history', // ⚠️ Not in schema list above!
  'achievements',
  'user_achievements',
  'friends',
  'friend_requests',
  'activity_feed',
  'notifications',
  'library_items',
  'credits_usage',
  'challenges',
  'subscriptions',
  'razorpay_subscriptions',
];

// Known column issues from previous analysis
const knownIssues = [
  {
    table: 'tasks',
    columns: ['parent_task_id', 'due_date'],
    status: 'FIXED',
    severity: 'critical',
  },
  {
    table: 'session_history',
    columns: ['*'],
    status: 'UNKNOWN',
    severity: 'warning',
    note: 'Table may be named differently in schema (sessions?)',
  },
  {
    table: 'library_items',
    columns: ['*'],
    status: 'UNKNOWN',
    severity: 'warning',
    note: 'May be ai_library in schema',
  },
  {
    table: 'credits_usage',
    columns: ['*'],
    status: 'UNKNOWN',
    severity: 'warning',
    note: 'May be credit_transactions in schema',
  },
  {
    table: 'friends',
    columns: ['*'],
    status: 'UNKNOWN',
    severity: 'warning',
    note: 'May be friendships in schema',
  },
  {
    table: 'friend_requests',
    columns: ['*'],
    status: 'UNKNOWN',
    severity: 'warning',
    note: 'May be part of friendships table',
  },
];

console.log('╔═══════════════════════════════════════════════╗');
console.log('║   SCHEMA AUDIT REPORT - STARPATH             ║');
console.log('╚═══════════════════════════════════════════════╝\n');

console.log('📋 Tables in FINAL_DATABASE_SCHEMA.sql:', schemaTables.length);
console.log('💻 Tables referenced in code:', codeUsedTables.length);
console.log('');

// Find tables in code but not in schema
const missingInSchema = codeUsedTables.filter(t => !schemaTables.includes(t));

// Find tables in schema but not used in code
const unusedTables = schemaTables.filter(t => !codeUsedTables.includes(t));

console.log('❌ CRITICAL: Tables used in code but NOT in schema:');
if (missingInSchema.length > 0) {
  missingInSchema.forEach(table => {
    const issue = knownIssues.find(i => i.table === table);
    console.log(`   - ${table}${issue ? ` (${issue.note})` : ''}`);
  });
} else {
  console.log('   ✅ None - all tables exist in schema');
}
console.log('');

console.log('ℹ️  Tables in schema but not used in code (may be unused):');
if (unusedTables.length > 0) {
  unusedTables.forEach(table => {
    console.log(`   - ${table}`);
  });
} else {
  console.log('   ✅ All schema tables are used');
}
console.log('');

console.log('🔍 KNOWN ISSUES:\n');
knownIssues.forEach((issue, idx) => {
  const icon = issue.severity === 'critical' ? '❌' : '⚠️';
  const statusIcon = issue.status === 'FIXED' ? '✅' : '🔧';
  
  console.log(`${idx + 1}. ${icon} Table: ${issue.table} [${statusIcon} ${issue.status}]`);
  console.log(`   Severity: ${issue.severity.toUpperCase()}`);
  if (issue.columns) {
    console.log(`   Columns: ${issue.columns.join(', ')}`);
  }
  if (issue.note) {
    console.log(`   Note: ${issue.note}`);
  }
  console.log('');
});

console.log('📝 RECOMMENDATIONS:\n');
console.log('1. Verify table name mappings:');
console.log('   - session_history vs sessions');
console.log('   - library_items vs ai_library');
console.log('   - credits_usage vs credit_transactions');
console.log('   - friends vs friendships');
console.log('');
console.log('2. Run full schema validation:');
console.log('   npm run schema:validate');
console.log('');
console.log('3. Run integration tests:');
console.log('   npm run test:integration');
console.log('');

const criticalCount = knownIssues.filter(i => i.severity === 'critical' && i.status !== 'FIXED').length;

if (criticalCount > 0) {
  console.log('❌ AUDIT FAILED: Critical issues remaining\n');
  process.exit(1);
} else {
  console.log('✅ AUDIT PASSED: No critical issues (warnings may exist)\n');
  process.exit(0);
}
