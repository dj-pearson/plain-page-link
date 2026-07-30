#!/usr/bin/env node
/**
 * Verifies the applied database schema against the code that uses it.
 *
 * scripts/validate-migrations.mjs only lints migration files as text; it never
 * executes them. That gap let a family of defects reach production unnoticed —
 * a trigger referencing a column that does not exist, tables the app queries
 * that no migration creates, an RPC called with the wrong parameter names.
 * Every one of those is invisible to tsc, to the unit tests, and to a structural
 * lint, but obvious the moment the migrations are applied to a real Postgres and
 * questioned.
 *
 * Usage:
 *   node scripts/verify-schema.mjs --db-url postgresql://postgres@localhost:5432/agentbio
 *
 * Expects a database with scripts/supabase-prelude.sql and every migration in
 * supabase/migrations/ already applied. See scripts/README-types-generation.md.
 *
 * Exits non-zero if any check fails.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const dbUrlIdx = process.argv.indexOf('--db-url');
if (dbUrlIdx === -1) {
  console.error('usage: node scripts/verify-schema.mjs --db-url <postgres url>');
  process.exit(2);
}
const DB_URL = process.argv[dbUrlIdx + 1];

function q(sql) {
  return execFileSync('psql', [DB_URL, '-tAq', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Strips block and line comments so that prose mentioning a table or RPC name —
 * including comments explaining a past bug — is not mistaken for a call site.
 */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
}

/** Every .ts/.tsx file under the given roots. */
function sourceFiles(roots) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(p)) out.push(p);
    }
  };
  for (const r of roots) walk(join(ROOT, r));
  return out;
}

// Names addressed through supabase.storage.from(), which are buckets rather than
// tables. `.from()` alone cannot distinguish them, so they are listed here.
const STORAGE_BUCKETS = new Set(['avatars', 'listings', 'listing-images', 'documents', 'logos']);

// Tables referenced only by edge functions that no migration defines, and whose
// callers are not reachable from the frontend. Recorded so this script can be
// blocking today; remove an entry as its feature is either built or deleted.
// See the deep-dive findings in docs/PLATFORM_AUDIT_2026-07.md.
const KNOWN_UNDEFINED_TABLES = new Set([
  'analytics_events', // ingest-analytics; src/lib/visitorAnalytics.ts is unimported
  'purchases', // stripe-webhook, inside a try/catch
  'push_tokens', // register/unregister-push-token, never invoked from src/
  'seo_backlinks', // sync-backlinks, never invoked from src/
  'seo_keyword_tracking_summary', // track-serp-positions, never invoked from src/
]);

const failures = [];
const notes = [];

function check(name, fn) {
  const found = fn();
  if (found.length) {
    failures.push({ name, found });
    console.log(`FAIL  ${name}  (${found.length})`);
    for (const f of found.slice(0, 25)) console.log(`        ${f}`);
    if (found.length > 25) console.log(`        ... and ${found.length - 25} more`);
  } else {
    console.log(`ok    ${name}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Trigger functions must only reference columns that exist on their table.
//    This is the class of bug that broke every INSERT into leads (NEW.type) and
//    every UPDATE to seo_monitoring_schedules (NEW.updated_at). PL/pgSQL
//    resolves record fields at run time, so nothing catches it until it fires.
// ---------------------------------------------------------------------------
check('trigger functions reference only real columns', () =>
  q(`
    WITH trig AS (
      SELECT c.relname AS tbl, p.proname AS fn, p.prosrc AS src
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_proc p ON p.oid = t.tgfoid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE NOT t.tgisinternal AND n.nspname = 'public'
    ), refs AS (
      SELECT DISTINCT tbl, fn,
             lower(regexp_replace(m[1], '^(NEW|OLD)\\.', '', 'i')) AS col
      FROM trig, regexp_matches(src, '\\y(?:NEW|OLD)\\.([a-zA-Z_][a-zA-Z0-9_]*)', 'gi') AS m
    )
    SELECT r.fn || ' on ' || r.tbl || ' references missing column: ' || r.col
    FROM refs r
    WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = r.tbl AND c.column_name = r.col
    )
    ORDER BY 1;
  `)
);

// ---------------------------------------------------------------------------
// 2. Row level security must be enabled on every table. Supabase grants ALL on
//    public tables to anon and authenticated, and the anon key ships in the
//    frontend bundle, so a table without RLS is world-readable and -writable.
// ---------------------------------------------------------------------------
check('row level security enabled on every table', () =>
  q(`
    SELECT c.relname || ' has RLS disabled'
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
    ORDER BY 1;
  `)
);

// ---------------------------------------------------------------------------
// 3. Every table the code queries must exist.
// ---------------------------------------------------------------------------
const relations = new Set(
  q(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`)
);

