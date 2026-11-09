/**
 * US-326 (US-314): the teammate a lead is routed to can record work on it.
 *
 * The behaviour is proven against a real Postgres by scripts/verify-schema.mjs
 * ("an assignee can log calls, emails, notes and follow-ups on a routed lead").
 * These tests hold the migration to what it promises without a database: every
 * write path the dashboard uses for lead activity admits the owner or the
 * current assignee, and still writes the row in the caller's own name.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS = join(process.cwd(), 'supabase/migrations');
const FILE = '20261107000326_assignee_logs_lead_activity.sql';
const sql = readFileSync(join(MIGRATIONS, FILE), 'utf8').replace(/--[^\n]*/g, '');

/** The body of one CREATE OR REPLACE FUNCTION public.<name>(…) … $function$. */
function functionBody(name: string): string {
  const m = sql.match(
    new RegExp(
      `CREATE OR REPLACE FUNCTION public\\.${name}\\([\\s\\S]*?\\$function\\$([\\s\\S]*?)\\$function\\$`
    )
  );
  if (!m) throw new Error(`${name} is not redefined in ${FILE}`);
  return m[0];
}

const OWNER_OR_ASSIGNEE = /AND \(user_id = current_user_id OR assigned_to = current_user_id\)/;

describe('the US-326 migration', () => {
  for (const fn of ['log_lead_activity', 'log_lead_call', 'log_lead_email']) {
    describe(fn, () => {
      const body = functionBody(fn);

      it('admits the lead owner or its current assignee', () => {
        expect(body).toMatch(OWNER_OR_ASSIGNEE);
        expect(body).toMatch(/current_user_id IS NULL OR NOT EXISTS/);
        expect(body).toContain("RAISE EXCEPTION 'Lead not found or access denied'");
      });

      it('stays SECURITY DEFINER with the pinned search_path', () => {
        expect(body).toMatch(/SECURITY DEFINER\s+SET search_path = public, extensions, pg_temp/);
      });

      it('writes the activity under the caller, not the lead owner', () => {
        expect(body).toMatch(/VALUES \(\s*_lead_id, current_user_id,/);
      });

      it('still records first contact without moving it', () => {
        expect(body).toContain('contacted_at = COALESCE(contacted_at, NOW())');
      });
    });
  }

  it('does not touch the EXECUTE grants (CREATE OR REPLACE keeps the ACL)', () => {
    expect(sql).not.toMatch(/\bGRANT\b/);
    expect(sql).not.toMatch(/\bREVOKE\b/);
  });

  it('replaces every INSERT policy on lead_activities with one for the owner or assignee', () => {
    expect(sql).toMatch(/polrelid = 'public\.lead_activities'::regclass AND polcmd = 'a'/);
    expect(sql).toMatch(
      /CREATE POLICY "Users can create activities on their leads"\s+ON public\.lead_activities FOR INSERT\s+TO authenticated\s+WITH CHECK \(\s*auth\.uid\(\) = user_id\s+AND EXISTS \([\s\S]*?\(l\.user_id = auth\.uid\(\) OR l\.assigned_to = auth\.uid\(\)\)/
    );
  });

  it('leaves the DELETE policy alone, so an assignee removes only rows they wrote', () => {
    expect(sql).not.toMatch(/FOR DELETE/);
  });

  it('is the latest definition of the three RPCs', () => {
    // US-349 redefines log_lead_activity to add the activity-type guard and
    // keeps this migration's owner-or-assignee rule; leadTimelineIntegrity.test.ts
    // holds it to that.
    const US_349 = '20261107000349_lead_timeline_system_rows_tamper_proof.sql';
    const later = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith('.sql') && f > FILE && f !== US_349)
      .filter((f) =>
        /FUNCTION public\.log_lead_(activity|call|email)\(/.test(
          readFileSync(join(MIGRATIONS, f), 'utf8')
        )
      );
    expect(later).toEqual([]);
  });
});
