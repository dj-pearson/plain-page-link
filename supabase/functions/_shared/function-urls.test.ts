/**
 * US-250: a function that calls another function must reach the runtime that
 * serves them.
 *
 * `${SUPABASE_URL}/functions/v1/<name>` goes through Kong to the Supabase edge
 * runtime, which holds none of these functions and answers every name with
 * 500 InvalidWorkerCreation (docs/deploy/edge-functions.md). Only
 * functions.agentbio.net — getFunctionsUrl() — serves them. submit-lead's
 * notify-lead call, scheduled-maintenance's account deletions and the
 * scheduled SEO audits were all built the first way, so every new-lead email
 * and every account erasure failed, logged to a console nobody reads.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const FUNCTIONS_DIR = join(process.cwd(), 'supabase/functions');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== 'node_modules') sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry) && !entry.includes('.test.')) {
      out.push(full);
    }
  }
  return out;
}

describe('edge function URLs (US-250)', () => {
  const files = sourceFiles(FUNCTIONS_DIR);

  it('found the function sources', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('no function builds a /functions/v1 URL; every one uses getFunctionsUrl()', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, 'utf-8').split('\n');
      lines.forEach((line, i) => {
        if (line.includes('/functions/v1')) {
          offenders.push(`${relative(FUNCTIONS_DIR, file)}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
