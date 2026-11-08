import { describe, it, expect } from 'vitest';
import { assigneeLabel, describeAssignee, isNotTeammateError } from './leadAssignee';

const ROSTER = [{ userId: 'u2', label: 'jo@acme.test' }];

describe('describeAssignee', () => {
  it("says 'Unassigned' only to a team owner looking at their own lead", () => {
    const lead = { user_id: 'owner', assigned_to: null };
    expect(describeAssignee(lead, 'owner', ROSTER, true)).toBe('Unassigned');
    expect(describeAssignee(lead, 'owner', [], false)).toBeNull();
    expect(describeAssignee(lead, 'someone-else', ROSTER, true)).toBeNull();
  });

  it('names the teammate from the roster', () => {
    expect(describeAssignee({ user_id: 'owner', assigned_to: 'u2' }, 'owner', ROSTER, true)).toBe(
      'Assigned to jo@acme.test'
    );
  });

  it('tells the assignee the lead is theirs', () => {
    expect(describeAssignee({ user_id: 'owner', assigned_to: 'u2' }, 'u2', [], false)).toBe(
      'Assigned to you'
    );
    expect(describeAssignee({ user_id: 'owner', assigned_to: 'owner' }, 'owner', [], true)).toBe(
      'Assigned to you'
    );
  });

  it('says when the assignee is off the team, but only to the owner', () => {
    const lead = { user_id: 'owner', assigned_to: 'gone' };
    expect(describeAssignee(lead, 'owner', ROSTER, true)).toBe(
      'Assigned to someone not on your team'
    );
    expect(describeAssignee(lead, 'u2', ROSTER, false)).toBeNull();
  });

  it('names an owner-held lead for a teammate who is not the owner', () => {
    expect(describeAssignee({ user_id: 'owner', assigned_to: 'owner' }, 'u2', [], false)).toBe(
      'Assigned to the owner'
    );
  });
});

describe('assigneeLabel', () => {
  it('uses the email and never shows a raw user id', () => {
    expect(assigneeLabel({ email: 'a@b.test', user_id: 'x' })).toBe('a@b.test');
    expect(assigneeLabel({ email: null, user_id: 'x' })).toBe('Teammate');
  });
});

describe('isNotTeammateError', () => {
  it("recognises guard_lead_assignee's refusal and nothing else", () => {
    expect(isNotTeammateError({ code: '23514', details: 'lead_assignee_not_teammate' })).toBe(true);
    expect(isNotTeammateError({ code: '23514', details: 'plan_limit:links' })).toBe(false);
    expect(isNotTeammateError({ code: '42501' })).toBe(false);
    expect(isNotTeammateError(null)).toBe(false);
    expect(isNotTeammateError('boom')).toBe(false);
  });
});
