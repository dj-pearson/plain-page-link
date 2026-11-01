/**
 * How an article's markdown body becomes headings (US-262).
 *
 * generate-article asks the model to write "Markdown format with # for title"
 * and stores the result verbatim, so every generated article's content starts
 * with `# <the title>`. BlogArticle already renders the title as the page's
 * <h1>, which meant every generated post carried two — the same text twice, at
 * the top level of the outline, on exactly the pages the blog exists to rank.
 *
 * Heading ids had their own defect: `String(children).toLowerCase()` on a
 * heading containing **bold** or a link stringified a React element array to
 * "[object object]", so those headings shared one id, and anchors to them
 * landed on whichever came first. Two headings with the same text collided the
 * same way.
 *
 * Both are fixed on the tree (a rehype step), not in the render components: a
 * component's render can run more than once, so a de-duplication counter held
 * there would hand out different ids on a re-render. A tree transform runs once
 * per markdown render, deterministically.
 */
import type { Element, ElementContent, Root, RootContent } from 'hast';

/**
 * Remove a leading ATX `# Title` line (and the blank lines after it).
 *
 * Only the first non-blank line, and only a level-one heading: a body that opens
 * with a `##` section or a paragraph is left exactly as written.
 */
export function stripLeadingTitle(markdown: string): string {
  return markdown.replace(
    /^\uFEFF?(?:[ \t]*\r?\n)*[ ]{0,3}#(?:[ \t]+[^\r\n]*)?[ \t]*(?:\r?\n|$)(?:[ \t]*\r?\n)*/,
    ''
  );
}

/** URL-fragment-safe slug of a heading's text. Never empty. */
export function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

/** The concatenated text of a hast node, from its text nodes only. */
export function hastText(node: Root | RootContent | ElementContent): string {
  if (node.type === 'text') return node.value;
  if ('children' in node) {
    return (node.children as Array<RootContent | ElementContent>).map(hastText).join('');
  }
  return '';
}

/** Hands out ids that are unique within one document: `x`, `x-1`, `x-2`, … */
export function createIdAllocator(): (base: string) => string {
  const used = new Set<string>();
  return (base: string) => {
    let id = base;
    for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
}

const HEADING = /^h[1-6]$/;

/**
 * rehype step for article bodies: demote every `h1` to `h2` (the page owns the
 * only h1), and give every heading an id from its text, de-duplicated.
 */
export function rehypeArticleHeadings() {
  return (tree: Root): void => {
    const allocate = createIdAllocator();
    const visit = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type !== 'element') continue;
        if (HEADING.test(child.tagName)) {
          if (child.tagName === 'h1') child.tagName = 'h2';
          child.properties = {
            ...child.properties,
            id: allocate(slugifyHeading(hastText(child))),
          };
        } else {
          visit(child);
        }
      }
    };
    visit(tree);
  };
}
