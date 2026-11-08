/**
 * Who a lead routing rule sends its leads to, as the routing screen shows it.
 *
 * lead_routing_rules.assigned_to names a user, not a roster row, so it can
 * outlive their membership. Since US-454 a departure pauses the rule and
 * auto_assign_lead ignores an assignee who is not on the team, but the rule
 * keeps the id so this screen can say what happened instead of showing a
 * bare "Unassigned" or, worse, a stale name.
 */

export interface RosterEntry {
  /** Null until the invite is accepted. */
  user_id: string | null;
  email: string | null;
}

export type RuleAssignee =
  | { kind: 'round_robin' }
  | { kind: 'member'; email: string }
  | { kind: 'departed' };

export function describeRuleAssignee(
  assignedTo: string | null,
  roster: readonly RosterEntry[]
): RuleAssignee {
  if (!assignedTo) return { kind: 'round_robin' };
  const member = roster.find((m) => m.user_id === assignedTo);
  if (!member) return { kind: 'departed' };
  return { kind: 'member', email: member.email ?? 'A teammate' };
}
