/**
 * US-409: the agent's new-lead email said who, but not what. It never named
 * the listing the visitor asked about, a seller's own address, or any answer
 * the form collected; Reply went to noreply@; the button opened the list.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLeadNotificationDetails } from './lead-notification.ts';
import { createLeadNotificationEmail } from './email.ts';

const SITE = 'https://agentbio.net';

beforeEach(() => {
  (globalThis as Record<string, unknown>).Deno = { env: { get: () => undefined } };
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).Deno;
});

describe('_shared/leadFormSchema.ts', () => {
  // The edge container copies only supabase/functions, so notify-lead runs a
  // copy. The dashboard and the email must label the same answers the same way.
  it('is identical to src/lib/leadFormSchema.ts', () => {
    const root = process.cwd();
    expect(readFileSync(join(root, 'supabase/functions/_shared/leadFormSchema.ts'), 'utf8')).toBe(
      readFileSync(join(root, 'src/lib/leadFormSchema.ts'), 'utf8')
    );
  });
});

describe('buildLeadNotificationDetails', () => {
  it('names the listing a buyer asked about and every answer they gave', () => {
    const details = buildLeadNotificationDetails(
      {
        id: 'lead-1',
        lead_type: 'buyer',
        listing_id: 'listing-1',
        property_address: '12 Maple Ave',
        price_range: '750k-1m',
        timeline: 'immediate',
        preapproved: true,
        form_data: { propertyType: 'single-family', bedrooms: '4', preApprovalStatus: 'cash' },
      },
      { address: '12 Maple Ave', city: 'Austin' },
      SITE
    );

    expect(details.listingAddress).toBe('12 Maple Ave, Austin');
    // The form's copy of the listing address is not the buyer's own home.
    expect(details.propertyAddress).toBeUndefined();
    const byLabel = Object.fromEntries(details.answers.map((a) => [a.label, a.value]));
    expect(byLabel['Price range']).toBe('$750k - $1M');
    expect(byLabel['Timeline']).toBe('ASAP (0-30 days)');
    expect(byLabel['Property type']).toBe('Single Family Home');
    expect(byLabel['Bedrooms']).toBeDefined();
    expect(byLabel['Financing']).toBeDefined();
  });

  it("gives a seller's own address as their property", () => {
    const details = buildLeadNotificationDetails(
      { id: 'lead-2', lead_type: 'valuation', property_address: ' 9 Oak St ', form_data: { yearBuilt: 1998 } },
      null,
      SITE
    );
    expect(details.listingAddress).toBeUndefined();
    expect(details.propertyAddress).toBe('9 Oak St');
    expect(details.answers).toContainEqual({ key: 'yearBuilt', label: 'Year built', value: '1998' });
  });

  it('falls back to the address the form sent when the listing is gone', () => {
    const details = buildLeadNotificationDetails(
      { id: 'lead-3', lead_type: 'buyer', listing_id: 'deleted', property_address: '1 Elm Rd' },
      null,
      SITE
    );
    expect(details.listingAddress).toBe('1 Elm Rd');
    expect(details.propertyAddress).toBeUndefined();
  });

  it('links to this lead, not the list', () => {
    const details = buildLeadNotificationDetails({ id: 'abc-123', lead_type: 'contact' }, null, SITE);
    expect(details.dashboardUrl).toBe(`${SITE}/dashboard/leads?lead=abc-123`);
    expect(details.answers).toEqual([]);
  });
});

describe('createLeadNotificationEmail (US-409)', () => {
  const base = {
    agentEmail: 'jane@realty.example',
    name: 'Dana Buyer',
    email: 'dana@example.com',
    phone: '(555) 123-4567',
    message: 'Can I see it Saturday?',
    listing: 'buying a home',
    listingAddress: '12 Maple Ave, Austin',
    answers: [
      { label: 'Price range', value: '$750k - $1M' },
      { label: 'Timeline', value: 'ASAP (0-30 days)' },
    ],
    dashboardUrl: `${SITE}/dashboard/leads?lead=lead-1`,
  };

  it('says which listing, carries the answers, and opens the lead', () => {
    const mail = createLeadNotificationEmail(base);
    expect(mail.subject).toBe('New Lead: Dana Buyer asked about 12 Maple Ave, Austin');
    for (const text of [mail.body, mail.html ?? '']) {
      expect(text).toContain('12 Maple Ave, Austin');
      expect(text).toContain('$750k - $1M');
      expect(text).toContain('ASAP (0-30 days)');
      expect(text).toContain('Can I see it Saturday?');
      expect(text).toContain(`${SITE}/dashboard/leads?lead=lead-1`);
    }
  });

  it('lets the agent answer the visitor by replying', () => {
    const mail = createLeadNotificationEmail(base);
    expect(mail.replyTo).toBe('dana@example.com');
    expect(mail.body).toContain('Reply to this email to answer Dana Buyer directly.');
  });

  it("shows a seller's own address", () => {
    const mail = createLeadNotificationEmail({
      ...base,
      listing: 'a home valuation',
      listingAddress: undefined,
      propertyAddress: '9 Oak St',
    });
    expect(mail.subject).toBe('New Lead: Dana Buyer is interested in a home valuation');
    expect(mail.body).toContain('Their property: 9 Oak St');
  });

  it('a phone-only lead has no Reply-To and no empty Email line', () => {
    const mail = createLeadNotificationEmail({ ...base, email: '' });
    expect(mail.replyTo).toBeUndefined();
    expect(mail.body).not.toMatch(/^Email:/m);
    expect(mail.body).toContain('Phone: (555) 123-4567');
  });

  it('never puts a malformed address in Reply-To', () => {
    const mail = createLeadNotificationEmail({ ...base, email: 'dana@example.com\r\nBcc: x@y.z' });
    expect(mail.replyTo).toBeUndefined();
  });

  it('a locked lead keeps what was asked but not how to reach them', () => {
    const mail = createLeadNotificationEmail({ ...base, locked: true });
    expect(mail.replyTo).toBeUndefined();
    for (const text of [mail.subject, mail.body, mail.html ?? '']) {
      expect(text).not.toContain('dana@example.com');
      expect(text).not.toContain('555');
      expect(text).not.toContain('Saturday');
    }
    expect(mail.body).toContain('12 Maple Ave, Austin');
    expect(mail.body).toContain('$750k - $1M');
  });

  it('escapes visitor text and drops the purple gradient', () => {
    const mail = createLeadNotificationEmail({
      ...base,
      name: '<b>Dana</b>',
      answers: [{ label: 'Reason', value: '<img src=x onerror=alert(1)>' }],
    });
    expect(mail.html).not.toContain('<b>Dana</b>');
    expect(mail.html).not.toContain('<img src=x');
    expect(mail.html).not.toContain('linear-gradient');
    expect(mail.html).not.toContain('border-left');
  });
});
