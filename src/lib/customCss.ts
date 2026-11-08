/**
 * Agent custom CSS for the public page (US-488, owner decision 2026-11-08).
 *
 * An agent on a plan with `customThemes` may write CSS for their /:username
 * page. What they write is untrusted input rendered into every visitor's
 * browser, so it is never inserted as written. `sanitizeCustomCss` rebuilds a
 * stylesheet from what survives a conservative allow-list and returns it with
 * every selector prefixed by the profile container's class:
 *
 *   - Every rule is scoped: `a { … }` becomes `.ab-custom-css a { … }`, and
 *     `html`, `body` and `:root` at the start of a selector mean the container
 *     itself. A descendant selector cannot match anything outside the
 *     container, so the compliance footer, the sticky action bar, the modals
 *     and the dashboard chrome are out of reach. (The page also renders the
 *     container with `contain: paint`, so nothing inside it can be positioned
 *     or painted over the footer below it.)
 *   - Nothing is fetched from another origin: `@import`, `@font-face` and every
 *     at-rule other than `@media`, `@supports` and `@container` are dropped, and
 *     so is any declaration using `url()` (other than a same-origin path),
 *     `image-set()`, `src()`, `element()`, `expression()`, `javascript:`,
 *     `behavior` or `-moz-binding`.
 *   - Backslash escapes are refused rather than decoded — they are how a
 *     blocked word is smuggled past a filter — and `<` is removed everywhere,
 *     so the output can never close the <style> element it is rendered into.
 *   - `position: fixed` and `position: sticky` are dropped; the agent's CSS
 *     restyles their page, it does not float things over the visitor's screen.
 *     (A value can still arrive through var(); `contain: paint` on the
 *     container is what actually keeps a fixed box inside it.)
 *   - Unbalanced braces, brackets or quotes reject the whole stylesheet: a
 *     parser that guesses where a broken rule ends can be steered.
 *
 * The same function runs in the dashboard editor, which lists what was removed
 * so the agent sees exactly what visitors will get.
 */

export const CUSTOM_CSS_SCOPE_CLASS = 'ab-custom-css';
const SCOPE = `.${CUSTOM_CSS_SCOPE_CLASS}`;

/** Matches the database trigger in 20261108000514. */
export const CUSTOM_CSS_MAX_LENGTH = 10_000;

export interface SanitizedCustomCss {
  /** The scoped stylesheet, or '' when nothing survived. */
  css: string;
  /** Plain-language notes on what was removed, for the editor. */
  removed: string[];
}

const ALLOWED_GROUP_AT_RULES = new Set(['media', 'supports', 'container']);

