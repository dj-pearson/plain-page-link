import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { LEAD_COLUMNS, LEAD_COLUMN_SET } from './leadColumns';

const split = (list: string) =>
  list
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

/** The column list of the newest `GRANT SELECT (...) ON public.leads` in the migrations. */
function grantedLeadColumns(): string[] {
  const dir = join(__dirname, '../../supabase/migrations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  let last: string[] | null = null;
  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8');
    for (const m of sql.matchAll(/GRANT\s+SELECT\s*\(([^)]*)\)\s*ON\s+public\.leads\s+TO/gi)) {
      last = split(m[1]);
    }
  }
  if (!last) throw new Error('no column grant on public.leads in supabase/migrations');
  return last;
}

describe('LEAD_COLUMNS (US-254)', () => {
  it('never asks for the ciphertext', () => {
    expect(split(LEAD_COLUMNS)).not.toContain('encrypted_email');
    expect(split(LEAD_COLUMNS)).not.toContain('encrypted_phone');
  });

  it('never asks for phone_hash, which only submit-lead reads (US-522)', () => {
    expect(split(LEAD_COLUMNS)).not.toContain('phone_hash');
    expect(grantedLeadColumns()).not.toContain('phone_hash');
  });

  it('names every readable column in types.ts, once', () => {
    const cols = split(LEAD_COLUMNS);
    expect(new Set(cols).size).toBe(cols.length);
    expect([...cols].sort()).toEqual(Object.keys(LEAD_COLUMN_SET).sort());
  });

  it('is exactly what the migration grants the browser', () => {
    expect([...split(LEAD_COLUMNS)].sort()).toEqual(grantedLeadColumns().sort());
  });
});
