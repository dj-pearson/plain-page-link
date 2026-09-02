/**
 * US-113: the public review page.
 *
 * Two of its promises had nothing behind them. It required an email "for
 * verification only" — `testimonials` has no column for one and nothing ever
 * verified anything, so the address was collected and dropped. And the success
 * screen said the agent "will be notified", when the only trigger on the table
 * is track_testimonials_usage.
 *
 * The field is gone and the submission goes through the submit-review edge
 * function, which is what actually sends the notification. These assert the
 * payload and the absent field, because those are what changed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';

const AGENT_ID = '11111111-1111-1111-1111-111111111111';

let profileResult: MockQueryResult;
const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => createQueryBuilder(profileResult),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

const toastMock = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));

import SubmitReview from './SubmitReview';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/janedoe/review']}>
      <Routes>
        <Route path="/:username/review" element={<SubmitReview />} />
      </Routes>
    </MemoryRouter>
  );

const fillAndSubmit = async () => {
  await userEvent.click(screen.getByRole('button', { name: '5 stars' }));
  await userEvent.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
  await userEvent.type(
    screen.getByLabelText(/your review/i),
    'She talked us out of the wrong house before we could talk ourselves into it.'
  );
  await userEvent.click(screen.getByRole('button', { name: /submit review/i }));
};

describe('SubmitReview', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastMock.mockReset();
    profileResult = {
      data: { id: AGENT_ID, full_name: 'Jane Doe', avatar_url: null, bio: null },
      error: null,
    };
    invokeMock.mockResolvedValue({ data: { success: true, data: { id: 'r1' } }, error: null });
  });

  it('does not ask for an email it cannot store or verify', async () => {
    renderPage();
    await screen.findByText(/share your experience/i);

    expect(screen.queryByLabelText(/your email/i)).toBeNull();
    expect(screen.queryByText(/verification only/i)).toBeNull();
  });

  it('gives every star an accessible name', async () => {
    renderPage();
    await screen.findByText(/share your experience/i);

    expect(screen.getByRole('button', { name: '1 star' })).toBeInTheDocument();
    for (const n of [2, 3, 4, 5]) {
      expect(screen.getByRole('button', { name: `${n} stars` })).toBeInTheDocument();
    }
  });

  it('submits through the edge function that notifies the agent', async () => {
    renderPage();
    await screen.findByText(/share your experience/i);
    await fillAndSubmit();

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    const [fn, options] = invokeMock.mock.calls[0] as [string, { body: Record<string, unknown> }];
    expect(fn).toBe('submit-review');
    expect(options.body).toEqual(
      expect.objectContaining({
        user_id: AGENT_ID,
        client_name: 'Dana Rivers',
        rating: 5,
        transaction_type: 'buyer',
      })
    );
    // The column does not exist; sending one would be a PostgREST error.
    expect(options.body).not.toHaveProperty('client_email');
  });

  it('does not claim success when the function returns a failure body', async () => {
    // functions.invoke() only rejects on transport failures, so a 400 arrives
    // as data.success === false and used to render the thank-you screen.
    invokeMock.mockResolvedValue({
      data: { success: false, error: { message: 'Too many review submissions.' } },
      error: null,
    });

    renderPage();
    await screen.findByText(/share your experience/i);
    await fillAndSubmit();

    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    expect(screen.queryByText(/thank you!/i)).toBeNull();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('tells the visitor the review is held for approval, not that it is live', async () => {
    renderPage();
    await screen.findByText(/share your experience/i);
    await fillAndSubmit();

    expect(await screen.findByText(/thank you!/i)).toBeInTheDocument();
    expect(screen.getByText(/review each one before it appears/i)).toBeInTheDocument();
  });
});
