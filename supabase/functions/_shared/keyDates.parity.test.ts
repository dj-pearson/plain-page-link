/**
 * The edge functions cannot import from src/ (the container copies only
 * supabase/functions), so the morning digest (US-230) runs a copy of
 * src/lib/keyDates.ts. This keeps the copy exact: the dashboard and the email
 * must agree on what "upcoming" means.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('_shared/keyDates.ts', () => {
  it('is identical to src/lib/keyDates.ts', () => {
    const root = process.cwd();
    expect(readFileSync(join(root, 'supabase/functions/_shared/keyDates.ts'), 'utf8')).toBe(
      readFileSync(join(root, 'src/lib/keyDates.ts'), 'utf8')
    );
  });
});
