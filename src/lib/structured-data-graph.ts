/**
 * Builds the one JSON-LD document SEOHead writes into the page head (US-480,
 * fixes US-182).
 *
 * SEOHead used to append its speakable block as a second, separate WebPage
 * node with no `@id`, next to whatever the page passed in. /features/lead-capture
 * and /features/analytics pass their own WebPage node, also with no `@id`, so
 * each published two anonymous WebPage nodes. A consumer compares nodes by
 * `@id`; with none, it cannot tell the two describe the same page, and the page
 * arrives as two partial descriptions of itself. And because both pages passed
 * an `@graph` document, the result was an `@graph` nested inside another.
 *
 * Now:
 *   - the page's schema is flattened, so there is one `@graph` at most;
 *   - a top-level WebPage node with no `@id` is this page, so it is given the
 *     canonical URL as its `@id` (the convention ArticleSEO already follows);
 *   - the speakable specification is merged into this page's WebPage node, and
 *     only when the page has none is a WebPage node added for it, under the
 *     same `@id`.
 */

type Node = Record<string, unknown>;

function isPlainObject(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function withoutContext(node: Node): Node {
  const { '@context': _context, ...rest } = node;
  return rest;
}

/** The top-level nodes of a JSON-LD document, without their `@context`. */
function flatten(schema: object | undefined): Node[] {
  if (!isPlainObject(schema)) return [];
  const graph = schema['@graph'];
  if (Array.isArray(graph)) {
    return graph.filter(isPlainObject).map(withoutContext);
  }
  return [withoutContext(schema)];
}

/** Exactly `WebPage`, not a subtype such as FAQPage (which has its own job). */
function isWebPage(node: Node): boolean {
  const type = node['@type'];
  return type === 'WebPage' || (Array.isArray(type) && type.includes('WebPage'));
}

export interface StructuredDataInput {
  schema?: object;
  canonicalUrl?: string;
  speakableSelectors?: string[];
}

export function buildStructuredData({
  schema,
  canonicalUrl,
  speakableSelectors = [],
}: StructuredDataInput): Node | null {
  let nodes = flatten(schema);

  if (canonicalUrl) {
    nodes = nodes.map((node) =>
      isWebPage(node) && node['@id'] === undefined ? { '@id': canonicalUrl, ...node } : node
    );
  }

  if (speakableSelectors.length > 0 && canonicalUrl) {
    const speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: speakableSelectors,
    };
    const index = nodes.findIndex((node) => isWebPage(node) && node['@id'] === canonicalUrl);
    if (index >= 0) {
      const page = nodes[index];
      nodes[index] = { ...page, url: page.url ?? canonicalUrl, speakable };
    } else {
      nodes.push({ '@type': 'WebPage', '@id': canonicalUrl, url: canonicalUrl, speakable });
    }
  }

  if (nodes.length === 0) return null;
  if (nodes.length === 1) return { '@context': 'https://schema.org', ...nodes[0] };
  return { '@context': 'https://schema.org', '@graph': nodes };
}
