/**
 * US-629: converting a lead whose person is already a client offers to link
 * to that client instead of creating a second record.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockLead } from '@/test/fixtures/lead';

const createContact = vi.fn();
const updateContact = vi.fn();
const findContactsMatchingLead = vi.fn();

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: { id: mockLead.user_id } }),
}));

vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({
    createContact: { mutateAsync: createContact, isPending: false },
    updateContact: { mutateAsync: updateContact, isPending: false },
  }),
}));

vi.mock('@/hooks/usePlanUsage', () => ({ usePlanUsage: () => ({ planName: 'Free' }) }));

vi.mock('@/lib/pii', () => ({
  findContactsMatchingLead: (...args: unknown[]) => findContactsMatchingLead(...args),
}));

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// No contact is linked to this lead yet.
vi.mock('@/integrations/supabase/client', () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: null, error: null }),
  };
  return { supabase: { from: () => chain } };
});

import { AddLeadToClientsButton } from './AddLeadToClientsButton';

function renderButton() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AddLeadToClientsButton lead={mockLead} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const dana = {
  id: 'contact-1',
  first_name: 'John',
  last_name: 'Smith',
  lead_id: null,
  matched_on: 'email' as const,
};

beforeEach(() => {
  createContact.mockReset().mockResolvedValue('new-contact');
  updateContact.mockReset().mockResolvedValue(undefined);
  findContactsMatchingLead.mockReset();
});

describe('AddLeadToClientsButton (US-629)', () => {
  it('creates the client straight away when nobody matches', async () => {
    findContactsMatchingLead.mockResolvedValue([]);
    renderButton();
    await userEvent.click(await screen.findByRole('button', { name: /add to clients/i }));

    await waitFor(() => expect(createContact).toHaveBeenCalledTimes(1));
    expect(findContactsMatchingLead).toHaveBeenCalledWith(mockLead.id);
    expect(createContact.mock.calls[0][0]).toMatchObject({
      first_name: 'John',
      last_name: 'Smith',
      lead_id: mockLead.id,
    });
  });

  it('offers the existing client and links the lead to it instead of creating one', async () => {
    findContactsMatchingLead.mockResolvedValue([dana]);
    renderButton();
    await userEvent.click(await screen.findByRole('button', { name: /add to clients/i }));

    expect(await screen.findByText(/may already be one of your clients/i)).toBeInTheDocument();
    expect(screen.getByText('(same email)')).toBeInTheDocument();
    expect(createContact).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /link to this client/i }));
    await waitFor(() =>
      expect(updateContact).toHaveBeenCalledWith({
        id: 'contact-1',
        input: { lead_id: mockLead.id },
      })
    );
    expect(createContact).not.toHaveBeenCalled();
  });

  it('opens a matched client already linked to another enquiry rather than moving its link', async () => {
    findContactsMatchingLead.mockResolvedValue([{ ...dana, lead_id: 'older-lead' }]);
    renderButton();
    await userEvent.click(await screen.findByRole('button', { name: /add to clients/i }));

    const open = await screen.findByRole('link', { name: /open client/i });
    expect(open).toHaveAttribute('href', '/dashboard/clients?client=contact-1');
    expect(screen.queryByRole('button', { name: /link to this client/i })).not.toBeInTheDocument();
  });

  it('still lets the agent add a separate client', async () => {
    findContactsMatchingLead.mockResolvedValue([dana]);
    renderButton();
    await userEvent.click(await screen.findByRole('button', { name: /add to clients/i }));
    await userEvent.click(await screen.findByRole('button', { name: /add as a new client/i }));
    await waitFor(() => expect(createContact).toHaveBeenCalledTimes(1));
    expect(updateContact).not.toHaveBeenCalled();
  });

  it('adds without the check when it cannot be made, rather than blocking the conversion', async () => {
    findContactsMatchingLead.mockRejectedValue(new Error('unreachable'));
    renderButton();
    await userEvent.click(await screen.findByRole('button', { name: /add to clients/i }));
    await waitFor(() => expect(createContact).toHaveBeenCalledTimes(1));
  });
});
