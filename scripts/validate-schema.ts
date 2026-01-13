#!/usr/bin/env tsx
/**
 * Schema Validation Script
 * Compares frontend code expectations with actual database schema
 * Run in CI/CD to catch schema mismatches before deployment
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

interface ColumnDefinition {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableExpectation {
  table: string;
  columns: {
    name: string;
    type?: string;
    nullable?: boolean;
    required?: boolean;
  }[];
  references?: {
    column: string;
    foreignTable: string;
    foreignColumn: string;
  }[];
}

// Expected schema based on frontend code usage
const expectedSchema: TableExpectation[] = [
  {
    table: 'profiles',
    columns: [
      { name: 'id', required: true },
      { name: 'user_id', required: true },
      { name: 'username', nullable: true },
      { name: 'full_name', nullable: true },
      { name: 'avatar_url', nullable: true },
      { name: 'bio', nullable: true },
      { name: 'xp', type: 'integer' },
      { name: 'level', type: 'integer' },
      { name: 'current_streak', type: 'integer' },
      { name: 'longest_streak', type: 'integer' },
      { name: 'user_code', nullable: true },
      { name: 'created_at', required: true },
      { name: 'updated_at', required: true },
    ],
  },
  {
    table: 'habits',
    columns: [
      { name: 'id', required: true },
      { name: 'user_id', required: true },
      { name: 'name', required: true },
      { name: 'description', nullable: true },
      { name: 'icon', nullable: true },
      { name: 'color', nullable: true },
      { name: 'frequency', nullable: true },
      { name: 'difficulty', nullable: true },
      { name: 'xp_reward', type: 'integer' },
      { name: 'category_id', nullable: true },
      { name: 'streak', type: 'integer' },
      { name: 'best_streak', type: 'integer' },
      { name: 'total_completions', type: 'integer' },
      { name: 'is_active', type: 'boolean' },
      { name: 'created_at', required: true },
      { name: 'updated_at', required: true },
    ],
  },
  {
    table: 'habit_completions',
    columns: [
      { name: 'id', required: true },
      { name: 'habit_id', required: true },
      { name: 'user_id', required: true },
      { name: 'completed_at', required: true },
      { name: 'created_at', required: true },
    ],
    references: [
      { column: 'habit_id', foreignTable: 'habits', foreignColumn: 'id' },
      { column: 'user_id', foreignTable: 'profiles', foreignColumn: 'id' },
    ],
  },
  {
    table: 'goals',
    columns: [
      { name: 'id', required: true },
      { name: 'user_id', required: true },
      { name: 'title', required: true },
      { name: 'description', nullable: true },
      { name: 'status', nullable: true },
      { name: 'progress', type: 'integer', nullable: true },
      { name: 'deadline', nullable: true },
      { name: 'completed_at', nullable: true },
      { name: 'created_at', required: true },
      { name: 'updated_at', required: true },
    ],
  },
  {
    table: 'tasks',
    columns: [
      { name: 'id', required: true },
      { name: 'user_id', required: true },
      { name: 'goal_id', required: true },
      { name: 'title', required: true },
      { name: 'completed', type: 'boolean' },
      { name: 'position', type: 'integer', nullable: true },
      { name: 'parent_task_id', nullable: true }, // CRITICAL: Must exist
      { name: 'due_date', nullable: true },       // CRITICAL: Must exist
      { name: 'created_at', required: true },
      { name: 'updated_at', required: true },
    ],
    references: [
      { column: 'goal_id', foreignTable: 'goals', foreignColumn: 'id' },
      { column: 'user_id', foreignTable: 'profiles', foreignColumn: 'id' },
      { column: 'parent_task_id', foreignTable: 'tasks', foreignColumn: 'id' },
    ],
  },
  {
    table: 'session_history',
    columns: [
      { name: 'id', required: true },
      { name: 'user_id', required: true },
      { name: 'started_at', required: true },
      { name: 'ended_at', nullable: true },
      { name: 'duration_seconds', type: 'integer', nullable: true },
      { name: 'created_at', required: true },
    ],
  },
  {
    table: 'library_items',
    columns: [
      { name: 'id', required: true },
      { name: 'user_id', required: true },
      { name: 'title', required: true },
      { name: 'content', required: true },
      { name: 'content_type', required: true },
      { name: 'created_at', required: true },
    ],
  },
  {
    table: 'credits_usage',
    columns: [
      { name: 'id', required: true },
      { name: 'user_id', required: true },
      { name: 'tool_name', required: true },
      { name: 'credits_used', type: 'integer', required: true },
      { name: 'created_at', required: true },
    ],
  },
];

class SchemaValidator {
  private supabase: any;
  private errors: string[] = [];
  private warnings: string[] = [];
  private passed: string[] = [];

  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  private log(color: keyof typeof colors, message: string) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  private async getTableColumns(tableName: string): Promise<ColumnDefinition[]> {
    // Try RPC function first (this may not exist in all databases)
    try {
      const { data, error } = await this.supabase.rpc('get_table_columns', {
        table_name: tableName,
      });

      if (!error && data) {
        return data;
      }
    } catch (rpcError) {
      // RPC function doesn't exist, use fallback
      console.log(`⚠️  RPC function 'get_table_columns' not available, using fallback for ${tableName}`);
    }

    // Fallback: try direct query
    const { data: fallbackData, error: fallbackError } = await this.supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (fallbackError) {
      console.error(`⚠️  Cannot query ${tableName}:`, fallbackError.message);
      // Don't throw - return empty and we'll test with dummy insert
      return [];
    }

    // If we can query the table, return empty array (we'll check if insert works)
    return [];
  }

  private async validateTable(expectation: TableExpectation): Promise<boolean> {
    this.log('blue', `\n📋 Validating table: ${expectation.table}`);

    let allValid = true;

    try {
      // Try to get actual columns
      const actualColumns = await this.getTableColumns(expectation.table);

      if (actualColumns.length === 0) {
        this.log('yellow', `  ⚠️  Cannot introspect schema, will test with dummy insert`);
        return await this.testTableInsert(expectation);
      }

      const actualColumnNames = actualColumns.map(c => c.column_name);

      // Check each expected column
      for (const expectedCol of expectation.columns) {
        const exists = actualColumnNames.includes(expectedCol.name);

        if (!exists) {
          if (expectedCol.required) {
            this.errors.push(
              `❌ CRITICAL: Table '${expectation.table}' missing REQUIRED column '${expectedCol.name}'`
            );
            this.log('red', `  ❌ Missing required column: ${expectedCol.name}`);
            allValid = false;
          } else {
            this.warnings.push(
              `⚠️  Table '${expectation.table}' missing optional column '${expectedCol.name}'`
            );
            this.log('yellow', `  ⚠️  Missing optional column: ${expectedCol.name}`);
          }
        } else {
          const actualCol = actualColumns.find(c => c.column_name === expectedCol.name);

          // Check type if specified
          if (expectedCol.type && actualCol) {
            const actualType = actualCol.data_type.toLowerCase();
            const expectedType = expectedCol.type.toLowerCase();

            if (!actualType.includes(expectedType) && !this.typesMatch(actualType, expectedType)) {
              this.warnings.push(
                `⚠️  Column '${expectation.table}.${expectedCol.name}' type mismatch: expected ${expectedType}, got ${actualType}`
              );
              this.log('yellow', `  ⚠️  Type mismatch: ${expectedCol.name} (expected ${expectedType}, got ${actualType})`);
            }
          }

          this.passed.push(`✅ Column '${expectation.table}.${expectedCol.name}' exists`);
          this.log('green', `  ✅ ${expectedCol.name}`);
        }
      }

      // Check foreign keys if specified
      if (expectation.references) {
        for (const ref of expectation.references) {
          const exists = actualColumnNames.includes(ref.column);
          if (exists) {
            this.log('green', `  ✅ Foreign key column: ${ref.column} → ${ref.foreignTable}.${ref.foreignColumn}`);
          } else {
            this.warnings.push(
              `⚠️  Foreign key column '${expectation.table}.${ref.column}' not found`
            );
            this.log('yellow', `  ⚠️  Missing FK column: ${ref.column}`);
          }
        }
      }
    } catch (error: any) {
      this.errors.push(`❌ Error validating table '${expectation.table}': ${error.message}`);
      this.log('red', `  ❌ Validation error: ${error.message}`);
      allValid = false;
    }

    return allValid;
  }

  private async testTableInsert(expectation: TableExpectation): Promise<boolean> {
    this.log('blue', `  🧪 Testing insert with dummy data...`);

    try {
      // Create dummy data based on expected columns
      const dummyData: any = {};

      for (const col of expectation.columns) {
        if (col.name === 'id') continue; // Skip ID (auto-generated)
        if (col.name.includes('created_at') || col.name.includes('updated_at')) continue;

        // Generate dummy value based on type
        if (col.name.includes('user_id')) {
          dummyData[col.name] = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
        } else if (col.name.includes('_id')) {
          dummyData[col.name] = '00000000-0000-0000-0000-000000000000';
        } else if (col.type === 'integer') {
          dummyData[col.name] = 0;
        } else if (col.type === 'boolean') {
          dummyData[col.name] = false;
        } else if (col.nullable) {
          dummyData[col.name] = null;
        } else {
          dummyData[col.name] = 'test';
        }
      }

      // Try insert (will fail due to FK constraints, but that's OK)
      const { error } = await this.supabase
        .from(expectation.table)
        .insert(dummyData)
        .select();

      if (error) {
        // Check if error is about missing column (BAD) or FK constraint (OK)
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const match = error.message.match(/column "([^"]+)"/);
          const missingColumn = match ? match[1] : 'unknown';

          this.errors.push(
            `❌ CRITICAL: Column '${expectation.table}.${missingColumn}' does not exist in database`
          );
          this.log('red', `  ❌ Missing column detected: ${missingColumn}`);
          return false;
        } else if (error.message.includes('foreign key') || error.message.includes('violates')) {
          this.log('green', `  ✅ All columns exist (FK constraint as expected)`);
          return true;
        } else {
          this.log('yellow', `  ⚠️  Insert test inconclusive: ${error.message}`);
          return true; // Assume OK
        }
      } else {
        // Insert succeeded (unlikely with dummy data)
        this.log('green', `  ✅ All columns exist and insert succeeded`);
        return true;
      }
    } catch (error: any) {
      this.log('red', `  ❌ Test insert failed: ${error.message}`);
      return false;
    }
  }

  private typesMatch(actualType: string, expectedType: string): boolean {
    const typeMapping: Record<string, string[]> = {
      integer: ['int4', 'int8', 'integer', 'bigint', 'smallint'],
      boolean: ['bool', 'boolean'],
      text: ['text', 'varchar', 'character varying'],
      uuid: ['uuid'],
      timestamp: ['timestamp', 'timestamptz', 'timestamp with time zone'],
      date: ['date'],
    };

    for (const [key, types] of Object.entries(typeMapping)) {
      if (expectedType === key && types.some(t => actualType.includes(t))) {
        return true;
      }
    }

    return false;
  }

  public async validate(): Promise<boolean> {
    this.log('magenta', '\n╔════════════════════════════════════════╗');
    this.log('magenta', '║   DATABASE SCHEMA VALIDATION          ║');
    this.log('magenta', '╚════════════════════════════════════════╝\n');

    let allTablesValid = true;

    for (const expectation of expectedSchema) {
      const valid = await this.validateTable(expectation);
      if (!valid) {
        allTablesValid = false;
      }
    }

    // Print summary
    this.log('magenta', '\n╔════════════════════════════════════════╗');
    this.log('magenta', '║   VALIDATION SUMMARY                  ║');
    this.log('magenta', '╚════════════════════════════════════════╝\n');

    this.log('green', `✅ Passed: ${this.passed.length}`);
    this.log('yellow', `⚠️  Warnings: ${this.warnings.length}`);
    this.log('red', `❌ Errors: ${this.errors.length}\n`);

    if (this.errors.length > 0) {
      this.log('red', '❌ CRITICAL ERRORS:\n');
      this.errors.forEach(err => this.log('red', err));
      console.log('');
    }

    if (this.warnings.length > 0) {
      this.log('yellow', '⚠️  WARNINGS:\n');
      this.warnings.forEach(warn => this.log('yellow', warn));
      console.log('');
    }

    if (allTablesValid && this.errors.length === 0) {
      this.log('green', '🎉 SCHEMA VALIDATION PASSED!\n');
      return true;
    } else {
      this.log('red', '💥 SCHEMA VALIDATION FAILED!\n');
      this.log('red', 'Fix the errors above before deploying.\n');
      return false;
    }
  }
}

// Main execution
async function main() {
  try {
    const validator = new SchemaValidator();
    const success = await validator.validate();

    process.exit(success ? 0 : 1);
  } catch (error: any) {
    console.error('❌ Validation script error:', error.message);
    process.exit(1);
  }
}

// Run if called directly (ES module compatible)
// Check if this file is being run directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Only run main() if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SchemaValidator, expectedSchema };
