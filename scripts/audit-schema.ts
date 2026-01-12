#!/usr/bin/env tsx
/**
 * Complete Database Schema Audit
 * Identifies all potential schema mismatches across the entire codebase
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SchemaIssue {
  severity: 'critical' | 'warning' | 'info';
  table: string;
  column?: string;
  issue: string;
  file: string;
  line: number;
  recommendation: string;
}

class SchemaAuditor {
  private issues: SchemaIssue[] = [];
  private knownTables = new Set<string>();
  private knownColumns = new Map<string, Set<string>>();

  constructor() {
    this.loadKnownSchema();
  }

  private loadKnownSchema() {
    // Load schema from FINAL_DATABASE_SCHEMA.sql
    const schemaPath = path.join(process.cwd(), 'FINAL_DATABASE_SCHEMA.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠️  FINAL_DATABASE_SCHEMA.sql not found');
      return;
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    
    // Parse CREATE TABLE statements
    const tableRegex = /CREATE TABLE.*?public\.(\w+)\s*\((.*?)\);/gs;
    let match;

    while ((match = tableRegex.exec(schemaContent)) !== null) {
      const tableName = match[1];
      const tableDefinition = match[2];

      this.knownTables.add(tableName);

      // Extract column names
      const columnRegex = /^\s*(\w+)\s+/gm;
      const columns = new Set<string>();
      let colMatch;

      while ((colMatch = columnRegex.exec(tableDefinition)) !== null) {
        const colName = colMatch[1];
        if (!['CONSTRAINT', 'PRIMARY', 'FOREIGN', 'CHECK', 'UNIQUE'].includes(colName)) {
          columns.add(colName);
        }
      }

      this.knownColumns.set(tableName, columns);
    }

    console.log(`📋 Loaded schema: ${this.knownTables.size} tables`);
  }

  private async scanCodeForDatabaseCalls() {
    const files = await glob('src/**/*.{ts,tsx}', { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.spec.ts'] 
    });

    console.log(`🔍 Scanning ${files.length} files for database operations...\n`);

    for (const file of files) {
      await this.scanFile(file);
    }
  }

  private async scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for .from() calls
      const fromMatch = line.match(/\.from\(['"`](\w+)['"`]\)/);
      if (fromMatch) {
        const tableName = fromMatch[1];
        
        if (!this.knownTables.has(tableName)) {
          this.issues.push({
            severity: 'critical',
            table: tableName,
            issue: `Unknown table '${tableName}' referenced in code`,
            file: filePath,
            line: lineNumber,
            recommendation: `Add table '${tableName}' to FINAL_DATABASE_SCHEMA.sql or fix the reference`,
          });
        }
      }

      // Check for .insert() with object literals
      const insertMatch = line.match(/\.insert\s*\(\s*\{/);
      if (insertMatch) {
        // Find the table name from previous lines
        const contextLines = lines.slice(Math.max(0, index - 5), index + 1).join('\n');
        const tableMatch = contextLines.match(/\.from\(['"`](\w+)['"`]\)/);
        
        if (tableMatch) {
          const tableName = tableMatch[1];
          const objectLiteralMatch = this.extractObjectLiteral(lines, index);
          
          if (objectLiteralMatch) {
            this.checkInsertColumns(tableName, objectLiteralMatch, filePath, lineNumber);
          }
        }
      }

      // Check for .select() with specific columns
      const selectMatch = line.match(/\.select\(['"`]([^'"`]+)['"`]\)/);
      if (selectMatch && selectMatch[1] !== '*') {
        const columns = selectMatch[1].split(',').map(c => c.trim());
        const contextLines = lines.slice(Math.max(0, index - 5), index + 1).join('\n');
        const tableMatch = contextLines.match(/\.from\(['"`](\w+)['"`]\)/);
        
        if (tableMatch) {
          const tableName = tableMatch[1];
          columns.forEach(col => {
            if (col && !col.includes('(') && !col.includes('*')) {
              const baseCol = col.split('.').pop()!;
              this.checkColumnExists(tableName, baseCol, filePath, lineNumber);
            }
          });
        }
      }

      // Check for .update() with object literals
      const updateMatch = line.match(/\.update\s*\(\s*\{/);
      if (updateMatch) {
        const contextLines = lines.slice(Math.max(0, index - 5), index + 1).join('\n');
        const tableMatch = contextLines.match(/\.from\(['"`](\w+)['"`]\)/);
        
        if (tableMatch) {
          const tableName = tableMatch[1];
          const objectLiteralMatch = this.extractObjectLiteral(lines, index);
          
          if (objectLiteralMatch) {
            this.checkUpdateColumns(tableName, objectLiteralMatch, filePath, lineNumber);
          }
        }
      }
    });
  }

  private extractObjectLiteral(lines: string[], startIndex: number): Record<string, any> | null {
    let depth = 0;
    let objectStr = '';
    let started = false;

    for (let i = startIndex; i < Math.min(startIndex + 20, lines.length); i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          depth++;
          started = true;
        }
        if (started) {
          objectStr += char;
        }
        if (char === '}') {
          depth--;
          if (depth === 0 && started) {
            try {
              // Extract key names from object literal
              const keys: Record<string, any> = {};
              const keyRegex = /(\w+)\s*:/g;
              let match;
              while ((match = keyRegex.exec(objectStr)) !== null) {
                keys[match[1]] = true;
              }
              return keys;
            } catch {
              return null;
            }
          }
        }
      }
    }

    return null;
  }

  private checkInsertColumns(table: string, columns: Record<string, any>, file: string, line: number) {
    const knownCols = this.knownColumns.get(table);
    if (!knownCols) return;

    for (const col of Object.keys(columns)) {
      if (!knownCols.has(col)) {
        this.issues.push({
          severity: 'critical',
          table,
          column: col,
          issue: `Column '${col}' does not exist in table '${table}'`,
          file,
          line,
          recommendation: `Add column '${col}' to '${table}' table schema or remove from insert`,
        });
      }
    }
  }

  private checkUpdateColumns(table: string, columns: Record<string, any>, file: string, line: number) {
    const knownCols = this.knownColumns.get(table);
    if (!knownCols) return;

    for (const col of Object.keys(columns)) {
      if (!knownCols.has(col)) {
        this.issues.push({
          severity: 'warning',
          table,
          column: col,
          issue: `Column '${col}' may not exist in table '${table}'`,
          file,
          line,
          recommendation: `Verify column '${col}' exists in '${table}' table`,
        });
      }
    }
  }

  private checkColumnExists(table: string, column: string, file: string, line: number) {
    const knownCols = this.knownColumns.get(table);
    if (!knownCols || knownCols.has(column)) return;

    this.issues.push({
      severity: 'warning',
      table,
      column,
      issue: `Column '${column}' referenced but may not exist in table '${table}'`,
      file,
      line,
      recommendation: `Verify column exists or use different column name`,
    });
  }

  private async checkMigrationConsistency() {
    console.log('\n🔍 Checking migration consistency...\n');

    const migrationFiles = await glob('supabase/migrations/*.sql');
    const schemaPath = 'FINAL_DATABASE_SCHEMA.sql';

    if (!fs.existsSync(schemaPath)) return;

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const addedColumns = new Map<string, Set<string>>();

    // Parse all migrations for ALTER TABLE ADD COLUMN
    for (const migFile of migrationFiles) {
      const content = fs.readFileSync(migFile, 'utf-8');
      const alterRegex = /ALTER TABLE\s+(?:public\.)?(\w+)\s+ADD COLUMN\s+(?:IF NOT EXISTS\s+)?(\w+)/gi;
      let match;

      while ((match = alterRegex.exec(content)) !== null) {
        const table = match[1];
        const column = match[2];

        if (!addedColumns.has(table)) {
          addedColumns.set(table, new Set());
        }
        addedColumns.get(table)!.add(column);
      }
    }

    // Check if added columns are in FINAL_DATABASE_SCHEMA.sql
    for (const [table, columns] of addedColumns.entries()) {
      for (const column of columns) {
        const tableRegex = new RegExp(`CREATE TABLE.*?${table}\\s*\\((.*?)\\);`, 's');
        const tableMatch = schema.match(tableRegex);

        if (tableMatch) {
          const tableDefinition = tableMatch[1];
          const hasColumn = new RegExp(`\\b${column}\\b`).test(tableDefinition);

          if (!hasColumn) {
            this.issues.push({
              severity: 'critical',
              table,
              column,
              issue: `Column '${column}' added in migration but missing from FINAL_DATABASE_SCHEMA.sql`,
              file: 'FINAL_DATABASE_SCHEMA.sql',
              line: 0,
              recommendation: `Add column '${column}' to table '${table}' in FINAL_DATABASE_SCHEMA.sql`,
            });
          }
        }
      }
    }
  }

  public async audit() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   DATABASE SCHEMA AUDIT               ║');
    console.log('╚════════════════════════════════════════╝\n');

    await this.scanCodeForDatabaseCalls();
    await this.checkMigrationConsistency();

    this.printReport();

    return this.issues.filter(i => i.severity === 'critical').length === 0;
  }

  private printReport() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   AUDIT REPORT                        ║');
    console.log('╚════════════════════════════════════════╝\n');

    const critical = this.issues.filter(i => i.severity === 'critical');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const info = this.issues.filter(i => i.severity === 'info');

    console.log(`❌ Critical Issues: ${critical.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`ℹ️  Info: ${info.length}\n`);

    if (critical.length > 0) {
      console.log('❌ CRITICAL ISSUES:\n');
      critical.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.issue}`);
        console.log(`   Table: ${issue.table}${issue.column ? `, Column: ${issue.column}` : ''}`);
        console.log(`   File: ${issue.file}:${issue.line}`);
        console.log(`   Fix: ${issue.recommendation}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n');
      warnings.slice(0, 10).forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.issue}`);
        console.log(`   File: ${issue.file}:${issue.line}`);
        console.log(`   Fix: ${issue.recommendation}\n`);
      });

      if (warnings.length > 10) {
        console.log(`   ... and ${warnings.length - 10} more warnings\n`);
      }
    }

    if (this.issues.length === 0) {
      console.log('✅ No schema issues found! Database schema is consistent.\n');
    } else if (critical.length === 0) {
      console.log('✅ No critical issues found. Please review warnings.\n');
    } else {
      console.log('❌ Critical issues found. Fix them before deploying!\n');
    }
  }
}

async function main() {
  const auditor = new SchemaAuditor();
  const success = await auditor.audit();

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

export { SchemaAuditor };
