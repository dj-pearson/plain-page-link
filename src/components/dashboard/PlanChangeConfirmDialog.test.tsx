import { describe, it, expect } from 'vitest';
import { limitsAfterChange } from './PlanChangeConfirmDialog';

describe('limitsAfterChange (US-297)', () => {
  const free = {
    limits: {
      listings: 3,
      links: 5,
      contacts: 25,
      emails_per_month: 0,
      sms_per_month: 0,
      market_reports_per_month: 0,
      cma_reports_per_month: 0,
      virtual_staging_photos_per_month: 0,
      video_tours_per_month: 0,
    },
  };

  it('lists the limits of features that exist, flagging usage over the new limit', () => {
    const rows = limitsAfterChange(free, { listings: 7, links: 2 });
    expect(rows.map((r) => r.key)).toEqual(['listings', 'links', 'contacts']);
    expect(rows[0]).toMatchObject({ text: '3 active listings', over: true, used: 7 });
    expect(rows[1]).toMatchObject({ over: false });
  });

  it('does not say a downgrade cuts emails, texts, reports, staging or video tours', () => {
    const text = limitsAfterChange(free)
      .map((r) => r.text)
      .join(' | ');
    expect(text).not.toMatch(/email|text|report|staged|video/i);
  });
});
