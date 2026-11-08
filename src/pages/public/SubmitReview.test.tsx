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
 *
 * US-611: the page called supabase.functions.invoke, which posts to
 * ${VITE_SUPABASE_URL}/functions/v1 — the empty edge runtime behind Kong that
 * answers every name with a 500. Every review failed. It now goes through
 * callEdgeFunction (VITE_FUNCTIONS_URL), and a refusal the visitor can act on
 * is shown to them instead of "please try again".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';

const AGENT_ID = '11111111-1111-1111-1111-111111111111';

let profileResult: MockQueryResult;
const invokeMock = vi.fn();
const callMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => createQueryBuilder(profileResult),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
  supabaseConfig: { url: 'https://api.test', anonKey: 'anon', functionsUrl: 'https://fn.test' },
}));

vi.mock('@/lib/edgeFunctions', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edgeFunctions')>('@/lib/edgeFunctions');
  return { ...actual, callEdgeFunction: (...args: unknown[]) => callMock(...args) };
});

const toastMock = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));

import SubmitReview, { REVIEW_LIMITS, reviewFailureMessage } from './SubmitReview';
import { EdgeFunctionError } from '@/lib/edgeFunctions';

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/janedoe/review']}>
        <Routes>
          <Route path="/:username/review" element={<SubmitReview />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
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
    callMock.mockReset();
    toastMock.mockReset();
    profileResult = {
      data: { id: AGENT_ID, full_name: 'Jane Doe', avatar_url: null, bio: null },
      error: null,
    };
    callMock.mockResolvedValue({ id: 'r1', pendingApproval: true, notified: true });
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

  it('submits to the routed functions host, not supabase.functions.invoke (US-611)', async () => {
    renderPage();
    await screen.findByText(/share your experience/i);
    await fillAndSubmit();

    await waitFor(() => expect(callMock).toHaveBeenCalledTimes(1));
    // invoke() would have posted to the empty runtime behind Kong.
    expect(invokeMock).not.toHaveBeenCalled();
    const [fn, options] = callMock.mock.calls[0] as [
      string,
      { body: Record<string, unknown>; auth?: boolean },
    ];
    expect(fn).toBe('submit-review');
    // A visitor has no session; sending one would not change anything, and a
    // stale token in localStorage must not be what decides whether it works.
    expect(options.auth).toBe(false);
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

  it('does not claim success when the function refuses, and says why', async () => {
    callMock.mockRejectedValue(
      new EdgeFunctionError('Too many review submissions. Please try again in a minute.', {
        functionName: 'submit-review',
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
      })
    );

    renderPage();
    await screen.findByText(/share your experience/i);
    await fillAndSubmit();

    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(screen.queryByText(/thank you!/i)).toBeNull();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        description: 'Too many review submissions. Please try again in a minute.',
      })
    );
    // The review they wrote is still there to send again.
    expect(screen.getByLabelText(/your review/i)).toHaveValue(
      'She talked us out of the wrong house before we could talk ourselves into it.'
    );
  });

  it('stops the visitor at the limits the function enforces', async () => {
    renderPage();
    await screen.findByText(/share your experience/i);

    expect(screen.getByLabelText(/your review/i)).toHaveAttribute('maxLength', '2000');
    expect(screen.getByLabelText(/your name/i)).toHaveAttribute('maxLength', '100');
    expect(screen.getByLabelText(/title\/occupation/i)).toHaveAttribute('maxLength', '100');
    expect(screen.getByLabelText(/property type/i)).toHaveAttribute('maxLength', '100');

    await userEvent.type(screen.getByLabelText(/your review/i), 'Twelve chars');
    expect(screen.getByText(/12 \/ 2,000/)).toBeInTheDocument();
  });

  it('tells the visitor the review is held for approval, not that it is live', async () => {
    renderPage();
    await screen.findByText(/share your experience/i);
    await fillAndSubmit();

    expect(await screen.findByText(/thank you!/i)).toBeInTheDocument();
    expect(screen.getByText(/review each one before it appears/i)).toBeInTheDocument();
  });

  it('has a head of its own: its title, noindex,follow, and no homepage canonical (US-262)', async () => {
    renderPage();
    await screen.findByText(/share your experience/i);

    // Helmet writes the head asynchronously, and the previous test's unmount
    // clears it asynchronously too — so all of it is awaited together.
    await waitFor(() => {
      expect(document.title).toBe('Leave a review for Jane Doe | AgentBio');
      const robots = document.head.querySelector('meta[name="robots"]');
      expect(robots?.getAttribute('content')).toBe('noindex, follow');
    });
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });
});

describe('REVIEW_LIMITS', () => {
  it('matches what validateReviewData refuses', () => {
    const source = readFileSync(
      join(process.cwd(), 'supabase/functions/_shared/validation.ts'),
      'utf8'
    );
    const fn = source.slice(source.indexOf('export function validateReviewData'));
    expect(fn).toMatch(new RegExp(`client_name\\), 1, ${REVIEW_LIMITS.name}\\)`));
    expect(fn).toMatch(new RegExp(`review\\), 1, ${REVIEW_LIMITS.review}\\)`));
    expect(fn).toMatch(new RegExp(`client_title\\), 0, ${REVIEW_LIMITS.title}\\)`));
    expect(fn).toMatch(new RegExp(`property_type\\), 0, ${REVIEW_LIMITS.propertyType}\\)`));
  });
});

describe('reviewFailureMessage', () => {
  const err = (status: number, message: string) =>
    new EdgeFunctionError(message, { functionName: 'submit-review', status });

  it('passes on a refusal the visitor can act on', () => {
    expect(reviewFailureMessage(err(404, 'This agent is not accepting reviews'))).toBe(
      'This agent is not accepting reviews'
    );
    expect(
      reviewFailureMessage(
        err(400, 'Validation failed: Review must be between 1 and 2000 characters')
      )
    ).toMatch(/2000 characters/);
  });

  it('keeps "try again" for server and network failures', () => {
    expect(reviewFailureMessage(err(502, 'The review could not be saved'))).toMatch(/try again/);
    expect(reviewFailureMessage(new TypeError('Failed to fetch'))).toMatch(/try again/);
  });
});
