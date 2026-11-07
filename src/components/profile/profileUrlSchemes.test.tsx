/**
 * US-268: the public profile rendered agent-supplied URLs straight into href —
 * link-in-bio rows, social profile URLs and listing virtual tours — so a
 * javascript: value (written through the API, a CSV import or an old form)
 * became a clickable button on agentbio.net. Only http(s), mailto, tel and
 * same-site paths may reach an href now; anything else is left off the page.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CustomLinks from './CustomLinks';
import SocialLinks from './SocialLinks';
import { mockProfile } from '@/test/fixtures/profile';

vi.mock('@/lib/analyticsEvents', () => ({ trackSocialClick: vi.fn() }));

const link = (id: string, title: string, url: string, position: number) => ({
  id,
  title,
  url,
  icon: null,
  position,
  is_active: true,
});

describe('CustomLinks', () => {
  it('drops links whose URL is not a safe scheme and keeps the rest', () => {
    render(
      <CustomLinks
        links={[
          link('1', 'Home search', 'https://example.com/search', 1),
          link('2', 'Evil', 'java\tscript:alert(document.cookie)', 2),
          link('3', 'Data', 'data:text/html,<script>alert(1)</script>', 3),
          link('4', 'Email me', 'mailto:jane@example.com', 4),
          link('5', 'My Zillow', 'zillow.com/profile/jane', 5),
        ]}
      />
    );

    const anchors = screen.getAllByRole('link');
    expect(anchors.map((a) => a.getAttribute('href'))).toEqual([
      'https://example.com/search',
      'mailto:jane@example.com',
      'https://zillow.com/profile/jane',
    ]);
    expect(screen.queryByText('Evil')).toBeNull();
    expect(screen.queryByText('Data')).toBeNull();
  });

  it('renders nothing when every link is unsafe', () => {
    const { container } = render(
      <CustomLinks links={[link('1', 'Evil', 'javascript:alert(1)', 1)]} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('SocialLinks', () => {
  it('links only http(s) profile URLs', () => {
    render(
      <SocialLinks
        profile={{
          ...mockProfile,
          instagram_url: 'https://instagram.com/jane',
          facebook_url: '\u0001javascript:alert(1)',
          linkedin_url: 'linkedin.com/in/jane',
          website_url: 'mailto:jane@example.com',
        }}
      />
    );

    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://instagram.com/jane'
    );
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/jane'
    );
    expect(screen.queryByRole('link', { name: 'Facebook' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Website' })).toBeNull();
  });
});
