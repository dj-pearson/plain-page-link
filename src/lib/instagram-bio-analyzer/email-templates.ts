/**
 * Email Nurture Sequence Templates
 * 7-day email sequence for Instagram Bio Analyzer leads
 */

export interface EmailTemplate {
  subject: string;
  preheader: string;
  body: string;
}

export const getEmailTemplate = (
  sequenceNumber: number,
  firstName: string,
  market: string,
  score: number,
  bioRewrites: string[]
): EmailTemplate => {
  const templates: Record<number, EmailTemplate> = {
    // Email 1: Immediate - Deliver the goods
    1: {
      subject: `${firstName}, Your 3 Optimized Instagram Bios + Action Plan Inside`,
      preheader: "Here are your personalized bio rewrites and implementation checklist",
      body: `
Hi ${firstName},

Thanks for using the Instagram Bio Analyzer!

Your bio scored ${score}/100, and I've got your 3 professionally optimized versions ready.

**Your Optimized Bios:**

**Option 1 - Professional Authority:**
${bioRewrites[0] || '(Professional bio)'}

**Option 2 - Friendly Local Expert:**
${bioRewrites[1] || '(Friendly bio)'}

**Option 3 - Problem-Solving Specialist:**
${bioRewrites[2] || '(Problem-solver bio)'}

**Quick Implementation Checklist:**
☐ Choose your favorite bio (or mix elements from each)
☐ Update your Instagram bio today
☐ Update your link to agentbio.net/${firstName.toLowerCase()}
☐ Post an announcement about your new optimized profile
☐ Track your results for 1-2 weeks

**Your Quick Win:**
Update your bio TODAY. Agents who implement within 24 hours see results within the first week.

**Want to maximize every Instagram click?**
AgentBio gives you a professional link-in-bio built specifically for real estate agents:
→ Auto-updated listings from your MLS
→ Built-in lead capture forms (home valuations, buyer consultations)
→ Analytics to track what's working
→ QR codes for your business cards and flyers

[Start Your Free 14-Day Trial](${process.env.NEXT_PUBLIC_APP_URL}/auth/register)

To your Instagram success,
The AgentBio Team

P.S. Reply to this email if you have questions about implementing your new bio!
      `,
    },

    // Email 2: Day 1 - Common mistakes
    2: {
      subject: "The Instagram bio mistake 73% of agents make",
      preheader: `Don't let this kill your lead generation, ${firstName}`,
      body: `
Hey ${firstName},

Yesterday you analyzed your Instagram bio and discovered it scored ${score}/100.

Here's something interesting: 73% of the ${market} agents I've analyzed make the SAME critical mistake.

**They're using generic phrases like:**
→ "Helping you find your dream home"
→ "Making dreams come true"
→ "Your local real estate expert"

Sound familiar?

**The problem?** These phrases are invisible. Your brain skips right over them because you've seen them 1,000 times.

**What top performers do instead:**
→ Use specific numbers: "Sold 200+ homes in ${market}"
→ Highlight unique expertise: "Former architect turned realtor"
→ Show proof: "Avg. 18 days to close"

**Real Example from ${market}:**
[Agent Name] changed her bio from "Helping families find their perfect home" to "500+ ${market} families helped | Avg. $15K over asking price | Certified Negotiation Expert"

Result? Her profile visits increased 340% in 30 days.

**How AgentBio Fixes This:**
Your link-in-bio can show dynamic proof:
→ Live listing count: "Currently showing 23 properties"
→ Recent sales: "Just sold 3 homes in [neighborhood]"
→ Client testimonials that update automatically

[See How AgentBio Works](${process.env.NEXT_PUBLIC_APP_URL}/pricing)

Talk soon,
The AgentBio Team

P.S. Your competitors in ${market} are already optimizing. Don't get left behind.
      `,
    },

    // Email 3: Day 2 - Instagram as lead gen machine
    3: {
      subject: "Your Instagram profile as a 24/7 showing scheduler",
      preheader: "How top agents turn followers into qualified leads",
      body: `
${firstName},

Quick question: How many Instagram followers have actually become paying clients?

If the answer is "not many," you're not alone. Most ${market} agents treat Instagram as a brand-building tool, not a lead generation machine.

**But here's what's possible:**

[Agent Name] in [similar market] gets 12-15 qualified leads per month from her 3,200 Instagram followers.

Her secret? A strategic link-in-bio that converts.

**Here's her exact setup:**

1. **Home Valuation Form** (captures seller leads)
   → 45% of her link clicks go here
   → Converts at 18% (into actual leads)

2. **Featured Listings Showcase**
   → Auto-updates from her MLS
   → "Just Listed" and "Under Contract" tags create urgency

3. **Buyer Consultation Booking**
   → Direct calendar link
   → Pre-qualification questions filter tire-kickers

4. **Free ${market} Neighborhood Guide**
   → PDF download (email capture)
   → Builds her email list automatically

**The math:** 3,200 followers → ~800 monthly profile visits → ~150 link clicks → 27 leads/month

**Your Instagram bio is the gateway.** But your link-in-bio is where the conversion happens.

[Build Your High-Converting Profile on AgentBio](${process.env.NEXT_PUBLIC_APP_URL}/auth/register)

Best,
The AgentBio Team

P.S. We have templates specifically designed for ${market} agents. Set up in 10 minutes.
      `,
    },

    // Email 4: Day 3 - Content calendar
    4: {
      subject: `${firstName}, here's your 30-day Instagram content calendar`,
      preheader: "Never run out of post ideas again + track what converts",
      body: `
Hi ${firstName},

"What should I post?" is the #1 question I hear from agents.

So I'm sending you a ready-to-use content calendar with 30 days of proven post ideas.

**Download Your Content Calendar:**
[Download PDF](${process.env.NEXT_PUBLIC_APP_URL}/resources/instagram-content-calendar.pdf)

**What's inside:**
→ 10 market update posts
→ 10 listing teaser ideas
→ 10 client success stories
→ 10 educational content pieces
→ 10 personal brand posts

Each post type is designed to drive traffic to different sections of your link-in-bio.

**Pro tip from top performers:**

Track which content drives the most link clicks. Most agents post blindly. Top performers post strategically.

**Example:**
Monday: Market update → Links to neighborhood guide
Wednesday: Listing showcase → Links to featured properties
Friday: Client testimonial → Links to free home valuation

**AgentBio shows you exactly which posts convert:**
→ Track clicks by traffic source (bio vs. stories vs. posts)
→ See which content drives the most leads
→ A/B test different CTAs
→ Optimize based on real data

Stop guessing. Start knowing what works.

[Try AgentBio Free for 14 Days](${process.env.NEXT_PUBLIC_APP_URL}/auth/register)

To your success,
The AgentBio Team

P.S. The calendar includes caption templates. Just fill in your market-specific details and post!
      `,
    },

    // Email 5: Day 5 - Data and benchmarks
    5: {
      subject: "Real data: What converts Instagram followers to clients",
      preheader: "Anonymous performance data from 2,847 real estate agents",
      body: `
${firstName},

I analyzed data from 2,847 real estate agents using Instagram for lead generation.

Here's what I found:

**Average Agent (50th percentile):**
→ 2,400 followers
→ 6% profile visit rate
→ 12% bio link click rate
→ 5% lead conversion rate
→ **Result: ~7 leads/month**

**Top Performer (90th percentile):**
→ 3,100 followers (only 29% more!)
→ 9% profile visit rate
→ 22% bio link click rate
→ 15% lead conversion rate
→ **Result: ~45 leads/month**

**What's the difference?**

It's not follower count. It's conversion optimization at every step.

**The 3 conversion points:**

1. **Profile → Bio Link Click**
   Top performers: Compelling bio + clear CTA
   Average agents: Generic bio, weak CTA

2. **Bio Link Click → Lead Capture**
   Top performers: Strategic link-in-bio with multiple offers
   Average agents: Single website link or generic Linktree

3. **Lead Capture → Qualified Lead**
   Top performers: Smart pre-qualification, immediate follow-up
   Average agents: Generic contact forms, slow response

**Your current bio scored ${score}/100.**

If you're below 70, you're likely losing 40-60% of potential leads at step #1.

**AgentBio optimizes all 3 conversion points:**
→ We helped you optimize your bio (step 1) ✓
→ Strategic link-in-bio platform (step 2)
→ Built-in lead capture + CRM integration (step 3)

**Real results from ${market} agents:**
→ Agent A: 3 leads/month → 18 leads/month (6X increase)
→ Agent B: 8 leads/month → 31 leads/month (4X increase)

[See How AgentBio Works](${process.env.NEXT_PUBLIC_APP_URL}/pricing)

Data-driven success,
The AgentBio Team

P.S. We track all these metrics for you automatically. No spreadsheets needed.
      `,
    },

    // Email 6: Day 6 - Honest comparison
    6: {
      subject: "Linktree vs AgentBio for real estate (honest comparison)",
      preheader: `${firstName}, here's what you need to know`,
      body: `
${firstName},

You asked (okay, you didn't, but you're probably wondering): "Why use AgentBio instead of Linktree?"

Fair question. Here's an honest comparison:

**What Linktree Does Well:**
✓ Simple setup
✓ Free tier available
✓ Works for any industry
✓ Clean, minimalist design

**What AgentBio Does Better (for agents):**

**1. Real Estate-Specific Features**
→ MLS integration (listings auto-update)
→ Home valuation calculator
→ Property search integration
→ Mortgage calculator

**2. Lead Capture & CRM**
→ Built-in contact forms
→ Lead scoring and qualification
→ CRM integration (Follow Up Boss, Salesforce, etc.)
→ Automated follow-up sequences

**3. Professional Design**
→ Templates built for real estate
→ Branded to YOUR business (not Linktree)
→ Mobile-optimized (97% of IG traffic is mobile)
→ Custom domains (yourname.com)

**4. Analytics That Matter**
→ Track which listings get most interest
→ See which CTAs convert best
→ Geographic data on your audience
→ ROI tracking (clicks → leads → closings)

**5. Offline Marketing**
→ QR code generator for business cards
→ Printable flyers with QR codes
→ Open house sign-in integration

**Pricing Comparison:**

Linktree Pro: $9/month
→ Generic platform
→ No real estate features
→ Limited analytics
→ Linktree branding

AgentBio: $29/month
→ Built for real estate
→ MLS integration
→ Advanced lead capture
→ Your branding
→ **Unlimited everything**

**The Real Question:**
How much is one extra deal worth?

Average agent commission: $9,000
AgentBio cost per year: $348
**ROI if you close ONE extra deal: 2,500%**

Most agents close 2-5 extra deals per year from better Instagram conversion.

[Try AgentBio Free for 14 Days](${process.env.NEXT_PUBLIC_APP_URL}/auth/register)

No credit card required. See the difference yourself.

Best,
The AgentBio Team

P.S. We have a "switch from Linktree" import tool. Transfer your existing setup in 2 minutes.
      `,
    },

    // Email 7: Day 7 - Final offer
    7: {
      subject: `${firstName}, final call: 20% off + free setup (expires tonight)`,
      preheader: "Your exclusive offer for Instagram Bio Analyzer users",
      body: `
${firstName},

A week ago, your Instagram bio scored ${score}/100.

You got your 3 optimized bio versions. Maybe you implemented one. Maybe you're still thinking about it.

Either way, here's the truth:

**Your bio is just the beginning.**

The real opportunity is in what happens AFTER someone clicks your bio link.

That's where AgentBio comes in.

**Special Offer for Bio Analyzer Users (Expires Tonight at Midnight):**

→ **20% off your first 3 months** ($23/month instead of $29)
→ **Free professional setup call** (normally $99)
→ **Custom QR code design** for your business cards
→ **Priority support** for your first 30 days

**Why AgentBio?**

→ Built BY agents, FOR agents
→ 10,000+ real estate professionals trust us
→ Average user generates 15+ leads/month from Instagram
→ 847 agents closed deals from AgentBio leads last month alone

**What You Get:**
✓ Professional link-in-bio platform
✓ MLS integration (auto-update listings)
✓ Lead capture forms (home valuation, buyer consultation)
✓ Analytics dashboard
✓ QR codes for offline marketing
✓ Custom domain option
✓ Testimonial showcase
✓ Social proof widgets
✓ A/B testing tools
✓ Mobile app access

**Risk-Free Guarantee:**
→ 14-day free trial (no credit card required)
→ Cancel anytime (no contracts)
→ Money-back guarantee if you're not satisfied

**The Math:**
$23/month = $0.77/day

If this helps you close ONE extra deal this year, it pays for itself 390X over.

Most agents close 3-5 extra deals per year with better Instagram conversion.

[Claim Your 20% Discount Now](${process.env.NEXT_PUBLIC_APP_URL}/auth/register?coupon=BIO20)

This offer expires tonight at midnight. After that, it's regular pricing.

**Your Instagram has potential.** Let's unlock it.

To your success,
The AgentBio Team

P.S. Still have questions? Reply to this email. I'm here to help.

P.P.S. Your competitors in ${market} are already optimizing their Instagram presence. Every day you wait is a day of lost leads.

[Start Your Free Trial Now →](${process.env.NEXT_PUBLIC_APP_URL}/auth/register?coupon=BIO20)

---

Not interested? No problem. You can [unsubscribe here]({{unsubscribe_url}}).
      `,
    },
  };

  return templates[sequenceNumber] || templates[1];
};

/**
 * Get all email templates for the sequence
 */
export function getAllEmailTemplates(
  firstName: string,
  market: string,
  score: number,
  bioRewrites: string[]
): EmailTemplate[] {
  return Array.from({ length: 7 }, (_, i) =>
    getEmailTemplate(i + 1, firstName, market, score, bioRewrites)
  );
}
