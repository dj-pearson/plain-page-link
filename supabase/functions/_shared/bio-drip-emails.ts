/**
 * The Instagram Bio Analyzer drip, emails 2-7 (US-415).
 *
 * send-bio-analyzer-email writes the subjects into instagram_bio_email_sequences
 * when a visitor captures their results; send-scheduled-bio-emails sends the
 * emails. The subjects used to be typed out in both functions, and the copy
 * lived in the sender. What it said, before this file:
 *
 *   - "73% of the ${market} agents I've analyzed make the SAME critical mistake"
 *   - "Agents get 12-15 qualified leads per month from Instagram"
 *   - "I analyzed data from 2,847 real estate agents" / "~7 leads/month" vs
 *     "~45 leads/month" — the agent count US-159 removed from src/
 *   - "If below 70, you're losing 40-60% of potential leads"
 *   - "AgentBio shows you exactly which posts convert" (it shows link clicks
 *     and which campaign sources became leads; it cannot see a post)
 *   - "Linktree Pro: $9/month", "Average commission: $9,000", "ROI 2,500%"
 *   - "final call: 20% off + free setup (expires tonight)" with coupon BIO20,
 *     which exists in no Stripe account and which /auth/register never reads,
 *     plus a "free professional setup call" nobody was booked to make
 *
 * None of it was measured. The rule in src/config/marketing-claims.ts applies
 * to email as much as to the site: a claim goes out only if someone can point
 * at the thing that makes it true. src/marketing-claims.test.ts scans this
 * file.
 *
 * Callers pass firstName and market already escaped (safeHtmlText) — they are
 * visitor-written.
 */
export const BIO_DRIP_SEQUENCE_NUMBERS = [2, 3, 4, 5, 6, 7] as const;
export type BioDripSequenceNumber = (typeof BIO_DRIP_SEQUENCE_NUMBERS)[number];

/** Days after capture at which each email becomes due. */
export const BIO_DRIP_DAY: Record<BioDripSequenceNumber, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 5,
  6: 6,
  7: 7,
};

export function isBioDripSequenceNumber(n: number): n is BioDripSequenceNumber {
  return (BIO_DRIP_SEQUENCE_NUMBERS as readonly number[]).includes(n);
}

export function bioDripSubject(sequence: BioDripSequenceNumber, firstName: string): string {
  switch (sequence) {
    case 2:
      return 'The Instagram bio mistake that makes agents easy to scroll past';
    case 3:
      return 'Your Instagram profile as a 24/7 showing scheduler';
    case 4:
      return `${firstName}, a month of Instagram post ideas`;
    case 5:
      return 'Where Instagram followers drop off before they contact you';
    case 6:
      return 'Linktree vs AgentBio for real estate (honest comparison)';
    case 7:
      return `${firstName}, what happens after someone taps your bio link`;
  }
}

export interface BioDripEmail {
  subject: string;
  body: string;
  html: string;
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.split('\n').join('<br>')}</p>`)
    .join('\n');
}

function link(href: string, label: string): string {
  return `<p><a href="${href}" style="display:inline-block;background:#6d28d9;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">${label}</a></p>`;
}

/**
 * Builds email `sequence` of the drip. `score` is the visitor's own analyzer
 * score (0-100) — the only number in these emails, and it is theirs.
 */
export function bioDripEmail(
  sequence: BioDripSequenceNumber,
  opts: { firstName: string; market: string; score: number; siteUrl: string }
): BioDripEmail {
  const { firstName, market, score, siteUrl } = opts;
  const register = `${siteUrl}/auth/register`;
  const pricing = `${siteUrl}/pricing`;
  const subject = bioDripSubject(sequence, firstName);

  let text: string;
  let cta: { href: string; label: string };

  switch (sequence) {
    case 2:
      text = `Hey ${firstName},

Yesterday you ran your Instagram bio through the analyzer and it scored ${score}/100.

The most common thing holding a bio back is generic phrasing:
→ "Helping you find your dream home"
→ "Making dreams come true"
→ "Your local real estate expert"

Readers have seen those lines so often that they skip them.

