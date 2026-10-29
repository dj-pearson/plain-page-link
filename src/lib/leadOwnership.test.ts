/**
 * US-236: a lead's owner and creation date are not client-writable.
 *
 * The behaviour itself is proven against a real Postgres by
 * scripts/verify-schema.mjs. These tests hold the two sides of that contract
 * together without a database: the app's lead updates never touch the frozen
 * columns (or every status change an assignee makes would now be refused), and
 * the migration freezes what it says it does.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLeadStatusPatch, buildContactPatch } from './leadStatus';
import { makeLead } from '@/test/fixtures/lead';

const FROZEN = ['user_id', 'created_at'];
const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost', 'nurturing'];

describe('lead patches the dashboard sends leave the frozen columns alone', () => {
  for (const status of STATUSES) {
    it(`status → ${status}`, () => {
      const patch = buildLeadStatusPatch(status, makeLead({ status: 'new' }));
      for (const col of FROZEN) expect(patch).not.toHaveProperty(col);
    });
  }

  it('the contact patch', () => {
    const patch = buildContactPatch(makeLead({ status: 'new', contacted_at: null }));
    expect(patch).not.toBeNull();
    for (const col of FROZEN) expect(patch).not.toHaveProperty(col);
  });
});

describe('the US-236 migration', () => {
  const sql = readFileSync(
    join(process.cwd(), 'supabase/migrations/20261028000004_freeze_lead_ownership_and_dates.sql'),
    'utf8'
  ).replace(/--[^\n]*/g, '');

  it('freezes user_id and created_at on leads, and created_at on contacts and open_houses', () => {
    expect(sql).toMatch(
      /BEFORE UPDATE OF user_id, created_at ON public\.leads\s+FOR EACH ROW EXECUTE FUNCTION public\.guard_frozen_columns\('user_id', 'created_at'\)/
    );
    for (const table of ['contacts', 'open_houses']) {
      expect(sql).toMatch(
        new RegExp(
          `BEFORE UPDATE OF created_at ON public\\.${table}\\s+FOR EACH ROW EXECUTE FUNCTION public\\.guard_frozen_columns\\('created_at'\\)`
        )
      );
    }
  });

  it('gives the lead UPDATE policy a WITH CHECK that still admits the assignee', () => {
    expect(sql).toMatch(
      /CREATE POLICY "Users can update their own leads"[\s\S]*?WITH CHECK \(auth\.uid\(\) = user_id OR auth\.uid\(\) = assigned_to\);/
    );
  });

  it('drops the anon testimonial INSERT policy', () => {
    expect(sql).toContain(
      'DROP POLICY IF EXISTS "Anyone can submit a review for a published profile" ON public.testimonials;'
    );
  });
});

describe('the public review page', () => {
  const page = readFileSync(join(process.cwd(), 'src/pages/public/SubmitReview.tsx'), 'utf8');

  it('submits through the submit-review edge function, not a direct insert', () => {
    expect(page).toMatch(/functions\.invoke\('submit-review'/);
    expect(page).not.toMatch(/from\(['"]testimonials['"]\)/);
  });
});
