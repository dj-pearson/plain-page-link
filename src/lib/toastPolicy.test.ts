import { describe, it, expect, vi } from 'vitest';

const { error } = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error }) }));

import { toast } from 'sonner';
import { installToastPolicy } from './toastPolicy';

describe('installToastPolicy (US-238)', () => {
  it('error toasts persist unless the caller says otherwise; installing twice is harmless', () => {
    installToastPolicy();
    installToastPolicy();
    toast.error('Payment failed');
    expect(error).toHaveBeenLastCalledWith('Payment failed', { duration: Infinity });
    toast.error('Brief', { duration: 2000, description: 'x' });
    expect(error).toHaveBeenLastCalledWith('Brief', { duration: 2000, description: 'x' });
    expect(error).toHaveBeenCalledTimes(2);
  });
});
