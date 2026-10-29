/**
 * US-200: every table and column this codebase names, checked against the
 * schema — without a database.
 *
 * CLAUDE.md opens its schema section with "Do not guess a table or column name
 * from this document, from a table's name, or from what a feature should have",
 * and gives the reason: gdpr-export queried a `blog_posts` table that has never
 * existed, coalesced the failure with `|| []`, and returned zero articles on
 * every subject access request without ever erroring.
 *
 * That is the shape of all of it. PostgREST answers an unknown column with 400.
 * Almost every call site here destructures `{ data }` and drops `error`, so the
 * query does not throw — it returns undefined, and the code carries on with an
 * empty result as though the table were empty.
 *
 * `npm run verify:schema` catches this, but it needs a real Postgres and runs
 * only in CI. src/integrations/supabase/types.ts is generated from the applied
 * schema and is in the repo, so the same class of defect can be caught in the
 * unit suite, on every commit, in milliseconds.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * Column names per relation, read out of the generated types.
 *
 * Row is the authoritative list: Insert and Update omit generated and optional
 * columns, so a key valid in Insert is always valid in Row.
 */
function parseSchema(): Map<string, Set<string>> {
  const lines = readFileSync(join(ROOT, 'src/integrations/supabase/types.ts'), 'utf-8').split('\n');

  const schema = new Map<string, Set<string>>();
  let relation: string | null = null;
  let inRow = false;

  for (const line of lines) {
    // Stop at Functions: past that point the shapes are RPC args, not columns.
    if (/^ {4}Functions: \{$/.test(line)) break;

    const relationStart = /^ {6}([a-z_0-9]+): \{$/.exec(line);
    if (relationStart) {
      relation = relationStart[1];
      inRow = false;
      continue;
    }
    if (relation && /^ {8}Row: \{$/.test(line)) {
      inRow = true;
      continue;
    }
    if (inRow) {
      if (/^ {8}\}/.test(line)) {
        inRow = false;
        continue;
      }
      const column = /^ {10}([a-z_0-9]+)\??:/.exec(line);
      if (column) {
        if (!schema.has(relation!)) schema.set(relation!, new Set());
        schema.get(relation!)!.add(column[1]);
      }
    }
  }
  return schema;
}

const SCHEMA = parseSchema();

/**
 * Comments are removed before anything is scanned.
 *
 * Not a nicety: several of the fixes in this story left a comment quoting the
 * broken call verbatim (`.eq('published', true)` — articles has no published
 * column), and a scanner that reads comments reports the explanation as the
 * defect. String literals are left alone, since that is where column names
 * actually live.
 */
function stripComments(source: string): string {
  // Replace with spaces rather than nothing so line numbers survive.
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, lead) => lead + ' '.repeat(m.length - lead.length));
}

function collectSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== 'node_modules') collectSources(full, out);
    } else if (/\.tsx?$/.test(entry) && !entry.includes('.test.')) {
      out.push(full);
    }
  }
  return out;
}

const SOURCES = [
  ...collectSources(join(ROOT, 'src')),
  ...collectSources(join(ROOT, 'supabase/functions')),
];

interface Reference {
  file: string;
  line: number;
  relation: string;
  column: string;
}

