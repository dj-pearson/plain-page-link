#!/usr/bin/env node
/**
 * Regenerates src/integrations/supabase/types.ts from a live Postgres schema.
 *
 * The canonical tool for this is `supabase gen types typescript`, but that
 * shells out to a Docker container, which is not available in CI or in the
 * sandboxed agent environment. This script reads the same information out of
 * the system catalogs via psql and emits the same shape, so the generated file
 * stays a drop-in replacement.
 *
 * Usage:
 *   node scripts/gen-supabase-types.mjs --db-url postgresql://user@host:port/db
 *   node scripts/gen-supabase-types.mjs --schema-json path/to/schema.json
 *
 * Add --check to verify the committed file is up to date without writing.
 *
 * The trailing helper types (Tables<>, TablesInsert<>, Enums<>, ...) are static
 * boilerplate; they are preserved verbatim from the existing file so that this
 * script only ever rewrites the `Database` type itself.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES_PATH = join(ROOT, 'src/integrations/supabase/types.ts');
const DUMP_SQL = join(ROOT, 'scripts/dump-schema.sql');

// The generated Database type ends here; everything from this marker onward is
// hand-maintained boilerplate that we copy through unchanged.
const TAIL_MARKER = 'type DatabaseWithoutInternals = ';

function parseArgs(argv) {
  const out = { check: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--db-url') out.dbUrl = argv[++i];
    else if (argv[i] === '--schema-json') out.schemaJson = argv[++i];
    else if (argv[i] === '--check') out.check = true;
    else if (argv[i] === '--postgrest-version') out.postgrestVersion = argv[++i];
  }
  return out;
}

function loadSchema({ dbUrl, schemaJson }) {
  if (schemaJson) return JSON.parse(readFileSync(schemaJson, 'utf8'));
  if (!dbUrl) {
    throw new Error('Pass either --db-url or --schema-json. See header comment.');
  }
  const raw = execFileSync('psql', [dbUrl, '-tAq', '-v', 'ON_ERROR_STOP=1', '-f', DUMP_SQL], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

/**
 * Maps a Postgres type descriptor onto its TypeScript equivalent.
 * `category` is pg_type.typcategory: N numeric, B boolean, A array, E enum.
 */
function tsType(col) {
  if (col.enumName) {
    const base = `Database["public"]["Enums"]["${col.enumName}"]`;
    return col.isArray ? `${base}[]` : base;
  }
  if (col.isArray) {
    const elem = tsType({
      udt: col.elemUdt,
      category: col.elemCategory,
      isArray: false,
      enumName: null,
    });
    return `${elem}[]`;
  }
  switch (col.udt) {
    case 'json':
    case 'jsonb':
      return 'Json';
    case 'bool':
      return 'boolean';
    // Postgres exposes bigint/numeric over PostgREST as JSON numbers.
    case 'int2':
    case 'int4':
    case 'int8':
    case 'float4':
    case 'float8':
    case 'numeric':
    case 'money':
    case 'oid':
      return 'number';
    case 'text':
    case 'varchar':
    case 'bpchar':
    case 'char':
    case 'name':
    case 'citext':
    case 'uuid':
    case 'date':
    case 'time':
    case 'timetz':
    case 'timestamp':
    case 'timestamptz':
    case 'interval':
    case 'bytea':
    case 'inet':
    case 'cidr':
    case 'macaddr':
    case 'tsvector':
    case 'xml':
      return 'string';
    case 'void':
      return 'undefined';
    case 'record':
      return 'Record<string, unknown>';
    default:
      // Numeric/boolean categories we do not name explicitly still map cleanly.
      if (col.category === 'N') return 'number';
      if (col.category === 'B') return 'boolean';
      return 'unknown';
  }
}

const IND = (n) => ' '.repeat(n);

function renderColumns(columns, mode, indent) {
  // Row: nullable columns get `| null`.
  // Insert: optional when the database can supply the value (default, identity,
  //         generated) or when NULL is acceptable.
  // Update: every column optional, since a patch may touch any subset.
  return columns
    .map((c) => {
      const base = tsType(c);
      const nullable = !c.notNull;
      const type = nullable ? `${base} | null` : base;
      let optional;
      if (mode === 'Row') optional = false;
      else if (mode === 'Update') optional = true;
      else optional = c.hasDefault || c.isGenerated || nullable;
      return `${IND(indent)}${c.name}${optional ? '?' : ''}: ${type}`;
    })
    .join('\n');
}

