/**
 * US-305: no page-builder template ships an invented number or review.
 *
 * Applying "Premium Showcase" used to publish "200+ Homes Sold", "98% Client
 * Satisfaction", "$50M in Sales" and three five-star reviews from clients who
 * do not exist on the agent's public page, under their name.
 */
import { describe, it, expect } from 'vitest';
import { pageTemplates, applyTemplate } from './pageTemplates';
import type {
  ContactBlockConfig,
  LinkBlockConfig,
  StatsBlockConfig,
  TestimonialBlockConfig,
} from '@/types/pageBuilder';
import { usableLinkUrl } from './blockLinkTarget';
import { isAgentStatSource } from './agentPageFacts';
import { pageBuilder } from './pageBuilder';

/** Copy a visitor reads as a claim (form fields and button text excluded). */
const CLAIM_FIELDS = ['headline', 'subheadline', 'title', 'subtitle', 'description', 'content'];

describe('page templates (US-305)', () => {
  it('stats blocks carry only live figures, never a literal value', () => {
    let statsBlocks = 0;
    for (const template of pageTemplates) {
      for (const block of template.blocks) {
        if (block.type !== 'stats') continue;
        statsBlocks += 1;
        const config = block.config as StatsBlockConfig;
        for (const stat of config.stats) {
          expect(isAgentStatSource(stat.source), `${template.id}: ${stat.label}`).toBe(true);
          expect(stat.value, `${template.id}: ${stat.label}`).toBe('');
          expect(stat.prefix ?? '').toBe('');
          expect(stat.suffix ?? '').toBe('');
        }
      }
    }
    expect(statsBlocks).toBeGreaterThan(0);
  });

  it('testimonial blocks read the testimonials table and carry no review text', () => {
    let testimonialBlocks = 0;
    for (const template of pageTemplates) {
      for (const block of template.blocks) {
        if (block.type !== 'testimonial') continue;
        testimonialBlocks += 1;
        const config = block.config as TestimonialBlockConfig;
        expect(config.source).toBe('profile');
        expect(config.testimonials).toEqual([]);
      }
    }
    expect(testimonialBlocks).toBeGreaterThan(0);
  });

  it('no claim copy contains a number', () => {
    for (const template of pageTemplates) {
      for (const block of template.blocks) {
        const config = block.config as unknown as Record<string, unknown>;
        for (const field of CLAIM_FIELDS) {
          const value = config[field];
          if (typeof value !== 'string') continue;
          expect(value, `${template.id} ${block.type}.${field}`).not.toMatch(/\d/);
        }
      }
    }
  });

  it('applying a template keeps the live bindings', () => {
    const premium = pageTemplates.find((t) => t.id === 'premium-showcase');
    expect(premium).toBeDefined();
    const blocks = applyTemplate(premium!, 'user-1', 'my-page');
    const stats = blocks.find((b) => b.type === 'stats')!.config as StatsBlockConfig;
    expect(stats.stats.every((s) => isAgentStatSource(s.source))).toBe(true);
  });

  it("a new Testimonials block reads the agent's published testimonials", () => {
    const template = pageBuilder.getBlockTemplates().find((t) => t.type === 'testimonial');
    expect(template).toBeDefined();
    const config = template!.defaultConfig as TestimonialBlockConfig;
    expect(config.source).toBe('profile');
    expect(config.testimonials).toEqual([]);
  });
});

/**
 * US-327: First-Time Buyer and Investor shipped link buttons promising a
 * "Free Download" and a "Market Analysis Report" with url '#', and every
 * contact form promised a reply "within 24 hours" in the agent's voice.
 */
describe('page templates make no promise the agent did not (US-327)', () => {
  /** Every URL-bearing field a template block can carry. */
  const URL_FIELDS = ['url', 'ctaUrl', 'buttonUrl'];

  it('every link, hero and CTA button has a real destination', () => {
    let checked = 0;
    for (const template of pageTemplates) {
      for (const block of template.blocks) {
        const config = block.config as unknown as Record<string, unknown>;
        for (const field of URL_FIELDS) {
          if (!(field in config)) continue;
          checked += 1;
          expect(
            usableLinkUrl(config[field] as string),
            `${template.id} ${block.type}.${field}`
          ).not.toBe('');
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('no link button promises a download, guide or report', () => {
    for (const template of pageTemplates) {
      for (const block of template.blocks) {
        if (block.type !== 'link') continue;
        const { title } = block.config as LinkBlockConfig;
        expect(title, template.id).not.toMatch(/download|guide|report|free/i);
      }
    }
  });

  it('no contact form commits the agent to a response time', () => {
    let forms = 0;
    for (const template of pageTemplates) {
      for (const block of template.blocks) {
        if (block.type !== 'contact') continue;
        forms += 1;
        const { successMessage } = block.config as ContactBlockConfig;
        expect(successMessage, template.id).toBeTruthy();
        expect(successMessage, template.id).not.toMatch(
          /\d|within|hours?|minutes?|same[- ]day|today|prepare/i
        );
      }
    }
    expect(forms).toBeGreaterThan(0);
  });

  it('a new Link block starts with no destination, so it is not published by accident', () => {
    const template = pageBuilder.getBlockTemplates().find((t) => t.type === 'link');
    expect(template).toBeDefined();
    expect(usableLinkUrl((template!.defaultConfig as LinkBlockConfig).url)).toBe('');
  });
});
