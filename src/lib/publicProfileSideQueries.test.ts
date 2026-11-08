/**
 * US-674: profile_shows_branding now returns NULL unless the agent's page is
 * published or the caller owns it (it used to reveal any agent's plan). The
 * browser must keep reading anything but an explicit `false` as "show the
 * footer", so a NULL never hides the branding.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

import { profileShowsBrandingQueryOptions } from './publicProfileSideQueries';

const answer = (data: unknown, error: unknown = null) => {
  rpc.mockResolvedValueOnce({ data, error });
  return new QueryClient().fetchQuery(profileShowsBrandingQueryOptions('agent-1'));
};

describe('profileShowsBrandingQueryOptions', () => {
  beforeEach(() => rpc.mockReset());

  it('hides the footer only on an explicit false', async () => {
    await expect(answer(false)).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledWith('profile_shows_branding', { _user_id: 'agent-1' });
  });

  it('shows it for true', async () => {
    await expect(answer(true)).resolves.toBe(true);
  });

  it('shows it when the function answers NULL for a page that is not published', async () => {
    await expect(answer(null)).resolves.toBe(true);
  });

  it('shows it on an error', async () => {
    await expect(answer(null, { message: 'boom' })).resolves.toBe(true);
  });
});
