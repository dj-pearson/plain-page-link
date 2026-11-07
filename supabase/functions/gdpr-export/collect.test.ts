import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  collectSections,
  ExportIncompleteError,
  maskLoginAttempt,
  readAllRows,
  sectionCounts,
  SECTIONS,
  type ExportReader,
  type ReadResult,
  type Row,
  type SectionSpec,
} from './collect.ts';

/** Row columns per relation, from the generated types (as schema-references.test.ts does). */
function parseSchema(): Map<string, Set<string>> {
  const lines = readFileSync(join(process.cwd(), 'src/integrations/supabase/types.ts'), 'utf-8').split('\n');
  const schema = new Map<string, Set<string>>();
  let relation: string | null = null;
  let inRow = false;
  for (const line of lines) {
    if (/^ {4}Functions: \{$/.test(line)) break;
    const start = /^ {6}([a-z_0-9]+): \{$/.exec(line);
    if (start) {
      relation = start[1];
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
      if (column && relation) {
        if (!schema.has(relation)) schema.set(relation, new Set());
        schema.get(relation)!.add(column[1]);
      }
    }
  }
  return schema;
}

const SCHEMA = parseSchema();
const columnsOf = (spec: SectionSpec) =>
  spec.columns === '*' ? [...(SCHEMA.get(spec.table) ?? [])] : spec.columns.split(',').map((c) => c.trim());

/** A reader over in-memory tables, recording each page request. */
function fakeReader(
  tables: Record<string, Row[]>,
  fail: (spec: SectionSpec, from: number) => string | null = () => null
) {
  const calls: { table: string; from: number; to: number }[] = [];
  const reader: ExportReader = {
    page(spec, _userId, from, to) {
      calls.push({ table: spec.table, from, to });
      const message = fail(spec, from);
      const result: ReadResult<Row[]> = message
        ? { data: null, error: { message } }
        : { data: (tables[spec.table] ?? []).slice(from, to + 1), error: null };
      return Promise.resolve(result);
    },
    one(spec) {
      const message = fail(spec, 0);
      const result: ReadResult<Row> = message
        ? { data: null, error: { message } }
        : { data: tables[spec.table]?.[0] ?? null, error: null };
      return Promise.resolve(result);
    },
  };
  return { reader, calls };
}

const rowsOf = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: String(i) }));

