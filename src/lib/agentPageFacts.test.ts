/**
 * US-305: page-builder stats read the agent's real figures, and the invented
 * figures and reviews the old templates saved into pages are never shown.
 */
import { describe, it, expect } from 'vitest';
import {
  buildAgentPageFacts,
  isTemplateFabricatedStat,
  isTemplateFabricatedTestimonial,
  resolveAgentStat,
  shownManualTestimonials,
  shownStats,
  type AgentPageFacts,
} from './agentPageFacts';

const facts: AgentPageFacts = {
  soldListings: 12,
  activeListings: 3,
  yearsExperience: 7,
  reviewCount: 4,
  averageRating: 4.75,
};

const empty: AgentPageFacts = {
  soldListings: 0,
  activeListings: 0,
  yearsExperience: null,
  reviewCount: 0,
  averageRating: null,
};

describe('resolveAgentStat', () => {
  it('reads each figure from the facts', () => {
    expect(resolveAgentStat('sold_listings', facts)).toBe('12');
    expect(resolveAgentStat('active_listings', facts)).toBe('3');
    expect(resolveAgentStat('years_experience', facts)).toBe('7');
    expect(resolveAgentStat('review_count', facts)).toBe('4');
    expect(resolveAgentStat('average_rating', facts)).toBe('4.8 / 5');
  });

  it('has no figure rather than a zero or a guess', () => {
    for (const source of [
      'sold_listings',
      'active_listings',
      'years_experience',
      'review_count',
      'average_rating',
    ] as const) {
      expect(resolveAgentStat(source, empty)).toBeNull();
    }
    expect(resolveAgentStat('years_experience', { ...empty, yearsExperience: 0 })).toBeNull();
  });
});

describe('template fabrications', () => {
  it('recognises every figure the old templates and defaults shipped', () => {
    expect(isTemplateFabricatedStat({ value: '200', label: 'Homes Sold', suffix: '+' })).toBe(true);
    expect(isTemplateFabricatedStat({ value: '150', label: 'Homes Sold', suffix: '+' })).toBe(true);
    expect(
      isTemplateFabricatedStat({ value: '98', label: 'Client Satisfaction', suffix: '%' })
    ).toBe(true);
    expect(isTemplateFabricatedStat({ value: '50', label: 'M in Sales', prefix: '$' })).toBe(true);
    expect(isTemplateFabricatedStat({ value: '5', label: 'Star Rating' })).toBe(true);
    expect(isTemplateFabricatedStat({ value: '0', label: 'New Stat' })).toBe(true);
  });

  it('keeps a figure the agent typed themselves', () => {
    expect(isTemplateFabricatedStat({ value: '200', label: 'Homes Sold' })).toBe(false);
    expect(isTemplateFabricatedStat({ value: '37', label: 'Homes Sold', suffix: '+' })).toBe(false);
  });

  it('recognises the invented reviews and the Add placeholder', () => {
    expect(
      isTemplateFabricatedTestimonial({
        name: 'Michael R.',
        content:
          'Sold our home in just 5 days above asking price. The marketing strategy was top-notch and communication was excellent throughout.',
      })
    ).toBe(true);
    expect(
      isTemplateFabricatedTestimonial({
        name: 'Client Name',
        content: 'Working with this agent was an amazing experience...',
      })
    ).toBe(true);
    expect(isTemplateFabricatedTestimonial({ name: 'Michael R.', content: 'Great agent.' })).toBe(
      false
    );
  });
});

describe('shownStats', () => {
  it('resolves live items, drops invented and unfilled ones, keeps typed ones', () => {
    const result = shownStats(
      [
        { id: 'a', source: 'sold_listings', value: '', label: 'Homes sold', icon: 'home' },
        { id: 'b', source: 'average_rating', value: '', label: '' },
        { id: 'c', value: '98', label: 'Client Satisfaction', suffix: '%' },
        { id: 'd', value: '', label: 'Unfilled' },
        { id: 'e', value: '3', label: 'Languages spoken' },
      ],
      facts
    );
    expect(result.shown.map((s) => [s.label, s.value])).toEqual([
      ['Homes sold', '12'],
      ['Average rating', '4.8 / 5'],
      ['Languages spoken', '3'],
    ]);
    expect(result.hiddenFabricated).toBe(1);
    expect(result.pendingLive).toBe(0);
  });

  it('hides live items until the figure exists, and while facts are not loaded', () => {
    const stats = [
      { id: 'a', source: 'sold_listings' as const, value: '999', label: 'Homes sold' },
    ];
    expect(shownStats(stats, empty).shown).toEqual([]);
    expect(shownStats(stats, empty).pendingLive).toBe(1);
    // `value` on a live item is never shown, even when facts are missing.
    expect(shownStats(stats, null).shown).toEqual([]);
  });

  it('survives a malformed jsonb value', () => {
    expect(shownStats(undefined, facts).shown).toEqual([]);
    expect(shownStats([null as never, 'x' as never], facts).shown).toEqual([]);
  });
});

describe('shownManualTestimonials', () => {
  it('drops invented and unfilled entries', () => {
    const { shown, hiddenFabricated } = shownManualTestimonials([
      {
        id: 't1',
        name: 'Sarah & James M.',
        content:
          'An incredible agent who went above and beyond to find us our dream home. Their market knowledge and negotiation skills saved us thousands.',
        rating: 5,
      },
      { id: 't2', name: '', content: '', rating: 5 },
      { id: 't3', name: 'Dana K.', content: 'Patient and honest.', rating: 4 },
    ]);
    expect(shown.map((t) => t.name)).toEqual(['Dana K.']);
    expect(hiddenFabricated).toBe(1);
  });
});

describe('buildAgentPageFacts', () => {
  it('counts reviews, averages valid ratings and maps rows to block testimonials', () => {
    const { facts: built, testimonials } = buildAgentPageFacts({
      yearsExperience: 9,
      soldListings: 5,
      activeListings: null,
      testimonials: [
        {
          id: 'x',
          client_name: 'Ana',
          client_title: 'Buyer',
          client_photo: null,
          review: 'Found us a house.',
          rating: 5,
        },
        {
          id: 'y',
          client_name: 'Ben',
          client_title: null,
          client_photo: 'p.jpg',
          review: 'Good.',
          rating: 4,
        },
      ],
    });
    expect(built).toEqual({
      soldListings: 5,
      activeListings: 0,
      yearsExperience: 9,
      reviewCount: 2,
      averageRating: 4.5,
    });
    expect(testimonials[0]).toEqual({
      id: 'x',
      name: 'Ana',
      role: 'Buyer',
      content: 'Found us a house.',
      avatarUrl: undefined,
      rating: 5,
    });
    expect(testimonials[1].avatarUrl).toBe('p.jpg');
  });
});
