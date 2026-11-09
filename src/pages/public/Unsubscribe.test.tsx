/**
 * US-425: /unsubscribe, where the Unsubscribe link in the free-tool emails
 * lands. It must not opt anyone out on page load (link scanners open every
 * link), must post the link's parameters when the person clicks, and must say
 * plainly when the link is bad.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const callMock = vi.fn();

vi.mock('@/lib/edgeFunctions', async () => {
  const actual = await vi.importActual<typeof import('@/lib/edgeFunctions')>('@/lib/edgeFunctions');
  return { ...actual, callEdgeFunction: (...args: unknown[]) => callMock(...args) };
});

import Unsubscribe from './Unsubscribe';
import { EdgeFunctionError } from '@/lib/edgeFunctions';

const CAPTURE = '3f2b6c1e-9a4d-4e8b-8c2f-1a2b3c4d5e6f';
const TOKEN = 'a'.repeat(64);

function renderAt(search: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/unsubscribe${search}`]}>
        <Routes>
          <Route path="/unsubscribe" element={<Unsubscribe />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

beforeEach(() => {
  callMock.mockReset();
});

describe('Unsubscribe page', () => {
  it('does nothing until the person clicks, then posts the link parameters', async () => {
    callMock.mockResolvedValue({ success: true });
    renderAt(`?l=listing&c=${CAPTURE}&t=${TOKEN}`);

    expect(screen.getByText(/listing description generator emails/)).toBeInTheDocument();
    expect(callMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));

    expect(callMock).toHaveBeenCalledWith('email-unsubscribe', {
      body: { list: 'listing', captureId: CAPTURE, token: TOKEN },
      auth: false,
    });
    expect(await screen.findByText(/unsubscribed/i)).toBeInTheDocument();
  });

  it('says the link is not valid when parameters are missing, without calling anything', () => {
    renderAt('');
    expect(screen.getByText('This unsubscribe link is not valid')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unsubscribe' })).not.toBeInTheDocument();
    expect(callMock).not.toHaveBeenCalled();
  });

  it('says the link is not valid when the function refuses the token', async () => {
    callMock.mockRejectedValue(
      new EdgeFunctionError('This unsubscribe link is not valid.', {
        functionName: 'email-unsubscribe',
        status: 403,
      })
    );
    renderAt(`?l=bio&c=${CAPTURE}&t=${TOKEN}`);
    await userEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
    expect(await screen.findByText('This unsubscribe link is not valid')).toBeInTheDocument();
  });

  it('offers a retry when the function fails for another reason', async () => {
    callMock
      .mockRejectedValueOnce(
        new EdgeFunctionError('down', { functionName: 'email-unsubscribe', status: 500 })
      )
      .mockResolvedValueOnce({ success: true });
    renderAt(`?l=bio&c=${CAPTURE}&t=${TOKEN}`);
    await userEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(callMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/unsubscribed/i)).toBeInTheDocument();
  });
});
