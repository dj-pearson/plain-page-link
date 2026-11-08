/**
 * US-114: every social unfurl of an agent's page showed AgentBio's own
 * marketing card. public/_redirects is `/* /index.html 200`, nothing
 * prerenders, and SEOHead sets its tags in React — which iMessage, Facebook,
 * Slack and LinkedIn never run.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildListingBody,
  buildListingTags,
  buildProfileBody,
  buildProfileTags,
  PROFILE_BODY_LISTING_LIMIT,
  type BodyListing,
  injectSocialTags,
  isCrawler,
  isReservedSegment,
  replaceRootContent,
  type ListingMeta,
  type ProfileMeta,
} from './social-meta';

const ORIGIN = 'https://agentbio.net';

const profile: ProfileMeta = {
  username: 'jane',
  full_name: 'Jane Doe',
  bio: 'Fifteen years selling homes on the east bench.',
  avatar_url: 'https://cdn.example.com/jane.jpg',
  og_image: null,
  seo_title: null,
  seo_description: null,
  title: 'Associate Broker',
  brokerage_name: 'Summit Realty',
  service_cities: ['Salt Lake City', 'Holladay'],
};

const listing: ListingMeta = {
  id: 'abc-123',
  address: '412 Maple Avenue',
  city: 'Salt Lake City',
  state: 'UT',
  price: '525000',
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1980,
  description: null,
  photos: ['https://cdn.example.com/412-maple.jpg'],
  image: null,
};

describe('isCrawler', () => {
  it('recognises the agents that fetch preview cards', () => {
    for (const ua of [
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Twitterbot/1.0',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'LinkedInBot/1.0',
      'WhatsApp/2.23.20.0',
      'Mozilla/5.0 (compatible; Discordbot/2.0)',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ]) {
      expect(isCrawler(ua), ua).toBe(true);
    }
  });

  it("recognises answer engines' crawlers and fetchers, which run no scripts either (US-520)", () => {
    for (const ua of [
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot) Chrome/119.0.6045.214 Safari/537.36',
      'DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)',
      'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
      'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
    ]) {
      expect(isCrawler(ua), ua).toBe(true);
    }
  });

  it('prerenders for every crawler robots.txt invites by name (US-520)', () => {
    // robots.txt allows these bots "for citation and search results". One that
    // is not prerendered for reads the homepage under every agent's URL.
    // Google-Extended is a robots.txt product token only; no request carries it.
    const robots = readFileSync(join(__dirname, '..', '..', 'public', 'robots.txt'), 'utf8');
    const invited: string[] = [];
    let agents: string[] = [];
    for (const raw of robots.split('\n')) {
      const line = raw.replace(/#.*/, '').trim();
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon).trim();
      const value = colon === -1 ? '' : line.slice(colon + 1).trim();
      if (/^user-agent$/i.test(field)) {
        agents.push(value);
      } else if (/^allow$/i.test(field) && value === '/') {
        invited.push(...agents);
      } else if (line === '') {
        agents = [];
      }
    }
    const named = invited.filter((agent) => agent !== '*' && agent !== 'Google-Extended');
    expect(named).toEqual(expect.arrayContaining(['GPTBot', 'ClaudeBot', 'PerplexityBot']));
    for (const agent of named) {
      expect(isCrawler(`Mozilla/5.0 (compatible; ${agent}/1.0)`), agent).toBe(true);
    }
  });

  it('does not divert a person', () => {
    for (const ua of [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0.0 Safari/537.36',
    ]) {
      expect(isCrawler(ua), ua).toBe(false);
    }
    expect(
      isCrawler(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
      )
    ).toBe(false);
    expect(isCrawler(null)).toBe(false);
    expect(isCrawler('')).toBe(false);
  });
});

describe('isReservedSegment', () => {
  it('keeps app routes and assets out of the profile path', () => {
    for (const segment of [
      'dashboard',
      'auth',
      'blog',
      'admin',
      'Pricing',
      'sitemap.xml',
      'sitemap-profiles.xml',
      'sw.js',
    ]) {
      expect(isReservedSegment(segment), segment).toBe(true);
    }
  });

  it('treats a plain username as a username', () => {
    expect(isReservedSegment('jane')).toBe(false);
    expect(isReservedSegment('dana-rivers')).toBe(false);
  });
});

