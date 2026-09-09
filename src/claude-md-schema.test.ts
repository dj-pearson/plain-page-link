/**
 * US-166: CLAUDE.md's schema section describes columns that do not exist.
 *
 * The document opens that section by saying, of itself:
 *
 *   "Do not guess a table or column name from this document ... An earlier
 *    version of this section described a `blog_posts` table that has never
 *    existed (the real one is `articles`), and the `gdpr-export` edge function
 *    duly queried `blog_posts`. The result was coalesced with `|| []`, so the
 *    export did not fail — it silently returned zero articles on every subject
 *    access request. Getting this section wrong propagates."
 *
 * It had drifted again, in four of the six tables it details, and one of them
 * is worse than the `blog_posts` case that prompted the warning:
 *
 *   leads.email / leads.phone — documented as live columns, with the note
 *   "US-016 dual-write; plaintext still populated". US-086 DROPPED both,
 *   deliberately, so that lead PII is only ever stored encrypted. A reader
 *   following CLAUDE.md would reintroduce plaintext email and phone for every
 *   captured lead — and on finding the insert rejected, the obvious "fix" is to
 *   add the column back, which is precisely the thing US-086 removed.
 *
 * The repository already checks that types.ts matches the database
 * (`npm run types:check`). Nothing checked that CLAUDE.md matches types.ts, and
 * CLAUDE.md is what a person or an assistant actually reads before writing a
 * query. So this is that check.
 *
 * It compares the documented column lists against the generated types, which
 * `types:check` in turn holds to the applied schema. It does not require the
 * document to list every column — a guide may summarise — but it does require
 * that every column it names is real, because a name in this document is an
 * instruction to use it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const CLAUDE_MD = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');
const TYPES = readFileSync(join(ROOT, 'src/integrations/supabase/types.ts'), 'utf8');

/** The section of CLAUDE.md that makes column-level claims. */
const SECTION_START = '### The tables you will touch most';
const SECTION_END = '### Database Patterns';

/**
 * Every column on a table, from the generated types.
 *
 * Reads the `Row:` block, which lists them all — `Insert:` omits nothing but
 * is easier to confuse with optionality, and `Row` is what a reader of the
 * document is picturing.
 */
function columnsOf(table: string): Set<string> | null {
  const tableStart = TYPES.indexOf(`      ${table}: {`);
  if (tableStart < 0) return null;

  const rowStart = TYPES.indexOf('Row: {', tableStart);
  if (rowStart < 0) return null;
  const rowEnd = TYPES.indexOf('};', rowStart);

  const columns = TYPES.slice(rowStart + 'Row: {'.length, rowEnd)
    .split('\n')
    .map((line) => line.trim().split(':')[0].trim())
    .filter((name) => /^[a-z_][a-z0-9_]*$/.test(name));

  return new Set(columns);
}

/** The names of the tables in the public schema, excluding Views and Functions. */
function tableNames(): string[] {
  const start = TYPES.indexOf('Tables: {');
  const end = TYPES.indexOf('Views: {', start);
  const slice = TYPES.slice(start, end > start ? end : undefined);

  return [...slice.matchAll(/^ {6}([a-z_][a-z0-9_]*): \{$/gm)].map((match) => match[1]);
}

/**
 * The column names CLAUDE.md claims for each table it documents.
 *
 * The section writes them as prose-ish lists inside fenced blocks:
 *
 *   id (PK, = auth.users.id), username (unique, NOT NULL), full_name
 *   specialties / certifications / service_cities (jsonb)
 *   encrypted_email, encrypted_phone   -- a trailing note
 *
 * so annotations in parentheses, `--` comments and `/` separators all have to
 * come off before the identifiers are readable.
 */
function documentedColumns(): Map<string, string[]> {
  const sectionStart = CLAUDE_MD.indexOf(SECTION_START);
  const sectionEnd = CLAUDE_MD.indexOf(SECTION_END, sectionStart);
  const section = CLAUDE_MD.slice(sectionStart, sectionEnd);

  const documented = new Map<string, string[]>();

  // Each entry is a bold table name, then prose, then the first fenced block.
  for (const match of section.matchAll(/^\*\*([a-z_][a-z0-9_]*)\*\*/gm)) {
    const table = match[1];
    const fenceStart = section.indexOf('```', match.index);
    if (fenceStart < 0) continue;
    const bodyStart = section.indexOf('\n', fenceStart) + 1;
    const fenceEnd = section.indexOf('```', bodyStart);

    const columns = section
      .slice(bodyStart, fenceEnd)
      .split('\n')
      .map((line) => line.replace(/--.*$/, '')) // trailing notes
      .join('\n')
      .replace(/\([^)]*\)/g, '') // type and constraint annotations
      .split(/[,/\n]/)
      .map((token) => token.trim())
      .filter((token) => /^[a-z_][a-z0-9_]*$/.test(token));

    if (columns.length) documented.set(table, columns);
  }

  return documented;
}

