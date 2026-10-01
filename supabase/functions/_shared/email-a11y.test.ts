/**
 * US-234: the HTML emails.
 *
 * None of the seven templates set <html lang>, so a screen reader announced
 * them in whatever language the mail client guessed (3.1.1). The new-lead
 * email's header and button put white on #667eea at 3.66:1, and the free-tool
 * emails' gradients ended in #ec4899 under white text at 3.53:1.
 *
 * This reads the template sources and checks every inline or <style> rule that
 * sets both a background and white text: each background colour in it — both
 * ends of a gradient — must give white text 4.5:1.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrastRatio } from '../../../src/lib/wcagContrast';

const FILES = [
  '_shared/email.ts',
  '_shared/digest.ts',
  'send-welcome-email/index.ts',
  'send-bio-analyzer-email/index.ts',
  'send-listing-generator-email/index.ts',
];
const read = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8');

const WHITE = /(^|[;{\s"])color:\s*(white|#fff\b|#ffffff)/i;

describe.each(FILES)('%s', (file) => {
  const src = read(file);

  it('every <html> declares lang', () => {
    const tags = src.match(/<html[^>]*>/g) ?? [];
    expect(tags.length).toBeGreaterThan(0);
    for (const t of tags) expect(t).toMatch(/lang="en"/);
  });

  it('white text sits on backgrounds of at least 4.5:1', () => {
    // A rule is an inline style="…" value or a { … } block in a <style>.
    const rules = [...src.matchAll(/style="([^"]*)"/g), ...src.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
    const failures: string[] = [];
    for (const rule of rules) {
      if (!WHITE.test(rule) || !/background/i.test(rule)) continue;
      const bg = rule.match(/background(?:-color)?:[^;]*/i)?.[0] ?? '';
      for (const hex of bg.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) ?? []) {
        const r = contrastRatio('#ffffff', hex);
        if (r < 4.5) failures.push(`${hex} (${r.toFixed(2)}:1) in: ${rule.trim().slice(0, 80)}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
