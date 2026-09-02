/**
 * US-095: "Send Message" could never submit.
 *
 * The form dropped its `agentId` prop and called EdgeFunctions.submitLead with
 * only name/email/phone/message/source. submit-lead's validateLeadData()
 * requires a user_id and a lead_type in {buyer, seller, valuation, contact},
 * so every submission was a 400 the visitor saw as "Failed to send message."
 *
 * The payload is what broke, so the payload is what these assert.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const { submitLeadMock, trackMock } = vi.hoisted(() => ({
  submitLeadMock: vi.fn(),
  trackMock: vi.fn(),
}));

vi.mock('@/lib/leadSubmission', () => ({
  submitLead: submitLeadMock,
  trackFormSubmission: trackMock,
}));

import { ContactForm } from './ContactForm';

const AGENT_ID = '11111111-1111-1111-1111-111111111111';

const fillAndSubmit = async () => {
  await userEvent.type(screen.getByLabelText(/your name/i), 'Dana Rivers');
  await userEvent.type(screen.getByLabelText(/email address/i), 'dana@example.com');
  await userEvent.type(screen.getByLabelText(/phone number/i), '5550142000');
  await userEvent.type(
    screen.getByLabelText(/message/i),
    'Is the Maple Avenue listing still available?'
  );
  await userEvent.click(screen.getByRole('button', { name: /send message/i }));
};

describe('ContactForm', () => {
  beforeEach(() => {
    submitLeadMock.mockReset();
    trackMock.mockReset();
    submitLeadMock.mockResolvedValue({ success: true, leadId: 'lead-1' });
  });

  it('submits with the agent id and a lead type the edge function accepts', async () => {
    renderWithProviders(<ContactForm agentId={AGENT_ID} agentName="Jane Doe" />);
    await fillAndSubmit();

    await waitFor(() => expect(submitLeadMock).toHaveBeenCalledTimes(1));
    expect(submitLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: AGENT_ID,
        leadType: 'contact',
        name: 'Dana Rivers',
        email: 'dana@example.com',
        phone: '5550142000',
        source: 'contact_form',
        data: { message: 'Is the Maple Avenue listing still available?' },
      })
    );
  });

  it('confirms to the visitor once the lead is stored', async () => {
    renderWithProviders(<ContactForm agentId={AGENT_ID} agentName="Jane Doe" />);
    await fillAndSubmit();

    expect(await screen.findByText('Message Sent!')).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith('contact_form', true);
  });

  it('surfaces the reason the submission was rejected, not a generic failure', async () => {
    submitLeadMock.mockResolvedValue({ success: false, error: 'Invalid lead type' });
    renderWithProviders(<ContactForm agentId={AGENT_ID} agentName="Jane Doe" />);
    await fillAndSubmit();

    expect(await screen.findByText('Invalid lead type')).toBeInTheDocument();
    expect(screen.queryByText('Message Sent!')).not.toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith('contact_form', false);
  });
});
