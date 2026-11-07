/**
 * US-413 (US-367): the browser never writes user_mfa_settings or user_sessions,
 * and reads only the columns migration 20261107000413 grants it.
 *
 * Owner UPDATE policies on both tables let anyone holding only an agent's
 * password (an aal1 JWT) switch a legacy second factor off, plant backup codes,
 * reset the TOTP lockout or un-revoke a session. The migration removed those
 * grants; every write now goes through the MFA and session edge functions
 * (service role). This test keeps browser code from growing a write or a read
 * of a column that PostgREST would now refuse — a refused select comes back as
 * `{ data: null }`, which the MFA gates would read as "no legacy factor".
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MIGRATION = join(
  ROOT,
  'supabase/migrations/20261107000413_mfa_and_session_rows_system_written.sql'
);
const TABLES = ['user_mfa_settings', 'user_sessions'] as const;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
}

/** The columns the migration grants `authenticated` SELECT on, per table. */
function grantedColumns(): Map<string, Set<string>> {
  const sql = readFileSync(MIGRATION, 'utf-8');
  const grants = new Map<string, Set<string>>();
  const re = /GRANT SELECT \(([^)]*)\) ON public\.([a-z_]+) TO authenticated;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    grants.set(
      m[2],
      new Set(
        m[1]
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      )
    );
  }
  return grants;
}

/** Every `.from('<table>')...` chain in browser code, up to the end of the statement. */
function chains(): { file: string; table: string; chain: string }[] {
  const out: { file: string; table: string; chain: string }[] = [];
  for (const file of sourceFiles(join(ROOT, 'src'))) {
    const source = stripComments(readFileSync(file, 'utf-8'));
    for (const table of TABLES) {
      const re = new RegExp(`\\.from\\(\\s*['"\`]${table}['"\`]\\s*\\)`, 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(source))) {
        const rest = source.slice(m.index);
        const end = rest.search(/;|\n\s*\n/);
        out.push({
          file: file.slice(ROOT.length + 1),
          table,
          chain: end === -1 ? rest : rest.slice(0, end),
        });
      }
    }
  }
  return out;
}

describe('browser access to user_mfa_settings and user_sessions (US-413)', () => {
  const grants = grantedColumns();
  const found = chains();

  it('reads the grant out of the migration', () => {
    expect(grants.get('user_mfa_settings')).toContain('mfa_enabled');
    expect(grants.get('user_mfa_settings')).toContain('verified_at');
    expect(grants.get('user_mfa_settings')).not.toContain('totp_secret');
    expect(grants.get('user_mfa_settings')).not.toContain('backup_codes');
    expect(grants.get('user_sessions')).not.toContain('session_token_hash');
    // The MFA gates read the legacy row, so the scan must actually find them.
    expect(found.some((c) => c.table === 'user_mfa_settings')).toBe(true);
  });

  it('never writes either table from the browser', () => {
    const writes = found.filter((c) => /\.(insert|update|upsert|delete)\s*\(/.test(c.chain));
    expect(writes.map((c) => `${c.file}: ${c.table}`)).toEqual([]);
  });

  it('selects only granted columns, and never *', () => {
    const problems: string[] = [];
    for (const { file, table, chain } of found) {
      const select = /\.select\(\s*(['"`])([^'"`]*)\1/.exec(chain);
      if (!select) {
        problems.push(`${file}: ${table} chain without a literal column list`);
        continue;
      }
      const allowed = grants.get(table) ?? new Set<string>();
      for (const column of select[2]
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)) {
        if (!allowed.has(column))
          problems.push(`${file}: ${table}.${column} is not granted to the browser`);
      }
    }
    expect(problems).toEqual([]);
  });
});
