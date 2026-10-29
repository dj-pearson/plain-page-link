/**
 * US-245: the rating stars were five unnamed buttons with `focus:outline-none`
 * and no replacement ring — a screen reader heard "button" five times and a
 * keyboard user could not see which star had focus or which was selected.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTestimonialModal } from './AddTestimonialModal';

describe('AddTestimonialModal rating (US-245)', () => {
  it('names each star, groups them under the Rating label and marks the chosen one', async () => {
    const user = userEvent.setup();
    render(<AddTestimonialModal open onOpenChange={vi.fn()} />);

    const group = await screen.findByRole('group', { name: 'Rating *' });
    expect(group).toBeInTheDocument();

    // Default rating is 5.
    expect(screen.getByRole('button', { name: '5 stars' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '1 star' })).toHaveAttribute('aria-pressed', 'false');

    const three = screen.getByRole('button', { name: '3 stars' });
    three.focus();
    await user.keyboard('{Enter}');
    expect(three).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '5 stars' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('gives the stars a visible focus ring instead of removing the outline', async () => {
    render(<AddTestimonialModal open onOpenChange={vi.fn()} />);
    const star = await screen.findByRole('button', { name: '4 stars' });
    expect(star.className).toContain('focus-visible:ring-2');
  });
});
