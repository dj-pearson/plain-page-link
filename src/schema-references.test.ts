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

/** Top-level keys of the object literal a write is given. */
function writtenKeys(chain: string): string[] {
  const write = WRITE.exec(chain);
  if (!write) return [];

  const open = chain.indexOf('{', write.index);
  let depth = 0;
  let close = chain.length - 1;
  for (let i = open; i < chain.length; i++) {
    if (chain[i] === '{') depth++;
    else if (chain[i] === '}' && --depth === 0) {
      close = i;
      break;
    }
  }

  // Depth-1, start-of-line keys only. A key written mid-line is almost always
  // the `: null` of a ternary rather than a column.
  const keys: string[] = [];
  depth = 0;
  for (const line of chain.slice(open, close + 1).split('\n')) {
    const key = /^\s*([a-z_][a-z_0-9]*)\s*:/.exec(line);
    if (depth === 1 && key) keys.push(key[1]);
    for (const char of line) {
      if (char === '{' || char === '[') depth++;
      else if (char === '}' || char === ']') depth--;
    }
  }
  return keys;
}

function scan(kind: 'filter' | 'write'): Reference[] {
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
        kind === 'filter' ? [...chain.matchAll(FILTER)].map((m) => m[1]) : writtenKeys(chain);

      for (const column of names) {
        if (!columns.has(column)) {
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
 * Writes to columns that do not exist, frozen as they were found.
 *
 * These are 59 real defects in one subsystem — the SEO and Search Console
 * tooling — and each needs a decision this test cannot make: whether the code
 * is naming the wrong column (seo_core_web_vitals stores `lcp` and `lcp_pass`,
 * the code writes `lcp_value` and `lcp_passed`) or whether the table is missing
 * a column the feature needs (seo_monitoring_log has 7 columns and the code
 * writes 6 more). Some need a migration; none should be guessed at.
 *
 * So this is a ratchet, not an exemption. The list may shrink and may never
 * grow, and an entry that no longer matches anything must be deleted — which
 * makes fixing one of them force its removal from here. US-200 tracks the work.
 */
const KNOWN_BROKEN_WRITES: Record<string, string[]> = {
  articles: ['last_seo_check', 'seo_issues', 'seo_recommendations', 'seo_score'],
  gsc_keyword_performance: ['keyword', 'platform', 'property_url', 'user_id'],
  gsc_page_performance: ['page_url', 'platform', 'property_url', 'user_id'],
  gsc_properties: ['last_sync_at', 'site_url'],
  seo_alerts: ['metadata', 'notification_sent', 'notified_at', 'related_url', 'rule_id'],
  seo_content_optimization: [
    'issues_count',
    'keyword',
    'keyword_prominence',
    'meta_description',
    'overall_score',
    'recommendations',
    'title',
  ],
  seo_core_web_vitals: [
    'checked_by',
    'cls_passed',
    'cls_value',
    'collection_period_end',
    'collection_period_start',
    'fcp_value',
    'fid_passed',
    'fid_value',
    'inp_value',
    'lcp_passed',
    'lcp_value',
    'ttfb_value',
  ],
  seo_link_analysis: [
    'analyzed_by',
    'issues_count',
    'total_external_links',
    'total_internal_links',
    'unique_internal_pages',
  ],
  seo_monitoring_log: [
    'check_type',
    'checks_performed',
    'duration_ms',
    'error_message',
    'issues_found',
    'user_id',
  ],
  seo_performance_budget: [
    'compliance_score',
    'last_check_at',
    'last_check_status',
    'latest_metrics',
    'latest_violations',
    'violations_detected',
  ],
  seo_semantic_analysis: ['lsi_keywords', 'top_keywords', 'total_words', 'unique_words'],
};

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