describe('CLAUDE.md describes the schema that exists (US-166)', () => {
  const documented = documentedColumns();

  it('finds the section it is meant to be checking', () => {
    // If the section is renamed or restructured, this test must fail loudly
    // rather than quietly checking nothing.
    expect(CLAUDE_MD).toContain(SECTION_START);
    expect(CLAUDE_MD).toContain(SECTION_END);
    expect([...documented.keys()]).toEqual([
      'profiles',
      'listings',
      'leads',
      'links',
      'articles',
      'user_roles',
    ]);
  });

  it.each([...documented.keys()])('%s is a real table', (table) => {
    expect(columnsOf(table), `CLAUDE.md documents a table not in types.ts`).not.toBeNull();
  });

  it.each([...documented.entries()])(
    'every column CLAUDE.md names on %s exists',
    (table, claimed) => {
      const real = columnsOf(table);
      const ghosts = claimed.filter((column) => !real?.has(column));

      expect(
        ghosts,
        `CLAUDE.md documents columns that src/integrations/supabase/types.ts does not have. ` +
          `A column named in that document is an instruction to use it, so this is how ` +
          `leads.email came to be documented as live for months after US-086 dropped it. ` +
          `Fix the document — do not add the column back.`
      ).toEqual([]);
    }
  );

  it('does not silently stop checking if a fenced block is emptied', () => {
    for (const [table, claimed] of documented) {
      expect(claimed.length, `${table} has no parsed columns`).toBeGreaterThan(2);
    }
  });

  it('states the right number of tables', () => {
    const stated = CLAUDE_MD.match(/The `public` schema has \*\*(\d+) tables\*\*/);
    expect(stated, 'the table count sentence has moved or changed shape').not.toBeNull();

    expect(
      Number(stated![1]),
      'CLAUDE.md states a table count that no longer matches types.ts'
    ).toBe(tableNames().length);
  });

  it('does not tell its reader the test suite does not exist', () => {
    // This section said "No automated tests yet" while CI was running 654 of
    // them. A guide that denies the suite teaches its reader not to run it.
    expect(CLAUDE_MD).not.toContain('No automated tests yet');

    // And it should name the command that CI actually runs.
    expect(CLAUDE_MD).toContain('npm run test:coverage');
  });

  it('detects drift, rather than passing whatever it is given', () => {
    // The guard has to be shown able to fail. leads.email is the real case:
    // documented for months, dropped by US-086.
    const real = columnsOf('leads');
    expect(real).not.toBeNull();
    expect(real!.has('encrypted_email'), 'the encrypted column is the one that exists').toBe(true);
    expect(real!.has('email'), 'the plaintext column US-086 dropped').toBe(false);
    expect(real!.has('phone'), 'the plaintext column US-086 dropped').toBe(false);
  });
});

/**
 * US-173: a security layer that does not run must not read as though it does.
 *
 * src/lib/security/ and src/hooks/useSecurity.ts implement four layers —
 * authentication, authorization, ownership, validation — and useSecurity's own
 * header calls itself "the primary interface for security checks in React
 * components". No component imports it. `npm run check:unbundled` lists the
 * whole tree as unreachable from src/main.tsx.
 *
 * That is not a live vulnerability: RLS is the enforcement, on every table, and
 * scripts/verify-schema.mjs checks it. It is a documentation problem, and a
 * dangerous one — the next person to read useSecurity.ts has every reason to
 * believe client-side ownership checks are happening.
 *
 * These hold the disclosure in place. If the layer gets wired up, delete them
 * and say where; do not quietly remove the warning while the code stays dead.
 */
describe('the unwired security layer says so (US-173)', () => {
  it('useSecurity.ts warns that layers 1-3 do not run', () => {
    const source = readFileSync(join(ROOT, 'src/hooks/useSecurity.ts'), 'utf8');

    expect(source, 'the file must say it is not wired up').toMatch(/NOT WIRED UP/i);
    expect(source, 'and must name RLS as the actual enforcement').toMatch(
      /RLS is the enforcement/i
    );
  });

  it('CLAUDE.md does not claim queries validate ownership client-side', () => {
    // The old wording: "All database queries validate user ownership".
    // True only via RLS, and it read as a description of that unwired layer.
    const idor = CLAUDE_MD.slice(CLAUDE_MD.indexOf('**IDOR Protection:**'));
    const section = idor.slice(0, idor.indexOf('**Login Security'));

    expect(section, 'must name RLS as the enforcement').toMatch(
      /Row Level Security is the enforcement/i
    );
    expect(section, 'must say the helper layer is not wired up').toMatch(/not wired up/i);
    expect(
      section.includes('- All database queries validate user ownership'),
      'the old unqualified claim is back'
    ).toBe(false);
  });
});
