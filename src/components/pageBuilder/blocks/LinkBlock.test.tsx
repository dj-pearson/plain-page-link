/**
 * US-327: templates shipped link buttons promising a free download with
 * url '#'. A link with no real destination is hidden on the public page, and
 * the editor says why, so pages already saved from those templates stop
 * showing a dead button.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkBlock } from './LinkBlock';
import { CustomBlocksSection } from '@/components/profile/CustomBlocksSection';
import type { LinkBlockConfig, PageBlock } from '@/types/pageBuilder';

const link = (url: string, title = 'First-Time Buyer Guide (Free Download)'): LinkBlockConfig => ({
  type: 'link',
  title,
  url,
  style: 'button',
  openInNewTab: false,
});

describe('LinkBlock (US-327)', () => {
  it.each(['#', '', 'https://example.com'])('publishes nothing for %j', (url) => {
    const { container } = render(<LinkBlock config={link(url)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('publishes a link that has a destination', () => {
    render(<LinkBlock config={link('https://agent.test/guide.pdf', 'My guide')} />);
    expect(screen.getByRole('button', { name: /my guide/i })).toBeInTheDocument();
  });

  it('tells the agent in the editor that the button is hidden', () => {
    render(<LinkBlock config={link('#')} isEditing />);
    expect(screen.getByRole('button', { name: /free download/i })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/hidden on your public page/i);
  });

  it('shows no warning in the editor once the link has a destination', () => {
    render(<LinkBlock config={link('#contact')} isEditing />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});

describe('CustomBlocksSection drops dead link buttons (US-327)', () => {
  const block = (id: string, order: number, config: PageBlock['config']): PageBlock => ({
    id,
    type: config.type,
    order,
    visible: true,
    config,
  });

  it('renders only the link blocks with a real destination', () => {
    const { container } = render(
      <CustomBlocksSection
        userId="u1"
        blocks={[
          block('a', 0, link('#', 'Dead guide')),
          block('b', 1, link('https://agent.test', 'Live site')),
          block('c', 2, link('https://example.com', 'Placeholder')),
        ]}
      />
    );
    expect(container.querySelectorAll('[data-block-type="link"]')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /live site/i })).toBeInTheDocument();
    expect(screen.queryByText(/dead guide/i)).not.toBeInTheDocument();
  });

  it('renders no section when the only block is a dead link', () => {
    const { container } = render(
      <CustomBlocksSection userId="u1" blocks={[block('a', 0, link('#'))]} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