/** Values that load something, run something, or are commonly used to hide one of those. */
const FORBIDDEN_VALUE_PATTERNS: Array<[RegExp, string]> = [
  [/expression\s*\(/i, 'expression()'],
  [/javascript\s*:/i, 'javascript: URLs'],
  [/vbscript\s*:/i, 'vbscript: URLs'],
  [/image-set\s*\(/i, 'image-set()'],
  [/(^|[^a-z-])src\s*\(/i, 'src()'],
  [/element\s*\(/i, 'element()'],
  // attr(… url) / attr(… type(<url>)) turns an attribute into a fetched URL.
  [/attr\s*\([^)]*url/i, 'attr() as a URL'],
  [/@import/i, '@import'],
];

const FORBIDDEN_PROPERTIES = new Set(['behavior', '-moz-binding']);

const PROPERTY_NAME = /^(?:--[A-Za-z0-9_-]+|-?[A-Za-z][A-Za-z0-9-]*)$/;

class Unbalanced extends Error {}

/** Remove comments, honouring strings so `content: "/*"` survives. */
function stripComments(input: string): string {
  let out = '';
  let i = 0;
  let quote: string | null = null;
  while (i < input.length) {
    const ch = input[i];
    if (quote) {
      out += ch;
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === '/' && input[i + 1] === '*') {
      const end = input.indexOf('*/', i + 2);
      if (end === -1) throw new Unbalanced();
      out += ' ';
      i = end + 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  if (quote) throw new Unbalanced();
  return out;
}

/**
 * Index of the first `target` character at nesting depth 0 (outside strings,
 * parentheses and brackets), or -1.
 */
function findTopLevel(text: string, from: number, targets: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = from; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') {
      depth -= 1;
      if (depth < 0) throw new Unbalanced();
    } else if (depth === 0 && targets.includes(ch)) return i;
  }
  if (quote || depth !== 0) throw new Unbalanced();
  return -1;
}

/** Index of the `}` matching the `{` at `open`. */
function findBlockEnd(text: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Unbalanced();
}

/** Split on a separator at depth 0 (outside strings, parentheses, brackets). */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let start = 0;
  for (;;) {
    const at = findTopLevel(text, start, separator);
    if (at === -1) {
      parts.push(text.slice(start));
      return parts;
    }
    parts.push(text.slice(start, at));
    start = at + 1;
  }
}

function urlIsSameOriginPath(value: string): boolean {
  const urls = value.match(/url\s*\(([^)]*)\)/gi);
  if (!urls) return true;
  return urls.every((u) => {
    const inner = u
      .replace(/^url\s*\(/i, '')
      .replace(/\)$/, '')
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .trim();
    // A path on this origin. Not `//host` (protocol-relative), not a scheme.
    return inner.startsWith('/') && !inner.startsWith('//');
  });
}

function scopeSelector(selector: string): string | null {
  const s = selector.trim().replace(/\s+/g, ' ');
  if (!s) return null;
  if (/[{};@\\]/.test(s)) return null;
  // CSS nesting's `&` would refer to whatever encloses the rule.
  if (s.includes('&')) return null;
  // `html`, `body` and `:root` at the front mean the container itself.
  const lead = /^(?:html|:root)?(?:\s*(?:>\s*)?body)?(?=$|[\s>+~:.[#])/i.exec(s);
  if (lead && lead[0].length > 0) {
    const rest = s.slice(lead[0].length).trim();
    if (!rest) return SCOPE;
    // `body.dark a`, `body:hover` — attach to the container; `body a` — descendant.
    if (/^[:.[#]/.test(rest)) return `${SCOPE}${rest}`;
    if (/^[>+~]/.test(rest)) {
      // A sibling of the container is outside it.
      if (/^[+~]/.test(rest)) return null;
      return `${SCOPE} ${rest}`;
    }
    return `${SCOPE} ${rest}`;
  }
  // A selector that starts with a combinator would reach siblings of the container.
  if (/^[+~]/.test(s)) return null;
  return `${SCOPE} ${s}`;
}

function sanitizeDeclarations(body: string, removed: Set<string>): string {
  const kept: string[] = [];
  for (const raw of splitTopLevel(body, ';')) {
    const decl = raw.trim();
    if (!decl) continue;
    const colon = decl.indexOf(':');
    if (colon <= 0) {
      removed.add('a declaration that is not "property: value"');
      continue;
    }
    const prop = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (!PROPERTY_NAME.test(prop) || !value) {
      removed.add('a declaration that is not "property: value"');
      continue;
    }
    const lowerProp = prop.toLowerCase();
    if (FORBIDDEN_PROPERTIES.has(lowerProp)) {
      removed.add(`the ${lowerProp} property`);
      continue;
    }
    const forbidden = FORBIDDEN_VALUE_PATTERNS.find(([re]) => re.test(value));
    if (forbidden) {
      removed.add(forbidden[1]);
      continue;
    }
    if (!urlIsSameOriginPath(value)) {
      removed.add('url() pointing at another site');
      continue;
    }
    if (lowerProp === 'position' && /\b(fixed|sticky)\b/i.test(value)) {
      removed.add('position: fixed / sticky');
      continue;
    }
    kept.push(`${lowerProp.startsWith('--') ? prop : lowerProp}: ${value};`);
  }
  return kept.join(' ');
}

function sanitizeRules(text: string, removed: Set<string>): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    // Skip whitespace and stray semicolons.
    while (i < text.length && /[\s;]/.test(text[i])) i += 1;
    if (i >= text.length) break;

    const stop = findTopLevel(text, i, '{;}');
    if (stop === -1) {
      removed.add('an incomplete rule at the end');
      break;
    }
    if (text[stop] === '}') throw new Unbalanced();
    const prelude = text.slice(i, stop).trim();

    if (text[stop] === ';') {
      // A statement at-rule: @import, @charset, @namespace, @layer a, b; …
      if (prelude.startsWith('@')) {
        const name = /^@([\w-]+)/.exec(prelude)?.[1]?.toLowerCase() ?? 'unknown';
        removed.add(`@${name}`);
      } else {
        removed.add('a declaration outside any rule');
      }
      i = stop + 1;
      continue;
    }

    const end = findBlockEnd(text, stop);
    const body = text.slice(stop + 1, end);
    i = end + 1;

    if (prelude.startsWith('@')) {
      const name = /^@([\w-]+)/.exec(prelude)?.[1]?.toLowerCase() ?? 'unknown';
      const condition = prelude.slice(name.length + 1).trim();
      if (!ALLOWED_GROUP_AT_RULES.has(name)) {
        removed.add(`@${name}`);
        continue;
      }
      if (
        /url\s*\(|[\\{};]/i.test(condition) ||
        FORBIDDEN_VALUE_PATTERNS.some(([re]) => re.test(condition))
      ) {
        removed.add(`an @${name} condition that is not allowed`);
        continue;
      }
      const inner = sanitizeRules(body, removed);
      if (inner.length) out.push(`@${name} ${condition} { ${inner.join(' ')} }`);
      continue;
    }

    if (findTopLevel(body, 0, '{') !== -1) {
      removed.add('nested rules');
      continue;
    }

    const selectors = splitTopLevel(prelude, ',')
      .map((sel) => {
        const scoped = scopeSelector(sel);
        if (scoped === null && sel.trim()) removed.add(`the selector "${sel.trim().slice(0, 60)}"`);
        return scoped;
      })
      .filter((sel): sel is string => sel !== null);
    if (!selectors.length) continue;

    const declarations = sanitizeDeclarations(body, removed);
    if (!declarations) continue;
    out.push(`${selectors.join(', ')} { ${declarations} }`);
  }
  return out;
}

export function sanitizeCustomCss(input: string | null | undefined): SanitizedCustomCss {
  if (!input || !input.trim()) return { css: '', removed: [] };
  if (input.length > CUSTOM_CSS_MAX_LENGTH) {
    return {
      css: '',
      removed: [
        `everything: custom CSS is limited to ${CUSTOM_CSS_MAX_LENGTH.toLocaleString('en-US')} characters`,
      ],
    };
  }

  const removed = new Set<string>();
  let text = input;
  if (text.includes('<')) {
    removed.add('the "<" character');
    text = text.replace(/</g, '');
  }
  if (text.includes('\\')) {
    // Refuse escapes instead of decoding them; see the module comment.
    return { css: '', removed: ['everything: backslash escapes are not allowed in custom CSS'] };
  }

  try {
    const rules = sanitizeRules(stripComments(text), removed);
    return { css: rules.join('\n'), removed: [...removed] };
  } catch (error) {
    if (error instanceof Unbalanced) {
      return {
        css: '',
        removed: ['everything: the CSS has an unclosed brace, bracket, quote or comment'],
      };
    }
    throw error;
  }
}