describe('SECTIONS (US-269)', () => {
  it('names only tables and columns that exist', () => {
    const missing: string[] = [];
    for (const spec of SECTIONS) {
      const columns = SCHEMA.get(spec.table);
      if (!columns) {
        missing.push(spec.table);
        continue;
      }
      if (!columns.has(spec.ownerColumn)) missing.push(`${spec.table}.${spec.ownerColumn}`);
      // Paging orders by id.
      if (!spec.single && !columns.has('id')) missing.push(`${spec.table}.id`);
      if (spec.columns !== '*') {
        for (const c of columnsOf(spec)) if (!columns.has(c)) missing.push(`${spec.table}.${c}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('never hands back a secret', () => {
    const SECRETS = [
      'key_hash',
      'session_token_hash',
      'totp_secret',
      'backup_codes',
      'verification_token_hash',
      'invite_token_hash',
    ];
    const leaked = SECTIONS.flatMap((spec) =>
      columnsOf(spec).filter((c) => SECRETS.includes(c)).map((c) => `${spec.table}.${c}`)
    );
    expect(leaked).toEqual([]);
  });

  it('covers the agent data the old export left out', () => {
    const tables = SECTIONS.map((s) => s.table);
    for (const t of [
      'lead_activities',
      'custom_pages',
      'workflows',
      'notifications',
      'invoices',
      'user_subscriptions',
      'team_members',
      'api_keys',
      'analytics_events',
    ]) {
      expect(tables).toContain(t);
    }
  });

  it('has unique keys', () => {
    const keys = SECTIONS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('readAllRows', () => {
  const spec: SectionSpec = { key: 'leads', table: 'leads', columns: '*', ownerColumn: 'user_id' };

  it('pages past the 1,000-row cap instead of stopping at the first page', async () => {
    const { reader, calls } = fakeReader({ leads: rowsOf(2500) });
    const { rows, truncated } = await readAllRows(reader, spec, 'u', 1000);
    expect(rows).toHaveLength(2500);
    expect(truncated).toBe(false);
    expect(calls.map((c) => [c.from, c.to])).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it('stops on an empty page when the count is an exact multiple', async () => {
    const { reader, calls } = fakeReader({ leads: rowsOf(2000) });
    const { rows } = await readAllRows(reader, spec, 'u', 1000);
    expect(rows).toHaveLength(2000);
    expect(calls).toHaveLength(3);
  });

  it('reports a section that reaches the ceiling as truncated', async () => {
    const { reader } = fakeReader({ leads: rowsOf(50) });
    const { rows, truncated } = await readAllRows(reader, spec, 'u', 10, 30);
    expect(rows).toHaveLength(30);
    expect(truncated).toBe(true);
  });

  it('throws when a later page fails rather than returning the first page', async () => {
    const { reader } = fakeReader({ leads: rowsOf(2500) }, (_s, from) => (from === 1000 ? 'timeout' : null));
    await expect(readAllRows(reader, spec, 'u', 1000)).rejects.toThrow('timeout');
  });
});

describe('collectSections', () => {
  const sections: SectionSpec[] = [
    { key: 'profile', table: 'profiles', columns: '*', ownerColumn: 'id', single: true },
    { key: 'settings', table: 'user_settings', columns: '*', ownerColumn: 'user_id', single: true },
    { key: 'listings', table: 'listings', columns: '*', ownerColumn: 'user_id' },
    { key: 'leads', table: 'leads', columns: '*', ownerColumn: 'user_id' },
    { key: 'loginAttempts', table: 'login_attempts', columns: 'id', ownerColumn: 'user_id' },
  ];

  it('returns every section, with a missing single row as null', async () => {
    const { reader } = fakeReader({ profiles: [{ id: 'u' }], listings: rowsOf(3), leads: rowsOf(1200) });
    const collected = await collectSections(reader, 'u', sections, 1000);
    expect(collected.singles).toEqual({ profile: { id: 'u' }, settings: null });
    expect(collected.rows.listings).toHaveLength(3);
    expect(collected.rows.leads).toHaveLength(1200);
    expect(collected.rows.loginAttempts).toEqual([]);
    expect(collected.truncated).toEqual([]);
    expect(sectionCounts(collected)).toEqual({
      profile: 1,
      settings: 0,
      listings: 3,
      leads: 1200,
      loginAttempts: 0,
    });
  });

  it('fails the whole export, naming each failed section, instead of exporting it as empty', async () => {
    const { reader } = fakeReader({ listings: rowsOf(3) }, (spec) =>
      spec.table === 'leads' || spec.table === 'user_settings' ? 'permission denied' : null
    );
    const error = await collectSections(reader, 'u', sections).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ExportIncompleteError);
    const incomplete = error as ExportIncompleteError;
    expect(incomplete.failed.map((f) => f.section)).toEqual(['settings', 'leads']);
    expect(incomplete.message).toContain('settings, leads');
    expect(incomplete.message).toContain('Nothing was downloaded');
  });

  it('lists truncated sections', async () => {
    const { reader } = fakeReader({ listings: rowsOf(40), leads: rowsOf(5) });
    const collected = await collectSections(reader, 'u', sections, 10, 20);
    expect(collected.truncated).toEqual(['listings']);
    expect(collected.rows.leads).toHaveLength(5);
  });
});

describe('maskLoginAttempt', () => {
  it('reports a fingerprint as present without returning it', () => {
    expect(maskLoginAttempt({ id: '1', device_fingerprint: 'abc' }).device_fingerprint).toBe('[PRESENT]');
    expect(maskLoginAttempt({ id: '2', device_fingerprint: null }).device_fingerprint).toBeNull();
  });
});
