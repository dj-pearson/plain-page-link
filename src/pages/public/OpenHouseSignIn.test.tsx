/**
 * The open house sign-in kiosk.
 *
 * What matters on a tablet at the door: the right payload reaches submit-lead
 * (lead fields, the preapproved yes/no/not-yet mapping, hasAgent), and the
 * thank-you clears itself so the next visitor never sees the previous one's
 * details.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const OPEN_HOUSE_ID = '22222222-2222-2222-2222-222222222222';
const AGENT_ID = '11111111-1111-1111-1111-111111111111';

const submitMock = vi.fn();
let hookResult: { data: Record<string, unknown> | null; isLoading: boolean; isError: boolean };

vi.mock('@/hooks/useOpenHouses', () => ({
  usePublicOpenHouse: () => hookResult,
  submitOpenHouseSignIn: (...args: unknown[]) => submitMock(...args),
  formatOpenHouseAddress: (l: {
    address: string;
    city: string;
    state?: string | null;
    zip_code?: string | null;
  }) =>
    [l.address, l.city, [l.state, l.zip_code].filter(Boolean).join(' ')].filter(Boolean).join(', '),
}));

import OpenHouseSignIn from './OpenHouseSignIn';

const openHouseRow = {
  id: OPEN_HOUSE_ID,
  user_id: AGENT_ID,
  listing_id: '33333333-3333-3333-3333-333333333333',
  starts_at: '2026-10-03T18:00:00.000Z',
  ends_at: '2026-10-03T20:00:00.000Z',
  public_notes: 'Street parking only. Cookies in the kitchen.',
  address: '12 Elm St',
  city: 'Springfield',
  state: 'IL',
  zip_code: '62701',
  price: '450000',
  beds: 3,
  baths: 2,
  sqft: 1850,
  image: null,
  photos: ['https://example.com/front.jpg'],
  agent_username: 'janedoe',
  agent_full_name: 'Jane Doe',
  agent_avatar_url: null,
  agent_title: 'Realtor',
  agent_brokerage_name: 'Acme Realty',
};

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/open-house/${OPEN_HOUSE_ID}`]}>
        <Routes>
          <Route path="/open-house/:openHouseId" element={<OpenHouseSignIn />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

const fillRequired = (name = 'Dana Rivers', email = 'dana@example.com') => {
  fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: email } });
};

describe('OpenHouseSignIn', () => {
  beforeEach(() => {
    submitMock.mockReset();
    submitMock.mockResolvedValue(undefined);
    hookResult = { data: openHouseRow, isLoading: false, isError: false };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the home being toured and who is hosting', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '12 Elm St' })).toBeInTheDocument();
    expect(screen.getByText('Springfield, IL 62701')).toBeInTheDocument();
    expect(screen.getByText('$450,000')).toBeInTheDocument();
    expect(screen.getByText(/street parking only/i)).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe may contact you/)).toBeInTheDocument();
  });

  it('sends the lead fields, the pre-approval mapping and hasAgent', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^name/i), 'Dana Rivers');
    await user.type(screen.getByLabelText(/^email/i), 'dana@example.com');
    await user.type(screen.getByLabelText(/^phone/i), '555-123-4567');
    await user.click(
      within(screen.getByRole('group', { name: /working with an agent/i })).getByRole('button', {
        name: 'No',
      })
    );
    await user.click(
      within(screen.getByRole('group', { name: /pre-approved/i })).getByRole('button', {
        name: 'Yes',
      })
    );
    await user.selectOptions(screen.getByLabelText(/hoping to move/i), '0-3 months');
    await user.selectOptions(screen.getByLabelText(/how did you hear/i), 'Sign');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    expect(submitMock).toHaveBeenCalledWith({
      agentId: AGENT_ID,
      openHouseId: OPEN_HOUSE_ID,
      name: 'Dana Rivers',
      email: 'dana@example.com',
      phone: '555-123-4567',
      hasAgent: false,
      preapproved: true,
      timeline: '0-3 months',
      heardFrom: 'Sign',
    });
  });

  it('maps "Not yet" to preapproved false and leaves unanswered questions out', async () => {
    const user = userEvent.setup();
    renderPage();

    fillRequired();
    await user.click(
      within(screen.getByRole('group', { name: /pre-approved/i })).getByRole('button', {
        name: 'Not yet',
      })
    );
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    const payload = submitMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.preapproved).toBe(false);
    expect(payload.hasAgent).toBeUndefined();
    expect(payload.phone).toBeUndefined();
    expect(payload.timeline).toBeUndefined();
  });

  it('does not submit without a name and a valid email', async () => {
    const user = userEvent.setup();
    renderPage();

    fillRequired('', 'not-an-email');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText(/please enter your name/i)).toBeInTheDocument();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('thanks the visitor, then clears itself for the next one', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderPage();

    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText(/thanks for visiting, dana/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^email/i)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.queryByText(/thanks for visiting/i)).toBeNull();
    expect(screen.getByLabelText(/^name/i)).toHaveValue('');
    expect(screen.getByLabelText(/^email/i)).toHaveValue('');
  });

  it('"Next visitor" resets immediately', async () => {
    renderPage();
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    fireEvent.click(await screen.findByRole('button', { name: /next visitor/i }));
    expect(screen.getByLabelText(/^name/i)).toHaveValue('');
  });

  it('asks the visitor to wait when rate limited', async () => {
    submitMock.mockRejectedValue(new Error('Too many requests'));
    renderPage();
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/please wait a moment/i);
    // The typed details stay so the visitor can simply try again.
    expect(screen.getByLabelText(/^email/i)).toHaveValue('dana@example.com');
  });

  it('says so when the open house is not taking sign-ins', () => {
    hookResult = { data: null, isLoading: false, isError: false };
    renderPage();
    expect(
      screen.getByRole('heading', { name: /this open house isn.t taking sign-ins/i })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/^email/i)).toBeNull();
  });
});
