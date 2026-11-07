/**
 * US-373 (US-336): log_lead_meeting holds to the rules every log_lead_* RPC
 * follows. scripts/verify-schema.mjs runs it against a real Postgres; this
 * holds the migration text to the same promises without a database.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS = join(process.cwd(), 'supabase/migrations');
const FILE = '20261107000373_log_lead_meeting.sql';
const sql = readFileSync(join(MIGRATIONS, FILE), 'utf8').replace(/--[^\n]*/g, '');
const SIGNATURE = 'public.log_lead_meeting(uuid, text, text, timestamp with time zone, text)';

const body = (() => {
  const m = sql.match(
    /CREATE OR REPLACE FUNCTION public\.log_lead_meeting\([\s\S]*?\$function\$[\s\S]*?\$function\$/
  );
  if (!m) throw new Error(`log_lead_meeting is not defined in ${FILE}`);
  return m[0];
})();

describe('log_lead_meeting', () => {
  it('admits only the lead owner or its current assignee', () => {
    expect(body).toMatch(/current_user_id IS NULL OR NOT EXISTS/);
    expect(body).toMatch(/AND \(user_id = current_user_id OR assigned_to = current_user_id\)/);
    expect(body).toContain("RAISE EXCEPTION 'Lead not found or access denied'");
  });

  it('is SECURITY DEFINER with the pinned search_path', () => {
    expect(body).toMatch(/SECURITY DEFINER\s+SET search_path = public, extensions, pg_temp/);
  });

  it('writes a meeting row under the caller, with the meeting details', () => {
    expect(body).toMatch(/VALUES \(\s*_lead_id, current_user_id, 'meeting',/);
    expect(body).toMatch(/meeting_type, meeting_location, meeting_scheduled_at/);
  });

  it('refuses meeting types the form does not offer', () => {
    expect(body).toMatch(/_meeting_type NOT IN \('in_person', 'video', 'phone'\)/);
  });

  it('sets first contact once and never moves it', () => {
    expect(body).toContain('contacted_at = COALESCE(contacted_at, NOW())');
  });

  it('is callable by signed-in agents only, not by anon', () => {
    expect(sql).toContain(
      `REVOKE EXECUTE ON FUNCTION ${SIGNATURE}\n  FROM PUBLIC, anon, authenticated;`
    );
    expect(sql).toContain(
      `GRANT EXECUTE ON FUNCTION ${SIGNATURE}\n  TO authenticated, service_role;`
    );
    expect(sql).not.toMatch(/GRANT[^;]*\banon\b/);
  });

  it('is listed in DEFINER_CALLABLE', () => {
    const verify = readFileSync(join(process.cwd(), 'scripts/verify-schema.mjs'), 'utf8');
    expect(verify).toMatch(/\['log_lead_meeting', \{ why: /);
  });

  it('is the latest definition', () => {
    const later = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith('.sql') && f > FILE)
      .filter((f) =>
        /FUNCTION public\.log_lead_meeting\(/.test(readFileSync(join(MIGRATIONS, f), 'utf8'))
      );
    expect(later).toEqual([]);
  });
});

describe('the dashboard', () => {
  it('logs meetings through the RPC, not a direct lead_activities insert', () => {
    const hook = readFileSync(join(process.cwd(), 'src/hooks/useLeadActivities.ts'), 'utf8');
    const meeting = hook.slice(
      hook.indexOf('const logMeetingMutation'),
      hook.indexOf('const createTaskMutation')
    );
    expect(meeting).toContain("supabase.rpc('log_lead_meeting'");
    expect(meeting).not.toContain('.insert(');
  });
});