check('every table referenced in code exists', () => {
  const out = [];
  for (const file of sourceFiles(['src', 'supabase/functions'])) {
    // Drop storage.from(...) so buckets are not mistaken for tables.
    const text = stripComments(readFileSync(file, 'utf8')).replace(
      /storage\s*\.\s*from\([^)]*\)/g,
      ''
    );
    for (const m of text.matchAll(/\.from\(\s*['"]([a-z0-9_]+)['"]/g)) {
      const t = m[1];
      if (relations.has(t) || STORAGE_BUCKETS.has(t) || KNOWN_UNDEFINED_TABLES.has(t)) continue;
      out.push(`${t} <- ${file.replace(ROOT + '/', '')}`);
    }
  }
  return [...new Set(out)].sort();
});

// ---------------------------------------------------------------------------
// 4. Every RPC the code calls must exist. A missing one is a run-time 404 that
//    no build step surfaces.
// ---------------------------------------------------------------------------
const routines = new Set(
  q(`
    SELECT p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public';
  `)
);

check('every RPC referenced in code exists', () => {
  const out = [];
  for (const file of sourceFiles(['src', 'supabase/functions'])) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const m of text.matchAll(/\.rpc\(\s*['"]([a-z0-9_]+)['"]/g)) {
      if (routines.has(m[1])) continue;
      out.push(`${m[1]} <- ${file.replace(ROOT + '/', '')}`);
    }
  }
  return [...new Set(out)].sort();
});

// ---------------------------------------------------------------------------
// 5. The ownership map in src/lib/security/ownership.ts must name real columns.
//    These helpers fail closed, so a wrong column name does not open a hole —
//    it silently denies every operation on that table, which is just as broken
//    and much harder to notice. `articles` was mapped to user_id when the column
//    is author_id.
// ---------------------------------------------------------------------------
check('security ownership map names real columns', () => {
  const out = [];
  const file = join(ROOT, 'src/lib/security/ownership.ts');
  const src = readFileSync(file, 'utf8');
  const block = src.match(/const OWNER_FIELD[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!block) {
    return ['could not locate the OWNER_FIELD map in src/lib/security/ownership.ts'];
  }
  for (const m of stripComments(block[1]).matchAll(/([a-z0-9_]+)\s*:\s*'([a-z0-9_]+)'/g)) {
    const [, table, column] = m;
    if (!relations.has(table)) {
      out.push(`OWNER_FIELD maps '${table}', which is not a table`);
      continue;
    }
    const hit = q(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='${table}' AND column_name='${column}';
    `);
    if (!hit.length) out.push(`OWNER_FIELD['${table}'] = '${column}' — no such column`);
  }
  return out;
});

// ---------------------------------------------------------------------------
// 6. Smoke test the lead pipeline. Lead capture is the platform's core value
//    proposition and is guarded by seven triggers, several of which swallow
//    their own errors, so "the insert succeeded" is not sufficient — assert the
//    side effects too.
// ---------------------------------------------------------------------------
check('lead insert pipeline works end to end', () => {
  const out = [];
  const uid = '00000000-dead-beef-0000-00000000ab01';
  const lid = '00000000-dead-beef-0000-00000000ab02';
  try {
    q(`
      INSERT INTO auth.users (id, email) VALUES ('${uid}', 'schemacheck@example.test')
        ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.profiles (id, username, full_name)
        VALUES ('${uid}', 'schemacheck', 'Schema Check')
        ON CONFLICT (id) DO NOTHING;
    `);

    // The insert itself. A trigger referencing a bad column aborts this.
    q(`
      INSERT INTO public.leads (id, user_id, name, email, lead_type, source)
      VALUES ('${lid}', '${uid}', 'Schema Check', 'lead@example.test', 'buyer', 'contact_form');
    `);

    // auto_log_lead_creation must have logged an activity.
    const acts = q(
      `SELECT count(*) FROM public.lead_activities WHERE lead_id = '${lid}';`
    );
    if (acts[0] === '0') {
      out.push('lead created but auto_log_lead_creation logged no activity');
    }

    // A note must be attachable to the lead (lead_notes must exist).
    q(`INSERT INTO public.lead_notes (lead_id, note) VALUES ('${lid}', 'schema check');`);
  } catch (e) {
    const msg = String(e.stderr || e.message)
      .split('\n')
      .filter((l) => l.includes('ERROR'))
      .join('; ');
    out.push(msg || 'lead pipeline raised an error');
  } finally {
    try {
      q(`DELETE FROM public.leads WHERE id = '${lid}';
         DELETE FROM public.profiles WHERE id = '${uid}';
         DELETE FROM auth.users WHERE id = '${uid}';`);
    } catch {
      /* cleanup is best effort */
    }
  }
  return out;
});

// ---------------------------------------------------------------------------
// Informational: SECURITY DEFINER functions without a pinned search_path are a
// privilege-escalation risk. Reported, not enforced, because the existing
// codebase has a backlog of them.
// ---------------------------------------------------------------------------
const unpinned = q(`
  SELECT p.proname
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef
    AND NOT EXISTS (
      SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) cfg WHERE cfg LIKE 'search\\_path=%'
    )
  ORDER BY 1;
`);
if (unpinned.length) {
  notes.push(
    `${unpinned.length} SECURITY DEFINER function(s) do not pin search_path: ` +
      unpinned.slice(0, 10).join(', ') +
      (unpinned.length > 10 ? ', ...' : '')
  );
}

console.log();
for (const n of notes) console.log(`note  ${n}`);

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll schema checks passed.');
