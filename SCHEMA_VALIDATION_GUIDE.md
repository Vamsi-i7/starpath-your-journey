# 🛡️ Schema Validation & Testing Guide

**Complete guide to preventing database schema bugs in StarPath**

---

## 🎯 What We Built

To prevent the "cannot add tasks" bug from happening again, we've implemented a comprehensive validation system:

1. ✅ **Schema Validation Script** - Catches mismatches before deployment
2. ✅ **Integration Tests** - Tests actual database operations
3. ✅ **Schema Auditor** - Scans code for schema issues
4. ✅ **CI/CD Pipeline** - Automated validation on every PR
5. ✅ **Type Generation** - TypeScript types from database

---

## 📁 New Files Created

### **Scripts** (4 files)
```
scripts/
├── validate-schema.ts      # Main validation script
├── audit-schema.ts         # Code scanner for DB calls
├── schema-audit-report.ts  # Quick audit report
└── generate-db-types.sh    # TypeScript type generator
```

### **Tests** (2 files)
```
src/test/integration/
├── database.test.ts         # Database operations tests
└── goals-tasks.test.ts      # Goals workflow tests
```

### **CI/CD** (1 file)
```
.github/workflows/
└── schema-validation.yml    # GitHub Actions workflow
```

### **Documentation** (2 files)
```
├── SCHEMA_MISMATCH_REPORT.md    # Current issues found
└── SCHEMA_VALIDATION_GUIDE.md   # This file
```

---

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
npm install -D tsx glob
```

### **2. Add Scripts to package.json**
Copy from `package.json.scripts` or add manually:
```json
{
  "scripts": {
    "schema:validate": "tsx scripts/validate-schema.ts",
    "schema:audit": "tsx scripts/audit-schema.ts",
    "schema:types": "bash scripts/generate-db-types.sh",
    "test:integration": "vitest run src/test/integration"
  }
}
```

### **3. Set Environment Variables**
```bash
# .env or .env.local
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **4. Run Validation**
```bash
npm run schema:validate
```

---

## 📋 Available Commands

### **Schema Validation**

#### `npm run schema:validate`
**Validates database schema against code expectations**

What it does:
- Connects to Supabase database
- Checks all expected tables exist
- Verifies critical columns are present
- Tests insert operations
- Reports errors and warnings

Output:
```
✅ Passed: 85 checks
⚠️  Warnings: 3
❌ Errors: 0

🎉 SCHEMA VALIDATION PASSED!
```

**When to run**:
- Before every deployment
- After database migrations
- When adding new features

---

#### `npm run schema:audit`
**Scans codebase for database operations and potential issues**

What it does:
- Parses all TypeScript files
- Finds `.from()`, `.insert()`, `.select()` calls
- Checks table names exist
- Verifies column names match schema
- Checks migration consistency

Output:
```
🔍 Scanning 247 files...

❌ CRITICAL: Column 'parent_task_id' does not exist in table 'tasks'
   File: src/hooks/useGoals.ts:434
   Fix: Add column to schema or remove from insert

✅ No critical issues!
```

**When to run**:
- Weekly maintenance
- Before major releases
- After code reviews

---

#### `npm run schema:report`
**Generates quick summary of schema status**

What it does:
- Compares table names between code and schema
- Lists known issues
- Shows recommendations

Output:
```
❌ Tables used in code but NOT in schema:
   - session_history (may be 'sessions' in schema)
   - library_items (may be 'ai_library' in schema)

✅ AUDIT PASSED (warnings exist)
```

**When to run**:
- Daily during development
- Before standup meetings
- Quick health checks

---

### **Testing**

#### `npm run test:integration`
**Runs integration tests against real database**

What it does:
- Tests actual database operations
- Creates test user
- Inserts/updates/deletes data
- Verifies RLS policies
- Tests entire workflows

**Requirements**:
- Test user account in Supabase
- Test email: `test@starpath-integration.test`
- Access to development database

Example:
```bash
npm run test:integration

✓ src/test/integration/database.test.ts (15)
  ✓ Tasks Table (6)
    ✓ should insert task with all required fields
    ✓ should insert task with parent_task_id
    ✓ should insert task with due_date
✓ src/test/integration/goals-tasks.test.ts (12)
  
Test Files  2 passed (2)
     Tests  27 passed (27)
```

