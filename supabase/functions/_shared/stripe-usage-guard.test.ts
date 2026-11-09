/**
 * US-656 (US-645): report-stripe-usage let any signed-in agent post Stripe
 * usage records against their own subscription items, including action 'set'
 * with quantity 0. There are no metered prices today, but the day one is added
 * an agent could reset their own bill. The function and its client wrapper
 * were deleted; this keeps a browser-callable usage writer from coming back
 * unnoticed.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '../../..');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...sourceFiles(p));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('Stripe usage reporting is not browser-callable', () => {
  it('the report-stripe-usage function is gone', () => {
    expect(existsSync(join(ROOT, 'supabase/functions/report-stripe-usage'))).toBe(false);
  });

  it('no client code calls report-stripe-usage', () => {
    const hits = sourceFiles(join(ROOT, 'src')).filter((f) =>
      /['"`]report-stripe-usage['"`]/.test(readFileSync(f, 'utf8')),
    );
    expect(hits).toEqual([]);
  });

  it('no edge function writes Stripe usage records', () => {
    const hits = sourceFiles(join(ROOT, 'supabase/functions')).filter((f) =>
      /createUsageRecord|usage_records\.create|usageRecords\.create/.test(readFileSync(f, 'utf8')),
    );
    expect(hits).toEqual([]);
  });
});