describe('buildProfileTags', () => {
  it('names the agent, not the product', () => {
    const tags = buildProfileTags(profile, ORIGIN);
    expect(tags.title).toBe('Jane Doe — Associate Broker at Summit Realty');
    expect(tags.description).toContain('east bench');
    expect(tags.image).toBe('https://cdn.example.com/jane.jpg');
    expect(tags.url).toBe('https://agentbio.net/jane');
    expect(tags.jsonLd['@type']).toBe('RealEstateAgent');
    expect(tags.ogType).toBe('profile');
  });

  it("prefers the agent's own SEO fields when they set them", () => {
    const tags = buildProfileTags(
      { ...profile, seo_title: 'Buy in Holladay', seo_description: 'Ask me anything.' },
      ORIGIN
    );
    expect(tags.title).toBe('Buy in Holladay');
    expect(tags.description).toBe('Ask me anything.');
  });

  it('writes a description from the service areas when there is no bio', () => {
    const tags = buildProfileTags({ ...profile, bio: null }, ORIGIN);
    expect(tags.description).toContain('Jane Doe');
    expect(tags.description).toContain('Salt Lake City');
  });

  it('makes a relative avatar absolute — a card cannot load a site-relative image', () => {
    const tags = buildProfileTags({ ...profile, avatar_url: '/uploads/jane.jpg' }, ORIGIN);
    expect(tags.image).toBe('https://agentbio.net/uploads/jane.jpg');
  });
});

describe('buildListingTags', () => {
  it('describes the property, with its own photo', () => {
    const tags = buildListingTags(profile, listing, ORIGIN);
    expect(tags.title).toBe('412 Maple Avenue, Salt Lake City, UT — $525,000');
    expect(tags.description).toContain('3 bd');
    expect(tags.description).toContain('1,980 sqft');
    expect(tags.image).toBe('https://cdn.example.com/412-maple.jpg');
    expect(tags.url).toBe('https://agentbio.net/jane/listing/abc-123');
    expect(tags.jsonLd['@type']).toBe('SingleFamilyResidence');
    // A property is not a person; og:type=profile would be wrong for it.
    expect(tags.ogType).toBe('website');
  });

  it('falls back to the agent card when the listing has no photo', () => {
    const tags = buildListingTags(profile, { ...listing, photos: [], image: null }, ORIGIN);
    expect(tags.image).toBe('https://cdn.example.com/jane.jpg');
  });

  it('handles the price column being text, in either shape', () => {
    expect(buildListingTags(profile, { ...listing, price: '$1,250,000' }, ORIGIN).title).toContain(
      '$1,250,000'
    );
    expect(buildListingTags(profile, { ...listing, price: null }, ORIGIN).title).toBe(
      '412 Maple Avenue, Salt Lake City, UT'
    );
  });
});

describe('injectSocialTags', () => {
  const INDEX = `<!DOCTYPE html><html><head>
    <meta name="description" content="Purpose-built link-in-bio for real estate agents." />
    <meta property="og:title" content="Real Estate Agent Bio Page Builder – AgentBio" />
    <meta property="og:image" content="https://agentbio.net/Cover.png" />
    <meta property="twitter:image" content="https://agentbio.net/Cover.png" />
    <title>Real Estate Agent Bio Page Builder – AgentBio</title>
  </head><body><div id="root"></div></body></html>`;

  it("removes index.html's tags rather than adding a second set", () => {
    const out = injectSocialTags(INDEX, buildProfileTags(profile, ORIGIN));

    expect(out).not.toContain('Cover.png');
    expect(out).not.toContain('Purpose-built link-in-bio');
    expect(out.match(/<title>/g)).toHaveLength(1);
    expect(out.match(/property="og:title"/g)).toHaveLength(1);
    expect(out.match(/property="og:image"/g)).toHaveLength(1);
  });

  it('writes the agent into the head', () => {
    const out = injectSocialTags(INDEX, buildProfileTags(profile, ORIGIN));

    expect(out).toContain('<title>Jane Doe — Associate Broker at Summit Realty</title>');
    expect(out).toContain('content="https://cdn.example.com/jane.jpg"');
    expect(out).toContain('rel="canonical" href="https://agentbio.net/jane"');
    expect(out).toContain('"@type":"RealEstateAgent"');
    expect(out).toContain(
      '<div id="root"><main><h1>Jane Doe — Associate Broker at Summit Realty</h1>'
    );
  });

  it('escapes a name that would otherwise break out of the attribute', () => {
    const out = injectSocialTags(
      INDEX,
      buildProfileTags({ ...profile, full_name: 'Jane "The Closer" Doe', seo_title: null }, ORIGIN)
    );
    expect(out).not.toContain('content="Jane "The Closer"');
    expect(out).toContain('&quot;The Closer&quot;');
  });

  it('escapes a closing script tag inside the JSON-LD', () => {
    const out = injectSocialTags(
      INDEX,
      buildProfileTags({ ...profile, bio: 'Hi </script><script>alert(1)</script>' }, ORIGIN)
    );
    expect(out).not.toContain('</script><script>alert(1)');
  });

  it('uses summary_large_image only when there is an image', () => {
    expect(
      injectSocialTags(INDEX, buildProfileTags({ ...profile, avatar_url: null }, ORIGIN))
    ).toContain('name="twitter:card" content="summary"');
    expect(injectSocialTags(INDEX, buildProfileTags(profile, ORIGIN))).toContain(
      'name="twitter:card" content="summary_large_image"'
    );
  });
});

