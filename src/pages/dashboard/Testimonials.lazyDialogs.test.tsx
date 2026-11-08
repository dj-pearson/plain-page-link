/**
 * US-431: the Testimonials page loads its add, edit, request and upgrade
 * dialogs when they are opened (the US-412 pattern).
 *
 * The add form put react-hook-form and zod on the route: 41.4 KB gzip beyond
 * the entry and the dashboard layout, now 13.1 KB. The empty state's "Add Your
 * First Testimonial" button also had no click handler; it opens the form now.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { FORM_STACK, clickWarmed, expectNoValueImports } from '@/test/lazyDialogs';

const { loaded, canAdd } = vi.hoisted(() => ({
  loaded: new Set<string>(),
  canAdd: { value: true },
}));

vi.mock('@/components/modals/AddTestimonialModal', () => {
  loaded.add('add');
  return {
    AddTestimonialModal: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="Add testimonial form" /> : null,
  };
});
vi.mock('@/components/modals/EditTestimonialModal', () => {
  loaded.add('edit');
  return { EditTestimonialModal: () => null };
});
vi.mock('@/components/testimonials/RequestTestimonialModal', () => {
  loaded.add('request');
  return {
    RequestTestimonialModal: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="Request testimonial" /> : null,
  };
});
vi.mock('@/components/UpgradeModal', () => {
  loaded.add('upgrade');
  return {
    UpgradeModal: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="Upgrade" /> : null,
  };
});
vi.mock('@/components/PlanLimitNotice', () => ({ PlanLimitNotice: () => null }));
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({ subscription: null, canAdd: () => canAdd.value }),
}));
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { username: 'jane', full_name: 'Jane Agent' } }),
}));
vi.mock('@/hooks/useTestimonials', () => {
  const mutation = { mutateAsync: vi.fn(), isPending: false };
  return {
    useTestimonials: () => ({
      testimonials: [],
      isError: false,
      error: null,
      refetch: vi.fn(),
      addTestimonial: mutation,
      updateTestimonial: mutation,
      deleteTestimonial: mutation,
      setTestimonialPublished: mutation,
    }),
  };
});

import Testimonials from './Testimonials';

describe('Testimonials dialogs load on first open (US-431)', () => {
  beforeEach(() => {
    canAdd.value = true;
  });

  it('renders without loading the add, edit, request or upgrade dialogs', () => {
    loaded.clear();
    renderWithProviders(<Testimonials />);
    expect(screen.getByText('No testimonials yet')).toBeInTheDocument();
    expect([...loaded]).toEqual([]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the add form from the header button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Testimonials />);
    await clickWarmed(user, screen.getByRole('button', { name: 'Add Testimonial' }));
    expect(await screen.findByRole('dialog', { name: 'Add testimonial form' })).toBeInTheDocument();
  });

  it('opens the add form from the empty state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Testimonials />);
    await clickWarmed(user, screen.getByRole('button', { name: 'Add Your First Testimonial' }));
    expect(await screen.findByRole('dialog', { name: 'Add testimonial form' })).toBeInTheDocument();
  });

  it('opens the request dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Testimonials />);
    await user.click(screen.getByRole('button', { name: 'Request Testimonial' }));
    expect(await screen.findByRole('dialog', { name: 'Request testimonial' })).toBeInTheDocument();
  });

  it('shows the upgrade prompt, not the form, when the plan is full', async () => {
    canAdd.value = false;
    const user = userEvent.setup();
    renderWithProviders(<Testimonials />);
    await clickWarmed(user, screen.getByRole('button', { name: 'Add Testimonial' }));
    expect(await screen.findByRole('dialog', { name: 'Upgrade' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Add testimonial form' })).not.toBeInTheDocument();
  });

  it('does not statically import the dialogs or the form stack', () => {
    expectNoValueImports(join(__dirname, 'Testimonials.tsx'), [
      ...FORM_STACK,
      '@/components/modals/AddTestimonialModal',
      '@/components/modals/EditTestimonialModal',
      '@/components/testimonials/RequestTestimonialModal',
      '@/components/UpgradeModal',
    ]);
  });
});