function renderRelationships(fks, indent) {
  if (!fks.length) return `${IND(indent)}Relationships: []`;
  const entries = fks
    .map((fk) => {
      const cols = fk.columns.map((c) => `"${c}"`).join(', ');
      const refCols = fk.referencedColumns.map((c) => `"${c}"`).join(', ');
      return [
        `${IND(indent + 2)}{`,
        `${IND(indent + 4)}foreignKeyName: "${fk.name}"`,
        `${IND(indent + 4)}columns: [${cols}]`,
        `${IND(indent + 4)}isOneToOne: ${fk.isOneToOne}`,
        `${IND(indent + 4)}referencedRelation: "${fk.referencedRelation}"`,
        `${IND(indent + 4)}referencedColumns: [${refCols}]`,
        `${IND(indent + 2)}},`,
      ].join('\n');
    })
    .join('\n');
  return [`${IND(indent)}Relationships: [`, entries, `${IND(indent)}]`].join('\n');
}

function renderTable(t, indent) {
  const inner = indent + 2;
  const cols = indent + 4;
  const parts = [`${IND(indent)}${t.name}: {`];
  for (const mode of ['Row', 'Insert', 'Update']) {
    parts.push(`${IND(inner)}${mode}: {`);
    parts.push(renderColumns(t.columns, mode, cols));
    parts.push(`${IND(inner)}}`);
  }
  parts.push(renderRelationships(t.foreignKeys, inner));
  parts.push(`${IND(indent)}}`);
  return parts.join('\n');
}

function renderView(v, indent) {
  const inner = indent + 2;
  const cols = indent + 4;
  // Views are read-only: Supabase emits Row (+ Relationships) only.
  return [
    `${IND(indent)}${v.name}: {`,
    `${IND(inner)}Row: {`,
    renderColumns(v.columns, 'Row', cols),
    `${IND(inner)}}`,
    renderRelationships(v.foreignKeys, inner),
    `${IND(indent)}}`,
  ].join('\n');
}

function renderFunction(fn, indent) {
  const inner = indent + 2;
  const r = fn.returns;

  let argsText;
  if (!fn.args.length) {
    argsText = 'Record<PropertyKey, never>';
  } else {
    argsText =
      '{ ' +
      fn.args
        .map((a) => `${a.name || '""'}${a.hasDefault ? '?' : ''}: ${tsType(a)}`)
        .join('; ') +
      ' }';
  }

  let returnsText;
  if (r.isComposite && r.compositeColumns.length) {
    const body = r.compositeColumns.map((c) => `${IND(inner + 4)}${c.name}: ${tsType(c)}`);
    returnsText = ['{', ...body, `${IND(inner + 2)}}${r.returnsSet ? '[]' : ''}`].join('\n');
  } else {
    returnsText = tsType(r) + (r.returnsSet ? '[]' : '');
  }

  // Keep short signatures on one line, matching the upstream generator's
  // prettier-formatted output.
  const oneLine = `${IND(indent)}${fn.name}: { Args: ${argsText}; Returns: ${returnsText} }`;
  if (!returnsText.includes('\n') && oneLine.length <= 80) return oneLine;

  return [
    `${IND(indent)}${fn.name}: {`,
    `${IND(inner)}Args: ${argsText}`,
    `${IND(inner)}Returns: ${returnsText}`,
    `${IND(indent)}}`,
  ].join('\n');
}

function renderEnum(e, indent) {
  const values = e.values.map((v) => `"${v}"`);
  const oneLine = `${IND(indent)}${e.name}: ${values.join(' | ')}`;
  if (oneLine.length <= 80) return oneLine;
  return [
    `${IND(indent)}${e.name}:`,
    ...values.map((v) => `${IND(indent + 2)}| ${v}`),
  ].join('\n');
}

function renderEmpty(name, indent) {
  return [`${IND(indent)}${name}: {`, `${IND(indent + 2)}[_ in never]: never`, `${IND(indent)}}`].join(
    '\n'
  );
}