**When to run**:
- Before every commit
- In CI/CD pipeline
- After schema changes

---

#### `npm run test:integration:watch`
**Runs tests in watch mode for development**

Useful during active development of database features.

---

### **Type Generation**

#### `npm run schema:types`
**Generates TypeScript types from database schema**

What it does:
- Uses Supabase CLI to introspect database
- Generates type-safe interfaces
- Creates `src/types/database.generated.ts`

Output:
```typescript
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          title: string;
          parent_task_id: string | null;
          due_date: string | null;
          // ...
        }
      }
    }
  }
}
```

**Usage in code**:
```typescript
import { Database } from '@/types/database.generated';

type Task = Database['public']['Tables']['tasks']['Row'];

const { data } = await supabase
  .from('tasks')
  .select('*')
  .returns<Task[]>();
```

**When to run**:
- After database schema changes
- Before adding new features
- Weekly to stay in sync

---

## 🔄 CI/CD Integration

### **GitHub Actions Workflow**

The workflow automatically runs on:
- Every pull request
- Every push to main/develop

**File**: `.github/workflows/schema-validation.yml`

What it does:
1. Checks out code
2. Installs dependencies
3. Runs `schema:validate`
4. Comments on PR if validation fails
5. Blocks merge if critical issues found

**Setup**:
1. Add secrets to GitHub:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Push the workflow file:
```bash
git add .github/workflows/schema-validation.yml
git commit -m "ci: Add schema validation workflow"
git push
```

3. Validation runs automatically on next PR

---

## 🧪 Integration Test Guide

### **Creating Test Data**

Tests automatically:
- Create test user on first run
- Sign in for each test suite
- Clean up data after tests
- Use isolated test accounts

### **Test Structure**

```typescript
describe('Feature Name', () => {
  let testUserId: string;
  let testGoalId: string;

  beforeAll(async () => {
    // Authenticate test user
  });

  afterAll(async () => {
    // Clean up test data
  });

  it('should perform operation', async () => {
    const { data, error } = await supabase
      .from('table')
      .insert({...});

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### **Writing New Tests**

1. **Identify the feature**
   - What database operations does it perform?
   - What could go wrong?

2. **Create test file**
```typescript
// src/test/integration/my-feature.test.ts
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work correctly', async () => {
    // Test code
  });
});
```

3. **Run tests**
```bash
npm run test:integration
```

---

## 🔍 How Schema Validation Works

### **Step 1: Load Expected Schema**
```typescript
const expectedSchema = [
  {
    table: 'tasks',
    columns: [
      { name: 'id', required: true },
      { name: 'parent_task_id', nullable: true },
      { name: 'due_date', nullable: true },
      // ...
    ]
  }
];
```

### **Step 2: Check Against Database**
```typescript
// For each table
for (const table of expectedSchema) {
  // Get actual columns from DB
  const actualColumns = await getTableColumns(table.name);
  
  // Compare expected vs actual
  for (const expectedCol of table.columns) {
    if (!actualColumns.includes(expectedCol.name)) {
      // Report error
    }
  }
}
```

### **Step 3: Test with Dummy Data**
```typescript
// Try to insert dummy data
const { error } = await supabase
  .from('tasks')
  .insert({
    user_id: 'test-uuid',
    goal_id: 'test-uuid',
    title: 'test',
    parent_task_id: null,  // Will fail if column missing
    due_date: null,        // Will fail if column missing
  });

// Analyze error message
if (error.message.includes('column does not exist')) {
  // Report missing column
}
```

---

## 🐛 Debugging Failed Validation

### **Error: "Column does not exist"**

**Cause**: Code tries to insert/update a column that's not in database

**Fix**:
1. Check `SCHEMA_MISMATCH_REPORT.md`
2. Either:
   - Add column to database (create migration)
   - Remove column from code

**Example**:
```sql
-- Add missing column
ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id);
```

---

### **Error: "Table does not exist"**

**Cause**: Code references a table with wrong name

**Fix**:
1. Check actual table name in database
2. Update code to use correct name

**Example**:
```typescript
// Wrong
.from('session_history')