What stands out instead is something specific and true about you:
→ The neighborhoods of ${market} you actually work
→ A niche: first-time buyers, relocation, condos, land
→ A fact a reader could check, such as homes you have sold, in your own real numbers

How AgentBio helps:
Your bio link can open a page that shows your active and sold listings and the reviews clients have left you, so the proof is one tap away instead of crammed into 150 characters.`;
      cta = { href: pricing, label: 'See how AgentBio works' };
      break;

    case 3:
      text = `${firstName},

Quick question: how many of your Instagram followers have become clients?

Most agents treat Instagram as brand-building. A follower who is ready to talk still has to find a way to reach you, and every extra tap loses some of them.

Make the next step obvious:
→ One link in your bio, not a list of ten
→ Your current listings on the page it opens
→ A short form for a home valuation or a buyer consultation
→ A booking link, if you use Calendly, so they can pick a time

That is what an AgentBio page is: one place where a follower can see your listings and get in touch.

Best,
The AgentBio Team`;
      cta = { href: register, label: 'Build your page free' };
      break;

    case 4:
      text = `Hi ${firstName},

"What should I post?" is the question we hear most. Here is a month of ideas you can use as-is:

Week 1: Your market
→ A street or neighborhood in ${market} you love, and why
→ What a typical home in your area looks like right now
→ A local business you recommend

Week 2: Your listings
→ A walkthrough video of a current listing
→ One detail of a home buyers usually miss
→ A "just sold" post, with your client's permission

Week 3: Your process
→ What happens in the first week after you list a home
→ A question a buyer asked you this week, answered
→ A mistake you help sellers avoid

Week 4: You
→ Why you got into real estate
→ A day in your working life
→ A review a client left you

Tip: put a campaign tag on the link in each post. AgentBio's analytics show which campaign sources turned into leads, so you can see which kinds of posts bring people to you.

To your success,
The AgentBio Team`;
      cta = { href: register, label: 'Start free on AgentBio' };
      break;

    case 5:
      text = `${firstName},

Your bio scored ${score}/100. The bio is the first step; here is where followers usually drop off after it:

1. The link goes to a generic page
If your bio link opens a brokerage homepage, the follower has to start searching. Send them to a page about you.

2. There is no way to act
A page with listings but no form or booking link leaves the next step to the visitor. Most will not take it.

3. The page is slow or awkward on a phone
Instagram traffic is almost all mobile. Open your own link on your phone and see how long it takes to reach a listing.

4. Nobody follows up
A form that sends you an email you see two days later loses to the agent who replied in an hour.

AgentBio covers the first three: a mobile page with your listings and lead forms, and an email to you when a lead comes in. The fourth is yours.`;
      cta = { href: pricing, label: 'See how AgentBio works' };
      break;

    case 6:
      text = `${firstName},

Why use AgentBio instead of Linktree?

Linktree is a general link-in-bio tool. It works well for a list of links, and it has no real estate features.

AgentBio is built for agents:
→ Your active and sold listings on your page
→ Lead capture forms for buyers and sellers
→ An open house sign-in kiosk
→ Analytics for page views, link clicks and lead sources

There is a free plan, and you can compare the paid plans at ${pricing}.

The question to ask of either one: if it brings you a single extra client this year, does it pay for itself?

Best,
The AgentBio Team`;
      cta = { href: register, label: 'Create your free page' };
      break;

    case 7:
      text = `${firstName},

A week ago your Instagram bio scored ${score}/100. Hopefully you have tried one of the rewrites.

The bigger opportunity is what happens after someone taps the link in your bio. If it opens a page with your listings and a simple way to reach you, more of those taps become conversations.

That is what AgentBio is for, and you can set it up on the free plan in a few minutes. Upgrade only if it earns its keep.

This is the last email in this series. Reply any time if you have a question.

To your success,
The AgentBio Team`;
      cta = { href: register, label: 'Create your free page' };
      break;
  }

  return {
    subject,
    body: `${text}\n\n${cta.label}: ${cta.href}`,
    html: `${paragraphs(text)}\n${link(cta.href, cta.label)}`,
  };
}
