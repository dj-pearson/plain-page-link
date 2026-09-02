/**
 * US-113: TestimonialCard rendered `transaction_type === 'buyer' ? 'Buyer' :
 * 'Seller'`, so 'both' — an option the public review form offers by name,
 * "Both (Buyer & Seller)" — was published on the profile as "Seller".
 */
import { describe, it, expect } from 'vitest';
import { transactionTypeLabel } from './testimonialLabels';

describe('transactionTypeLabel', () => {
  it("renders 'both' as Buyer & Seller, not Seller", () => {
    expect(transactionTypeLabel('both')).toBe('Buyer & Seller');
  });

  it('renders the two single-sided values', () => {
    expect(transactionTypeLabel('buyer')).toBe('Buyer');
    expect(transactionTypeLabel('seller')).toBe('Seller');
  });

  it('tolerates the casing and padding a nullable text column can hold', () => {
    expect(transactionTypeLabel(' Both ')).toBe('Buyer & Seller');
    expect(transactionTypeLabel('SELLER')).toBe('Seller');
  });

  it('shows no badge rather than guessing at an unknown value', () => {
    expect(transactionTypeLabel(null)).toBeNull();
    expect(transactionTypeLabel(undefined)).toBeNull();
    expect(transactionTypeLabel('')).toBeNull();
    expect(transactionTypeLabel('lease')).toBeNull();
  });
});
