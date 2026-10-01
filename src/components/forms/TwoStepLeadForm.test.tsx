/**
 * US-228: a lead exists after step one; step two only adds to it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders as render, screen, userEvent, waitFor } from '@/test/test-utils';

const submitLead = vi.fn();
const enrichLead = vi.fn();
vi.mock('@/lib/leadSubmission', () => ({
  submitLead: (...a: unknown[]) => submitLead(...a),
  enrichLead: (...a: unknown[]) => enrichLead(...a),
  trackFormSubmission: vi.fn(),
}));
vi.mock('@/hooks/useFormOpenTracking', () => ({ useFormOpenTracking: () => undefined }));

import { BuyerInquiryForm } from './BuyerInquiryForm';
import { HomeValuationForm } from './HomeValuationForm';

describe('two-step lead forms', () => {
  beforeEach(() => {
    submitLead.mockReset().mockResolvedValue({ success: true, leadId: 'lead-1', updateToken: 'tok' });
    enrichLead.mockReset().mockResolvedValue({ success: true, leadId: 'lead-1' });
  });

  it('creates the lead from a name and a phone alone, then adds the optional details', async () => {
    const user = userEvent.setup();
    render(<BuyerInquiryForm agentId="agent-1" agentName="Jane" />);

    await user.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
    await user.type(screen.getByLabelText(/^phone/i), '555-123-4567');
    await user.click(screen.getByRole('button', { name: /send to jane/i }));

    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(1));
    expect(submitLead.mock.calls[0][0]).toMatchObject({
      agentId: 'agent-1',
      leadType: 'buyer',
      name: 'Dana Rivers',
      phone: '555-123-4567',
      email: undefined,
    });

    // Step two: everything optional.
    await user.selectOptions(await screen.findByLabelText(/price range/i), '500k-750k');
    await user.click(screen.getByRole('button', { name: /add these details/i }));
    await waitFor(() => expect(enrichLead).toHaveBeenCalledWith('lead-1', 'tok', { priceRange: '500k-750k' }));
    expect(await screen.findByText(/inquiry received/i)).toBeInTheDocument();
  });

  it('skipping step two leaves the lead as it is', async () => {
    const user = userEvent.setup();
    render(<BuyerInquiryForm agentId="agent-1" agentName="Jane" />);
    await user.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
    await user.type(screen.getByLabelText(/^email/i), 'dana@example.com');
    await user.click(screen.getByRole('button', { name: /send to jane/i }));
    await user.click(await screen.findByRole('button', { name: /skip/i }));
    expect(enrichLead).not.toHaveBeenCalled();
    expect(await screen.findByText(/inquiry received/i)).toBeInTheDocument();
  });

  it('asks for an email or a phone, and for the address on a valuation', async () => {
    const user = userEvent.setup();
    render(<HomeValuationForm agentId="agent-1" agentName="Jane" />);
    await user.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
    await user.click(screen.getByRole('button', { name: /send to jane/i }));
    expect(await screen.findByText(/please give an email or a phone number/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter the property address/i)).toBeInTheDocument();
    expect(submitLead).not.toHaveBeenCalled();
  });
});
