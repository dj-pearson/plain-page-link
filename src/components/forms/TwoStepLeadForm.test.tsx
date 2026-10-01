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
    expect(await screen.findByRole('heading', { name: /inquiry received/i })).toBeInTheDocument();
  });

  it('skipping step two leaves the lead as it is', async () => {
    const user = userEvent.setup();
    render(<BuyerInquiryForm agentId="agent-1" agentName="Jane" />);
    await user.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
    await user.type(screen.getByLabelText(/^email/i), 'dana@example.com');
    await user.click(screen.getByRole('button', { name: /send to jane/i }));
    await user.click(await screen.findByRole('button', { name: /skip/i }));
    expect(enrichLead).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: /inquiry received/i })).toBeInTheDocument();
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

  // US-238: focus and announcements for a screen-reader user.
  it('focuses the step-two heading after the lead is created', async () => {
    const user = userEvent.setup();
    render(<BuyerInquiryForm agentId="agent-1" agentName="Jane" />);
    await user.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
    await user.type(screen.getByLabelText(/^phone/i), '555-123-4567');
    await user.click(screen.getByRole('button', { name: /send to jane/i }));
    const heading = await screen.findByRole('heading', { name: /jane has your details/i });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it('focuses the first invalid field on a failed submit', async () => {
    const user = userEvent.setup();
    render(<HomeValuationForm agentId="agent-1" agentName="Jane" />);
    await user.click(screen.getByRole('button', { name: /send to jane/i }));
    expect(screen.getByLabelText(/your name/i)).toHaveFocus();

    await user.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
    await user.click(screen.getByRole('button', { name: /send to jane/i }));
    expect(screen.getByLabelText(/^email/i)).toHaveFocus();
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('announces from a live region that exists before it has anything to say', async () => {
    const user = userEvent.setup();
    render(<BuyerInquiryForm agentId="agent-1" agentName="Jane" />);
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();
    await user.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
    await user.type(screen.getByLabelText(/^phone/i), '555-123-4567');
    await user.click(screen.getByRole('button', { name: /send to jane/i }));
    await user.click(await screen.findByRole('button', { name: /skip/i }));
    // Same node, now holding the outcome.
    await waitFor(() => expect(region).toHaveTextContent(/inquiry received/i));
    expect(region).toBeInTheDocument();
  });

  it('does not close itself; the visitor closes it, and a failed enrichment stays visible', async () => {
    enrichLead.mockResolvedValue({ success: false });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<BuyerInquiryForm agentId="agent-1" agentName="Jane" onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
    await user.type(screen.getByLabelText(/^phone/i), '555-123-4567');
    await user.click(screen.getByRole('button', { name: /send to jane/i }));
    await user.selectOptions(await screen.findByLabelText(/price range/i), '500k-750k');
    await user.click(screen.getByRole('button', { name: /add these details/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/not these extras/i);
    await new Promise((r) => setTimeout(r, 3200));
    expect(onSuccess).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  }, 10000);
});
