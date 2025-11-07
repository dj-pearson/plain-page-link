# Internal Linking Strategy - AgentBio

## Overview
Internal linking is crucial for SEO, user experience, and helping search engines understand your site structure. This document outlines the strategic internal linking approach for AgentBio.

## Goals
1. **Distribute Page Authority** - Pass link equity from high-authority pages to important landing pages
2. **Improve Crawlability** - Help search engines discover and index all pages
3. **Enhance User Experience** - Guide users to relevant content and conversion paths
4. **Establish Topic Clusters** - Create semantic relationships between related content
5. **Reduce Bounce Rate** - Keep users engaged with relevant internal links

---

## Site Architecture & Link Hierarchy

### Tier 1: Homepage (Highest Authority)
**Page:** `/`
**Links OUT to:**
- Pricing (`/pricing`) - Primary CTA
- Blog (`/blog`) - Content hub
- Register (`/auth/register`) - Conversion
- Login (`/auth/login`) - User access
- Featured Agent Profiles (3-5 profiles) - Social proof
- Legal pages in footer

**Expected Links IN:** External backlinks, social media, marketing campaigns

---

### Tier 2: Main Service Pages (High Authority)
#### Pricing Page `/pricing`
**Links OUT to:**
- Homepage - Breadcrumb
- Register (`/auth/register`) - Free plan CTA
- Blog articles about pricing/ROI - Context
- Example agent profiles - Social proof

**Expected Links IN:** Homepage, Blog articles, Agent profiles

#### Blog Index `/blog`
**Links OUT to:**
- Homepage - Breadcrumb
- Individual blog posts (10-20 most recent)
- Category archives
- Featured/popular articles

**Expected Links IN:** Homepage, Individual articles, Agent profiles

---

### Tier 3: Content Pages (Medium Authority)

#### Blog Articles `/blog/:slug`
**Links OUT to:**
- Homepage - Breadcrumb
- Blog index - Breadcrumb
- Category page - Breadcrumb
- 3-5 Related articles - Contextual
- Pricing - CTA (when relevant)
- Register - CTA
- Relevant agent profiles - Examples

**Expected Links IN:** Blog index, Other blog articles, Homepage (featured)

#### Agent Profiles `/:slug`
**Links OUT to:**
- Homepage - Breadcrumb
- Pricing - Upgrade CTA
- Blog articles (relevant topics) - Resources
- Other agent profiles (same area/specialty) - Network

**Expected Links IN:** Homepage (featured), Blog articles (examples), Other profiles

---

### Tier 4: Utility Pages (Lower Authority)
#### Legal Pages `/privacy`, `/terms`, `/dmca`, `/acceptable-use`
**Links OUT to:**
- Homepage - Breadcrumb
- Other legal pages - Cross-reference
- Contact/support pages

**Expected Links IN:** Footer sitewide, Registration flow

---

## Link Placement Strategies

### 1. Navigation Links (Global)
**Location:** Header, Footer
**Purpose:** Site-wide accessibility
**Links:**
- Header: Home, Pricing, Blog, Login, Register
- Footer: Privacy, Terms, DMCA, Acceptable Use, Social media

### 2. Breadcrumb Links
**Location:** Top of all pages except homepage
**Purpose:** Navigation hierarchy, schema markup
**Format:** Home > Category > Page

**Implementation:**
```tsx
<Breadcrumbs items={[
  { name: "Blog", href: "/blog" },
  { name: "Article Title", href: "/blog/article-slug" }
]} />
```

### 3. Contextual Content Links
**Location:** Within body content
**Purpose:** User engagement, topic clustering
**Guidelines:**
- Use descriptive anchor text (not "click here")
- Link to relevant, related content
- 3-5 internal links per 1000 words
- Place links naturally in content flow

**Example Anchor Text:**
- ❌ Bad: "Click here for pricing"
- ✅ Good: "Compare our pricing plans"
- ❌ Bad: "Read more"
- ✅ Good: "Learn how to showcase sold properties"

### 4. Related Content Links
**Location:** End of articles, sidebars
**Purpose:** Discovery, engagement
**Format:**
- "You May Also Like" section
- "Related Articles" with thumbnails
- "Similar Profiles" in agent pages

### 5. Call-to-Action (CTA) Links
**Location:** Strategic points in content
**Purpose:** Conversion
**Links:**
- Register/Sign Up
- View Pricing
- Explore Examples
- Contact Us

---

## Content Clusters & Topic Hubs

### Cluster 1: Getting Started
**Hub Page:** Homepage `/`
**Spoke Pages:**
- `/pricing` - Choose a plan
- `/auth/register` - Sign up
- `/blog/how-to-create-agent-portfolio` - Tutorial
- `/blog/real-estate-marketing-tips` - Best practices

### Cluster 2: Real Estate Marketing
**Hub Page:** `/blog` (category: Marketing)
**Spoke Pages:**
- Individual marketing strategy articles
- Case studies from agent profiles
- Pricing page for marketing features
- Agent profiles as examples

### Cluster 3: Lead Generation
**Hub Page:** `/blog` (category: Lead Generation)
**Spoke Pages:**
- Lead capture tutorials
- Form optimization articles
- Analytics guides
- Agent success stories

### Cluster 4: Market Insights
**Hub Page:** `/blog` (category: Market Insights)
**Spoke Pages:**
- Local market analysis
- Trend reports
- Investment guides
- Neighborhood profiles

---

## Link Patterns by Page Type

### Homepage Internal Links
```
├── Primary Nav (Header)
│   ├── Pricing
│   ├── Blog
│   ├── Login
│   └── Register (CTA)
├── Hero CTA → Register
├── Features Section
│   └── Links to feature-specific blog articles
├── Featured Agent Profiles (3-5)
│   └── Links to /:slug profiles
├── Blog Preview Section
│   └── Links to 3-6 recent articles
└── Footer Links
    ├── Legal (Privacy, Terms, DMCA, AUP)
    └── Social Media
```

