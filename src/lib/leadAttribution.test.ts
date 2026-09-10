import { describe, expect, it } from 'vitest';
import { describeLeadOrigin, groupLeadsByChannel, referrerHost } from './leadAttribution';

const SELF = 'agentbio.net';

describe('describeLeadOrigin', () => {
  it('names the campaign source when the visit carried one', () => {
    const origin = describeLeadOrigin(
      { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'spring', device: 'mobile' },
      SELF
    );
    expect(origin).toMatchObject({
      channel: 'instagram',
      label: 'Instagram',
      confidence: 'campaign',
      campaign: 'spring',
      medium: 'social',
      device: 'mobile',
    });
  });

  it('groups the same source written two ways under one channel', () => {
    expect(describeLeadOrigin({ utm_source: 'Instagram' }, SELF).channel).toBe(
      describeLeadOrigin({ utm_source: 'instagram' }, SELF).channel
    );
  });

  it('does not credit Direct when only a medium or campaign was recorded', () => {
    const origin = describeLeadOrigin({ utm_campaign: 'yard-sign-qr', device: 'mobile' }, SELF);
    expect(origin.confidence).toBe('campaign');
    expect(origin.label).toBe('Campaign: yard-sign-qr');
  });

  it('falls back to the referring site and marks it inferred', () => {
    const origin = describeLeadOrigin(
      { referrer_url: 'https://www.zillow.com/agent/jane', device: 'desktop' },
      SELF
    );
    expect(origin).toMatchObject({
      channel: 'zillow.com',
      label: 'Zillow',
      confidence: 'referral',
    });
  });

  it('does not read its own domain as a referral', () => {
    // ContactBlock sends window.location.href as referrer_url.
    const origin = describeLeadOrigin(
      { referrer_url: 'https://agentbio.net/janedoe', device: 'mobile' },
      SELF
    );
    expect(origin.confidence).toBe('direct');
    expect(origin.label).toBe('Direct');
  });

  it('separates a lead with no attribution from one captured before it existed', () => {
    expect(describeLeadOrigin({ device: 'mobile' }, SELF).confidence).toBe('direct');
    // No device at all is the mark of a lead from before US-188.
    expect(describeLeadOrigin({}, SELF)).toMatchObject({
      confidence: 'unrecorded',
      label: 'Not recorded',
    });
  });

  it('ignores whitespace-only values', () => {
    expect(describeLeadOrigin({ utm_source: '   ', device: 'mobile' }, SELF).confidence).toBe(
      'direct'
    );
  });
});

describe('referrerHost', () => {
  it('drops a leading www.', () => {
    expect(referrerHost('https://www.example.com/x')).toBe('example.com');
  });

  it('returns null for an unparseable referrer', () => {
    expect(referrerHost('not a url')).toBeNull();
    expect(referrerHost(null)).toBeNull();
  });
});

describe('groupLeadsByChannel', () => {
  it('counts per channel, largest first', () => {
    const rows = groupLeadsByChannel(
      [
        { utm_source: 'instagram' },
        { utm_source: 'Instagram' },
        { utm_source: 'facebook' },
        { referrer_url: 'https://zillow.com/x' },
        { device: 'mobile' },
      ],
      SELF
    );
    expect(rows[0]).toEqual({ channel: 'instagram', label: 'Instagram', count: 2 });
    expect(rows.map((r) => r.label)).toContain('Zillow');
    expect(rows.reduce((sum, r) => sum + r.count, 0)).toBe(5);
  });

  it('breaks ties alphabetically so the order does not flicker between renders', () => {
    const first = groupLeadsByChannel([{ utm_source: 'zeta' }, { utm_source: 'alpha' }], SELF);
    const second = groupLeadsByChannel([{ utm_source: 'alpha' }, { utm_source: 'zeta' }], SELF);
    expect(first.map((r) => r.label)).toEqual(second.map((r) => r.label));
  });
});
