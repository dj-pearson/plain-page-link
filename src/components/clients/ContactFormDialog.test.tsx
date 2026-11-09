/**
 * US-670 (US-641): adding or editing a client by hand warns when another
 * client already has the email or phone, and lets the agent open that client
 * or save anyway.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import type { Contact } from '@/hooks/useContacts';

const { createContact, updateContact, findMatches } = vi.hoisted(() => ({
  createContact: { mutateAsync: vi.fn(), isPending: false },
  updateContact: { mutateAsync: vi.fn(), isPending: false },
  findMatches: vi.fn(),
}));

vi.mock('@/hooks/useContacts', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useContacts')>('@/hooks/useContacts');
  return { ...actual, useContacts: () => ({ createContact, updateContact }) };
});
vi.mock('@/hooks/usePlanUsage', () => ({ usePlanUsage: () => ({ planName: 'Free' }) }));
vi.mock('@/lib/pii', () => ({ findContactsMatchingDetails: findMatches }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ContactFormDialog, needsDuplicateCheck, duplicateHeadline } from './ContactFormDialog';

const dana = {
  id: 'c-dana',
  first_name: 'Dana',
  last_name: 'Reyes',
  lead_id: null,
  matched_on: 'email' as const,
};

function renderAdd(onOpenChange = vi.fn()) {
  renderWithProviders(<ContactFormDialog open onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

async function fillAndSubmit(email: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('First name'), 'Dana');
  await user.type(screen.getByLabelText('Email'), email);
  await user.click(screen.getByRole('button', { name: 'Add client' }));
  return user;
}

beforeEach(() => {
  createContact.mutateAsync.mockReset().mockResolvedValue('new-id');
  updateContact.mutateAsync.mockReset().mockResolvedValue(undefined);
  findMatches.mockReset();
});

describe('needsDuplicateCheck', () => {
  it('checks a new client with an email or phone, and nothing without either', () => {
    expect(needsDuplicateCheck({ email: 'a@b.co', phone: null })).toBe(true);
    expect(needsDuplicateCheck({ email: null, phone: '512 555 0142' })).toBe(true);
    expect(needsDuplicateCheck({ email: null, phone: null })).toBe(false);
  });

  it('checks an edit only when the email or phone changed', () => {
    const original = { email: 'dana@example.com', phone: '(512) 555-0142' };
    expect(
      needsDuplicateCheck({ email: 'DANA@example.com', phone: '512.555.0142' }, original)
    ).toBe(false);
    expect(needsDuplicateCheck({ email: 'new@example.com', phone: '512.555.0142' }, original)).toBe(
      true
    );
    expect(needsDuplicateCheck({ email: null, phone: null }, original)).toBe(false);
  });
});

describe('duplicateHeadline', () => {
  it('names the one client and what matched', () => {
    expect(duplicateHeadline([dana])).toBe('Dana Reyes already has this email');
    expect(duplicateHeadline([{ ...dana, matched_on: 'phone' }])).toBe(
      'Dana Reyes already has this phone number'
    );
    expect(duplicateHeadline([dana, { ...dana, id: 'c2' }])).toMatch(/These clients/);
  });
});

describe('ContactFormDialog duplicate warning (US-670)', () => {
  it('saves straight away when no other client has the details', async () => {
    findMatches.mockResolvedValue([]);
    const { onOpenChange } = renderAdd();
    await fillAndSubmit('dana@example.com');

    await waitFor(() => expect(createContact.mutateAsync).toHaveBeenCalledTimes(1));
    expect(findMatches).toHaveBeenCalledWith({
      email: 'dana@example.com',
      phone: null,
      excludeContactId: null,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('warns instead of saving, links to the existing client, and saves on "Save anyway"', async () => {
    findMatches.mockResolvedValue([dana]);
    renderAdd();
    const user = await fillAndSubmit('dana@example.com');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Dana Reyes already has this email');
    expect(screen.getByRole('link', { name: 'Open Dana' })).toHaveAttribute(
      'href',
      '/dashboard/clients?client=c-dana'
    );
    expect(createContact.mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Add client' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Save anyway' }));
    await waitFor(() => expect(createContact.mutateAsync).toHaveBeenCalledTimes(1));
    expect(createContact.mutateAsync.mock.calls[0][0]).toMatchObject({
      first_name: 'Dana',
      email: 'dana@example.com',
    });
  });

  it('drops the warning once the agent changes the email', async () => {
    findMatches.mockResolvedValue([dana]);
    renderAdd();
    const user = await fillAndSubmit('dana@example.com');
    await screen.findByRole('alert');

    await user.type(screen.getByLabelText('Email'), 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('saves without the check when pii-crypto cannot answer', async () => {
    findMatches.mockRejectedValue(new Error('unreachable'));
    renderAdd();
    await fillAndSubmit('dana@example.com');
    await waitFor(() => expect(createContact.mutateAsync).toHaveBeenCalledTimes(1));
  });

  it('excludes the contact being edited and skips the check when its details are unchanged', async () => {
    const contact = {
      id: 'c-self',
      first_name: 'Dana',
      last_name: null,
      email: 'dana@example.com',
      phone: null,
      relationship: 'past_client',
      preferred_contact: null,
      household: [],
      interests: [],
      tags: [],
      lead_id: null,
    } as unknown as Contact;
    findMatches.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<ContactFormDialog open onOpenChange={vi.fn()} contact={contact} />);

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(updateContact.mutateAsync).toHaveBeenCalledTimes(1));
    expect(findMatches).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(findMatches).toHaveBeenCalledTimes(1));
    expect(findMatches).toHaveBeenCalledWith({
      email: 'new@example.com',
      phone: null,
      excludeContactId: 'c-self',
    });
  });
});