### Blog Article Internal Links
```
├── Breadcrumbs → Home > Blog > Article
├── Author Link → Author profile or homepage
├── Category Link → Blog category page
├── Inline Contextual Links (3-5)
│   ├── Related blog articles
│   ├── Pricing page (when relevant)
│   └── Example agent profiles
├── CTA Section
│   └── Register or Pricing
└── Related Articles Section (3-5)
    └── Similar topic articles
```

### Agent Profile Internal Links
```
├── Breadcrumbs → Home > Agent Name
├── Upgrade CTA → Pricing page
├── Resources Section
│   └── Links to relevant blog articles
├── Similar Agents
│   └── Links to 3-5 profiles in same area
└── Footer (standard site links)
```

### Pricing Page Internal Links
```
├── Breadcrumbs → Home > Pricing
├── Plan CTAs → Register
├── FAQ Links → Support/blog articles
├── Testimonials → Agent profiles
└── Resources Section
    └── ROI articles, comparison guides
```

---

## Anchor Text Best Practices

### Do's ✅
- Use descriptive, keyword-rich text
- Vary anchor text for same destination
- Make it clear what users will find
- Use natural language
- Include brand name sometimes

### Don'ts ❌
- Don't use "click here" or "read more"
- Don't over-optimize with exact match keywords
- Don't link same text to different pages
- Don't use generic phrases
- Don't use long sentences as anchor text

### Anchor Text Examples

**For Pricing Links:**
- "View our pricing plans"
- "Compare AgentBio subscription options"
- "See pricing and features"
- "Choose your plan"

**For Blog Links:**
- "Real estate marketing strategies"
- "How to generate leads as an agent"
- "Best practices for agent portfolios"
- "Learn more about SEO for realtors"

**For Profile Links:**
- "[Agent Name]'s portfolio"
- "View [City] real estate agents"
- "See example agent profiles"
- "Browse successful agent portfolios"

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Add breadcrumbs to all public pages
- [ ] Update header navigation links
- [ ] Add footer links across all pages
- [ ] Implement homepage → pricing/blog links

### Phase 2: Content Linking (Week 2)
- [ ] Add related articles to blog posts
- [ ] Link blog articles to pricing (where relevant)
- [ ] Add featured profiles to homepage
- [ ] Create category hub pages for blog

### Phase 3: Advanced Linking (Week 3)
- [ ] Add contextual inline links to blog content
- [ ] Link agent profiles to relevant blog articles
- [ ] Create "similar profiles" recommendations
- [ ] Add resource sections to service pages

### Phase 4: Optimization (Week 4)
- [ ] Audit all internal links
- [ ] Fix broken internal links
- [ ] Optimize anchor text
- [ ] Monitor internal link performance

---

## Measurement & Monitoring

### Key Metrics to Track

1. **Internal Link Metrics:**
   - Click-through rate on internal links
   - Most clicked internal links
   - Least clicked internal links
   - Internal link distribution by page

2. **SEO Metrics:**
   - Pages per session (should increase)
   - Bounce rate (should decrease)
   - Average session duration (should increase)
   - Page authority distribution

3. **User Behavior:**
   - Internal search queries
   - Navigation paths
   - Exit pages
   - Conversion paths from internal links

### Tools
- Google Analytics (Behavior Flow, Site Search)
- Google Search Console (Internal Links report)
- Screaming Frog (Internal link audit)
- Ahrefs / SEMrush (Internal linking analysis)

---

## Maintenance Schedule

### Weekly
- Check for broken internal links
- Review new content for linking opportunities
- Update featured/related content links

### Monthly
- Audit top 50 pages for internal link opportunities
- Update anchor text variety
- Refresh related content recommendations
- Review link click analytics

### Quarterly
- Full site internal link audit
- Rebalance link authority distribution
- Update content clusters
- Analyze internal link impact on rankings

---

## Common Internal Linking Mistakes to Avoid

1. **Orphan Pages** - Pages with no internal links pointing to them
2. **Over-Linking** - Too many links on a single page (dilutes authority)
3. **Under-Linking** - Missing opportunities for contextual links
4. **Broken Links** - 404 errors from internal links
5. **Poor Anchor Text** - Generic or non-descriptive link text
6. **Circular Linking** - Links that go nowhere useful
7. **JavaScript Links** - Links that search engines can't follow
8. **Deep Buried Content** - Important pages too many clicks from homepage

---

## Next Steps

1. **Audit Current State**
   - Run Screaming Frog crawl
   - Identify orphan pages
   - Map current link structure

2. **Prioritize Implementation**
   - Start with breadcrumbs (quick win)
   - Add related content sections
   - Build out content clusters

3. **Create Templates**
   - Related posts component
   - Breadcrumb component (✅ Done)
   - CTA link component
   - Resource section component

4. **Monitor & Iterate**
   - Track metrics weekly
   - Adjust based on performance
   - Continuously optimize

---

## Technical Implementation

### React Component Examples

**Related Articles Component:**
```tsx
<section className="related-articles">
  <h2>You May Also Like</h2>
  <div className="grid grid-cols-3 gap-4">
    {relatedArticles.map(article => (
      <Link to={`/blog/${article.slug}`} key={article.id}>
        <img src={article.image} alt={article.title} />
        <h3>{article.title}</h3>
      </Link>
    ))}
  </div>
</section>
```

**Contextual Link Helper:**
```tsx
function InternalLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-primary hover:underline font-medium"
      onClick={() => trackInternalLink(to)}
    >
      {children}
    </Link>
  );
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-07
**Owner:** AgentBio Development Team