const FROM = /\.from\(\s*['"]([a-z_0-9]+)['"]\s*\)/g;
const FILTER =
  /\.(?:eq|neq|gt|gte|lt|lte|like|ilike|is|in|contains|containedBy|order)\(\s*['"]([a-zA-Z_0-9]+)['"]/g;
const WRITE = /\.(insert|update|upsert)\(\s*\{/;

/**
 * The chain that follows one `.from('table')`, up to the next one.
 *
 * A regex, not a parser: this only has to be right about `.from(...)` chains
 * written the way this codebase writes them, and being conservative costs a
 * missed reference rather than a false failure.
 */
function chainAfter(source: string, start: number): string {
  const rest = source.slice(start, start + 2000);
  const next = rest.indexOf('.from(');
  return next >= 0 ? rest.slice(0, next) : rest;
}

/**
 * Top-level keys of the object literal opening at `open` (a `{`), or of each
 * object in the array literal opening there (a `[` of `{ ... }` rows).
 */
function literalKeys(text: string, open: number): string[] {
  let depth = 0;
  let close = text.length - 1;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{' || text[i] === '[') depth++;
    else if ((text[i] === '}' || text[i] === ']') && --depth === 0) {
      close = i;
      break;
    }
  }
  const keyDepth = text[open] === '[' ? 2 : 1;

  // Start-of-line keys at the object's own depth only. A key written mid-line
  // is almost always the `: null` of a ternary rather than a column.
  //
  // Shorthand counts: `{ url, device, lcp }` is three columns, and a scanner
  // that only reads `name:` misses them. seo_link_analysis was written with a
  // shorthand `url` for a table whose column is `page_url`, and the first
  // version of this test did not see it.
  const keys: string[] = [];
  depth = 0;
  for (const line of text.slice(open, close + 1).split('\n')) {
    const key =
      /^\s*([a-z_][a-z_0-9]*)\s*:/.exec(line) ?? /^\s*([a-z_][a-z_0-9]*)\s*,?\s*$/.exec(line);
    if (depth === keyDepth && key) keys.push(key[1]);
    for (const char of line) {
      if (char === '{' || char === '[') depth++;
      else if (char === '}' || char === ']') depth--;
    }
  }
  return keys;
}

const WRITE_IDENTIFIER = /\.(?:insert|update|upsert)\(\s*([A-Za-z_][\w]*)/;

/**
 * Keys a write is given: an inline object literal, or (US-247) a variable
 * declared in the same file as an object or array literal.
 *
 * The inline-only version never saw sample-data-service, which builds
 * `const sampleListings = [{ beds: 4, ... }]` and inserts
 * `sampleListings.map(...)`; every row carried the GENERATED beds/baths/sqft
 * and Postgres refused the whole insert.
 */
function writtenKeys(chain: string, source: string): string[] {
  const write = WRITE.exec(chain);
  if (write) return literalKeys(chain, chain.indexOf('{', write.index));

  const named = WRITE_IDENTIFIER.exec(chain);
  if (!named) return [];
  const declaration = new RegExp(`\\b(?:const|let|var)\\s+${named[1]}\\b[^=;]*=\\s*([[{])`).exec(
    source
  );
  if (!declaration) return [];
  return literalKeys(source, declaration.index + declaration[0].length - 1);
}

/**
 * GENERATED ALWAYS AS (...) STORED columns, read out of the migrations.
 *
 * types.ts cannot say which columns these are (the generator lists them in
 * Insert and Update like any other), so tsc accepts `beds: 4` in an insert and
 * Postgres rejects it: "cannot insert a non-DEFAULT value into column".
 */
function parseGeneratedColumns(): Map<string, Set<string>> {
  const dir = join(ROOT, 'supabase/migrations');
  const generated = new Map<string, Set<string>>();
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    const sql = readFileSync(join(dir, file), 'utf-8').replace(/--[^\n]*/g, '');
    for (const statement of sql.split(';')) {
      if (!/GENERATED\s+ALWAYS\s+AS\s*\(/i.test(statement)) continue;
      const table =
        /(?:CREATE\s+TABLE|ALTER\s+TABLE)(?:\s+IF\s+(?:NOT\s+)?EXISTS)?(?:\s+ONLY)?\s+(?:public\.)?"?([a-z_0-9]+)/i.exec(
          statement
        );
      if (!table) continue;
      for (const column of statement.matchAll(
        // One column definition per line, as pg_dump and these migrations write them.
        /^[ \t]*(?:ADD[ \t]+COLUMN[ \t]+(?:IF[ \t]+NOT[ \t]+EXISTS[ \t]+)?)?"?([a-z_0-9]+)"?[ \t]+\S+(?:[ \t]+\S+)*?[ \t]+GENERATED[ \t]+ALWAYS[ \t]+AS[ \t]*\(/gim
      )) {
        if (!generated.has(table[1])) generated.set(table[1], new Set());
        generated.get(table[1])!.add(column[1]);
      }
    }
  }
  return generated;
}

const GENERATED = parseGeneratedColumns();

function scan(kind: 'filter' | 'write' | 'generated'): Reference[] {
  const found: Reference[] = [];
  for (const file of SOURCES) {
    const source = stripComments(readFileSync(file, 'utf-8'));
    for (const match of source.matchAll(FROM)) {
      const relation = match[1];
      const columns = SCHEMA.get(relation);
      // An unknown relation is the sibling test's problem, and storage buckets
      // (`supabase.storage.from('avatars')`) are not relations at all.
      if (!columns) continue;

      const chain = chainAfter(source, match.index! + match[0].length);
      const names =
        kind === 'filter'
          ? [...chain.matchAll(FILTER)].map((m) => m[1])
          : writtenKeys(chain, source);

      for (const column of names) {
        const flagged =
          kind === 'generated'
            ? GENERATED.get(relation)?.has(column) === true
            : !columns.has(column);
        if (flagged) {
          found.push({
            file: file.slice(ROOT.length + 1),
            line: source.slice(0, match.index).split('\n').length,
            relation,
            column,
          });
        }
      }
    }
  }
  return found;
}

const describeRef = (r: Reference) => `${r.relation}.${r.column} (${r.file}:${r.line})`;

/**
 * Writes to columns that do not exist. Empty, and it stays empty.
 *
 * This began at 59 entries across 11 tables — the whole SEO and Search Console
 * subsystem computing results and then discarding them, because PostgREST
 * rejects a statement naming an unknown column and every one of those call sites
 * logged the error and carried on.
 *
 * US-201 closed 55 by naming the column that already existed. US-202 closed the
 * last four with a migration, once a real Postgres was available to regenerate
 * types.ts against rather than hand-editing it.
 *
 * Anything added back here is an accepted defect, and needs the argument for it
 * written down. The stale-entry test below means an entry can never outlive the
 * problem it describes.
 */
const KNOWN_BROKEN_WRITES: Record<string, string[]> = {};

describe('schema references (US-200)', () => {
  it('parsed the generated types at all', () => {
    // Every assertion below is vacuous if this silently returns nothing.
    expect(SCHEMA.size).toBeGreaterThan(140);
    expect(SCHEMA.get('leads')).toContain('lead_type');
    expect(SCHEMA.get('leads')).not.toContain('type');
    expect(SCHEMA.get('profiles')).not.toContain('email');
    expect(SOURCES.length).toBeGreaterThan(500);
  });

  it('filters only on columns that exist', () => {
    // A `.eq()` on a column that is not there is not a narrower result set. It
    // is a 400, and `{ data }` without `error` turns that into "no rows".
    expect(scan('filter').map(describeRef)).toEqual([]);
  });

  it('writes only columns that exist, outside the frozen list', () => {
    const unexpected = scan('write').filter(
      (r) => !KNOWN_BROKEN_WRITES[r.relation]?.includes(r.column)
    );
    expect(unexpected.map(describeRef)).toEqual([]);
  });

  it('never writes a GENERATED column (US-247)', () => {
    // Postgres refuses any non-DEFAULT value for one, so the whole row fails.
    expect([...(GENERATED.get('listings') ?? [])].sort()).toEqual(['baths', 'beds', 'sqft']);
    expect(scan('generated').map(describeRef)).toEqual([]);
  });

  it('reads the keys of a write given a named literal, not only an inline one', () => {
    const source = [
      'const rows = [',
      '  {',
      '    beds: 4,',
      '    address,',
      '  },',
      '];',
      "await supabase.from('listings').insert(rows.map((r) => ({ ...r })));",
    ].join('\n');
    const chain = source.slice(source.indexOf('.insert'));
    expect(writtenKeys(chain, source)).toEqual(['beds', 'address']);
  });

  it('has no stale entries in the frozen list', () => {
    // Fixing one forces deleting it from KNOWN_BROKEN_WRITES, so the list can
    // only ever describe work that is still outstanding.
    const live = new Set(scan('write').map((r) => `${r.relation}.${r.column}`));
    const stale = Object.entries(KNOWN_BROKEN_WRITES)
      .flatMap(([relation, columns]) => columns.map((c) => `${relation}.${c}`))
      .filter((entry) => !live.has(entry));
    expect(stale).toEqual([]);
  });

  it('names only relations that exist', () => {
    const unknown: string[] = [];
    for (const file of SOURCES) {
      const source = stripComments(readFileSync(file, 'utf-8'));
      for (const match of source.matchAll(FROM)) {
        // storage.from() takes a bucket name, not a relation.
        const before = source.slice(Math.max(0, match.index! - 20), match.index!);
        if (/storage\s*$/.test(before)) continue;
        if (!SCHEMA.has(match[1])) {
          unknown.push(`${match[1]} (${file.slice(ROOT.length + 1)})`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });
});
