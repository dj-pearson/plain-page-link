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
  // leads:INSERT was here, described as "public lead-capture forms on every
  // profile — the core product". No public form had used it since US-069:
  // leadSubmission.ts and ContactBlock.tsx both go through the submit-lead
  // edge function, which runs with the service role and is exempt from RLS.
  // The policy it excused let anyone holding the anon key — which ships in the
  // bundle — insert contact-less leads into any agent's CRM, firing nine
  // triggers each. Dropped in 20260902000001 (US-097). Do not re-add it: an
  // agent inserting into their own CRM is covered by "Users can insert their
  // own leads", and the public path needs no policy at all.
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
// 5b. Every rpc() call's NAMED ARGUMENTS must match the function's parameters.
//
//     Check 5 matches by name only, which is how US-098 survived it: the
//     edge-function rate limiter called check_rate_limit with p_ip_address and
//     p_endpoint — the column names of an orphaned `rate_limits` table — while
//     the function takes p_identifier and p_limit_type. PostgREST resolves an
//     overload by its named arguments, so the mismatch was a 404, the limiter's
//     error branch failed open, and thirteen edge functions believed they were
//     rate limited when no check had ever succeeded. Nothing in tsc, deno check
//     or the unit tests can see this; only the applied schema can.
//
//     A call is checked only when its argument object is a literal this can
//     read. Spreads, computed keys and variables are skipped rather than
//     guessed at — reported as notes so they are visible without being fatal.
// ---------------------------------------------------------------------------
const rpcParams = new Map();
for (const row of q(`
  SELECT p.proname || E'\\t' || array_to_string(
           ARRAY(
             -- proargnames covers OUT columns too; for a TABLE-returning
             -- function like check_rate_limit that would list allowed /
             -- remaining / reset_at as if they were parameters, and the check
             -- would accept a call passing them. proargmodes is NULL when
             -- every argument is IN, and otherwise marks each one.
             SELECT p.proargnames[i]
             FROM generate_subscripts(p.proargnames, 1) AS i
             WHERE p.proargmodes IS NULL
                OR p.proargmodes[i] IN ('i', 'b', 'v')
           ), ','
         )
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proargnames IS NOT NULL;
`)) {
  const [name, args] = row.split('\t');
  // An overloaded function contributes every parameter name it might accept;
  // this check catches names no overload has, not a wrong choice among them.
  const set = rpcParams.get(name) ?? new Set();
  for (const a of (args ?? '').split(',').filter(Boolean)) set.add(a);
  rpcParams.set(name, set);
}

/** The `{ ... }` argument object of a .rpc() call, if it is a readable literal. */
function rpcArgObject(text, from) {
  const open = text.indexOf('{', from);
  if (open === -1) return null;
  // Bail if a non-object argument (a variable, a spread) got there first.
  const between = text.slice(from, open);
  if (!/^[\s,]*$/.test(between)) return null;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(open + 1, i);
    }
  }
  return null;
}

/**
 * Top-level keys of an object literal's body.
 *
 * Two things make a naive scan wrong, and both produced false positives here:
 *   - nesting: `log_audit_event({ p_details: { count: n } })` passes one
 *     argument, not two;
 *   - ternaries: in `p_action: cond ? 'mfa_enable' : 'mfa_verify'` the second
 *     colon belongs to the conditional, not to a new key.
 * So this tracks bracket depth and pending `?`s rather than matching a regex.
 */
function topLevelKeys(body) {
  const keys = [];
  let depth = 0;
  let pendingTernary = 0;
  let quote = null;
  let token = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) {
      if (c === quote && body[i - 1] !== '\\') quote = null;
      else if (depth === 0) token += c;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      continue;
    }
    if (c === '{' || c === '[' || c === '(') {
      depth++;
    } else if (c === '}' || c === ']' || c === ')') {
      depth--;
    } else if (depth === 0 && c === '?') {
      pendingTernary++;
    } else if (depth === 0 && c === ':') {
      if (pendingTernary > 0) {
        pendingTernary--;
      } else {
        const k = token.trim();
        if (/^[a-z0-9_]+$/i.test(k)) keys.push(k);
      }
      token = '';
    } else if (depth === 0 && c === ',') {
      token = '';
      pendingTernary = 0;
    } else if (depth === 0) {
      token += c;
    }
  }
  return keys;
}

