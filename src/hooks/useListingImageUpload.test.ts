/**
 * US-107: uploadListingImages returned [] for every failure — not logged in,
 * file too large, storage error — which the caller could not tell apart from
 * "no images selected". Listings.tsx read that as a normal `return` and the
 * six-step Add form closed and reset, so one oversized photo cost the agent
 * the entire listing.
 *
 * These pin the two things that made the loss possible: it throws now, and the
 * rollback can actually find the objects it uploaded.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';

const { storageMock, invokeMock, validateMock } = vi.hoisted(() => ({
  storageMock: {
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
    remove: vi.fn(),
  },
  invokeMock: vi.fn(),
  validateMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { storage: { from: () => storageMock } },
}));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: () => ({ user: { id: 'u1' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/edgeFunctions', () => ({ edgeFunctions: { invoke: invokeMock } }));
vi.mock('@/lib/fileValidation', () => ({ validateUpload: validateMock }));

import { useListingImageUpload } from './useListingImageUpload';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

const file = (name = 'photo.jpg') => new File(['x'], name, { type: 'image/jpeg' });

const PUBLIC_URL =
  'https://example.supabase.co/storage/v1/object/public/listing-photos/u1/123/abc.jpg';

describe('uploadListingImages', () => {
  beforeEach(() => {
    storageMock.upload.mockReset().mockResolvedValue({ error: null });
    storageMock.getPublicUrl.mockReset().mockReturnValue({ data: { publicUrl: PUBLIC_URL } });
    storageMock.remove.mockReset().mockResolvedValue({ error: null });
    invokeMock.mockReset().mockResolvedValue({});
    validateMock.mockReset().mockResolvedValue(null);
  });

  it('throws when a file fails validation, rather than returning an empty list', async () => {
    validateMock.mockResolvedValue('File is larger than 5MB');
    const { result } = renderHook(() => useListingImageUpload(), { wrapper });

    await expect(result.current.uploadListingImages([file()])).rejects.toThrow(/5MB/);
  });

  it('throws when storage rejects the upload', async () => {
    storageMock.upload.mockResolvedValue({ error: { message: 'quota exceeded' } });
    const { result } = renderHook(() => useListingImageUpload(), { wrapper });

    await expect(result.current.uploadListingImages([file()])).rejects.toThrow(/quota exceeded/);
  });

  it('optimises against the bucket that exists', async () => {
    const { result } = renderHook(() => useListingImageUpload(), { wrapper });
    await result.current.uploadListingImages([file()]);

    // 'listings' is not a bucket; optimize-image 404'd on every upload and the
    // public page served the untouched 5 MB original.
    expect(invokeMock).toHaveBeenCalledWith(
      'optimize-image',
      expect.objectContaining({ body: expect.objectContaining({ bucket: 'listing-photos' }) })
    );
  });

  it('rolls back the objects it already uploaded when a later file fails', async () => {
    storageMock.upload
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'network' } });

    const { result } = renderHook(() => useListingImageUpload(), { wrapper });
    await expect(
      result.current.uploadListingImages([file('a.jpg'), file('b.jpg')])
    ).rejects.toThrow();

    // The old path regex was /listings\/(.+)$/, which never matched a
    // listing-photos URL — so the rollback always had nothing to delete and
    // every partial upload orphaned its objects.
    expect(storageMock.remove).toHaveBeenCalledWith(['u1/123/abc.jpg']);
  });

  it('returns the public URLs on success', async () => {
    const { result } = renderHook(() => useListingImageUpload(), { wrapper });

    await expect(result.current.uploadListingImages([file()])).resolves.toEqual([PUBLIC_URL]);
  });
});
