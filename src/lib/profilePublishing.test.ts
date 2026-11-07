import { describe, it, expect } from 'vitest';
import { isUnpublishedPreview, publicProfileFilter } from './profilePublishing';

const UID = '11111111-2222-3333-4444-555555555555';

describe('publicProfileFilter (US-265)', () => {
  it('asks a visitor for published pages only', () => {
    expect(publicProfileFilter(null)).toBe('is_published.eq.true');
    expect(publicProfileFilter(undefined)).toBe('is_published.eq.true');
    expect(publicProfileFilter('')).toBe('is_published.eq.true');
  });

  it('asks a signed-in viewer for published pages or their own', () => {
    expect(publicProfileFilter(UID)).toBe(`is_published.eq.true,id.eq.${UID}`);
    expect(publicProfileFilter(UID.toUpperCase())).toBe(`is_published.eq.true,id.eq.${UID}`);
  });

  it('ignores a viewer id that is not a uuid instead of interpolating it', () => {
    expect(publicProfileFilter(`${UID},is_published.eq.false`)).toBe('is_published.eq.true');
    expect(publicProfileFilter('id.neq.0)')).toBe('is_published.eq.true');
  });
});

describe('isUnpublishedPreview', () => {
  it('is a preview for anything but true, because RLS compares is_published = true', () => {
    expect(isUnpublishedPreview({ is_published: false })).toBe(true);
    expect(isUnpublishedPreview({ is_published: null })).toBe(true);
    expect(isUnpublishedPreview({ is_published: true })).toBe(false);
  });

  it('is not a preview while there is no profile', () => {
    expect(isUnpublishedPreview(null)).toBe(false);
    expect(isUnpublishedPreview(undefined)).toBe(false);
  });
});
