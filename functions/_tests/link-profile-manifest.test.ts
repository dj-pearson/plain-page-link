/**
 * linkProfileManifest (US-471): the crawler HTML for /:username names the
 * agent's manifest, exactly once, whatever shape the source link had.
 */
import { describe, it, expect } from 'vitest';
import { linkProfileManifest } from '../_lib/profile-route';

const EXPECTED = '<link rel="manifest" href="/jane/manifest.json" />';

describe('linkProfileManifest', () => {
  it('replaces the dashboard manifest link in place', () => {
    const html =
      '<html><head><title>x</title><link rel="manifest" href="/manifest.json" /><link rel="icon" href="/i.png"></head><body></body></html>';
    expect(linkProfileManifest(html, 'jane')).toBe(
      `<html><head><title>x</title>${EXPECTED}<link rel="icon" href="/i.png"></head><body></body></html>`
    );
  });

  it('collapses duplicate links, in any attribute order or quoting, to one', () => {
    const html =
      "<head><link href='/manifest.json' rel='manifest'><link rel=manifest href=/manifest.webmanifest></head>";
    const out = linkProfileManifest(html, 'jane');
    expect(out.match(/rel="?manifest/g)).toHaveLength(1);
    expect(out).toBe(`<head>${EXPECTED}</head>`);
  });

  it('adds the link when the document had none', () => {
    const out = linkProfileManifest('<html><head><title>x</title></head></html>', 'jane');
    expect(out).toContain(`${EXPECTED}\n  </head>`);
  });

  it('leaves a document with no head unchanged', () => {
    expect(linkProfileManifest('<p>hi</p>', 'jane')).toBe('<p>hi</p>');
  });

  it('does not touch other links that mention manifest', () => {
    const html = '<head><link rel="preload" href="/manifest.json" as="fetch"></head>';
    const out = linkProfileManifest(html, 'jane');
    expect(out).toContain('<link rel="preload" href="/manifest.json" as="fetch">');
    expect(out).toContain(EXPECTED);
  });

  it('encodes the username in the path', () => {
    expect(
      linkProfileManifest('<head><link rel="manifest" href="/m.json"></head>', 'a b')
    ).toContain('href="/a%20b/manifest.json"');
  });
});
