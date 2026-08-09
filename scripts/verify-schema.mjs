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
// US-075 reconciled three names for listing photos ('listings',
// 'listing-images', 'listing-photos') onto the one the migration creates.
// Check 13 now verifies every referenced bucket exists, so a stale name here
// would let check 4 mistake it for a table.
const STORAGE_BUCKETS = new Set(['avatars', 'listing-photos', 'brokerage-logos']);

// Tables the code references that no migration creates. Empty since US-059:
// each of the five former entries was an unfinished feature whose caller was
// unreachable from src/, and all five callers were deleted rather than having
// tables invented for them. Adding an entry here needs a story against it.
const KNOWN_UNDEFINED_TABLES = new Set([]);

// Policies that reach anon/authenticated with an unconditional predicate and are
// meant to. Keyed `table:CMD`. Everything not listed here (and not in
// KNOWN_OVERPERMISSIVE below) fails check 3.
//
// The bar for this list: the data is already public, or the command is an
// append-only submission from a page that has no session to authenticate with.
const PUBLIC_BY_DESIGN = new Map([
  ['leads:INSERT', 'public lead-capture forms on every profile — the core product'],
  ['analytics_views:INSERT', 'profile view counter, fired by anonymous visitors'],
  ['mortgage_calculations:INSERT', 'anonymous mortgage calculator on public profiles'],
  ['feature_catalog:SELECT', 'plan/pricing catalog, rendered on the public pricing page'],
  ['seo_settings:SELECT', 'site-wide SEO config that is emitted into every page head'],
  // The free lead-gen tools under /tools/* are used by visitors with no account,
  // so the submission itself has to be open. Reading them back is not — see
  // KNOWN_OVERPERMISSIVE.
  ['instagram_bio_analyses:INSERT', 'anonymous submission from the Instagram bio tool'],
  ['instagram_bio_analytics:INSERT', 'anonymous usage event from the Instagram bio tool'],
  ['instagram_bio_email_captures:INSERT', 'anonymous email capture from the Instagram bio tool'],
  ['listing_descriptions:INSERT', 'anonymous submission from the listing description tool'],
  ['listing_generator_analytics:INSERT', 'anonymous usage event from the listing tool'],
  ['listing_email_captures:INSERT', 'anonymous email capture from the listing tool'],
]);

// Pre-existing over-permissive policies, recorded so this check can be blocking
// today rather than someday. These are defects, not decisions -- each one needs a
// real exposure with a story against it. Take an entry off the list as it is
// fixed; do not add to it without one.
//
// Empty since US-067 closed the last twelve (the /tools/* lead-gen tables,
// content_suggestions and seo_alert_rules) in migration 20260806000004.
const KNOWN_OVERPERMISSIVE = new Map([]);

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
// 3. RLS being *enabled* says nothing about what the policies *grant*. Check 2
//    passed on every table involved in the two worst defects this repo has had:
//
//      CREATE POLICY "Service role can manage audit logs"
//        ON audit_logs FOR ALL USING (true);
//
//    Postgres defaults an omitted TO clause to TO PUBLIC, and Supabase grants
//    ALL on public tables to anon — whose key ships in the frontend bundle — so
//    that policy let any visitor read and delete the compliance audit trail.
//    The same shape on `links` let any visitor repoint any profile's links.
//    Both were invisible to every gate in the repo. (US-063, US-064.)
//
//    So: a permissive policy that reaches anon/authenticated with an
//    unconditional predicate must be declared, either as intentional
//    (PUBLIC_BY_DESIGN) or as a known defect with a story (KNOWN_OVERPERMISSIVE).
//    Anything else fails. `TO service_role` is always fine — service_role is
//    BYPASSRLS anyway and never reachable with a publishable key.
// ---------------------------------------------------------------------------
check('no undeclared over-permissive RLS policy', () => {
  const rows = q(`
    SELECT tablename || ':' || cmd || '\t' || policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
      AND (roles::text = '{public}' OR roles::text ~ '\\manon\\M|\\mauthenticated\\M')
      AND ( (cmd <> 'INSERT' AND qual = 'true')
         OR (cmd = 'INSERT'  AND with_check = 'true') )
    ORDER BY 1;
  `);
  const out = [];
  for (const row of rows) {
    const [key, policyname] = row.split('\t');
    if (PUBLIC_BY_DESIGN.has(key)) continue;
    if (KNOWN_OVERPERMISSIVE.has(key)) continue;
    out.push(
      `${key} "${policyname}" is unconditional and reaches anon/authenticated. ` +
        `Scope it (TO service_role, or a real USING predicate), or declare it in ` +
        `PUBLIC_BY_DESIGN with a reason.`
    );
  }
  return out;
});

// Stale allowlist entries are their own kind of rot: they read as "still broken"
// long after the fix landed, and they hide the next regression on that table.
for (const [key, story] of KNOWN_OVERPERMISSIVE) {
  const [table, cmd] = key.split(':');
  const still = q(`
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = '${table}' AND cmd = '${cmd}'
      AND permissive = 'PERMISSIVE'
      AND (roles::text = '{public}' OR roles::text ~ '\\manon\\M|\\mauthenticated\\M')
      AND ( (cmd <> 'INSERT' AND qual = 'true') OR (cmd = 'INSERT' AND with_check = 'true') )
    LIMIT 1;
  `);
  if (!still.length) {
    notes.push(`KNOWN_OVERPERMISSIVE entry ${key} (${story}) is fixed — remove it from the list`);
  }
}

