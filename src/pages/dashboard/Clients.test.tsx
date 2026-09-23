/**
 * The Clients page filters the sphere client-side over the summary list: the
 * search reaches household members' names (an agent remembers "Emma's mum"
 * before the parent's own name), and "Due for a touch" narrows to contacts
 * whose next_touch_at has arrived.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';
import type { ContactSummary } from '@/hooks/useContacts';

const { contactsRef } = vi.hoisted(() => ({ contactsRef: { current: [] as unknown[] } }));

vi.mock('@/hooks/useContacts', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useContacts')>('@/hooks/useContacts');
  const mutation = { mutateAsync: vi.fn(), isPending: false };
  return {
    ...actual,
    useContacts: () => ({
      contacts: contactsRef.current,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      createContact: mutation,
      updateContact: mutation,
      deleteContact: mutation,
    }),
    useContact: () => ({ data: null, isLoading: false, error: null }),
    useKeyDates: () => ({
      keyDates: [],
      isLoading: false,
      addKeyDate: mutation,
      updateKeyDate: mutation,
      deleteKeyDate: mutation,
    }),
    useContactInteractions: () => ({
      interactions: [],
      isLoading: false,
      logInteraction: mutation,
      deleteInteraction: mutation,
    }),
  };
});

import Clients, { householdSummary } from './Clients';

const DAY = 24 * 60 * 60 * 1000;

function contact(overrides: Partial<ContactSummary>): ContactSummary {
  return {
    id: 'c-0',
    lead_id: null,
    first_name: 'Someone',
    last_name: null,
    relationship: 'past_client',
    preferred_contact: null,
    city: null,
    household: [],
    interests: [],
    tags: [],
    touch_frequency_days: null,
    last_contacted_at: null,
    next_touch_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const rows = () =>
  screen.queryAllByRole('listitem').filter((li) => li.closest('ul[aria-label="Clients"]'));

describe('Clients page', () => {
  beforeEach(() => {
    contactsRef.current = [
      contact({
        id: 'c-1',
        first_name: 'Jordan',
        last_name: 'Reyes',
        household: [
          { name: 'Sam', relation: 'spouse' },
          { name: 'Emma', relation: 'child' },
          { name: 'Leo', relation: 'child' },
        ],
        touch_frequency_days: 30,
        next_touch_at: new Date(Date.now() - 2 * DAY).toISOString(),
        last_contacted_at: new Date(Date.now() - 40 * DAY).toISOString(),
      }),
      contact({
        id: 'c-2',
        first_name: 'Priya',
        last_name: 'Shah',
        relationship: 'sphere',
        tags: ['investor'],
        touch_frequency_days: 90,
        next_touch_at: new Date(Date.now() + 10 * DAY).toISOString(),
      }),
      contact({ id: 'c-3', first_name: 'Marcus', last_name: 'Lee', interests: ['golf'] }),
    ];
  });

  it('summarises the household as partner · others', () => {
    expect(
      householdSummary([
        { name: 'Sam', relation: 'spouse' },
        { name: 'Emma', relation: 'child' },
        { name: 'Leo', relation: 'child' },
      ])
    ).toBe('Sam · Emma, Leo');
  });

  it('lists every contact with its touch status', () => {
    renderWithProviders(<Clients />);
    expect(rows()).toHaveLength(3);
    expect(screen.getByText('Sam · Emma, Leo')).toBeInTheDocument();
    expect(screen.getByText('Touch due')).toBeInTheDocument();
    expect(screen.getByText('Next touch in 10 days')).toBeInTheDocument();
    expect(screen.getByText('No cadence')).toBeInTheDocument();
  });

  it('finds a contact by a household member’s name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Clients />);

    await user.type(screen.getByLabelText('Search'), 'emma');

    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]).getByText('Jordan Reyes')).toBeInTheDocument();
  });

  it('searches tags and interests too', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Clients />);

    await user.type(screen.getByLabelText('Search'), 'golf');
    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]).getByText('Marcus Lee')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search'));
    await user.type(screen.getByLabelText('Search'), 'investor');
    expect(within(rows()[0]).getByText('Priya Shah')).toBeInTheDocument();
  });

  it('narrows to contacts due for a touch', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Clients />);

    const toggle = screen.getByRole('button', { name: /Due for a touch \(1\)/ });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]).getByText('Jordan Reyes')).toBeInTheDocument();
  });

  it('opens a contact from the ?client= deep link', async () => {
    window.history.pushState({}, '', '/dashboard/clients?client=c-1');
    renderWithProviders(<Clients />);
    // useContact is mocked to resolve nothing, so the dialog reports that.
    expect(await screen.findByRole('dialog')).toHaveTextContent('Client not found');
    window.history.pushState({}, '', '/');
  });

  it('explains the page when there are no contacts yet', () => {
    contactsRef.current = [];
    renderWithProviders(<Clients />);
    expect(screen.getByText('Start your client sphere')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add your first client/ })).toBeInTheDocument();
  });
});
