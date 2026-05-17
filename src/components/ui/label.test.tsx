import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Label } from './label';
import { Input } from './input';

describe('Label', () => {
  it('renders its text', () => {
    renderWithProviders(<Label>Email address</Label>);
    expect(screen.getByText('Email address')).toBeInTheDocument();
  });

  it('shows a required indicator when required', () => {
    renderWithProviders(<Label required>Username</Label>);
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('associates with an input via htmlFor', () => {
    renderWithProviders(
      <>
        <Label htmlFor="email-field">Email</Label>
        <Input id="email-field" aria-label="Email" />
      </>
    );
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email-field');
  });
});
