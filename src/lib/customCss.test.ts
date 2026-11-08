import { describe, expect, it } from 'vitest';
import { CUSTOM_CSS_MAX_LENGTH, sanitizeCustomCss } from './customCss';

const S = '.ab-custom-css';

describe('sanitizeCustomCss', () => {
  it('returns nothing for empty input', () => {
    expect(sanitizeCustomCss(null)).toEqual({ css: '', removed: [] });
    expect(sanitizeCustomCss('   ')).toEqual({ css: '', removed: [] });
  });

  it('scopes every selector to the profile container', () => {
    const { css, removed } = sanitizeCustomCss('h1, .card > p { color: red; font-weight: 700 }');
    expect(css).toBe(`${S} h1, ${S} .card > p { color: red; font-weight: 700; }`);
    expect(removed).toEqual([]);
  });

  it('maps html, body and :root to the container itself', () => {
    expect(sanitizeCustomCss('body { background: #fff }').css).toBe(`${S} { background: #fff; }`);
    expect(sanitizeCustomCss(':root { --brand: #123456 }').css).toBe(`${S} { --brand: #123456; }`);
    expect(sanitizeCustomCss('html body a { color: blue }').css).toBe(`${S} a { color: blue; }`);
    expect(sanitizeCustomCss('body.dark a { color: blue }').css).toBe(
      `${S}.dark a { color: blue; }`
    );
    // Not a prefix match on the word.
    expect(sanitizeCustomCss('bodyguard { color: blue }').css).toBe(
      `${S} bodyguard { color: blue; }`
    );
  });

  it('refuses selectors that would reach a sibling of the container', () => {
    const { css, removed } = sanitizeCustomCss('body ~ footer, + div, a { color: red }');
    expect(css).toBe(`${S} a { color: red; }`);
    expect(removed.length).toBeGreaterThan(0);
    expect(sanitizeCustomCss('& .x { color: red }').css).toBe('');
  });

  it('drops @import, @font-face and other at-rules', () => {
    const { css, removed } = sanitizeCustomCss(
      '@import url("https://evil.test/x.css"); @charset "utf-8"; @font-face { font-family: x; src: url(https://evil.test/f.woff) } @keyframes spin { to { opacity: 0 } } p { color: red }'
    );
    expect(css).toBe(`${S} p { color: red; }`);
    expect(removed).toEqual(
      expect.arrayContaining(['@import', '@charset', '@font-face', '@keyframes'])
    );
  });

  it('keeps @media and @supports, scoping the rules inside', () => {
    const { css } = sanitizeCustomCss('@media (max-width: 600px) { h1 { font-size: 2rem } }');
    expect(css).toBe(`@media (max-width: 600px) { ${S} h1 { font-size: 2rem; } }`);
    expect(sanitizeCustomCss('@supports (display: grid) { .a { display: grid } }').css).toBe(
      `@supports (display: grid) { ${S} .a { display: grid; } }`
    );
  });

  it('drops url() to another origin but keeps a same-origin path', () => {
    const { css, removed } = sanitizeCustomCss(
      'a { background: url(https://tracker.test/p.gif); color: red } b { background-image: url("/hero.jpg") } c { background: url(//evil.test/x) }'
    );
    expect(css).toBe(`${S} a { color: red; }\n${S} b { background-image: url("/hero.jpg"); }`);
    expect(removed).toContain('url() pointing at another site');
  });

  it.each([
    ['expression()', 'a { width: expression(alert(1)) }'],
    ['javascript: URLs', 'a { background: javascript:alert(1) }'],
    ['image-set()', 'a { background: image-set("https://evil.test/a.png" 1x) }'],
    ['image-set()', 'a { background: -webkit-image-set("https://evil.test/a.png" 1x) }'],
    ['src()', 'a { background: src("https://evil.test/a.png") }'],
    ['the behavior property', 'a { behavior: url(x.htc) }'],
    ['the -moz-binding property', 'a { -moz-binding: url(x.xml#x) }'],
    ['attr() as a URL', 'a { background: attr(data-x url) }'],
  ])('drops %s', (label, input) => {
    const { css, removed } = sanitizeCustomCss(input);
    expect(css).toBe('');
    expect(removed).toContain(label);
  });

  it('drops position: fixed and sticky so nothing floats over the page', () => {
    const { css, removed } = sanitizeCustomCss(
      '.x { position: fixed; inset: 0; z-index: 9999 } .y { position: relative }'
    );
    expect(css).toBe(`${S} .x { inset: 0; z-index: 9999; }\n${S} .y { position: relative; }`);
    expect(removed).toContain('position: fixed / sticky');
  });

  it('refuses backslash escapes rather than decoding them', () => {
    const { css, removed } = sanitizeCustomCss('a { background: u\\72l(https://evil.test) }');
    expect(css).toBe('');
    expect(removed[0]).toMatch(/backslash/);
  });

  it('can never close the style element it is rendered into', () => {
    const { css } = sanitizeCustomCss('a { content: "</style><script>alert(1)</script>" }');
    expect(css).not.toContain('<');
  });

  it('rejects the whole stylesheet when braces, quotes or comments are unbalanced', () => {
    for (const input of [
      'a { color: red',
      'a { color: red } }',
      'a { content: "x }',
      '/* a { color: red }',
      'a { width: calc(1px }',
    ]) {
      const { css, removed } = sanitizeCustomCss(input);
      expect(css).toBe('');
      expect(removed[0]).toMatch(/unclosed|everything/);
    }
  });

  it('ignores braces inside strings and comments', () => {
    const { css } = sanitizeCustomCss('/* } */ a::after { content: "{ }" }');
    expect(css).toBe(`${S} a::after { content: "{ }"; }`);
  });

  it('drops nested rules', () => {
    const { css, removed } = sanitizeCustomCss('.a { color: red; .b { color: blue } }');
    expect(css).toBe('');
    expect(removed).toContain('nested rules');
  });

  it('rejects input over the length limit', () => {
    const { css, removed } = sanitizeCustomCss(
      `a { color: red } ${' '.repeat(CUSTOM_CSS_MAX_LENGTH)}`
    );
    expect(css).toBe('');
    expect(removed[0]).toMatch(/limited to 10,000/);
  });
});
