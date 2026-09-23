import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LockedLeadDetails } from './LockedLeadDetails';

describe('LockedLeadDetails', () => {
  it('hides the placeholder from assistive tech and links to the upgrade', () => {
    const { container } = render(
      <MemoryRouter>
        <LockedLeadDetails withMessage />
      </MemoryRouter>
    );
    // The blurred text is decoration: pii-crypto returned nothing real.
    expect(container.querySelector('[aria-hidden="true"].select-none')).not.toBeNull();
    expect(screen.getByText("Past this month's lead allowance.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upgrade to see their details' })).toHaveAttribute(
      'href',
      '/dashboard/subscription'
    );
  });
});
