/**
 * US-103: getRecommendedActions() has produced advice since it was written and
 * no component ever rendered it. These cover the narrowing that replaced it —
 * one action, with a button behind it.
 */
import { describe, it, expect } from 'vitest';
import { getLeadNextStep } from './leadNextStep';
import { makeLead } from '@/test/fixtures/lead';

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

describe('getLeadNextStep', () => {
  it('puts an unanswered new lead ahead of everything else', () => {
    const step = getLeadNextStep(
      makeLead({ status: 'new', first_responded_at: null, created_at: hoursAgo(0.1) })
    );
    expect(step.action).toBe('call');
    expect(step.urgency).toBe('now');
  });

  it('says how long an unanswered lead has been waiting', () => {
    const step = getLeadNextStep(
      makeLead({ status: 'new', first_responded_at: null, created_at: hoursAgo(3) })
    );
    expect(step.rationale).toMatch(/3h/);
  });

  it('routes to email when the lead left no phone number', () => {
    const step = getLeadNextStep(
      makeLead({ status: 'new', first_responded_at: null, phone: null })
    );
    expect(step.action).toBe('email');
    expect(step.rationale).toMatch(/no phone/i);
  });

  it('does not tell the agent to call a lead they have already answered', () => {
    const step = getLeadNextStep(
      makeLead({
        status: 'contacted',
        first_responded_at: hoursAgo(1),
        contacted_at: hoursAgo(1),
      })
    );
    expect(step.urgency).not.toBe('now');
  });

  it('chases a lead that has gone quiet for three days', () => {
    const step = getLeadNextStep(
      makeLead({
        status: 'qualified',
        first_responded_at: hoursAgo(80),
        contacted_at: hoursAgo(80),
      })
    );
    expect(step.action).toBe('call');
    expect(step.rationale).toMatch(/3 days ago/);
  });

  it('pushes a hot scored lead towards a viewing', () => {
    const step = getLeadNextStep(
      makeLead({ status: 'contacted', first_responded_at: hoursAgo(2), contacted_at: hoursAgo(2) }),
      85
    );
    expect(step.label).toMatch(/viewing/i);
    expect(step.rationale).toMatch(/85/);
  });

  it('turns a closed lead into a referral opportunity rather than nothing', () => {
    const step = getLeadNextStep(
      makeLead({ status: 'converted', first_responded_at: hoursAgo(200) })
    );
    expect(step.action).toBe('task');
    expect(step.rationale).toMatch(/referral/i);
  });

  it('always returns something actionable', () => {
    for (const status of ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost']) {
      const step = getLeadNextStep(makeLead({ status }));
      expect(step.label).toBeTruthy();
      expect(['call', 'email', 'sms', 'task']).toContain(step.action);
    }
  });
});
