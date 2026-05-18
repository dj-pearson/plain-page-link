import type { Lead } from '@/types/lead';

export const mockLead: Lead = {
  id: '33333333-3333-3333-3333-333333333333',
  user_id: '11111111-1111-1111-1111-111111111111',
  lead_type: 'buyer_inquiry',
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+1-555-0142',
  message: "I'm interested in the Maple Avenue listing. Is it still available?",
  status: 'new',
  source: 'public_profile',
  form_data: { listing_id: 1, budget: '400000-450000' },
  created_at: '2026-03-01T12:00:00.000Z',
  updated_at: '2026-03-01T12:00:00.000Z',
};

export const mockContactedLead: Lead = {
  ...mockLead,
  id: '44444444-4444-4444-4444-444444444444',
  name: 'Sarah Lee',
  email: 'sarah.lee@example.com',
  status: 'contacted',
};

export const makeLead = (overrides: Partial<Lead> = {}): Lead => ({
  ...mockLead,
  ...overrides,
});
