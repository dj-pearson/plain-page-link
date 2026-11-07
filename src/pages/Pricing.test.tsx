/**
 * US-270: the plan cards on /pricing rendered raw subscription_plans feature
 * keys — "CustomThemes", "RemoveBranding", "AiListingDescriptions" — on the
 * page an agent buys from.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, within } from '@/test/test-utils';

vi.mock('@/hooks/useSubscription', async (orig) => {
  const actual = await orig<typeof import('@/hooks/useSubscription')>();
  return {
    ...actual,
    useSubscription: () => ({
      subscription: null,
      isLoading: false,
      plans: [
        {
          id: 'p-free',
          name: 'free',
          price_monthly: 0,
          price_yearly: 0,
          stripe_price_id: null,
          stripe_price_id_monthly: null,
          stripe_price_id_yearly: null,
          features: { analytics: true, customThemes: false, openHouseManagement: true },
          limits: { listings: 3, links: 5, leads_per_month: 10, analytics_days: 30 },
        },
        {
          id: 'p-pro',
          name: 'professional',
          price_monthly: 49,
          price_yearly: 490,
          stripe_price_id: null,
          stripe_price_id_monthly: 'price_pro_m',
          stripe_price_id_yearly: 'price_pro_y',
          features: {
            analytics: true,
            customThemes: true,
            customDomain: true,
            removeBranding: true,
            leadScoring: true,
            aiListingDescriptions: true,
            openHouseManagement: true,
          },
          limits: {
            listings: 25,
            links: -1,
            leads_per_month: -1,
            analytics_days: 365,
            ai_listing_descriptions_per_month: 25,
            workflows: 10,
            emails_per_month: 2000,
            sms_per_month: 500,
          },
        },
      ],
    }),
  };
});
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/components/pricing/AddOnWaitlist', () => ({ AddOnWaitlist: () => null }));
vi.mock('@/components/layout/PublicHeader', () => ({ PublicHeader: () => null }));
vi.mock('@/components/layout/PublicFooter', () => ({ PublicFooter: () => null }));
vi.mock('@/components/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/lib/edgeFunctions', () => ({ edgeFunctions: { invoke: vi.fn() } }));

import Pricing from './Pricing';

describe('Pricing plan cards', () => {
  it('words each card instead of printing feature keys', () => {
    renderWithProviders(<Pricing />);

    const pro = screen.getByRole('heading', { name: /professional/i }).closest('div.relative');
    expect(pro).not.toBeNull();
    const card = within(pro as HTMLElement);

    expect(card.getByText('25 AI listing descriptions a month')).toBeInTheDocument();
    expect(card.getByText('Premium themes')).toBeInTheDocument();
    expect(card.getByText('Your own domain')).toBeInTheDocument();
    expect(card.getByText('No AgentBio branding')).toBeInTheDocument();

    const items = card.getAllByRole('listitem').map((li) => li.textContent ?? '');
    for (const text of items) {
      expect(text.replace(/AgentBio/g, ''), text).not.toMatch(/[a-z][A-Z]/);
    }
    // Metered in the database, not delivered by the product yet.
    expect(items.join(' ')).not.toMatch(/sms|text message|automated email|workflow|sequence/i);
  });
});
