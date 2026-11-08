import { describe, it, expect } from 'vitest';
import { planBulkDelete, summarizeBulkDelete, summarizeBulkStatus } from './leadBulkActions';

describe('summarizeBulkStatus (US-588)', () => {
  it('reports a full update plainly', () => {
    expect(summarizeBulkStatus(3, 3, 'Contacted')).toEqual({
      title: 'Status updated',
      description: '3 leads set to Contacted.',
      partial: false,
    });
  });

  it('reports the leads the server did not change', () => {
    const s = summarizeBulkStatus(3, 2, 'Lost');
    expect(s.partial).toBe(true);
    expect(s.title).toBe('Some leads were not updated');
    expect(s.description).toContain('2 leads set to Lost.');
    expect(s.description).toContain('1 lead not changed; it was deleted');
  });

  it('never says "updated" when nothing changed', () => {
    const s = summarizeBulkStatus(2, 0, 'Contacted');
    expect(s.title).toBe('Status not updated');
    expect(s.partial).toBe(true);
    expect(s.description).not.toMatch(/set to/);
  });
});

describe('planBulkDelete / summarizeBulkDelete (US-588)', () => {
  const loaded = [
    { id: 'a', user_id: 'me' },
    { id: 'b', user_id: 'me' },
    { id: 'c', user_id: 'owner' },
  ];

  it('sends only the viewer’s own leads and counts the assigned ones', () => {
    expect(planBulkDelete(['a', 'b', 'c'], loaded, 'me')).toEqual({
      toDelete: ['a', 'b'],
      notOwned: 1,
    });
  });

  it('sends ids that are no longer loaded and lets the server decide', () => {
    expect(planBulkDelete(['gone'], loaded, 'me').toDelete).toEqual(['gone']);
  });

  it('reports a clean delete', () => {
    expect(summarizeBulkDelete({ toDelete: ['a', 'b'], notOwned: 0 }, 2)).toEqual({
      title: 'Leads deleted',
      description: '2 leads deleted.',
      partial: false,
    });
  });

  it('reports kept assigned leads and refused ids', () => {
    const s = summarizeBulkDelete({ toDelete: ['a', 'b'], notOwned: 1 }, 1);
    expect(s.title).toBe('Some leads were not deleted');
    expect(s.partial).toBe(true);
    expect(s.description).toContain('1 lead deleted.');
    expect(s.description).toContain('1 lead kept: only a lead’s owner can delete it');
    expect(s.description).toContain('1 lead could not be deleted');
  });

  it('says nothing was deleted when the selection was all assigned leads', () => {
    const s = summarizeBulkDelete({ toDelete: [], notOwned: 2 }, 0);
    expect(s.title).toBe('No leads deleted');
    expect(s.description).toContain('2 leads kept');
  });
});
