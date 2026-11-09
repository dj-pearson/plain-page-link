/**
 * US-350: Hero and CTA blocks navigated to sanitizeUrl's result, so a saved
 * '#' or example.com published a button that went nowhere. They now use
 * usableLinkUrl, as LinkBlock does since US-327: the hero drops only its
 * button, the CTA block (which is only a button) drops entirely, and the
 * editor says why.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroBlock } from './HeroBlock';
import { CTABlock } from './CTABlock';
import { CustomBlocksSection } from '@/components/profile/CustomBlocksSection';
import type { CTABlockConfig, HeroBlockConfig, PageBlock } from '@/types/pageBuilder';

const hero = (ctaUrl: string | undefined, ctaText = 'Book a consultation'): HeroBlockConfig => ({
  type: 'hero',
  headline: 'Austin homes, sold right',
  ctaText,
  ctaUrl,
  layout: 'centered',
  height: 'medium',
});

const cta = (buttonUrl: string): CTABlockConfig => ({
  type: 'cta',
  headline: 'Ready to sell?',
  description: 'Get a free valuation.',
  buttonText: 'Get my valuation',
  buttonUrl,
  variant: 'solid',
  openInNewTab: false,
});

afterEach(() => vi.restoreAllMocks());

describe('HeroBlock CTA (US-350)', () => {
  it.each(['#', '', 'https://example.com', 'javascript:alert(1)', undefined])(
    'keeps the headline but publishes no button for %j',
    (url) => {
      render(<HeroBlock config={hero(url)} />);
      expect(screen.getByRole('heading', { name: /austin homes/i })).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('note')).not.toBeInTheDocument();
    }
  );

  it('publishes the button for a same-page anchor and scrolls to it', () => {
    render(<HeroBlock config={hero('#contact')} />);
    fireEvent.click(screen.getByRole('button', { name: /book a consultation/i }));
    expect(window.location.hash).toBe('#contact');
  });

  it('opens an external destination in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<HeroBlock config={hero('https://agent.test/book')} />);
    fireEvent.click(screen.getByRole('button', { name: /book a consultation/i }));
    expect(open).toHaveBeenCalledWith('https://agent.test/book', '_blank', 'noopener,noreferrer');
  });

  it('publishes no button without a label, even with a destination', () => {
    render(<HeroBlock config={hero('https://agent.test', '  ')} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('tells the agent in the editor that the button is hidden', () => {
    render(<HeroBlock config={hero('#')} isEditing />);
    expect(screen.getByRole('button', { name: /book a consultation/i })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/hidden on your public page/i);
  });

  it('shows no warning in the editor once the button has a destination', () => {
    render(<HeroBlock config={hero('#contact')} isEditing />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});

describe('CTABlock (US-350)', () => {
  it.each(['#', '', 'https://www.example.org/x', 'data:text/html,hi'])(
    'publishes nothing for %j',
    (url) => {
      const { container } = render(<CTABlock config={cta(url)} />);
      expect(container).toBeEmptyDOMElement();
    }
  );

  it('publishes a CTA that has a destination', () => {
    render(<CTABlock config={cta('https://agent.test/valuation')} />);
    expect(screen.getByRole('button', { name: /get my valuation/i })).toBeInTheDocument();
  });

  it('tells the agent in the editor that the block is hidden', () => {
    render(<CTABlock config={cta('https://example.com')} isEditing />);
    expect(screen.getByRole('heading', { name: /ready to sell/i })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/hidden on your public page/i);
  });

  it('shows no warning in the editor for the template default #contact', () => {
    render(<CTABlock config={cta('#contact')} isEditing />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});

describe('CustomBlocksSection drops dead CTA blocks (US-350)', () => {
  const block = (id: string, order: number, config: PageBlock['config']): PageBlock => ({
    id,
    type: config.type,
    order,
    visible: true,
    config,
  });

  it('leaves no wrapper for a CTA with no destination, and keeps a hero without its button', () => {
    const { container } = render(
      <CustomBlocksSection
        userId="u1"
        blocks={[block('a', 0, hero('#')), block('b', 1, cta('#')), block('c', 2, cta('#contact'))]}
      />
    );
    expect(container.querySelectorAll('[data-block-type="cta"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-block-type="hero"]')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /book a consultation/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get my valuation/i })).toBeInTheDocument();
  });
});
