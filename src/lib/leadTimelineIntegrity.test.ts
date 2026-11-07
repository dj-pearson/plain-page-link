/**
 * US-349 (US-335, US-313): system rows on a lead's timeline cannot be forged,
 * rewritten or deleted from the browser.
 *
 * The behaviour is proven against a real Postgres by scripts/verify-schema.mjs
 * ("a lead's system timeline rows cannot be forged, rewritten or deleted").
 * These tests hold the migration to its promise without a database, and keep
 * its type list and AGENT_AUTHORED_ACTIVITY_TYPES from drifting apart.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  AGENT_AUTHORED_ACTIVITY_TYPES,
  SYSTEM_ACTIVITY_TYPES,
  isAgentAuthoredActivityType,
} from './leadActivityTypes';

const MIGRATIONS = join(process.cwd(), 'supabase/migrations');
const FILE = '20261107000349_lead_timeline_system_rows_tamper_proof.sql';
const sql = readFileSync(join(MIGRATIONS, FILE), 'utf8').replace(/--[^\n]*/g, '');

const SQL_LIST = `('${AGENT_AUTHORED_ACTIVITY_TYPES.join("', '")}')`;

function policy(name: string): string {
  const m = sql.match(new RegExp(`CREATE POLICY "${name}"[\\s\\S]*?;`));
  if (!m) throw new Error(`policy "${name}" is not created in ${FILE}`);
  return m[0];
}

describe('agent-authored activity types', () => {
  it('splits every timeline type into exactly one kind', () => {
    for (const t of AGENT_AUTHORED_ACTIVITY_TYPES)
      expect(isAgentAuthoredActivityType(t)).toBe(true);
    for (const t of SYSTEM_ACTIVITY_TYPES) expect(isAgentAuthoredActivityType(t)).toBe(false);
    expect(isAgentAuthoredActivityType('anything_else')).toBe(false);
  });
});

describe('the US-349 migration', () => {
  it('log_lead_activity refuses any type outside the agent-authored list, before it inserts', () => {
    const fn = sql.match(
      /CREATE OR REPLACE FUNCTION public\.log_lead_activity\([\s\S]*?\$function\$([\s\S]*?)\$function\$/
    );
    expect(fn).not.toBeNull();
    const body = fn![1];
    const guard = body.indexOf(`_activity_type NOT IN ${SQL_LIST}`);
    expect(guard).toBeGreaterThan(-1);
    expect(body).toMatch(/_activity_type IS NULL/);
    expect(body).toMatch(/RAISE EXCEPTION 'Activity type % cannot be logged by hand'/);
    expect(guard).toBeLessThan(body.indexOf('INSERT INTO public.lead_activities'));
    // Still the US-326 owner-or-assignee check, and still pinned.
    expect(body).toMatch(/AND \(user_id = current_user_id OR assigned_to = current_user_id\)/);
    expect(fn![0]).toMatch(/SECURITY DEFINER\s+SET search_path = public, extensions, pg_temp/);
    expect(body).toMatch(/VALUES \(\s*_lead_id, current_user_id,/);
    expect(body).toContain('contacted_at = COALESCE(contacted_at, NOW())');
    expect(sql).not.toMatch(/FUNCTION public\.log_lead_(call|email)\(/);
    expect(sql).not.toMatch(/GRANT[^;]*FUNCTION/);
  });

  it('is the latest definition of log_lead_activity', () => {
    const later = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith('.sql') && f > FILE)
      .filter((f) =>
        /FUNCTION public\.log_lead_activity\(/.test(readFileSync(join(MIGRATIONS, f), 'utf8'))
      );
    expect(later).toEqual([]);
  });

  it('drops every INSERT, UPDATE and DELETE policy before recreating them', () => {
    expect(sql).toMatch(
      /polrelid = 'public\.lead_activities'::regclass AND polcmd IN \('a', 'w', 'd'\)/
    );
  });

  it('INSERT admits only agent-authored rows, in your own name, on a lead you own or are assigned', () => {
    const p = policy('Users can create activities on their leads');
    expect(p).toMatch(/FOR INSERT\s+TO authenticated/);
    expect(p).toContain('auth.uid() = user_id');
    expect(p).toContain(`activity_type IN ${SQL_LIST}`);
    expect(p).toMatch(/l\.user_id = auth\.uid\(\) OR l\.assigned_to = auth\.uid\(\)/);
  });

  it('DELETE reaches only agent-authored rows you wrote', () => {
    const p = policy('Users can delete activities they wrote');
    expect(p).toMatch(/FOR DELETE\s+TO authenticated/);
    expect(p).toContain('auth.uid() = user_id');
    expect(p).toContain(`activity_type IN ${SQL_LIST}`);
  });

  it('UPDATE is task_completed_at on task rows only', () => {
    expect(sql).toMatch(
      /REVOKE UPDATE ON public\.lead_activities FROM PUBLIC, anon, authenticated;/
    );
    expect(sql).toMatch(
      /GRANT UPDATE \(task_completed_at\) ON public\.lead_activities TO authenticated;/
    );
    const p = policy('Users can complete follow-ups on their leads');
    expect(p).toMatch(/FOR UPDATE\s+TO authenticated/);
    expect(p.match(/activity_type = 'task'/g)).toHaveLength(2); // USING and WITH CHECK
    expect(p).toContain('WITH CHECK');
  });

  it('no later migration widens lead_activities write policies again', () => {
    const later = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith('.sql') && f > FILE)
      .filter((f) =>
        /CREATE POLICY[\s\S]*?ON public\.lead_activities FOR (INSERT|UPDATE|DELETE|ALL)/.test(
          readFileSync(join(MIGRATIONS, f), 'utf8')
        )
      );
    expect(later).toEqual([]);
  });
});