describe('replaceRootContent', () => {
  it('replaces the whole of #root, not up to its first nested </div>', () => {
    const html =
      '<body><div id="root"><div><div>a</div><div>b</div></div><p>c</p></div><div id="portal"></div></body>';
    expect(replaceRootContent(html, '<h1>x</h1>')).toBe(
      '<body><div id="root"><h1>x</h1></div><div id="portal"></div></body>'
    );
  });

  it('leaves a document without #root, or with an unbalanced one, unchanged', () => {
    expect(replaceRootContent('<body><main></main></body>', 'x')).toBe(
      '<body><main></main></body>'
    );
    const unbalanced = '<body><div id="root"><div>open</body>';
    expect(replaceRootContent(unbalanced, 'x')).toBe(unbalanced);
  });
});

describe('buildProfileBody (US-539)', () => {
  const bodyListing = (over: Partial<BodyListing> = {}): BodyListing => ({
    id: 'abc-123',
    status: 'active',
    address: '412 Maple Avenue',
    city: 'Salt Lake City',
    state: 'UT',
    price: '525000',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1980,
    ...over,
  });
  const body = (p: ProfileMeta, listings: BodyListing[] = [], showContact = true) =>
    buildProfileBody(p, buildProfileTags(p, ORIGIN), ORIGIN, { listings, showContact });

  it('escapes markup in the bio, name, cities and licence', () => {
    const hostile: ProfileMeta = {
      ...profile,
      full_name: 'Jane <img src=x onerror=alert(1)>',
      bio: 'Call me </main><script>alert(1)</script>',
      service_cities: ['<b>Holladay</b>'],
      license_number: '"><svg onload=alert(1)>',
      license_state: 'UT',
    };
    const html = body(hostile);
    expect(html).not.toMatch(/<(img|script|svg|b)\b/);
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<li>&lt;b&gt;Holladay&lt;/b&gt;</li>');
    expect(html.match(/<\/main>/g)).toHaveLength(1);
  });

  it('escapes markup in a listing address and encodes its id into the link', () => {
    const html = body(profile, [
      bodyListing({ id: 'a"b c', address: '1 <script>x</script> Way', city: 'O"Fallon' }),
    ]);
    expect(html).not.toContain('<script>');
    expect(html).toContain('href="https://agentbio.net/jane/listing/a%22b%20c"');
    expect(html).toContain('1 &lt;script&gt;x&lt;/script&gt; Way, O&quot;Fallon, UT');
  });

  it(`links to at most ${PROFILE_BODY_LISTING_LIMIT} listings`, () => {
    const many = Array.from({ length: PROFILE_BODY_LISTING_LIMIT + 5 }, (_, i) =>
      bodyListing({ id: `l-${i}` })
    );
    expect(body(profile, many).match(/\/listing\//g)).toHaveLength(PROFILE_BODY_LISTING_LIMIT);
  });

  it('puts only a number in a tel: link and only a plausible address in a mailto: link', () => {
    const html = body({
      ...profile,
      phone: '+1 801-555-0100" onclick="x',
      email_display: 'jane@x.com?bcc=everyone@x.com',
    });
    expect(html).toContain('href="tel:+18015550100"');
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('onclick="');
  });

  it('leaves contact links out when they are not allowed', () => {
    const html = body(
      { ...profile, phone: '801 555 0100', email_display: 'jane@x.com' },
      [],
      false
    );
    expect(html).not.toContain('tel:');
    expect(html).not.toContain('mailto:');
  });

  it('does not repeat the bio when it is already the description', () => {
    const html = body(profile);
    expect(html.match(/Fifteen years selling homes/g)).toHaveLength(1);
  });
});

describe('buildListingBody (US-539)', () => {
  it('states the facts and links back to the agent, escaped', () => {
    const p = { ...profile, full_name: 'Jane & <Co>' };
    const l = { ...listing, status: 'pending', description: 'Lovely <b>porch</b>' };
    const html = buildListingBody(p, l, buildListingTags(p, l, ORIGIN), ORIGIN);
    expect(html).toContain('<p>Pending · $525,000 · 3 bd · 2 ba · 1,980 sqft</p>');
    expect(html).toContain('<p>Lovely &lt;b&gt;porch&lt;/b&gt;</p>');
    expect(html).toContain('<a href="https://agentbio.net/jane">Jane &amp; &lt;Co&gt;</a>');
  });
});
