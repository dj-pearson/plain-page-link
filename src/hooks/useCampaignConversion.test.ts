import { describe, it, expect } from 'vitest';
import { toCampaignRows } from './useCampaignConversion';

describe('toCampaignRows (US-227)', () => {
  it('computes views → leads per source, and no rate without views', () => {
    expect(
      toCampaignRows([
        { source: 'instagram', views: 200, form_opens: 30, leads: 8 },
        { source: 'direct', views: 0, form_opens: 0, leads: 2 },
      ])
    ).toEqual([
      { source: 'instagram', views: 200, formOpens: 30, leads: 8, rate: 0.04 },
      { source: 'direct', views: 0, formOpens: 0, leads: 2, rate: null },
    ]);
  });
  it('tolerates a non-array', () => {
    expect(toCampaignRows(null)).toEqual([]);
  });
});
