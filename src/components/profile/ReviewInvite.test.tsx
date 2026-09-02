/**
 * US-113: /:username/review has existed since US-074, but the only code that
 * built the URL was RequestTestimonialModal in the agent's own dashboard — so
 * a client could reach the review page only if the agent had already sent them
 * the link. A visitor already on the profile had no way in.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReviewInvite } from './ReviewInvite';

describe('ReviewInvite', () => {
  it('links to the agent’s review page by username', () => {
    render(
      <MemoryRouter>
        <ReviewInvite username="janedoe" agentName="Jane Doe" />
      </MemoryRouter>
    );

    expect(screen.getByText(/worked with jane doe\?/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /leave a review/i });
    expect(link).toHaveAttribute('href', '/janedoe/review');
  });
});
