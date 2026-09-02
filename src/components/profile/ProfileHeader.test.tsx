/**
 * US-112: `stats?.propertiesSold && …` renders a literal "0".
 *
 * 0 is falsy, so && short-circuits to 0 — and React prints 0. Two of these
 * side by side gave a brand-new agent's badge row "00" where it should have
 * been empty.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import ProfileHeader from './ProfileHeader';
import type { PublicProfile } from '@/types';

vi.mock('@/lib/images', () => ({
  getImageUrl: (v: string) => v,
  getImageUrls: () => [],
}));

const profile = {
  id: 'p1',
  username: 'newagent',
  full_name: 'New Agent',
  years_experience: 0,
} as unknown as PublicProfile;

describe('ProfileHeader trust badges', () => {
  it('renders no stray zero for a brand-new agent', () => {
    const { container } = renderWithProviders(
      <ProfileHeader
        profile={profile}
        stats={{ propertiesSold: 0, averageRating: 0, reviewCount: 0 }}
      />
    );

    // The badge row itself must be EMPTY. With the falsy guards it rendered
    // <div class="flex flex-wrap gap-2 …">0</div> — a bare zero where a badge
    // would go.
    const badgeRow = container.querySelector('.flex.flex-wrap.gap-2');
    expect(badgeRow?.textContent).toBe('');
    expect(screen.queryByText('0 Homes Sold')).not.toBeInTheDocument();
  });

  it('shows the sold badge once there is something to report', () => {
    renderWithProviders(
      <ProfileHeader profile={profile} stats={{ propertiesSold: 4, reviewCount: 0 }} />
    );
    expect(screen.getByText('4 Homes Sold')).toBeInTheDocument();
  });

  it('shows "Licensed in" only when both licence fields are present', () => {
    const { rerender } = renderWithProviders(<ProfileHeader profile={profile} />);
    // No licence on file: no badge. It used to say "Verified Agent" for
    // everyone, with no verification process anywhere in the product (US-111).
    expect(screen.queryByText(/Licensed in/)).not.toBeInTheDocument();

    rerender(
      <ProfileHeader
        profile={{ ...profile, license_number: 'ABC123', license_state: 'TX' } as PublicProfile}
      />
    );
    expect(screen.getByText('Licensed in TX')).toBeInTheDocument();
  });

  it('never claims availability', () => {
    renderWithProviders(<ProfileHeader profile={profile} />);
    expect(screen.queryByText(/Available Now/i)).not.toBeInTheDocument();
  });
});
