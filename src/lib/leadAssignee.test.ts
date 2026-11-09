import { describe, it, expect } from 'vitest';
import {
  assigneeLabel,
  describeAssignee,
  isNotTeammateError,
  normalizeAssigneeFilter,
  planBulkAssign,
  summarizeBulkAssign,
} from './leadAssignee';

const ROSTER = [{ userId: 'u2', label: 'jo@acme.test' }];

describe('normalizeAssigneeFilter (US-515)', () => {
  it('keeps unassigned and a user id, lower-cased', () => {
    expect(normalizeAssigneeFilter('unassigned')).toBe('unassigned');
    expect(normalizeAssigneeFilter('22222222-2222-4222-8222-AAAAAAAAAAAA')).toBe(
      '22222222-2222-4222-8222-aaaaaaaaaaaa'
    );
  });

  it('reads anything else as no filter', () => {
    expect(normalizeAssigneeFilter(null)).toBeNull();
    expect(normalizeAssigneeFilter('')).toBeNull();
    expect(normalizeAssigneeFilter('me')).toBeNull();
    expect(normalizeAssigneeFilter('x,user_id.neq.1')).toBeNull();
  });
});

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

describe('planBulkAssign / summarizeBulkAssign (US-573)', () => {
  const loaded = [
    { id: 'a', user_id: 'owner', assigned_to: null },
    { id: 'b', user_id: 'owner', assigned_to: 'u2' },
    { id: 'c', user_id: 'other-owner', assigned_to: 'owner' },
  ];

  it('sends only the viewer’s leads that change, and counts the rest', () => {
    const plan = planBulkAssign(['a', 'b', 'c'], loaded, 'owner', 'u2');
    expect(plan).toEqual({ toUpdate: ['a'], notOwned: 1, unchanged: 1 });
  });

  it('sends an id that is no longer loaded and lets the server decide', () => {
    expect(planBulkAssign(['gone'], loaded, 'owner', null).toUpdate).toEqual(['gone']);
  });

  it('unassigns: a lead already unassigned is unchanged', () => {
    expect(planBulkAssign(['a', 'b'], loaded, 'owner', null)).toEqual({
      toUpdate: ['b'],
      notOwned: 0,
      unchanged: 1,
    });
  });

  it('reports a clean result as not partial', () => {
    const plan = { toUpdate: ['a', 'b'], notOwned: 0, unchanged: 0 };
    expect(summarizeBulkAssign(plan, 2, 'jo@acme.test')).toEqual({
      title: 'Leads reassigned',
      description: '2 leads are now assigned to jo@acme.test.',
      partial: false,
    });
  });

  it('reports another agent’s leads and rows the server did not change', () => {
    const plan = { toUpdate: ['a', 'b'], notOwned: 1, unchanged: 0 };
    const s = summarizeBulkAssign(plan, 1, null);
    expect(s.partial).toBe(true);
    expect(s.title).toBe('Some leads were not reassigned');
    expect(s.description).toContain('1 lead is now unassigned.');
    expect(s.description).toContain('1 lead not changed: only a lead’s owner can reassign it');
    expect(s.description).toContain('1 lead could not be changed');
  });
});
