/**
 * US-374: the brokerage logo is uploaded through the same path as the avatar
 * (useProfileImageUpload), into the brokerage-logos bucket, with magic-number
 * validation (US-076). The shared path also stops deleting the previous image
 * before the new one is safely in place.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';

const { storageMock, fromBucket, profilesMock, validateMock, toastMock } = vi.hoisted(() => {
  const storageMock = {
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  };
  const profilesMock = {
    update: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
  };
  return {
    storageMock,
    fromBucket: vi.fn(() => storageMock),
    profilesMock,
    validateMock: vi.fn(),
    toastMock: vi.fn(),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: { from: fromBucket },
    from: () => profilesMock,
  },
}));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T>(select: (s: { user: { id: string } }) => T) => select({ user: { id: 'u1' } }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock('@/lib/fileValidation', () => ({ validateUpload: validateMock }));

import { useBrokerageLogoUpload } from './useBrokerageLogoUpload';
import { useAvatarUpload } from './useAvatarUpload';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

const logoFile = () => new File(['x'], 'logo.png', { type: 'image/png' });
const LOGO_URL = 'https://example.supabase.co/storage/v1/object/public/brokerage-logos/u1/logo.png';

describe('useBrokerageLogoUpload', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    fromBucket.mockClear();
    storageMock.upload.mockReset().mockResolvedValue({ error: null });
    storageMock.getPublicUrl.mockReset().mockReturnValue({ data: { publicUrl: LOGO_URL } });
    storageMock.list
      .mockReset()
      .mockResolvedValue({ data: [{ name: 'logo-1.png' }, { name: 'logo-1700000000000.png' }] });
    storageMock.remove.mockReset().mockResolvedValue({ error: null });
    profilesMock.update.mockReset().mockReturnValue(profilesMock);
    profilesMock.eq.mockReset().mockReturnValue(profilesMock);
    profilesMock.select.mockReset().mockReturnValue(profilesMock);
    profilesMock.single.mockReset().mockResolvedValue({ data: { id: 'u1' }, error: null });
    validateMock.mockReset().mockResolvedValue(null);
    toastMock.mockReset();
  });

  it('uploads to the brokerage-logos bucket under the uid and saves brokerage_logo', async () => {
    const { result } = renderHook(() => useBrokerageLogoUpload(), { wrapper });

    let url: string | null = null;
    await act(async () => {
      url = await result.current.uploadLogo(logoFile());
    });

    expect(url).toBe(LOGO_URL);
    expect(fromBucket).toHaveBeenCalledWith('brokerage-logos');
    expect(fromBucket).not.toHaveBeenCalledWith('avatars');
    expect(storageMock.upload).toHaveBeenCalledWith(
      'u1/logo-1700000000000.png',
      expect.any(File),
      expect.anything()
    );
    expect(profilesMock.update).toHaveBeenCalledWith({ brokerage_logo: LOGO_URL });
    // The bare .select() after an update is refused on profiles (US-235).
    expect(profilesMock.select).toHaveBeenCalledWith('id');
  });

  it('validates against the bucket limits: 2MB, no SVG, magic number checked', async () => {
    const { result } = renderHook(() => useBrokerageLogoUpload(), { wrapper });
    await act(async () => {
      await result.current.uploadLogo(logoFile());
    });

    const [, options] = validateMock.mock.calls[0];
    expect(options.maxBytes).toBe(2 * 1024 * 1024);
    expect(options.accept).not.toContain('image/svg+xml');
  });

  it('rejects a file that fails validation without touching storage or the profile', async () => {
    validateMock.mockResolvedValue("This file's contents don't match its type.");
    const { result } = renderHook(() => useBrokerageLogoUpload(), { wrapper });

    let url: string | null = 'unset';
    await act(async () => {
      url = await result.current.uploadLogo(logoFile());
    });

    expect(url).toBeNull();
    expect(storageMock.upload).not.toHaveBeenCalled();
    expect(profilesMock.update).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Invalid file', variant: 'destructive' })
    );
  });

  it('removes the replaced logo only after the profile points at the new one', async () => {
    const { result } = renderHook(() => useBrokerageLogoUpload(), { wrapper });
    await act(async () => {
      await result.current.uploadLogo(logoFile());
    });

    expect(storageMock.remove).toHaveBeenCalledWith(['u1/logo-1.png']);
    const updateOrder = profilesMock.single.mock.invocationCallOrder[0];
    const removeOrder = storageMock.remove.mock.invocationCallOrder[0];
    expect(removeOrder).toBeGreaterThan(updateOrder);
  });

  it('keeps the current logo when the upload fails', async () => {
    storageMock.upload.mockResolvedValue({ error: { message: 'quota exceeded' } });
    const { result } = renderHook(() => useBrokerageLogoUpload(), { wrapper });

    let url: string | null = 'unset';
    await act(async () => {
      url = await result.current.uploadLogo(logoFile());
    });

    expect(url).toBeNull();
    expect(storageMock.remove).not.toHaveBeenCalled();
    expect(profilesMock.update).not.toHaveBeenCalled();
  });

  it('keeps the current logo when the profile update fails', async () => {
    profilesMock.single.mockResolvedValue({ data: null, error: { message: 'denied' } });
    const { result } = renderHook(() => useBrokerageLogoUpload(), { wrapper });

    let url: string | null = 'unset';
    await act(async () => {
      url = await result.current.uploadLogo(logoFile());
    });

    expect(url).toBeNull();
    expect(storageMock.remove).not.toHaveBeenCalled();
  });
});

describe('useAvatarUpload on the shared path', () => {
  beforeEach(() => {
    fromBucket.mockClear();
    profilesMock.update.mockClear();
  });

  it('still writes avatar_url in the avatars bucket', async () => {
    const { result } = renderHook(() => useAvatarUpload(), { wrapper });
    await act(async () => {
      await result.current.uploadAvatar(new File(['x'], 'me.jpg', { type: 'image/jpeg' }));
    });

    expect(fromBucket).toHaveBeenCalledWith('avatars');
    expect(fromBucket).not.toHaveBeenCalledWith('brokerage-logos');
    expect(profilesMock.update).toHaveBeenCalledWith({ avatar_url: LOGO_URL });
  });
});
