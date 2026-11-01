import { describe, it, expect } from 'vitest';
import type { Root } from 'hast';
import {
  createIdAllocator,
  hastText,
  rehypeArticleHeadings,
  slugifyHeading,
  stripLeadingTitle,
} from './articleMarkdown';

describe('stripLeadingTitle', () => {
  it('removes the generated "# Title" line and the blank lines after it', () => {
    expect(stripLeadingTitle('# The Title\n\nFirst paragraph.')).toBe('First paragraph.');
  });

  it('tolerates leading blank lines, a BOM and CRLF', () => {
    expect(stripLeadingTitle('\uFEFF\n\r\n# The Title\r\n\r\nBody')).toBe('Body');
  });

  it('leaves a body that opens with a section or a paragraph alone', () => {
    expect(stripLeadingTitle('## Section\n\nText')).toBe('## Section\n\nText');
    expect(stripLeadingTitle('Intro\n\n# Later')).toBe('Intro\n\n# Later');
  });

  it('does not mistake a hashtag for a heading', () => {
    expect(stripLeadingTitle('#realestate tips\n\nBody')).toBe('#realestate tips\n\nBody');
  });

  it('strips only the first h1', () => {
    expect(stripLeadingTitle('# One\n# Two\nBody')).toBe('# Two\nBody');
  });
});

describe('slugifyHeading', () => {
  it('lower-cases, drops punctuation and accents, and joins with hyphens', () => {
    expect(slugifyHeading('Why Bio Links Matter?')).toBe('why-bio-links-matter');
    expect(slugifyHeading('  Café — Open  Houses! ')).toBe('cafe-open-houses');
    expect(slugifyHeading('Q&A')).toBe('q-and-a');
  });

  it('never returns an empty id', () => {
    expect(slugifyHeading('???')).toBe('section');
  });
});

describe('createIdAllocator', () => {
  it('de-duplicates, including against an id that already looks suffixed', () => {
    const allocate = createIdAllocator();
    expect(['a', 'a', 'a-1', 'a'].map(allocate)).toEqual(['a', 'a-1', 'a-1-1', 'a-2']);
  });
});

describe('rehypeArticleHeadings', () => {
  const tree = (): Root => ({
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'h1',
        properties: {},
        children: [{ type: 'text', value: 'Top' }],
      },
      {
        type: 'element',
        tagName: 'section',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'h2',
            properties: { className: ['x'] },
            children: [
              { type: 'text', value: 'Why ' },
              {
                type: 'element',
                tagName: 'strong',
                properties: {},
                children: [{ type: 'text', value: 'this' }],
              },
            ],
          },
          {
            type: 'element',
            tagName: 'h2',
            properties: {},
            children: [{ type: 'text', value: 'Top' }],
          },
        ],
      },
    ],
  });

  it('demotes h1 to h2 and ids headings from their text nodes, uniquely', () => {
    const root = tree();
    rehypeArticleHeadings()(root);
    expect(hastText(root)).toBe('TopWhy thisTop');
    const [h1, section] = root.children;
    if (h1.type !== 'element' || section.type !== 'element') throw new Error('shape');
    expect(h1.tagName).toBe('h2');
    expect(h1.properties.id).toBe('top');
    const [bold, dup] = section.children;
    if (bold.type !== 'element' || dup.type !== 'element') throw new Error('shape');
    expect(bold.properties).toEqual({ className: ['x'], id: 'why-this' });
    expect(dup.properties.id).toBe('top-1');
  });
});
