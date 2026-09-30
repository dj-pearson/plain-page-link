/**
 * US-221: a Calendly booking becomes a lead with the listing and campaign.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendlyModal } from './CalendlyModal';

const submitLead = vi.fn(async (..._args: unknown[]) => ({ success: true, leadId: 'lead-1' }));
const initInlineWidget = vi.fn();

vi.mock('@/lib/leadSubmission', () => ({ submitLead: (...args: unknown[]) => submitLead(...args) }));
vi.mock('@/lib/attribution', () => ({ getLeadAttribution: () => ({ utm_source: 'instagram' }) }));
vi.mock('@/lib/calendly', async (orig) => ({
  ...(await orig<typeof import('@/lib/calendly')>()),
  loadCalendly: async () => ({ initInlineWidget }),
}));

describe('CalendlyModal', () => {
  beforeEach(() => {
    submitLead.mockClear();
    initInlineWidget.mockClear();
  });

  it('asks who the showing is for, prefills Calendly, and records the booking as a lead', async () => {
    const user = userEvent.setup();
    render(
      <CalendlyModal
        isOpen
        onClose={() => undefined}
        calendlyUrl="https://calendly.com/jane/showing"
        agentId="agent-1"
        listingAddress="12 Maple Ave"
        listingId="listing-1"
      />
    );

    await user.type(screen.getByLabelText('Name'), 'Dana Rivers');
    await user.type(screen.getByLabelText('Email'), 'dana@example.com');
    await user.click(screen.getByRole('button', { name: /pick a time/i }));

    await waitFor(() => expect(initInlineWidget).toHaveBeenCalledTimes(1));
    const url = new URL(initInlineWidget.mock.calls[0][0].url);
    expect(url.searchParams.get('email')).toBe('dana@example.com');
    expect(url.searchParams.get('a1')).toBe('12 Maple Ave');
    expect(url.searchParams.get('utm_source')).toBe('instagram');

    // A message from anywhere else is ignored.
    window.dispatchEvent(
      new MessageEvent('message', { origin: 'https://evil.example', data: { event: 'calendly.event_scheduled' } })
    );
    window.dispatchEvent(
      new MessageEvent('message', { origin: 'https://calendly.com', data: { event: 'calendly.event_scheduled' } })
    );
    // …and a repeated booking message records one lead, not two.
    window.dispatchEvent(
      new MessageEvent('message', { origin: 'https://calendly.com', data: { event: 'calendly.event_scheduled' } })
    );

    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(1));
    expect(submitLead.mock.calls[0][0]).toMatchObject({
      agentId: 'agent-1',
      leadType: 'buyer',
      name: 'Dana Rivers',
      email: 'dana@example.com',
      listingId: 'listing-1',
      source: 'calendly_showing',
    });
    expect(await screen.findByText(/you're booked/i)).toBeInTheDocument();
  });
});
