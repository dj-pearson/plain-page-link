/**
 * US-306 (slice US-285): a failed key list used to read as "No active API
 * keys yet", the copy and revoke buttons had no names, and a refused clipboard
 * write lost the one-time key silently.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/lib/edgeFunctions', () => ({ edgeFunctions: { invoke } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import ApiKeysPage from './ApiKeysPage';

const KEY = {
  id: 'k1',
  name: 'Follow Up Boss',
  key_prefix: 'ab_12',
  permissions: { read: true },
  last_used_at: null,
  expires_at: null,
  revoked_at: null,
  created_at: '2026-10-01T00:00:00Z',
};

type Body = { action: string; [k: string]: unknown };
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

describe('ApiKeysPage', () => {
  beforeEach(() => {
    invoke.mockReset();
  });
  afterEach(() => {
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else setClipboard(undefined);
  });

  it('shows a retryable error, not the empty state, when the list fails', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { message: 'network down' } });
    renderWithProviders(<ApiKeysPage />);

    expect(await screen.findByText(/couldn’t load your api keys/i)).toBeInTheDocument();
    expect(screen.queryByText(/no active api keys yet/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your keys' })).toBeInTheDocument();

    invoke.mockResolvedValueOnce({ data: { keys: [KEY] }, error: null });
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Follow Up Boss')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your keys (1)' })).toBeInTheDocument();
  });

  it('names the revoke button and the key in the confirmation', async () => {
    invoke.mockImplementation(async (_fn: string, { body }: { body: Body }) =>
      body.action === 'list' ? { data: { keys: [KEY] }, error: null } : { data: {}, error: null }
    );
    renderWithProviders(<ApiKeysPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Revoke Follow Up Boss' }));
    expect(await screen.findByText('Revoke “Follow Up Boss”?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith('api-keys', { body: { action: 'revoke', id: 'k1' } })
    );
  });

  async function createKey() {
    invoke.mockImplementation(async (_fn: string, { body }: { body: Body }) =>
      body.action === 'create'
        ? { data: { key: 'ab_secret_value' }, error: null }
        : { data: { keys: [] }, error: null }
    );
    renderWithProviders(<ApiKeysPage />);
    await userEvent.type(await screen.findByLabelText('API key name'), 'Zapier');
    await userEvent.click(screen.getByRole('button', { name: /create key/i }));
    return screen.findByRole('button', { name: 'Copy API key' });
  }

  it('copies the new key and announces it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const copy = await createKey();
    await userEvent.click(copy);
    expect(writeText).toHaveBeenCalledWith('ab_secret_value');
    expect(await screen.findByText('Copied to your clipboard.')).toBeInTheDocument();
  });

  it('selects the key and says so when the browser refuses the clipboard', async () => {
    const copy = await createKey();
    // userEvent installs its own clipboard stub; replace it with a refusal.
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) });
    await userEvent.click(copy);

    expect(await screen.findByText(/browser blocked automatic copying/i)).toBeInTheDocument();
    expect(window.getSelection()?.toString()).toBe('ab_secret_value');
    expect(screen.getByTestId('created-api-key')).toHaveTextContent('ab_secret_value');
  });

  it('falls back the same way when there is no clipboard API (insecure context)', async () => {
    const copy = await createKey();
    setClipboard(undefined);
    await userEvent.click(copy);
    expect(await screen.findByText(/browser blocked automatic copying/i)).toBeInTheDocument();
    expect(window.getSelection()?.toString()).toBe('ab_secret_value');
  });
});
