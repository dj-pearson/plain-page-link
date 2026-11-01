/**
 * US-261: every input, textarea and select in the dashboard, auth, onboarding
 * and listings sources must have an accessible name. A placeholder is not one.
 * Before this, Profile had 21 labels and 2 htmlFor, so a screen reader read
 * most of the page as "edit text, blank".
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findUnnamedFields } from './fieldNames';

const SRC = resolve(__dirname, '..', '..');

const ROOTS = [
  'pages/dashboard',
  'pages/auth',
  'pages/onboarding',
  'components/onboarding',
  'components/listings',
  'components/auth',
  'components/settings/LeadRoutingRules.tsx',
];

function sources(path: string): string[] {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((entry) => sources(join(path, entry)));
  }
  return path.endsWith('.tsx') && !/\.test\.tsx$/.test(path) ? [path] : [];
}

describe('findUnnamedFields', () => {
  const names = (src: string) => findUnnamedFields(src).map((p) => p.tag);

  it('flags a field whose only hint is a placeholder', () => {
    expect(names('<input type="text" placeholder="Name" />')).toEqual(['input']);
    expect(names('<Textarea placeholder="Bio" />')).toEqual(['Textarea']);
    expect(names('<Select><SelectTrigger><SelectValue /></SelectTrigger></Select>')).toEqual([
      'SelectTrigger',
    ]);
  });

  it('flags a label that is not wired to its field', () => {
    expect(names('<div><label>Full Name</label><input type="text" /></div>')).toEqual(['input']);
    expect(names('<div><Label htmlFor="a">A</Label><Input id="b" /></div>')).toEqual(['Input']);
  });

  it('accepts id + htmlFor, including matching template expressions', () => {
    expect(names('<div><Label htmlFor="a">A</Label><Input id="a" /></div>')).toEqual([]);
    expect(names('<div><label htmlFor={`x-${i}`}>X</label><input id={`x-${i}`} /></div>')).toEqual(
      []
    );
  });

  it('accepts aria-label, aria-labelledby and a wrapping label', () => {
    expect(names('<input aria-label="Search" />')).toEqual([]);
    expect(names('<textarea aria-labelledby="h" />')).toEqual([]);
    expect(names('<label>Agree <input type="checkbox" /></label>')).toEqual([]);
    expect(names('<FormControl><Input {...field} /></FormControl>')).toEqual([]);
  });

  it('ignores inputs outside the accessibility tree or that are buttons', () => {
    expect(names('<input type="hidden" name="x" />')).toEqual([]);
    expect(names('<input type="submit" value="Go" />')).toEqual([]);
    expect(names('<input type="file" className="hidden" />')).toEqual([]);
  });
});

describe('form fields have accessible names (US-261)', () => {
  const files = ROOTS.flatMap((root) => sources(join(SRC, root)));

  it('scans a meaningful set of files', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it('finds no unnamed input, textarea or select', () => {
    const problems = files.flatMap((file) =>
      findUnnamedFields(readFileSync(file, 'utf8'), file).map(
        (p) => `${relative(SRC, file)}:${p.line}  ${p.text}`
      )
    );
    expect(problems).toEqual([]);
  });
});