// ---------------------------------------------------------------------------
// 4. Every table the code queries must exist.
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
// 5. Every RPC the code calls must exist. A missing one is a run-time 404 that
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
// 6. The ownership map in src/lib/security/ownership.ts must name real columns.
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
// 7. Smoke test the lead pipeline. Lead capture is the platform's core value
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
// 8. Every SECURITY DEFINER function must pin search_path. Such a function runs
//    with its owner's privileges, so if the caller controls how unqualified
//    names inside it resolve, the caller controls what it operates on. Postgres
//    searches the temporary schema first for relation names unless pg_temp is
//    named explicitly, and any role may create temp tables -- so without a pin,
//    `CREATE TEMP TABLE audit_logs (...)` diverts an unqualified
//    `INSERT INTO audit_logs` inside the function into the attacker's table.
//    Demonstrated both ways in the US-062 write-up.
//
//    Was a note rather than a check while a backlog of 50 existed; the backlog
//    is cleared (20260806000003), so this is blocking now.
// ---------------------------------------------------------------------------
check('SECURITY DEFINER functions pin search_path', () =>
  q(`
    SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
             || ' is SECURITY DEFINER without a pinned search_path'
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) cfg WHERE cfg LIKE 'search\\_path=%'
      )
    ORDER BY 1;
  `)
);

// ---------------------------------------------------------------------------
// 9. Every column named in a .select('...') list must exist on the target table.
//    Check 4 above proves the TABLE exists; nothing proved the COLUMNS did, and
//    that gap is what shipped US-070 and US-083. Five edge functions selected
//    `profiles.email`, a column that has never existed — PostgREST rejects the
//    whole query for one unknown column, and because every one of those call
//    sites destructured the result without an error branch, the value came back
//    undefined and the path silently did nothing. That cost agent lead
//    notifications, Zapier webhook deliveries, contact-form alerts and Stripe
//    dunning email, all returning HTTP 200. generate-sitemap lost every article
//    and every listing the same way.
//
//    tsc catches this in src/ when types.ts is in sync, but it does not run over
//    supabase/functions/ (Deno, and CI's deno check does not know the schema),
//    and the tsc baseline is not blocking. This check covers both trees.
// ---------------------------------------------------------------------------
const columnsByTable = new Map();
for (const row of q(`
  SELECT table_name || '|' || string_agg(column_name, ',')
  FROM information_schema.columns
  WHERE table_schema = 'public'
  GROUP BY table_name;
`)) {
  const [t, cols] = row.split('|');
  columnsByTable.set(t, new Set(cols.split(',')));
}

/**
 * PostgREST select lists carry more than bare column names: embedded resources
 * `profiles(username)` / `profiles!inner(...)`, aliases `alias:column`, JSON
 * paths `col->>key`, casts `col::text` and aggregates `count(...)`. Strip all of
 * that and return the plain top-level column names.
 */
function selectedColumns(list) {
  if (list.includes('*')) return [];
  const withoutEmbeds = list.replace(/[a-z0-9_]+\s*(?:!\s*[a-z]+)?\s*\([^()]*\)/gi, '');
  return withoutEmbeds
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => c.replace(/^[a-z0-9_]+\s*:\s*/i, ''))
    .map((c) => c.split(/->>?|::/)[0].trim())
    .filter((c) => c && c !== '*' && /^[a-z0-9_]+$/.test(c));
}