function generate(schema, postgrestVersion) {
  const byName = (a, b) => a.name.localeCompare(b.name, 'en');
  const tables = schema.tables.filter((t) => t.kind === 'table').sort(byName);
  const views = schema.tables.filter((t) => t.kind === 'view').sort(byName);
  const enums = [...schema.enums].sort(byName);

  // Deduplicate overloads by name: the Database type is keyed by function name,
  // so only one signature can be represented. Prefer the richest overload
  // (most arguments) for the same reason the upstream generator does.
  //
  // Functions with unnamed arguments are skipped: PostgREST invokes RPCs with a
  // named-parameter JSON body, so they are not reachable from the client, and
  // emitting them would produce duplicate empty keys in the Args object.
  const fnByName = new Map();
  for (const fn of schema.functions) {
    if (fn.args.some((a) => !a.name)) continue;
    const prev = fnByName.get(fn.name);
    if (!prev || fn.args.length > prev.args.length) fnByName.set(fn.name, fn);
  }
  const functions = [...fnByName.values()].sort(byName);

  const out = [];
  out.push('export type Json =');
  out.push('  | string');
  out.push('  | number');
  out.push('  | boolean');
  out.push('  | null');
  out.push('  | { [key: string]: Json | undefined }');
  out.push('  | Json[]');
  out.push('');
  out.push('export type Database = {');
  out.push('  // Allows to automatically instantiate createClient with right options');
  out.push("  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)");
  out.push('  __InternalSupabase: {');
  out.push(`    PostgrestVersion: "${postgrestVersion}"`);
  out.push('  }');
  out.push('  public: {');

  out.push('    Tables: {');
  for (const t of tables) out.push(renderTable(t, 6));
  out.push('    }');

  if (views.length) {
    out.push('    Views: {');
    for (const v of views) out.push(renderView(v, 6));
    out.push('    }');
  } else {
    out.push(renderEmpty('Views', 4));
  }

  if (functions.length) {
    out.push('    Functions: {');
    for (const f of functions) out.push(renderFunction(f, 6));
    out.push('    }');
  } else {
    out.push(renderEmpty('Functions', 4));
  }

  if (enums.length) {
    out.push('    Enums: {');
    for (const e of enums) out.push(renderEnum(e, 6));
    out.push('    }');
  } else {
    out.push(renderEmpty('Enums', 4));
  }

  out.push(renderEmpty('CompositeTypes', 4));
  out.push('  }');
  out.push('}');
  out.push('');

  return out.join('\n');
}

/**
 * Runs the repo's Prettier over the generated source. The committed file is
 * Prettier-formatted (format:check covers src/), so formatting here keeps
 * `--check` comparing like with like.
 */
function format(source) {
  return execFileSync(
    process.execPath,
    [join(ROOT, 'node_modules/prettier/bin/prettier.cjs'), '--stdin-filepath', TYPES_PATH],
    { input: source, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: ROOT }
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const existing = readFileSync(TYPES_PATH, 'utf8');

  const tailIdx = existing.indexOf(TAIL_MARKER);
  if (tailIdx === -1) {
    throw new Error(
      `Could not find the boilerplate marker (${TAIL_MARKER}) in ${TYPES_PATH}. ` +
        'Update TAIL_MARKER in this script if the generated file layout changed.'
    );
  }
  const tail = existing.slice(tailIdx);

  // Keep the PostgrestVersion pinned to whatever the committed file declares
  // unless explicitly overridden — it reflects the deployed Supabase version,
  // which a local scratch database cannot know.
  const pinned = existing.match(/PostgrestVersion:\s*"([^"]+)"/);
  const postgrestVersion = args.postgrestVersion ?? pinned?.[1] ?? '13.0.5';

  const schema = loadSchema(args);
  const next = format(generate(schema, postgrestVersion) + tail);

  if (args.check) {
    if (next !== existing) {
      console.error('src/integrations/supabase/types.ts is out of date. Regenerate it.');
      process.exit(1);
    }
    console.log('types.ts is up to date.');
    return;
  }

  writeFileSync(TYPES_PATH, next);
  const tableCount = schema.tables.filter((t) => t.kind === 'table').length;
  const viewCount = schema.tables.filter((t) => t.kind === 'view').length;
  console.log(
    `Wrote ${TYPES_PATH}: ${tableCount} tables, ${viewCount} views, ` +
      `${schema.functions.length} functions, ${schema.enums.length} enums.`
  );
}

main();
