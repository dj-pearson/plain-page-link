import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { LeadRoutingRule } from '@/hooks/useLeadRouting';
import { describeRuleAssignee } from '@/lib/routingRuleAssignee';

const toggle = vi.fn();
let rules: LeadRoutingRule[] = [];

vi.mock('@/hooks/useLeadRouting', () => ({
  useLeadRouting: () => ({
    rules,
    isLoading: false,
    createRule: { mutate: vi.fn(), isPending: false },
    toggleRule: { mutate: toggle, isPending: false },
    deleteRule: { mutate: vi.fn(), isPending: false },
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { LeadRoutingRules } from './LeadRoutingRules';

const rule = (over: Partial<LeadRoutingRule>): LeadRoutingRule => ({
  id: 'r1',
  team_id: 't1',
  name: 'Buyers',
  criteria: { lead_type: 'buyer' },
  assigned_to: null,
  is_active: true,
  priority: 1,
  created_at: '2026-11-01T00:00:00Z',
  ...over,
});

const members = [
  { user_id: 'owner', email: 'owner@example.com' },
  { user_id: 'amy', email: 'amy@example.com' },
  { user_id: null, email: 'pending@example.com' },
];

describe('describeRuleAssignee (US-454)', () => {
  it('reads a null assignee as round robin', () => {
    expect(describeRuleAssignee(null, members)).toEqual({ kind: 'round_robin' });
  });

  it('names a current member', () => {
    expect(describeRuleAssignee('amy', members)).toEqual({
      kind: 'member',
      email: 'amy@example.com',
    });
  });

  it('flags an assignee who is no longer on the roster', () => {
    expect(describeRuleAssignee('gone', members)).toEqual({ kind: 'departed' });
  });
});

describe('LeadRoutingRules (US-454)', () => {
  beforeEach(() => {
    toggle.mockClear();
  });

  it("shows a departed teammate's paused rule as unassigned and does not offer to resume it", () => {
    rules = [rule({ assigned_to: 'gone', is_active: false })];
    render(<LeadRoutingRules teamId="t1" members={members} />);
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('buyer → unassigned');
    expect(item).toHaveTextContent('paused');
    expect(item).toHaveTextContent(/has left the team/);
    expect(within(item).getByRole('switch', { name: 'Resume rule Buyers' })).toBeDisabled();
  });

  it("names a current member's rule and lets it be paused", () => {
    rules = [rule({ assigned_to: 'amy' })];
    render(<LeadRoutingRules teamId="t1" members={members} />);
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('buyer → amy@example.com');
    expect(item).not.toHaveTextContent(/has left the team/);
    const sw = within(item).getByRole('switch', { name: 'Pause rule Buyers' });
    expect(sw).toBeEnabled();
    expect(within(item).getByRole('button', { name: 'Delete rule Buyers' })).toBeInTheDocument();
  });
});
