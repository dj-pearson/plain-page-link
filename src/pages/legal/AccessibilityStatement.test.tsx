/**
 * US-239: the statement claimed "substantial conformance", a "comprehensive
 * audit", keyboard shortcuts and alt text on every image — none true. An
 * overclaiming statement is a deceptive-claims exposure, so the claims it
 * must not make are held here.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';

vi.mock('@/components/layout/PublicHeader', () => ({ PublicHeader: () => null }));
vi.mock('@/components/layout/PublicFooter', () => ({ PublicFooter: () => null }));
vi.mock('@/lib/edgeFunctions', () => ({ callEdgeFunction: vi.fn() }));

import AccessibilityStatement from './AccessibilityStatement';

describe('AccessibilityStatement', () => {
  it('states partial conformance with WCAG 2.2 AA in W3C wording, with an ISO date', () => {
    renderWithProviders(<AccessibilityStatement />);
    expect(screen.getByText('AgentBio is partially conformant with WCAG 2.2 Level AA.')).toBeInTheDocument();
    expect(document.querySelector('time')?.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('makes none of the claims the product could not back', () => {
    const { container } = renderWithProviders(<AccessibilityStatement />);
    const text = container.textContent ?? '';
    for (const claim of [
      /substantially conformant/i,
      /comprehensive (accessibility )?audit/i,
      /keyboard shortcuts/i,
      /all meaningful images/i,
      /older PDF/i,
      /blog posts .*created by users/i,
      /makes? (the|this) site (compliant|conformant)/i,
    ]) {
      expect(text).not.toMatch(claim);
    }
  });

  it('offers a form, an email and post, alternative formats, and the agent guide', () => {
    renderWithProviders(<AccessibilityStatement />);
    expect(screen.getByRole('form', { name: /accessibility feedback form/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'accessibility@agentbio.net' }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Post:/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /another format/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Making your page accessible' })).toHaveAttribute('href', '/accessibility/agents');
  });
});
