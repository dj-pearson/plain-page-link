/**
 * US-200 / US-201: a failure message that says only "try again" is a dead end.
 *
 * Twenty-six catch blocks told someone their action had failed and gave them
 * nothing to act on, while the server was returning a specific reason —
 * "For security purposes, you can only request this after 47 seconds",
 * "Review must be between 1 and 2000 characters" — that the page discarded.
 *
 * The remedy is not to print error.message; a Postgres error names a
 * constraint and a Supabase transport failure says "non-2xx status code".
 * userFacingError() decides which is which, so this guard asks only that the
 * decision be made rather than skipped.
 *
 * Source-level, because there is no runtime signal: the toast renders, nothing
 * throws, and the only way to notice is to be the person reading it.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');

/**
 * Catch blocks that are deliberately vague, and why. Each entry is a decision,
 * not an exemption to be added to when the guard is inconvenient.
 */
const DELIBERATELY_VAGUE: Record<string, string> = {
  'pages/auth/Login.tsx':
    'An OAuth failure carries text that reveals whether an account exists. Sign-in is the one place where saying less is the feature.',
  'components/layout/DashboardLayout.tsx':
    'A clipboard write fails because the browser blocked it or the context is insecure; NotAllowedError has no wording an agent can act on.',
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

/** The body of each `catch (x) { ... }`, by brace matching. */
function catchBodies(source: string): { binding: string; body: string }[] {
  const out: { binding: string; body: string }[] = [];
  const opener = /catch \((\w+)\)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = opener.exec(source)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') depth -= 1;
      i += 1;
    }
    out.push({ binding: match[1], body: source.slice(match.index + match[0].length, i) });
  }
  return out;
}

describe('a failure says what happened', () => {
  it('has no catch block that says "try again" without reading the error', () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(SRC)) {
      const relative = file
        .slice(SRC.length + 1)
        .split('\\')
        .join('/');
      if (DELIBERATELY_VAGUE[relative]) continue;

      const source = readFileSync(file, 'utf8');
      for (const { binding, body } of catchBodies(source)) {
        if (!/try again/i.test(body)) continue;
        const readsError = new RegExp(
          `userFacingError\\(\\s*${binding}|${binding}\\s*instanceof\\s+Error|\\b${binding}\\.message`
        ).test(body);
        if (!readsError) offenders.push(relative);
      }
    }

    expect(
      [...new Set(offenders)].sort(),
      'route these through userFacingError(), or add them to DELIBERATELY_VAGUE with the reason'
    ).toEqual([]);
  });
});
