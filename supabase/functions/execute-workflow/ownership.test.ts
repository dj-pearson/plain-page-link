/**
 * US-218: workflow steps may only touch the workflow owner's leads, and the
 * webhook step may not reach the internal network.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertLeadOwnedBy, taskAssignee, type LeadReader } from './ownership.ts';

const reader = (row: { user_id: string; assigned_to: string | null } | null): LeadReader => ({
  from: () => ({
    select: () => ({
      eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }),
    }),
  }),
});

describe('assertLeadOwnedBy', () => {
  it("returns the owner's own lead", async () => {
    await expect(assertLeadOwnedBy(reader({ user_id: 'a', assigned_to: null }), 'l1', 'a')).resolves.toMatchObject({
      user_id: 'a',
    });
  });

  it("refuses another agent's lead with the same answer as a missing one", async () => {
    await expect(assertLeadOwnedBy(reader({ user_id: 'b', assigned_to: null }), 'l1', 'a')).rejects.toThrow('Lead not found');
    await expect(assertLeadOwnedBy(reader(null), 'l1', 'a')).rejects.toThrow('Lead not found');
  });
});

describe('taskAssignee', () => {
  const lead = { user_id: 'owner', assigned_to: 'teammate' };
  it('allows the owner or the current assignee', () => {
    expect(taskAssignee('owner', lead)).toBe('owner');
    expect(taskAssignee('teammate', lead)).toBe('teammate');
  });
  it('anyone else falls back to the owner', () => {
    expect(taskAssignee('stranger', lead)).toBe('owner');
    expect(taskAssignee(undefined, lead)).toBe('owner');
  });
});

describe('execute-workflow source', () => {
  const src = readFileSync(join(__dirname, 'index.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  it('never calls bare fetch() — every outbound request goes through safeFetch', () => {
    expect(src).not.toMatch(/(?<![A-Za-z_.])fetch\(/);
  });
  it('update_lead and create_task check lead ownership', () => {
    expect(src.match(/assertLeadOwnedBy\(/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});
