/**
 * The organisation must not claim accounts it does not have (US-178).
 *
 * schema.org `sameAs` on an Organization is a claim of identity, and it is what
 * Google reconciles an entity against when building a knowledge panel. Two
 * `sameAs` lists shipped on every page, plus a third copy in SEO_CONFIG,
 * claiming six accounts:
 *
 *     twitter.com/agentbio, facebook.com/agentbio,
 *     linkedin.com/company/agentbio, instagram.com/agentbio,
 *     youtube.com/@agentbio, github.com/agentbio
 *
 * The footer links four, under @agentbioapp / @AgentBioApp, and only LinkedIn
 * appears in both lists. So the site told Google it owned four accounts under a
 * handle it does not use — accounts that either belong to somebody else or do
 * not exist — and asserted a YouTube channel and a GitHub organisation that
 * appear nowhere else in this repository. twitter:site said @agentbio on every
 * page for the same reason.
 *
 * The rule these tests encode: an account goes in the list only if the site
 * links to it. That is the only evidence available here that it exists and is
 * ours.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SAME_AS, SOCIAL_PROFILES, X_HANDLE, profileUrl } from './config/social-profiles';
import { SEO_CONFIG } from './config/seo.config';

const ROOT = process.cwd();
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), 'utf8');

/** Social URLs a file asserts, ignoring share-intent and embed endpoints. */
function socialUrlsIn(source: string): string[] {
  const urls = new Set<string>();
  const pattern =
    /https?:\/\/(?:www\.)?(?:twitter|x|facebook|instagram|linkedin|youtube|github|tiktok)\.com\/[A-Za-z0-9_@./-]+/g;
  for (const url of source.match(pattern) ?? []) {
    // Sharing endpoints and embeds are not identity claims.
    if (/\/(intent|sharer|share-offsite|embed|watch)\b/.test(url)) continue;
    urls.add(url.replace(/[).,]+$/, ''));
  }
  return [...urls].sort();
}

const ALLOWED = new Set(SAME_AS);

describe('the social profile list', () => {
  it('has no duplicates and no empty entries', () => {
    expect(new Set(SAME_AS).size).toBe(SAME_AS.length);
    for (const profile of SOCIAL_PROFILES) {
      expect(profile.url).toMatch(/^https:\/\//);
      expect(profile.name.length).toBeGreaterThan(0);
    }
  });

  it('carries none of the six accounts that shipped in sameAs', () => {
    // Named literally rather than by pattern. The first version of this test
    // banned any URL ending in "agentbio", which rejects
    // linkedin.com/company/agentbio/ — the one entry in the old list that was
    // actually right. A rule that cannot tell the real account from the
    // invented ones is not a rule about accounts.
    const shipped = [
      'https://twitter.com/agentbio',
      'https://www.facebook.com/agentbio',
      'https://www.instagram.com/agentbio',
      'https://www.youtube.com/@agentbio',
      'https://github.com/agentbio',
    ];
    for (const wrong of shipped) {
      expect(SAME_AS, `${wrong} is not an account this company has`).not.toContain(wrong);
    }
  });
});

describe('every place that names a social account', () => {
  const sources: [string, string][] = [
    ['the footer', read('src', 'components', 'layout', 'PublicFooter.tsx')],
    ['lib/seo.ts', read('src', 'lib', 'seo.ts')],
    ['PageSEO.tsx', read('src', 'components', 'seo', 'PageSEO.tsx')],
    ['seo.config.ts', read('src', 'config', 'seo.config.ts')],
    ['llms.txt', read('public', 'llms.txt')],
  ];

  for (const [label, source] of sources) {
    it(`${label} names only accounts in SOCIAL_PROFILES`, () => {
      const claimed = socialUrlsIn(source).filter((url) => !ALLOWED.has(url));
      expect(
        claimed,
        `${label} asserts an account that is not in @/config/social-profiles. ` +
          'Claiming one you do not own hands the entity to a stranger.'
      ).toEqual([]);
    });
  }
});

describe('the footer', () => {
  const footer = read('src', 'components', 'layout', 'PublicFooter.tsx');

  it('links every profile, so sameAs stays evidenced by something visible', () => {
    for (const profile of SOCIAL_PROFILES) {
      expect(footer, `${profile.name} is in SOCIAL_PROFILES but not in the footer`).toContain(
        `profileUrl('${profile.name}')`
      );
    }
  });
});

describe('the X handle', () => {
  it('matches the account the site links to', () => {
    expect(X_HANDLE).toBe('@AgentBioApp');
    expect(profileUrl('X').toLowerCase()).toContain(X_HANDLE.slice(1).toLowerCase());
  });

  it('is what SEO_CONFIG hands to twitter:site', () => {
    expect(SEO_CONFIG.twitterHandle).toBe(X_HANDLE);
  });
});

describe('SEO_CONFIG', () => {
  it('takes its social links from the one list', () => {
    expect([...SEO_CONFIG.socialLinks]).toEqual([...SAME_AS]);
  });
});