// Correct
.from('sessions')
```

---

### **Error: "Cannot connect to database"**

**Cause**: Missing or invalid Supabase credentials

**Fix**:
1. Check `.env` file has:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxx...
   ```

2. Verify credentials are correct
3. Check network connection

---

## 📊 Schema Validation Report Example

```
╔════════════════════════════════════════╗
║   DATABASE SCHEMA VALIDATION          ║
╚════════════════════════════════════════╝

📋 Validating table: tasks
  ✅ id
  ✅ user_id
  ✅ goal_id
  ✅ title
  ✅ completed
  ✅ position
  ✅ parent_task_id
  ✅ due_date
  ✅ created_at
  ✅ updated_at

📋 Validating table: goals
  ✅ id
  ✅ user_id
  ✅ title
  ✅ description
  ✅ status
  ⚠️  Type mismatch: progress (expected integer, got numeric)

╔════════════════════════════════════════╗
║   VALIDATION SUMMARY                  ║
╚════════════════════════════════════════╝

✅ Passed: 47
⚠️  Warnings: 1
❌ Errors: 0

✅ SCHEMA VALIDATION PASSED!
```

---

## 🎯 Best Practices

### **1. Run Validation Before Every Deploy**
```bash
npm run schema:validate && npm run build && npm run deploy
```

### **2. Add to Pre-commit Hook**
```bash
# .husky/pre-commit
npm run schema:validate
```

### **3. Review Schema Mismatches Weekly**
```bash
npm run schema:audit > schema-audit-$(date +%Y%m%d).log
```

### **4. Keep FINAL_DATABASE_SCHEMA.sql Updated**
After every migration:
```bash
# Apply migration
supabase db push

# Update schema file
npm run schema:types
```

### **5. Write Integration Tests for New Features**
For every new database table/column:
```typescript
it('should insert with new column', async () => {
  const { error } = await supabase
    .from('new_table')
    .insert({ new_column: 'value' });
  
  expect(error).toBeNull();
});
```

---

## 🚨 Critical Issues to Watch

### **1. Missing Columns**
Most common issue. Always causes INSERT failures.

**Symptom**: "column does not exist"  
**Fix**: Add column to schema or remove from code

### **2. Wrong Table Names**
Second most common. Silent failure.

**Symptom**: No data returned, empty arrays  
**Fix**: Use correct table name from schema

### **3. Type Mismatches**
Less common but can cause subtle bugs.

**Symptom**: Data stored incorrectly  
**Fix**: Use correct data type in code

### **4. Missing Tables**
Rare but critical.

**Symptom**: "relation does not exist"  
**Fix**: Create table in database

---

## ✅ Success Metrics

Validation is working when:

1. ✅ `npm run schema:validate` passes
2. ✅ All integration tests pass
3. ✅ No "column does not exist" errors in logs
4. ✅ CI/CD pipeline succeeds
5. ✅ Features work in production

---

## 📚 Additional Resources

### **Scripts**
- `scripts/validate-schema.ts` - Full validation logic
- `scripts/audit-schema.ts` - Code scanner
- `scripts/schema-audit-report.ts` - Quick report

### **Tests**
- `src/test/integration/database.test.ts` - All tables
- `src/test/integration/goals-tasks.test.ts` - Workflows

### **Reports**
- `SCHEMA_MISMATCH_REPORT.md` - Current issues
- `BUG_ANALYSIS_REPORT.md` - Bug investigation
- `BUG_FIX_SUMMARY.md` - Fix summary

### **CI/CD**
- `.github/workflows/schema-validation.yml` - GitHub Actions

---

## 🎉 Summary

You now have:

✅ Automated schema validation  
✅ Integration tests for database  
✅ CI/CD pipeline integration  
✅ Type generation from database  
✅ Comprehensive documentation  

**These tools will prevent the "cannot add tasks" bug class from ever happening again!**

---

*Last Updated: January 13, 2026*  
*Created by: Rovo Dev AI*