check("every rpc() call's named arguments exist on the function", () => {
  const out = [];
  for (const file of sourceFiles(['src', 'supabase/functions'])) {
    const text = stripComments(readFileSync(file, 'utf8'));
    for (const m of text.matchAll(/\.rpc\(\s*['"]([a-z0-9_]+)['"]\s*,/g)) {
      const fn = m[1];
      const params = rpcParams.get(fn);
      if (!params) continue; // check 5 already reports a function that does not exist
      const body = rpcArgObject(text, m.index + m[0].length);
      if (body === null) {
        notes.push(`rpc('${fn}') in ${file.replace(ROOT + '/', '')} passes a non-literal argument object — not checked`);
        continue;
      }
      if (/\.\.\./.test(body) || /\[/.test(body.split(':')[0] ?? '')) {
        notes.push(`rpc('${fn}') in ${file.replace(ROOT + '/', '')} uses a spread or computed key — not checked`);
        continue;
      }
      for (const key of topLevelKeys(body)) {
        if (params.has(key)) continue;
        out.push(
          `${fn}({ ${key}: ... }) <- ${file.replace(ROOT + '/', '')}; accepts: ${[...params].sort().join(', ')}`
        );
      }
    }
  }
  return [...new Set(out)].sort();
});

// ---------------------------------------------------------------------------
// 5c. Plain (non-trigger) plpgsql functions must also name real columns.
//
//     Check 1 only sees functions attached to a trigger, which is how US-100
//     survived it: log_lead_activity, log_lead_call and log_lead_email each end
//     with `UPDATE public.leads SET last_contacted_at = NOW()` and `leads` has
//     contacted_at, not last_contacted_at. plpgsql resolves the name when the
//     statement first executes, so CREATE FUNCTION succeeded, every structural
//     lint passed, and the first real call raised — after inserting the
//     activity row, so the exception rolled back both.
//
//     This parses the UPDATE ... SET and INSERT INTO ... (cols) targets out of
//     every plpgsql body in `public` and checks them against the catalog. It is
//     deliberately conservative: only statements naming a table this schema
//     knows are checked, and only simple column lists. A body that defeats the
//     parse is skipped rather than guessed at — the alternative to a partial
//     check here is no check at all, which is what let this through.
// ---------------------------------------------------------------------------
check('plpgsql function bodies reference only real columns', () => {
  const out = [];
  const rows = q(`
    SELECT p.proname || E'\\x01' || replace(p.prosrc, E'\\n', E'\\x02')
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname = 'public' AND l.lanname = 'plpgsql';
  `);

  const columnsOf = (table) =>
    new Set(
      q(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table}';
      `)
    );
  const colCache = new Map();
  const cols = (t) => {
    if (!colCache.has(t)) colCache.set(t, columnsOf(t));
    return colCache.get(t);
  };

  for (const row of rows) {
    const sep = row.indexOf('\x01');
    if (sep === -1) continue;
    const fn = row.slice(0, sep);
    const src = row.slice(sep + 1).replace(/\x02/g, '\n');
    // Comments in a function body are prose, not statements.
    const body = src.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

    // UPDATE [public.]<table> SET a = ..., b = ...
    for (const m of body.matchAll(
      /\bUPDATE\s+(?:public\.)?([a-z0-9_]+)\s+SET\s+([\s\S]*?)(?=\bWHERE\b|\bRETURNING\b|;)/gi
    )) {
      const table = m[1].toLowerCase();
      const known = relations.has(table) ? cols(table) : null;
      if (!known || known.size === 0) continue;
      for (const a of m[2].matchAll(/(?:^|,)\s*([a-z0-9_]+)\s*=/gi)) {
        const col = a[1].toLowerCase();
        if (!known.has(col)) out.push(`${fn}: UPDATE ${table} SET ${col} — no such column`);
      }
    }

    // INSERT INTO [public.]<table> ( a, b, c )
    for (const m of body.matchAll(
      /\bINSERT\s+INTO\s+(?:public\.)?([a-z0-9_]+)\s*\(([^)]*)\)/gi
    )) {
      const table = m[1].toLowerCase();
      const known = relations.has(table) ? cols(table) : null;
      if (!known || known.size === 0) continue;
      const list = m[2].split(',').map((c) => c.trim().toLowerCase());
      // A column list is names only; anything else means this matched a
      // function call or a subquery, not an insert target.
      if (!list.every((c) => /^[a-z0-9_]+$/.test(c))) continue;
      for (const col of list) {
        if (!known.has(col)) out.push(`${fn}: INSERT INTO ${table} (${col}) — no such column`);
      }
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
// 6b. The rate limiter must actually refuse. US-098's failure was not that the
//     limit was wrong — it was that no check ever ran, because the RPC was
//     called with argument names the function does not have and the error
//     branch failed open. Check 5b stops the names drifting again; this
//     exercises the function itself, so "the limiter works" is a demonstrated
//     fact and not an inference from a signature.
// ---------------------------------------------------------------------------
check('check_rate_limit refuses the 11th call in a window', () => {
  const out = [];
  const id = 'schemacheck-198.51.100.7';
  const type = 'submit-lead-schemacheck';
  try {
    q(`DELETE FROM public.rate_limit_entries WHERE identifier = '${id}';`);

    // Ten calls with a limit of ten: every one allowed, remaining counting down.
    for (let i = 1; i <= 10; i++) {
      const [row] = q(
        `SELECT allowed || ',' || remaining FROM public.check_rate_limit('${id}', '${type}', 10, 60);`
      );
      const [allowed, remaining] = row.split(',');
      // `allowed || ','` casts the boolean to text, so it reads true/false
      // rather than psql's t/f column display.
      if (allowed !== 'true') {
        out.push(`call ${i} of 10 was refused (remaining ${remaining})`);
        break;
      }
      if (Number(remaining) !== 10 - i) {
        out.push(`call ${i} reported remaining ${remaining}, expected ${10 - i}`);
        break;
      }
    }

    // The eleventh, inside the same window, must be refused.
    const [eleventh] = q(
      `SELECT allowed || ',' || remaining FROM public.check_rate_limit('${id}', '${type}', 10, 60);`
    );
    if (eleventh !== 'false,0') {
      out.push(`the 11th call returned "${eleventh}", expected "false,0"`);
    }

    // cleanup_rate_limits() must be able to reach the row check_rate_limit
    // wrote. It used to delete from `rate_limits`, a different and orphaned
    // table, so nothing was ever collected (fixed in 20260902000002).
    const before = q(
      `SELECT count(*) FROM public.rate_limit_entries WHERE identifier = '${id}';`
    );
    if (before[0] === '0') {
      out.push('check_rate_limit wrote no rate_limit_entries row');
    }
    q(
      `UPDATE public.rate_limit_entries SET window_end = now() - INTERVAL '2 days' WHERE identifier = '${id}';`
    );
    q(`SELECT public.cleanup_rate_limits();`);
    const after = q(
      `SELECT count(*) FROM public.rate_limit_entries WHERE identifier = '${id}';`
    );
    if (after[0] !== '0') {
      out.push('cleanup_rate_limits() left an expired rate_limit_entries row behind');
    }
  } catch (e) {
    const msg = String(e.stderr || e.message)
      .split('\n')
      .filter((l) => l.includes('ERROR'))
      .join('; ');
    out.push(msg || 'rate limit check raised an error');
  } finally {
    try {
      q(`DELETE FROM public.rate_limit_entries WHERE identifier = '${id}';`);
    } catch {
      /* cleanup is best effort */
    }
  }
  return out;
});

// ---------------------------------------------------------------------------
// 6c. The three lead-activity RPCs must actually run.
//
//     Check 5c reads their bodies for unknown column names, which is what
//     caught US-100. This executes them, because a plpgsql body has more ways
//     to fail than a bad column: an ownership guard that never passes, a CHECK
//     constraint on activity_type, a NOT NULL nobody fills. US-102 puts these
//     on the UI's critical path, so "it parses" is not the bar.
// ---------------------------------------------------------------------------
check('log_lead_activity / _call / _email run against a real lead', () => {
  const out = [];
  const uid = '00000000-dead-beef-0000-00000000ac01';
  const lid = '00000000-dead-beef-0000-00000000ac02';
  const asOwner = (sql) =>
    q(`SET ROLE authenticated;
       SET request.jwt.claim.sub = '${uid}';
       ${sql}`);
  try {
    q(`
      INSERT INTO auth.users (id, email) VALUES ('${uid}', 'rpccheck@example.test')
        ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.profiles (id, username, full_name)
        VALUES ('${uid}', 'rpccheck', 'RPC Check')
        ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.leads (id, user_id, name, encrypted_email, lead_type)
        VALUES ('${lid}', '${uid}', 'RPC Check', 'enc:v1:rpccheck', 'buyer');
    `);

    asOwner(`SELECT public.log_lead_call('${lid}', 'connected', 120, 'notes');`);
    asOwner(`SELECT public.log_lead_email('${lid}', 'Subject', 'lead@example.test', 'body');`);
    asOwner(`SELECT public.log_lead_activity('${lid}', 'meeting', 'content', 'title');`);

    const types = q(
      `SELECT string_agg(DISTINCT activity_type, ',' ORDER BY activity_type)
       FROM public.lead_activities WHERE lead_id = '${lid}';`
    );
    for (const t of ['call', 'email', 'meeting']) {
      if (!(types[0] ?? '').includes(t)) out.push(`log_lead_* left no '${t}' activity`);
    }

    // Every one of the three sets contacted_at. It records FIRST contact — the
    // Leads page measures response time from it — so it must be set, and a
    // later call must not move it.
    const [firstContact] = q(
      `SELECT coalesce(contacted_at::text, '') FROM public.leads WHERE id = '${lid}';`
    );
    if (!firstContact) {
      out.push('log_lead_* did not set leads.contacted_at');
    } else {
      asOwner(`SELECT public.log_lead_call('${lid}', 'connected', 60, 'later');`);
      const [afterSecond] = q(
        `SELECT coalesce(contacted_at::text, '') FROM public.leads WHERE id = '${lid}';`
      );
      if (afterSecond !== firstContact) {
        out.push('a later call moved leads.contacted_at; it records first contact');
      }
    }
  } catch (e) {
    const msg = String(e.stderr || e.message)
      .split('\n')
      .filter((l) => l.includes('ERROR'))
      .join('; ');
    out.push(msg || 'a lead-activity RPC raised an error');
  } finally {
    try {
      q(`RESET ROLE;
         DELETE FROM public.leads WHERE id = '${lid}';
         DELETE FROM public.profiles WHERE id = '${uid}';
         DELETE FROM auth.users WHERE id = '${uid}';`);
    } catch {
      /* cleanup is best effort */
    }
  }
  return out;
});

// ---------------------------------------------------------------------------
// 6d. Zip routing rules must actually match.
//
//     auto_assign_lead compared criteria->>'zip' to NEW.property_address — a
//     full street address — so equality against a five-digit zip was never
//     true. Every zip rule fell through to the round-robin fallback, which is
//     the worst shape of failure: the lead IS assigned, so routing looks like
//     it works, just to the wrong person (US-105). A trigger like this can only
//     be checked by running it.
// ---------------------------------------------------------------------------
check('zip routing rules match against the property address', () => {
  const out = [];
  const owner = '00000000-dead-beef-0000-00000000ad01';
  const zipTarget = '00000000-dead-beef-0000-00000000ad02';
  const roundRobin = '00000000-dead-beef-0000-00000000ad03';
  const team = '00000000-dead-beef-0000-00000000ad04';
  const leadOf = (n) => `00000000-dead-beef-0000-00000000ae0${n}`;

  const assignee = (id) =>
    q(`SELECT coalesce(assigned_to::text, '') FROM public.leads WHERE id = '${id}';`)[0] ?? '';

  try {
    for (const [id, email] of [
      [owner, 'zipowner@example.test'],
      [zipTarget, 'ziptarget@example.test'],
      [roundRobin, 'zipfallback@example.test'],
    ]) {
      q(`INSERT INTO auth.users (id, email) VALUES ('${id}', '${email}')
         ON CONFLICT (id) DO NOTHING;`);
    }
    q(`
      INSERT INTO public.teams (id, owner_id, name)
      VALUES ('${team}', '${owner}', 'Schema Check Team') ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.team_members (team_id, user_id, accepted_at, invited_at)
      VALUES ('${team}', '${roundRobin}', now(), now()) ON CONFLICT DO NOTHING;
      INSERT INTO public.lead_routing_rules (team_id, name, criteria, assigned_to, priority, is_active)
      VALUES ('${team}', 'Schema check zip', '{"zip":"84604"}'::jsonb, '${zipTarget}', 1, true);
    `);

    const cases = [
      [1, '1234 N Canyon Rd, Provo, UT 84604', true, 'a zip inside a street address'],
      [2, '9 Elm St, Provo, UT 84604-1234', true, 'ZIP+4'],
      [3, '846040 Long Rd, Nowhere, UT 99999', false, 'a longer number containing the zip'],
      [4, '12 Other St, Elsewhere, UT 99999', false, 'an unrelated address'],
    ];

    for (const [n, address, shouldMatch, label] of cases) {
      q(`
        INSERT INTO public.leads (id, user_id, name, encrypted_email, lead_type, property_address)
        VALUES ('${leadOf(n)}', '${owner}', 'Zip Check', 'enc:v1:zipcheck', 'buyer',
                ${address === null ? 'NULL' : `'${address}'`});
      `);
      const got = assignee(leadOf(n)) === zipTarget;
      if (got !== shouldMatch) {
        out.push(
          `${label}: expected ${shouldMatch ? '' : 'no '}match on the zip rule, got ${got ? 'a match' : 'the round-robin fallback'}`
        );
      }
    }
  } catch (e) {
    const msg = String(e.stderr || e.message)
      .split('\n')
      .filter((l) => l.includes('ERROR'))
      .join('; ');
    out.push(msg || 'zip routing check raised an error');
  } finally {
    try {
      q(`
        DELETE FROM public.leads WHERE user_id = '${owner}';
        DELETE FROM public.lead_routing_rules WHERE team_id = '${team}';
        DELETE FROM public.team_round_robin WHERE team_id = '${team}';
        DELETE FROM public.team_members WHERE team_id = '${team}';
        DELETE FROM public.teams WHERE id = '${team}';
        DELETE FROM public.profiles WHERE id IN ('${owner}', '${zipTarget}', '${roundRobin}');
        DELETE FROM auth.users WHERE id IN ('${owner}', '${zipTarget}', '${roundRobin}');
      `);
    } catch {
      /* cleanup is best effort */
    }
  }
  return out;
});

// ---------------------------------------------------------------------------
// 6e. An anonymous visitor must be able to read an agent's visibility toggles,
//     and nothing else from that table.
//
//     usePublicProfile reads user_settings with the ANON client, and the only
//     SELECT policy was `auth.uid() = user_id`. maybeSingle() therefore
//     returned null for every real visitor and the hook fell back to all-true,
//     so an agent who switched "Show sold properties" off saw it work — because
//     they are logged in — while every visitor went on seeing them (US-110).
//
//     The same table holds the agent's private notification choices, so this
//     also asserts the column grant: the row being visible must not make
//     email_leads readable.
// ---------------------------------------------------------------------------
check('anon reads visibility toggles but not notification settings', () => {
  const out = [];
  const uid = '00000000-dead-beef-0000-00000000af01';
  try {
    q(`
      INSERT INTO auth.users (id, email) VALUES ('${uid}', 'visibility@example.test')
        ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.profiles (id, username, full_name, is_published)
        VALUES ('${uid}', 'visibilitycheck', 'Visibility Check', true)
        ON CONFLICT (id) DO UPDATE SET username = 'visibilitycheck', is_published = true;
      INSERT INTO public.user_settings (user_id, show_sold_properties)
        VALUES ('${uid}', false)
        ON CONFLICT (user_id) DO UPDATE SET show_sold_properties = false;
    `);

    const [visible] = q(`
      SET ROLE anon;
      SELECT count(*) FROM public.user_settings WHERE user_id = '${uid}';
    `);
    if (visible !== '1') {
      out.push(`anon sees ${visible} settings row(s) for a published profile, expected 1`);
    } else {
      const [flag] = q(`
        SET ROLE anon;
        SELECT show_sold_properties::text FROM public.user_settings WHERE user_id = '${uid}';
      `);
      if (flag !== 'false') {
        out.push(`anon read show_sold_properties as "${flag}", expected the stored false`);
      }
    }

    // The private columns must stay private even though the row is visible.
    // This probe is EXPECTED to fail, so its stderr is swallowed — otherwise a
    // passing check prints "ERROR: permission denied" and reads like a defect.
    let leaked = false;
    try {
      execFileSync(
        'psql',
        [
          DB_URL,
          '-tAq',
          '-v',
          'ON_ERROR_STOP=1',
          '-c',
          `SET ROLE anon; SELECT email_leads FROM public.user_settings WHERE user_id = '${uid}';`,
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      );
      leaked = true;
    } catch {
      /* expected: permission denied for table user_settings */
    }
    if (leaked) {
      out.push('anon can read user_settings.email_leads — the column grant is too wide');
    }

    // An unpublished profile's settings must not be readable at all.
    q(`UPDATE public.profiles SET is_published = false WHERE id = '${uid}';`);
    const [hidden] = q(`
      SET ROLE anon;
      SELECT count(*) FROM public.user_settings WHERE user_id = '${uid}';
    `);
    if (hidden !== '0') {
      out.push(`anon sees ${hidden} settings row(s) for an UNPUBLISHED profile, expected 0`);
    }
  } catch (e) {
    const msg = String(e.stderr || e.message)
      .split('\n')
      .filter((l) => l.includes('ERROR'))
      .join('; ');
    out.push(msg || 'visibility settings check raised an error');
  } finally {
    try {
      q(`RESET ROLE;
         DELETE FROM public.user_settings WHERE user_id = '${uid}';
         DELETE FROM public.profiles WHERE id = '${uid}';
         DELETE FROM auth.users WHERE id = '${uid}';`);
    } catch {
      /* cleanup is best effort */
    }
  }
  return out;
});

// ---------------------------------------------------------------------------
// 6f. The public counters must be throttled, and must agree with each other.
//
//     profiles.view_count came from increment_profile_views, an unthrottled
//     SECURITY DEFINER RPC callable by anon, while the analytics_views rows had
//     a per-visitor ceiling — so the headline number and the chart measured
//     different things, and anyone holding the anon key could inflate the
//     headline without limit. increment_link_clicks had no bound either
//     (US-115).
//
//     The counter is now a trigger on the throttled insert, so this asserts the
//     property that matters: 60 inserts produce the same bounded number in both
//     places, and the old unthrottled entry point is closed to anon.
// ---------------------------------------------------------------------------
check('view and click counters are throttled, and match the rows they count', () => {
  const out = [];
  const uid = '00000000-dead-beef-0000-00000000af02';
  const lid = '00000000-dead-beef-0000-00000000af03';
  try {
    q(`
      INSERT INTO auth.users (id, email) VALUES ('${uid}', 'counters@example.test')
        ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.profiles (id, username, full_name, is_published, view_count)
        VALUES ('${uid}', 'counterscheck', 'Counters Check', true, 0)
        ON CONFLICT (id) DO UPDATE SET username = 'counterscheck', is_published = true, view_count = 0;
      INSERT INTO public.links (id, user_id, title, url, position, click_count)
        VALUES ('${lid}', '${uid}', 'Site', 'https://example.com', 1, 0)
        ON CONFLICT (id) DO UPDATE SET click_count = 0;
      -- The rate-limit buckets outlive the rows this check creates, so without
      -- this a second run inside the same minute starts already over the
      -- ceiling and the check fails on its own leftovers. The table is
      -- rate_limit_entries, keyed on (identifier, limit_type). There is a
      -- separate rate_limits table that check_rate_limit does not touch.
      DELETE FROM public.rate_limit_entries WHERE identifier LIKE 'verify-visitor%';
    `);

    // Well past the 30/minute ceiling.
    const [counts] = q(`
      INSERT INTO public.analytics_views (user_id, visitor_id, device, source)
        SELECT '${uid}', 'verify-visitor', 'desktop', 'direct' FROM generate_series(1, 60);
      SELECT (SELECT count(*) FROM public.analytics_views WHERE user_id = '${uid}')
             || ',' || (SELECT view_count FROM public.profiles WHERE id = '${uid}');
    `);
    const [rows, counter] = String(counts).split(',');
    if (rows !== counter) {
      out.push(`analytics_views has ${rows} rows but profiles.view_count is ${counter}`);
    }
    if (Number(rows) > 30) {
      out.push(`${rows} views recorded from one visitor in a minute; the throttle is not applied`);
    }

    const [clicks] = q(`
      SELECT public.increment_link_clicks('${lid}', 'verify-visitor') FROM generate_series(1, 60);
      SELECT click_count::text FROM public.links WHERE id = '${lid}';
    `);
    if (Number(clicks) > 30) {
      out.push(`${clicks} link clicks from one visitor in a minute; the throttle is not applied`);
    }
    if (Number(clicks) === 0) {
      out.push('increment_link_clicks recorded nothing at all');
    }

    // The unthrottled path must be closed. Expected to fail, so stderr is
    // swallowed — otherwise a passing check prints "ERROR: permission denied".
    let reachable = false;
    try {
      execFileSync(
        'psql',
        [
          DB_URL,
          '-tAq',
          '-v',
          'ON_ERROR_STOP=1',
          '-c',
          `SET ROLE anon; SELECT public.increment_profile_views('${uid}');`,
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      );
      reachable = true;
    } catch {
      /* expected: permission denied for function increment_profile_views */
    }
    if (reachable) {
      out.push('anon can still call increment_profile_views — the unthrottled counter is open');
    }
  } catch (e) {
    const msg = String(e.stderr || e.message)
      .split('\n')
      .filter((l) => l.includes('ERROR'))
      .join('; ');
    out.push(msg || 'counter throttle check raised an error');
  } finally {
    try {
      q(`RESET ROLE;
         DELETE FROM public.rate_limit_entries WHERE identifier LIKE 'verify-visitor%';
         DELETE FROM public.analytics_views WHERE user_id = '${uid}';
         DELETE FROM public.links WHERE id = '${lid}';
         DELETE FROM public.profiles WHERE id = '${uid}';
         DELETE FROM auth.users WHERE id = '${uid}';`);
    } catch {
      /* cleanup is best effort */
    }
  }
  return out;
});

// ---------------------------------------------------------------------------
// 6g. "Is this username free?" must be answered by something that can see
//     unpublished profiles.
//
//     useUsernameCheck asked PostgREST directly, and since 20260808000002 the
//     public SELECT policy on `profiles` is scoped to published rows. So a
//     username held by an unpublished profile — every account that has not
//     published yet, which includes every account mid-signup — read as
//     available, the insert then failed on the unique index, and the agent saw
//     a generic error naming no field (US-117).
// ---------------------------------------------------------------------------
check('check_username_available sees profiles the anon client cannot', () => {
  const out = [];
  const uid = '00000000-dead-beef-0000-00000000af04';
  try {
    q(`
      INSERT INTO auth.users (id, email) VALUES ('${uid}', 'username@example.test')
        ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.profiles (id, username, full_name, is_published)
        VALUES ('${uid}', 'verifyhidden', 'Verify Hidden', false)
        ON CONFLICT (id) DO UPDATE SET username = 'verifyhidden', is_published = false;
    `);

    // The premise: the direct query really cannot see it.
    const [visible] = q(`
      SET ROLE anon;
      SELECT count(*) FROM public.profiles WHERE username = 'verifyhidden';
    `);
    if (visible !== '0') {
      out.push(
        `anon can see the unpublished profile (${visible} rows) — this check no longer tests what it says`
      );
    }

    const [taken] = q(`
      SET ROLE anon;
      SELECT public.check_username_available('verifyhidden')::text;
    `);
    if (taken !== 'false') {
      out.push('check_username_available says a taken username is free');
    }

    const [cased] = q(`
      SET ROLE anon;
      SELECT public.check_username_available('VerifyHidden')::text;
    `);
    if (cased !== 'false') {
      out.push('check_username_available is case-sensitive; the unique index is not');
    }

    const [free] = q(`
      SET ROLE anon;
      SELECT public.check_username_available('verify-definitely-free')::text;
    `);
    if (free !== 'true') {
      out.push('check_username_available says a free username is taken');
    }

    // The agent's own name must not read as taken when they are the holder.
    const [own] = q(`
      SET ROLE anon;
      SELECT public.check_username_available('verifyhidden', '${uid}')::text;
    `);
    if (own !== 'true') {
      out.push('check_username_available reports the holder their own username is taken');
    }
  } catch (e) {
    const msg = String(e.stderr || e.message)
      .split('\n')
      .filter((l) => l.includes('ERROR'))
      .join('; ');
    out.push(msg || 'username availability check raised an error');
  } finally {
    try {
      q(`RESET ROLE;
         DELETE FROM public.profiles WHERE id = '${uid}';
         DELETE FROM auth.users WHERE id = '${uid}';`);
    } catch {
      /* cleanup is best effort */
    }
  }
  return out;
});

// ---------------------------------------------------------------------------
// 6h. Entitlement must follow what the agent has paid for.
//
//     stripe-webhook wrote status 'canceled' the day cancel_at_period_end was
//     set, and get_user_plan joined only status = 'active' — so a paid-up
//     agent lost their plan the moment they scheduled a cancellation, weeks
//     early. invoice.payment_failed wrote 'past_due' with the same effect and
//     no grace at all (US-118).
//
//     Also asserts the plans table is seeded: nothing ever seeded it, so
//     Pricing rendered an empty grid and get_user_plan fell through to its
//     hard-coded fallback for every agent.
// ---------------------------------------------------------------------------
check('subscription entitlement survives a scheduled cancellation', () => {
  const out = [];
  const uid = '00000000-dead-beef-0000-00000000af05';
  try {
    const [planCount] = q(`SELECT count(*) FROM public.subscription_plans WHERE is_active;`);
    if (Number(planCount) < 4) {
      out.push(`subscription_plans holds ${planCount} active row(s); the seed did not run`);
      return out;
    }

    const [freePrice] = q(`SELECT price_monthly::text FROM public.subscription_plans WHERE name = 'free';`);
    if (freePrice !== '0.00' && freePrice !== '0') {
      out.push(`the free plan costs ${freePrice}`);
    }

    q(`
      INSERT INTO auth.users (id, email) VALUES ('${uid}', 'entitlement@example.test')
        ON CONFLICT (id) DO NOTHING;
      INSERT INTO public.profiles (id, username, full_name)
        VALUES ('${uid}', 'entitlementcheck', 'Entitlement Check')
        ON CONFLICT (id) DO UPDATE SET username = 'entitlementcheck';
      DELETE FROM public.user_subscriptions WHERE user_id = '${uid}';
      INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_period_end, cancel_at_period_end)
        SELECT '${uid}', id, 'canceled', now() + interval '20 days', true
        FROM public.subscription_plans WHERE name = 'professional';
    `);

    const [cancelled] = q(
      `SELECT public.get_user_plan('${uid}')->>'plan_name';`
    );
    if (cancelled !== 'professional') {
      out.push(
        `a cancellation scheduled for 20 days' time already reads as "${cancelled}", not professional`
      );
    }

    q(`UPDATE public.user_subscriptions SET status = 'past_due', current_period_end = now() - interval '2 days' WHERE user_id = '${uid}';`);
    const [pastDue] = q(`SELECT public.get_user_plan('${uid}')->>'plan_name';`);
    if (pastDue !== 'professional') {
      out.push(`a payment that failed 2 days ago already reads as "${pastDue}"; there is no grace`);
    }

    q(`UPDATE public.user_subscriptions SET current_period_end = now() - interval '30 days' WHERE user_id = '${uid}';`);
    const [expired] = q(`SELECT public.get_user_plan('${uid}')->>'plan_name';`);
    if (expired !== 'free') {
      out.push(`a subscription 30 days past due still reads as "${expired}"; the grace never ends`);
    }

    q(`UPDATE public.user_subscriptions SET status = 'canceled', current_period_end = now() - interval '1 day' WHERE user_id = '${uid}';`);
    const [over] = q(`SELECT public.get_user_plan('${uid}')->>'plan_name';`);
    if (over !== 'free') {
      out.push(`a cancelled subscription whose period ended still reads as "${over}"`);
    }
  } catch (e) {
    const msg = String(e.stderr || e.message)
      .split('\n')
      .filter((l) => l.includes('ERROR'))
      .join('; ');
    out.push(msg || 'entitlement check raised an error');
  } finally {
    try {
      q(`RESET ROLE;
         DELETE FROM public.user_subscriptions WHERE user_id = '${uid}';
         DELETE FROM public.profiles WHERE id = '${uid}';
         DELETE FROM auth.users WHERE id = '${uid}';`);
    } catch {
      /* cleanup is best effort */
    }
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
    // Contact details go in encrypted_email — US-086 dropped the plaintext
    // columns, so an insert naming `email` would fail here for the wrong
    // reason. The value is not real ciphertext; nothing in this check decrypts.
    q(`
      INSERT INTO public.leads (id, user_id, name, encrypted_email, lead_type, source)
      VALUES ('${lid}', '${uid}', 'Schema Check', 'enc:v1:schemacheck', 'buyer', 'contact_form');
    `);

    // auto_log_lead_creation must have logged an activity.
    const acts = q(
      `SELECT count(*) FROM public.lead_activities WHERE lead_id = '${lid}';`
    );
    if (acts[0] === '0') {
      out.push('lead created but auto_log_lead_creation logged no activity');
    }

    // A note must be attachable to the lead. This used to insert into
    // lead_notes — a second activity store the modal read while every trigger
    // wrote lead_activities. US-102 migrated those rows across and dropped the
    // table, so there is one timeline again.
    q(`
      INSERT INTO public.lead_activities (lead_id, user_id, activity_type, content)
      VALUES ('${lid}', '${uid}', 'note', 'schema check');
    `);
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
