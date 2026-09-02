/**
 * US-114: every social unfurl of an agent's page showed AgentBio's own
 * marketing card. public/_redirects is `/* /index.html 200`, nothing
 * prerenders, and SEOHead sets its tags in React — which iMessage, Facebook,
 * Slack and LinkedIn never run.
 */
import { describe, it, expect } from 'vitest';
import {
  buildListingTags,
  buildProfileTags,
  injectSocialTags,
  isCrawler,
  isReservedSegment,
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

  it('does not divert a person', () => {
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
    expect(tags.url).toBe('https://agentbio.net/jane?listing=abc-123');
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
    expect(out).toContain('<div id="root"></div>');
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
