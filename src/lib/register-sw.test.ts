/**
 * US-211: the service worker reloaded every first-time visitor.
 *
 * `controlling` fires whenever a service worker takes control of the page,
 * which includes the first registration on a first visit — not only an update
 * the visitor asked for. Reloading there means the page is fetched, parsed and
 * rendered twice before anyone can read it.
 *
 * Measured on a production build served with real cache headers: the landing
 * page went from 1232 KB over 36 requests to 2109 KB over 57, with the
 * document, the stylesheet and every entry chunk fetched twice. The public
 * profile went 1397 KB -> 2274 KB.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Listener = () => void;

const listeners = new Map<string, Listener[]>();
const messageSkipWaiting = vi.fn();
const register = vi.fn().mockResolvedValue(undefined);

vi.mock('workbox-window', () => ({
  Workbox: class {
    addEventListener(event: string, listener: Listener) {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    }
    messageSkipWaiting = messageSkipWaiting;
    register = register;
  },
}));

interface ToastAction {
  label: string;
  onClick: () => void;
}
let lastToastAction: ToastAction | undefined;

vi.mock('sonner', () => ({
  toast: Object.assign(
    (_message: string, options?: { action?: ToastAction }) => {
      lastToastAction = options?.action;
    },
    { error: vi.fn(), success: vi.fn() }
  ),
}));

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn() } }));

const fire = (event: string) => (listeners.get(event) ?? []).forEach((l) => l());

const reload = vi.fn();

describe('registerServiceWorker (US-211)', () => {
  beforeEach(() => {
    listeners.clear();
    lastToastAction = undefined;
    reload.mockClear();
    messageSkipWaiting.mockClear();
    register.mockClear();
    vi.stubEnv('PROD', true);
    vi.stubGlobal('navigator', { serviceWorker: {} });
    // jsdom's location.reload is not configurable; replace the object.
    vi.stubGlobal('window', { ...globalThis.window, location: { reload } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function register_() {
    const { registerServiceWorker } = await import('./register-sw');
    registerServiceWorker();
  }

  it('does not reload when a worker takes control on a first visit', async () => {
    await register_();
    // No update was offered and none was accepted; this is simply the worker
    // that was just registered taking over.
    fire('controlling');
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads only after the visitor asks for the update', async () => {
    await register_();

    fire('waiting');
    expect(lastToastAction?.label).toBe('Refresh');

    // Still nothing: being offered an update is not asking for one.
    fire('controlling');
    expect(reload).not.toHaveBeenCalled();

    lastToastAction!.onClick();
    expect(messageSkipWaiting).toHaveBeenCalled();

    fire('controlling');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads at most once', async () => {
    await register_();
    fire('waiting');
    lastToastAction!.onClick();
    fire('controlling');
    fire('controlling');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not register outside production', async () => {
    vi.stubEnv('PROD', false);
    vi.resetModules();
    await register_();
    expect(register).not.toHaveBeenCalled();
  });
});