check('every column referenced in a .select() exists', () => {
  const out = [];
  for (const file of sourceFiles(['src', 'supabase/functions'])) {
    if (file.endsWith('src/integrations/supabase/types.ts')) continue;
    const text = stripComments(readFileSync(file, 'utf8')).replace(
      /storage\s*\.\s*from\([^)]*\)/g,
      ''
    );
    // `.from('t')` followed by `.select('...')`, allowing whitespace/newlines
    // and template literals between them.
    for (const m of text.matchAll(
      /\.from\(\s*['"]([a-z0-9_]+)['"]\s*\)\s*\.select\(\s*[`'"]([^`'"]*)[`'"]/g
    )) {
      const [, table, list] = m;
      const cols = columnsByTable.get(table);
      if (!cols) continue; // check 4 owns unknown tables
      for (const col of selectedColumns(list)) {
        if (cols.has(col)) continue;
        out.push(`${table}.${col} <- ${file.replace(ROOT + '/', '')}`);
      }
    }
  }
  return [...new Set(out)].sort();
});

// ---------------------------------------------------------------------------
// 10. Every trigger function defined in public must be attached to something.
//     handle_new_user() survived the US-060 squash but `on_auth_user_created`
//     did not — the baseline came from a public-schema dump and the trigger
//     lives on auth.users. Check 1 happily validated the orphaned function's
//     column references. Signup created no profile, no role and no default
//     subscription until US-068 restored it.
// ---------------------------------------------------------------------------
check('every trigger function is attached to a table', () =>
  q(`
    SELECT p.proname || '() returns trigger but no trigger references it'
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype = 'trigger'::regtype
      AND NOT EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgfoid = p.oid)
    ORDER BY 1;
  `)
);

// ---------------------------------------------------------------------------
// 11. A view granted to anon/authenticated must set security_invoker.
//     Without it a view runs with its OWNER's privileges and RLS on the base
//     tables does not apply, so the view is a hole straight through every
//     policy behind it. Twelve views were granted to anon this way:
//     user_subscription_details handed out stripe_customer_id and
//     stripe_subscription_id, lead_activity_summary handed out cross-tenant
//     lead activity. Fixed in US-071.
// ---------------------------------------------------------------------------
check('views granted to anon/authenticated set security_invoker', () =>
  q(`
    SELECT DISTINCT c.relname || ' is granted to ' || g.grantee || ' without security_invoker'
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN information_schema.role_table_grants g
      ON g.table_schema = n.nspname AND g.table_name = c.relname
    WHERE n.nspname = 'public'
      AND c.relkind IN ('v', 'm')
      AND g.grantee IN ('anon', 'authenticated')
      AND g.privilege_type = 'SELECT'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(c.reloptions, '{}')) o
        WHERE o = 'security_invoker=on' OR o = 'security_invoker=true'
      )
    ORDER BY 1;
  `)
);

// ---------------------------------------------------------------------------
// 12. A secret-shaped column must not sit on a table anon can actually read.
//     RLS filters rows, not columns, so a policy cannot make a column private —
//     only a column privilege can. "Public can view limited profile info" was
//     row-scoped and published every agent's zapier_webhook_url, a bearer token
//     for their automations; enterprise_sso_config published oidc_client_secret
//     and saml_certificate. Neither tripped check 3, because both quals are
//     conditional (`is_published = true`, `active = true`) rather than a literal
//     `true`. Fixed in US-072 and US-073.
//
//     Reachability, not the grant, is what matters here. Supabase grants ALL on
//     every public table to anon by default, so a column privilege on its own
//     says nothing. The dangerous combination is: anon still holds the column
//     privilege AND the table has a SELECT policy anon can actually satisfy —
//     one whose qualifier does not depend on auth.uid() or has_role(), both of
//     which are empty for an anonymous caller.
// ---------------------------------------------------------------------------
check('no secret-shaped column is reachable by anon', () =>
  q(`
    WITH anon_readable AS (
      SELECT DISTINCT p.tablename
      FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.cmd IN ('SELECT', 'ALL')
        AND ('anon' = ANY (p.roles) OR 'public' = ANY (p.roles))
        AND COALESCE(p.qual, 'true') NOT ILIKE '%auth.uid()%'
        AND COALESCE(p.qual, 'true') NOT ILIKE '%has_role%'
        AND COALESCE(p.qual, 'true') NOT ILIKE '%auth.role()%'
        AND COALESCE(p.qual, 'true') NOT ILIKE '%auth.jwt()%'
    )
    SELECT g.table_name || '.' || g.column_name
             || ' is reachable by ' || g.grantee
             || ' (table has an anon-satisfiable SELECT policy)'
    FROM information_schema.column_privileges g
    JOIN anon_readable a ON a.tablename = g.table_name
    WHERE g.table_schema = 'public'
      AND g.grantee = 'anon'
      AND g.privilege_type = 'SELECT'
      AND (
        g.column_name LIKE '%secret%'
        OR g.column_name LIKE '%webhook_url%'
        OR g.column_name LIKE '%certificate%'
        OR g.column_name LIKE '%refresh_token%'
        OR g.column_name LIKE '%access_token%'
        OR g.column_name LIKE '%password%'
        OR g.column_name LIKE '%api_key%'
      )
    ORDER BY 1;
  `)
);

// ---------------------------------------------------------------------------
// 13. Every bucket named in storage.from() must be created by a migration.
//     There are no storage.buckets rows and no storage.objects policies in the
//     applied schema at all — bucket creation lives only in the unapplied
//     archive, another US-060 casualty. Three different names are in use for
//     listing photos ('listings', 'listing-images', archived 'listing-photos'),
//     so at least one upload path writes to a bucket that does not exist.
//     US-075 owns the fix; this check is a NOTE until then so it can land
//     blocking the moment that story does.
// ---------------------------------------------------------------------------
{
  const declared = new Set(q(`SELECT id FROM storage.buckets;`));
  const referenced = new Set();
  for (const file of sourceFiles(['src', 'supabase/functions'])) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const m of text.matchAll(/storage\s*\.\s*from\(\s*['"]([a-z0-9_-]+)['"]/g)) {
      referenced.add(m[1]);
    }
  }
  const missing = [...referenced].filter((b) => !declared.has(b)).sort();
  if (missing.length) {
    notes.push(
      `US-075: ${missing.length} storage bucket(s) referenced in code but created by no migration: ${missing.join(', ')}`
    );
  }
}

console.log();
for (const n of notes) console.log(`note  ${n}`);

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll schema checks passed.');
