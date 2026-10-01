import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const { callEdgeFunction } = vi.hoisted(() => ({ callEdgeFunction: vi.fn() }));
vi.mock('@/lib/edgeFunctions', () => ({ callEdgeFunction }));

import { AccessibilityFeedbackForm } from './AccessibilityFeedbackForm';

describe('AccessibilityFeedbackForm (US-239)', () => {
  beforeEach(() => {
    callEdgeFunction.mockReset();
  });

  it('needs only a description, focuses it when missing, and sends with spam signals', async () => {
    callEdgeFunction.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderWithProviders(<AccessibilityFeedbackForm />);
    const status = screen.getByRole('status');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    const message = screen.getByLabelText(/what happened/i);
    expect(message).toHaveFocus();
    expect(callEdgeFunction).not.toHaveBeenCalled();

    await user.type(message, 'The sort menu on a profile will not open with Enter.');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    await waitFor(() => expect(callEdgeFunction).toHaveBeenCalledTimes(1));
    const [fn, opts] = callEdgeFunction.mock.calls[0];
    expect(fn).toBe('accessibility-feedback');
    expect(opts.body).toMatchObject({ message: expect.stringContaining('sort menu'), _hp: '', _elapsed_ms: expect.any(Number) });
    await waitFor(() => expect(status).toHaveTextContent(/your report was sent/i));
  });

  it('on failure, says so and gives the email address', async () => {
    callEdgeFunction.mockRejectedValue(new Error('502'));
    const user = userEvent.setup();
    renderWithProviders(<AccessibilityFeedbackForm />);
    await user.type(screen.getByLabelText(/what happened/i), 'Captions do not show on the tour video.');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('accessibility@agentbio.net'));
  });
});
