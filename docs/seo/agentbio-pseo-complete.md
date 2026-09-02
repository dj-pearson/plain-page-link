# AgentBio Programmatic SEO System
## Complete 7-Phase Specification

**Project:** AgentBio.net  
**Purpose:** Generate thousands of high-value, agent-discovery pages targeting real estate search intent across US markets  
**Stack:** React + TypeScript + Supabase + Cloudflare Pages  
**Total Estimated Pages at Full Build-Out:** ~9,550

---

# PHASE 1: TAXONOMY

## Core Principle

AgentBio's pSEO targets people searching for agents — not listings. Every page answers the question: "Who is the right real estate agent for MY specific situation in MY specific place?" The platform's data advantage is the agent profiles themselves: bios, specialties, listings, testimonials, and performance data.

---

## DIMENSION 1: GEOGRAPHY

### D1A — States (50)
Full US state list. Each state has a context object:

```json
{
  "id": "iowa",
  "display": "Iowa",
  "abbreviation": "IA",
  "region": "Midwest",
  "market_character": "affordable, stable, steady appreciation",
  "top_metros": ["Des Moines", "Cedar Rapids", "Iowa City", "Sioux City"],
  "median_home_price": 218000,
  "license_body": "Iowa Real Estate Commission",
  "license_abbreviation": "IREC",
  "avg_days_on_market": 28,
  "notable_trends": "Strong first-time buyer market, low inventory in Des Moines metro"
}
```

### D1B — Metro Areas (150 priority markets)

**Tier 1 — Top 25 Markets (highest agent density + search volume)**
```
New York City, NY | Los Angeles, CA | Chicago, IL | Houston, TX | Phoenix, AZ |
Philadelphia, PA | San Antonio, TX | San Diego, CA | Dallas, TX | San Jose, CA |
Austin, TX | Jacksonville, FL | Fort Worth, TX | Columbus, OH | Charlotte, NC |
Indianapolis, IN | San Francisco, CA | Seattle, WA | Denver, CO | Nashville, TN |
Oklahoma City, OK | El Paso, TX | Washington, DC | Las Vegas, NV | Louisville, KY
```

**Tier 2 — Markets 26–75 (medium agent density)**
```
Memphis, TN | Portland, OR | Baltimore, MD | Milwaukee, WI | Albuquerque, NM |
Tucson, AZ | Fresno, CA | Sacramento, CA | Mesa, AZ | Kansas City, MO |
Atlanta, GA | Omaha, NE | Colorado Springs, CO | Raleigh, NC | Minneapolis, MN |
Cleveland, OH | Wichita, KS | Arlington, TX | New Orleans, LA | Bakersfield, CA |
Tampa, FL | Honolulu, HI | Anaheim, CA | Aurora, CO | Santa Ana, CA |
Corpus Christi, TX | Riverside, CA | Lexington, KY | Pittsburgh, PA | Stockton, CA |
St. Louis, MO | Cincinnati, OH | Salt Lake City, UT | Orlando, FL | Greensboro, NC |
Virginia Beach, VA | Boise, ID | Chandler, AZ | Madison, WI | Durham, NC |
Buffalo, NY | North Las Vegas, NV | Plano, TX | Richmond, VA | Laredo, TX |
Scottsdale, AZ | Baton Rouge, LA | Fremont, CA | Providence, RI | Rochester, NY
```

**Tier 3 — Markets 76–150 (emerging/long-tail)**
```
Spokane, WA | Glendale, AZ | Des Moines, IA | Montgomery, AL | Tacoma, WA |
Akron, OH | Little Rock, AR | Augusta, GA | Grand Rapids, MI | Huntsville, AL |
Columbus, GA | Tallahassee, FL | Glendale, CA | Oxnard, CA | Knoxville, TN |
Chattanooga, TN | Worcester, MA | Fort Wayne, IN | Fayetteville, NC | Jackson, MS |
Huntington Beach, CA | Tempe, AZ | Moreno Valley, CA | Oceanside, CA | Shreveport, LA |
Salt Lake City, UT | Garden Grove, CA | Pembroke Pines, FL | Eugene, OR | Cary, NC |
Fort Collins, CO | Savannah, GA | Peoria, IL | Springfield, MO | Surprise, AZ |
Overland Park, KS | Santa Clarita, CA | Clarksville, TN | Alexandria, VA | Roseville, CA |
Ontario, CA | Macon, GA | Hampton, VA | Mesquite, TX | Pasadena, TX |
Sunnyvale, CA | Escondido, CA | Kansas City, KS | Torrance, CA | Pomona, CA
```

**Metro context object:**
```json
{
  "id": "austin-tx",
  "display": "Austin",
  "state": "TX",
  "state_display": "Texas",
  "metro_display": "Austin, TX",
  "region": "South",
  "tier": 1,
  "market_character": "tech-driven, high appreciation, competitive bidding",
  "median_home_price": 540000,
  "yoy_appreciation": 0.042,
  "avg_days_on_market": 19,
  "buyer_demand": "high",
  "inventory_level": "low",
  "notable_neighborhoods": ["South Congress", "East Austin", "Mueller", "Domain"],
  "agent_density": "high",
  "primary_buyer_profile": "tech workers, transplants from CA/NY, first-time buyers priced out of CA",
  "notable_trends": "Out-of-state buyers common, cash offers competitive, new construction active"
}
```

### D1C — Neighborhoods / Submarkets (500 priority)

Top 5 neighborhoods per top 100 cities. Used for hyper-local long-tail pages.

**Neighborhood context object:**
```json
{
  "id": "south-congress-austin-tx",
  "display": "South Congress",
  "city": "austin-tx",
  "character": "walkable, eclectic, mix of bungalows and new condos",
  "median_price": 680000,
  "primary_property_type": "single-family and condo",
  "buyer_profile": "young professionals, creatives, first-time buyers with budget",
  "walkability": "high",
  "school_district": "Austin ISD",
  "avg_sqft_price": 420
}
```

---

## DIMENSION 2: AGENT SPECIALTY

Ten specialty values with full context objects:

```json
[
  {
    "id": "luxury",
    "display": "Luxury",
    "search_aliases": ["high-end", "luxury homes", "estate", "million dollar"],
    "typical_price_floor": 800000,
    "buyer_mindset": "discretion, white-glove service, off-market access",
    "agent_signals": ["Certified Luxury Home Marketing Specialist", "CLHMS", "Guild member", "high average sale price"],
    "search_volume_tier": "high",
    "context": "Buyers and sellers of luxury properties prioritize agent discretion, market relationships, and proven track records at higher price points. They want agents who understand staging, privacy, and negotiating complex transactions."
  },
  {
    "id": "first-time-buyer",
    "display": "First-Time Buyer",
    "search_aliases": ["first home", "first-time homebuyer", "FTB", "new buyer"],
    "typical_price_floor": 0,
    "buyer_mindset": "education, patience, handholding through process",
    "agent_signals": ["specializes in first-time buyers", "patient", "explains process", "down payment assistance knowledge"],
    "search_volume_tier": "high",
    "context": "First-time buyers need agents who slow down, explain every step, know loan programs like FHA and down payment assistance grants, and don't make them feel rushed or pressured."
  },
  {
    "id": "investment",
    "display": "Real Estate Investment",
    "search_aliases": ["investment property", "rental property", "investor", "ROI", "cap rate"],
    "typical_price_floor": 0,
    "buyer_mindset": "ROI-focused, analytical, portfolio thinking",
    "agent_signals": ["investor network", "cap rate analysis", "knows rental markets", "multi-family experience"],
    "search_volume_tier": "high",
    "context": "Real estate investors want agents who speak their language — cap rates, cash-on-cash return, NOI, 1031 exchanges. They need agents with investor networks who can surface off-market deals and analyze properties financially."
  },
  {
    "id": "relocation",
    "display": "Relocation",
    "search_aliases": ["relocating", "moving to", "relo", "corporate relocation", "moving from out of state"],
    "typical_price_floor": 0,
    "buyer_mindset": "unfamiliar with market, needs local expertise, time-constrained",
    "agent_signals": ["relocation specialist", "works with out-of-state buyers", "virtual tours", "neighborhood guidance"],
    "search_volume_tier": "medium",
    "context": "Relocation buyers are often making purchasing decisions without being able to visit multiple times. They need agents who can act as local experts, provide neighborhood comparisons, and facilitate virtual showings."
  },
  {
    "id": "military",
    "display": "Military & VA",
    "search_aliases": ["VA loan", "military relocation", "PCS", "veterans", "active duty"],
    "typical_price_floor": 0,
    "buyer_mindset": "VA loan process, PCS timeline, BAH-conscious",
    "agent_signals": ["Military Relocation Professional", "MRP", "VA loan expert", "knows PCS timelines"],
    "search_volume_tier": "medium",
    "context": "Military buyers using VA loans need agents who understand the VA appraisal process, MPRs (minimum property requirements), and the urgency of PCS orders. They benefit from agents with MRP certification who've closed many VA transactions."
  },
  {
    "id": "new-construction",
    "display": "New Construction",
    "search_aliases": ["new build", "builder", "new homes", "construction", "custom home"],
    "typical_price_floor": 0,
    "buyer_mindset": "navigating builder contracts, upgrade decisions, timeline risk",
    "agent_signals": ["builder contract experience", "represents buyers against builders", "knows upgrade ROI"],
    "search_volume_tier": "medium",
    "context": "New construction buyers need agents who understand builder contracts (which heavily favor builders), upgrade ROI, construction timelines, and how to negotiate incentives. A builder's sales agent represents the builder, not the buyer."
  },
  {
    "id": "senior",
    "display": "Senior & Downsizing",
    "search_aliases": ["55+", "senior living", "downsizing", "retirement", "empty nester"],
    "typical_price_floor": 0,
    "buyer_mindset": "simplified life, accessibility needs, senior communities",
    "agent_signals": ["SRES certification", "Senior Real Estate Specialist", "55+ community knowledge"],
    "search_volume_tier": "medium",
    "context": "Seniors and downsizers need patient agents familiar with active adult communities, accessibility features, and the emotional complexity of leaving a long-time family home. SRES-certified agents have specific training for this life stage."
  },
  {
    "id": "commercial",
    "display": "Commercial",
    "search_aliases": ["commercial real estate", "office space", "retail", "industrial", "CRE"],
    "typical_price_floor": 0,
    "buyer_mindset": "business-focused, lease vs. buy analysis, location analytics",
    "agent_signals": ["CCIM", "commercial experience", "lease analysis", "business district knowledge"],
    "search_volume_tier": "low",
    "context": "Commercial real estate requires different expertise than residential — zoning knowledge, lease structure, cap rate analysis, and business location analytics. Look for agents with CCIM designation or significant commercial transaction history."
  },
  {
    "id": "vacation-second-home",
    "display": "Vacation & Second Home",
    "search_aliases": ["vacation home", "second home", "beach house", "lake house", "cabin"],
    "typical_price_floor": 0,
    "buyer_mindset": "lifestyle purchase, rental income potential, seasonal market knowledge",
    "agent_signals": ["vacation market knowledge", "short-term rental rules", "seasonal pricing"],
    "search_volume_tier": "low",
    "context": "Vacation and second home buyers need agents who understand seasonal markets, HOA rental restrictions, Airbnb zoning regulations, and the unique financing rules for non-primary residences."
  },
  {
    "id": "land",
    "display": "Land & Lots",
    "search_aliases": ["land", "lot", "acreage", "build site", "raw land"],
    "typical_price_floor": 0,
    "buyer_mindset": "buildable, utilities, zoning, access",
    "agent_signals": ["land specialist", "knows zoning", "survey experience", "utilities knowledge"],
    "search_volume_tier": "low",
    "context": "Land transactions require specialized knowledge of zoning ordinances, utility availability, soil tests, easements, and survey requirements. Most residential agents rarely close land deals — seek agents who actively specialize in land."
  }
]
```

---

## DIMENSION 3: PROPERTY TYPE

```json
[
  {
    "id": "single-family",
    "display": "Single-Family Home",
    "search_aliases": ["house", "home", "SFR", "single family"],
    "search_volume_tier": "high",
    "context": "The most common property type. Agents who specialize in single-family homes know neighborhood comparables, school district impacts, and the full spectrum from starter homes to move-up properties."
  },
  {
    "id": "condo-townhome",
    "display": "Condo & Townhome",
    "search_aliases": ["condo", "condominium", "townhouse", "townhome", "HOA"],
    "search_volume_tier": "high",
    "context": "Condos and townhomes have unique considerations: HOA financials, reserve funds, rental restrictions, and special assessment risk. Agents experienced in attached housing know how to review governing documents and identify HOA red flags."
  },
  {
    "id": "multi-family",
    "display": "Multi-Family",
    "search_aliases": ["duplex", "triplex", "fourplex", "apartment building", "multi-unit"],
    "search_volume_tier": "medium",
    "context": "Multi-family properties require analysis of rental income, occupancy rates, and expense ratios. Agents who specialize here understand the intersection of residential and investment real estate."
  },
  {
    "id": "new-construction-homes",
    "display": "New Construction Homes",
    "search_aliases": ["new home", "new build", "builder home", "new construction"],
    "search_volume_tier": "medium",
    "context": "Newly built homes involve builder contracts, construction phase inspections, and upgrade selections. Buyers benefit enormously from having their own agent rather than relying on the builder's sales staff."
  },
  {
    "id": "land-lots",
    "display": "Land & Lots",
    "search_aliases": ["land", "lot", "acreage", "raw land", "build site"],
    "search_volume_tier": "low",
    "context": "Land purchases involve zoning, utilities, access rights, and survey issues that most residential agents rarely encounter. A land specialist is worth the extra research to find."
  },
  {
    "id": "luxury-homes",
    "display": "Luxury Homes",
    "search_aliases": ["luxury home", "estate", "mansion", "high-end home"],
    "search_volume_tier": "medium",
    "context": "Luxury properties ($1M+) have different marketing, negotiation, and privacy requirements than typical residential transactions. Top luxury agents maintain discreet networks and proven track records at upper price points."
  }
]
```

---

## DIMENSION 4: TRANSACTION SIDE

```json
[
  {
    "id": "buyers-agent",
    "display": "Buyer's Agent",
    "search_aliases": ["buyer's agent", "buyers agent", "agent for buyers", "help buying a home"],
    "search_volume_tier": "high",
    "context": "A buyer's agent represents your interests exclusively in a purchase. They help identify properties, structure offers, negotiate terms, and guide you through inspection and closing. Since August 2024 NAR settlement changes, buyer's agent compensation is now negotiated separately."
  },
  {
    "id": "listing-agent",
    "display": "Listing Agent",
    "search_aliases": ["listing agent", "seller's agent", "agent to sell my home", "sell my house"],
    "search_volume_tier": "high",
    "context": "A listing agent represents sellers, handling pricing strategy, marketing, showings, offer negotiation, and transaction management. Their goal is to net you the most money in the least time with the fewest complications."
  }
]
```

---

## DIMENSION 5: LIFE SITUATION

```json
[
  {
    "id": "divorce",
    "display": "Divorce",
    "search_aliases": ["divorce real estate", "selling home in divorce", "dividing property", "divorce agent"],
    "search_volume_tier": "medium",
    "context": "Divorce real estate requires neutrality, discretion, and experience with court-ordered sales. Some agents hold the Real Estate Collaboration Specialist - Divorce (RCS-D) certification. The right agent helps both parties move forward without exacerbating conflict."
  },
  {
    "id": "estate-probate",
    "display": "Estate & Probate",
    "search_aliases": ["estate sale", "probate", "inherited home", "selling parents house", "executor"],
    "search_volume_tier": "medium",
    "context": "Selling an estate or inherited property involves probate law, court timelines, and often properties in need of updating. Probate specialists understand the legal process and can connect clients with estate attorneys, cleanout services, and as-is buyers."
  },
  {
    "id": "upsizing",
    "display": "Upsizing",
    "search_aliases": ["moving to bigger home", "need more space", "growing family", "bigger house"],
    "search_volume_tier": "low",
    "context": "Upsizing buyers are often simultaneously selling their current home — timing the sale and purchase is the primary challenge. Experienced agents coordinate both sides or build contingency protections that protect the buyer."
  },
  {
    "id": "downsizing",
    "display": "Downsizing",
    "search_aliases": ["downsizing", "smaller home", "empty nest", "retire", "right-sizing"],
    "search_volume_tier": "medium",
    "context": "Downsizers are often 55+ with equity-rich current homes, moving to smaller spaces or active adult communities. The emotional complexity of leaving a long-time home is real — patient, experienced agents make the transition smoother."
  },
  {
    "id": "foreclosure-short-sale",
    "display": "Foreclosure & Short Sale",
    "search_aliases": ["foreclosure", "short sale", "distressed property", "REO", "bank-owned"],
    "search_volume_tier": "low",
    "context": "Distressed property transactions have unique timelines, as-is conditions, and lender approval requirements. Agents who regularly work foreclosures and short sales navigate these complexities efficiently and set realistic expectations."
  },
  {
    "id": "new-to-area",
    "display": "New to the Area",
    "search_aliases": ["moving to", "new to area", "relocating to", "just moved", "unfamiliar with"],
    "search_volume_tier": "medium",
    "context": "Buyers new to a market rely entirely on their agent for neighborhood guidance, commute analysis, and local knowledge. The best agents for newcomers proactively provide neighborhood tours, school information, and community context — not just property details."
  }
]
```

---

## COMBINATION MATRIX & PRIORITIZATION

### Tier 1 Combinations (generate first — highest search volume)
| Pattern | Example | Estimated Pages | Priority |
|---------|---------|-----------------|----------|
| City + Directory | "Real estate agents in Austin, TX" | 150 | 1 |
| City + Buyers Agent | "Buyer's agents in Austin, TX" | 150 | 1 |
| City + Listing Agent | "Best listing agents in Austin, TX" | 150 | 1 |
| City + Luxury | "Luxury real estate agents in Austin, TX" | 100 | 1 |
| City + First-Time Buyer | "First-time buyer agents in Austin, TX" | 100 | 1 |
| City + Investment | "Investment property agents in Austin, TX" | 100 | 1 |
| State + Directory | "Real estate agents in Texas" | 50 | 1 |

**Tier 1 Total: ~800 pages**

### Tier 2 Combinations (generate weeks 3–4)
| Pattern | Example | Estimated Pages | Priority |
|---------|---------|-----------------|----------|
| City + Relocation | "Relocation agents in Austin, TX" | 100 | 2 |
| City + Military/VA | "VA loan agents in Austin, TX" | 80 | 2 |
| City + New Construction | "New construction agents in Austin, TX" | 100 | 2 |
| City + Senior | "Senior real estate agents in Austin, TX" | 100 | 2 |
| City + Condo | "Condo agents in Austin, TX" | 100 | 2 |
| City + Multi-Family | "Multi-family agents in Austin, TX" | 80 | 2 |
| City + Divorce | "Divorce real estate agents in Austin, TX" | 80 | 2 |

**Tier 2 Total: ~640 pages**

### Tier 3 Combinations (generate weeks 5–6)
| Pattern | Example | Estimated Pages | Priority |
|---------|---------|-----------------|----------|
| Neighborhood + Directory | "Real estate agents in South Congress, Austin" | 500 | 3 |
| City + Estate/Probate | "Probate real estate agents in Austin, TX" | 80 | 3 |
| City + Luxury + Condo | "Luxury condo agents in Austin, TX" | 60 | 3 |
| City + Investment + Multi-Family | "Multi-family investment agents in Austin, TX" | 60 | 3 |
| City + Downsizing | "Downsizing agents in Austin, TX" | 80 | 3 |
| State + Specialty | "Luxury real estate agents in Texas" | 250 | 3 |
| City + Land | "Land specialists in Austin, TX" | 80 | 3 |

**Tier 3 Total: ~1,110 pages**

### Tier 4 (long-tail, generate month 2+)
- City + Specialty + Property Type combos: ~3,000 pages
- Neighborhood + Specialty: ~2,000 pages
- State + Specialty + City comparisons: ~500 pages

**Grand Total at Full Build-Out: ~9,550 pages**

---

# PHASE 2: PAGE TYPE DEFINITIONS

---

## PAGE_TYPE_01: city-directory

```
PAGE_TYPE_ID: city-directory
DISPLAY_NAME: City Agent Directory
URL_PATTERN: /real-estate-agents/[state-slug]/[city-slug]
EXAMPLE_URL: /real-estate-agents/texas/austin

TITLE_TEMPLATE: "Real Estate Agents in [City], [State] — Find Local [State Abbreviation] Agents"
EXAMPLE_TITLE: "Real Estate Agents in Austin, TX — Find Local TX Agents"

META_DESCRIPTION_TEMPLATE: "Find the best real estate agents in [City], [State]. Browse [agent_count]+ verified profiles with reviews, listings, and specialties. [AI-FILL: market-specific hook, max 80 chars]."

TARGET_QUERY_PATTERN:
  - "real estate agents in [city]"
  - "best realtors in [city]"
  - "[city] real estate agent"
  - "find a realtor in [city] [state]"

SEARCH_VOLUME_TIER: high

DATA_SOURCES:
  - profiles (WHERE city = [city] AND state = [state] AND is_published = true)
  - listings (JOIN profiles, WHERE status = 'active', grouped by agent)
  - testimonials (JOIN profiles, aggregate rating)
  - user_subscriptions (for sorting paid agents to top)

MINIMUM_DATA_THRESHOLD: 5 published agent profiles in this city

COMPONENT_NAME: CityDirectoryPage

INTERACTIVE_FEATURES:
  - specialty filter (dropdown)
  - transaction type filter (buyer/seller)
  - sort by (most reviewed, newest, most listings)
  - map view toggle (Mapbox, agent office locations)
  - language filter (for markets with significant non-English populations)

INTERNAL_LINKS_TO:
  - city-buyers-agent (this city)
  - city-listing-agent (this city)
  - city-specialty pages (this city, all specialties present)
  - state-directory (parent state)
  - neighborhood-directory (all neighborhoods in this city)

SCHEMA_MARKUP: ItemList (agents as ListItem with Person schema)

FRESHNESS_SIGNAL: yes — regenerate when agent count changes ±10% or monthly
FRESHNESS_DAYS: 30

USEFUL_WITHOUT_SEARCH: Yes. A visitor who bookmarks this page can return when they're ready to choose an agent. The directory serves as a comparison tool with real profile data, reviews, and active listings — not a thin list of names.
```

---

## PAGE_TYPE_02: city-specialty

```
PAGE_TYPE_ID: city-specialty
DISPLAY_NAME: City + Specialty Agent Directory
URL_PATTERN: /real-estate-agents/[state-slug]/[city-slug]/[specialty-slug]
EXAMPLE_URL: /real-estate-agents/texas/austin/luxury

TITLE_TEMPLATE: "Best [Specialty Display] Real Estate Agents in [City], [State] ([Current Year])"
EXAMPLE_TITLE: "Best Luxury Real Estate Agents in Austin, TX (2026)"

META_DESCRIPTION_TEMPLATE: "Compare [agent_count] [specialty] real estate agents in [City], [State]. [AI-FILL: specialty-specific value prop + city market context, max 100 chars]."

TARGET_QUERY_PATTERN:
  - "best [specialty] real estate agent in [city]"
  - "[specialty] realtor [city] [state]"
  - "find [specialty] agent [city]"
  - "[city] [specialty] real estate"

SEARCH_VOLUME_TIER: high (luxury, first-time buyer, investment) / medium (others)

DATA_SOURCES:
  - profiles WHERE specialty CONTAINS [specialty-id] AND city = [city]
  - listings WHERE profiles.city = [city] (for agent's active listings count)
  - testimonials (aggregate rating per agent)

MINIMUM_DATA_THRESHOLD: 3 agents with this specialty in this city

COMPONENT_NAME: CitySpecialtyPage

INTERACTIVE_FEATURES:
  - agent card grid with specialty badge
  - sort by (rating, listings count, years experience)
  - specialty explainer accordion (what to look for in a [specialty] agent)
  - lead capture: "Not sure which agent is right? Get matched." form

INTERNAL_LINKS_TO:
  - city-directory (parent)
  - city-buyers-agent or city-listing-agent (related transaction type)
  - city-property-type (related property types)
  - other city-specialty pages (cross-specialty discovery)
  - state-directory (parent)

SCHEMA_MARKUP: ItemList + FAQPage

FRESHNESS_SIGNAL: yes — monthly or when specialty agent count changes
FRESHNESS_DAYS: 30

USEFUL_WITHOUT_SEARCH: Yes. Specialty pages answer a specific research question ("What should I look for in a luxury agent? Who are the top options in Austin?") with direct comparison of real agent profiles.
```

---

## PAGE_TYPE_03: city-buyers-agent

```
PAGE_TYPE_ID: city-buyers-agent
DISPLAY_NAME: City Buyer's Agent Directory
URL_PATTERN: /buyers-agents/[state-slug]/[city-slug]
EXAMPLE_URL: /buyers-agents/texas/austin

TITLE_TEMPLATE: "Best Buyer's Agents in [City], [State] — Top [State Abbr] Buyer's Agents"
EXAMPLE_TITLE: "Best Buyer's Agents in Austin, TX — Top TX Buyer's Agents"

META_DESCRIPTION_TEMPLATE: "Find a buyer's agent in [City], [State] who represents YOUR interests. Compare [agent_count] agents. [AI-FILL: market-specific buyer challenge in this city, max 90 chars]."

TARGET_QUERY_PATTERN:
  - "buyer's agent in [city]"
  - "buyers agent [city] [state]"
  - "agent to help me buy a home in [city]"
  - "best buyer's agent [city]"

SEARCH_VOLUME_TIER: high

DATA_SOURCES:
  - profiles WHERE represents_buyers = true AND city = [city]
  - listings WHERE transaction_side = 'buyer' (represented buyer transactions)
  - testimonials WHERE service_type LIKE '%bought%'

MINIMUM_DATA_THRESHOLD: 5 buyer-side agents in this city

COMPONENT_NAME: CityBuyersAgentPage

INTERACTIVE_FEATURES:
  - buyer's agent explainer (what buyer's agent does, post-NAR settlement context)
  - agent comparison tool (side-by-side up to 3 agents)
  - lead form: "Tell us what you're looking for — get matched to a buyer's agent"
  - FAQ accordion (buyer's agent cost, NAR settlement, fiduciary duty)

INTERNAL_LINKS_TO:
  - city-directory (sibling)
  - city-listing-agent (sibling)
  - city-specialty pages
  - city-first-time-buyer (child specialty)
  - city-luxury buyers agent (child specialty + transaction)

SCHEMA_MARKUP: ItemList + FAQPage

FRESHNESS_SIGNAL: yes — monthly
FRESHNESS_DAYS: 30

USEFUL_WITHOUT_SEARCH: Yes. Especially valuable post-NAR settlement (August 2024) when buyers must now sign representation agreements before touring — educating buyers on what buyer's agents do and how to choose one has significant standalone value.
```

---

## PAGE_TYPE_04: city-listing-agent

```
PAGE_TYPE_ID: city-listing-agent
DISPLAY_NAME: City Listing Agent Directory
URL_PATTERN: /listing-agents/[state-slug]/[city-slug]
EXAMPLE_URL: /listing-agents/texas/austin

TITLE_TEMPLATE: "Best Listing Agents in [City], [State] — Top [State Abbr] Seller's Agents ([Year])"
EXAMPLE_TITLE: "Best Listing Agents in Austin, TX — Top TX Seller's Agents (2026)"

META_DESCRIPTION_TEMPLATE: "Compare top listing agents in [City], [State] by homes sold, reviews, and average sale price. [AI-FILL: seller-specific market context for this city, max 90 chars]."

TARGET_QUERY_PATTERN:
  - "best listing agent in [city]"
  - "top seller's agent [city] [state]"
  - "agent to sell my home in [city]"
  - "how to find a listing agent in [city]"

SEARCH_VOLUME_TIER: high

DATA_SOURCES:
  - profiles WHERE represents_sellers = true AND city = [city]
  - listings WHERE status IN ('sold', 'active') grouped by agent (for sold history)
  - testimonials WHERE service_type LIKE '%sold%'
  - listings.sold_price, listings.list_price (for list-to-sale ratio)

MINIMUM_DATA_THRESHOLD: 5 listing-focused agents in this city

COMPONENT_NAME: CityListingAgentPage

INTERACTIVE_FEATURES:
  - seller readiness checklist (interactive, downloadable)
  - market snapshot widget (median days on market, median price from Supabase data)
  - home valuation CTA (prominent, connects to agent contact)
  - agent sold history cards

INTERNAL_LINKS_TO:
  - city-directory (sibling)
  - city-buyers-agent (sibling)
  - city-specialty (luxury listing, divorce listing)
  - state-directory (parent)

SCHEMA_MARKUP: ItemList + FAQPage

FRESHNESS_SIGNAL: yes — monthly (market conditions change)
FRESHNESS_DAYS: 30

USEFUL_WITHOUT_SEARCH: Yes. Sellers researching listing agents will bookmark this for agent comparison research, especially the market snapshot data showing current market conditions.
```

---

## PAGE_TYPE_05: state-directory

```
PAGE_TYPE_ID: state-directory
DISPLAY_NAME: State Agent Directory
URL_PATTERN: /real-estate-agents/[state-slug]
EXAMPLE_URL: /real-estate-agents/texas

TITLE_TEMPLATE: "Real Estate Agents in [State] — Find [State] Realtors by City"
EXAMPLE_TITLE: "Real Estate Agents in Texas — Find TX Realtors by City"

META_DESCRIPTION_TEMPLATE: "Browse real estate agents across [State]. Find agents in [top 3 cities by agent count] and [X] other cities. [AI-FILL: state market overview sentence, max 80 chars]."

TARGET_QUERY_PATTERN:
  - "real estate agents in [state]"
  - "[state] realtors"
  - "find a realtor in [state]"
  - "[state] real estate agent"

SEARCH_VOLUME_TIER: medium (lower than city, higher than neighborhood)

DATA_SOURCES:
  - profiles WHERE state = [state] (aggregated by city)
  - cities within state (grouped counts)
  - state context object (from taxonomy)

MINIMUM_DATA_THRESHOLD: 10 published profiles across at least 3 cities in this state

COMPONENT_NAME: StateDirectoryPage

INTERACTIVE_FEATURES:
  - city browser grid (with agent count per city)
  - state market stats widget
  - specialty filter (state-wide specialty leaders)
  - map with city pins (Mapbox, agent density heat)

INTERNAL_LINKS_TO:
  - all city-directory pages within state
  - top 5 city-specialty pages (most searched combos)

SCHEMA_MARKUP: ItemList + BreadcrumbList

FRESHNESS_SIGNAL: yes — monthly
FRESHNESS_DAYS: 30

USEFUL_WITHOUT_SEARCH: Yes. A hub page that helps people understand the real estate landscape in a state before narrowing to a specific city. Useful for people considering multiple markets or recently relocated.
```

---

## PAGE_TYPE_06: neighborhood-directory

```
PAGE_TYPE_ID: neighborhood-directory
DISPLAY_NAME: Neighborhood Agent Directory
URL_PATTERN: /real-estate-agents/[state-slug]/[city-slug]/[neighborhood-slug]
EXAMPLE_URL: /real-estate-agents/texas/austin/south-congress

TITLE_TEMPLATE: "Real Estate Agents in [Neighborhood], [City] — Local [City] Neighborhood Experts"
EXAMPLE_TITLE: "Real Estate Agents in South Congress, Austin — Local Austin Neighborhood Experts"

META_DESCRIPTION_TEMPLATE: "Find real estate agents who specialize in [Neighborhood], [City]. [AI-FILL: neighborhood character + what makes local expertise valuable here, max 110 chars]."

TARGET_QUERY_PATTERN:
  - "real estate agent in [neighborhood] [city]"
  - "[neighborhood] realtor"
  - "[neighborhood] [city] real estate"
  - "agent who knows [neighborhood]"

SEARCH_VOLUME_TIER: long-tail

DATA_SOURCES:
  - profiles WHERE service_neighborhoods CONTAINS [neighborhood-id]
  - listings WHERE city = [city] AND neighborhood = [neighborhood] (for market data)
  - neighborhood context object

MINIMUM_DATA_THRESHOLD: 2 agents serving this neighborhood

COMPONENT_NAME: NeighborhoodDirectoryPage

INTERACTIVE_FEATURES:
  - neighborhood snapshot (median price, avg DOM, property types from listing data)
  - small map centered on neighborhood
  - agent cards with neighborhood-specific listing history

INTERNAL_LINKS_TO:
  - city-directory (parent)
  - nearby neighborhood pages
  - city-specialty pages

SCHEMA_MARKUP: ItemList + BreadcrumbList

FRESHNESS_SIGNAL: yes — monthly
FRESHNESS_DAYS: 30

USEFUL_WITHOUT_SEARCH: Yes. Hyper-local neighborhood pages are bookmarked by buyers researching specific areas they want to live in. They provide market data and agent expertise specific to that neighborhood.
```

---

## PAGE_TYPE_07: city-situation

```
PAGE_TYPE_ID: city-situation
DISPLAY_NAME: City Life Situation Agent Directory  
URL_PATTERN: /real-estate-agents/[state-slug]/[city-slug]/[situation-slug]
EXAMPLE_URL: /real-estate-agents/texas/austin/divorce

TITLE_TEMPLATE: "Real Estate Agents for [Situation Display] in [City], [State] ([Year])"
EXAMPLE_TITLE: "Real Estate Agents for Divorce in Austin, TX (2026)"

META_DESCRIPTION_TEMPLATE: "Find [city] real estate agents experienced with [situation]. [AI-FILL: situation-specific empathy + agent value prop, max 115 chars]."

TARGET_QUERY_PATTERN:
  - "[situation] real estate agent [city]"
  - "real estate agent for [situation] in [city]"
  - "[city] realtor [situation]"

SEARCH_VOLUME_TIER: medium

DATA_SOURCES:
  - profiles WHERE specialties CONTAINS [situation-id] AND city = [city]
  - testimonials WHERE content MENTIONS [situation keywords] (soft match)

MINIMUM_DATA_THRESHOLD: 2 agents with this situation specialty in this city

COMPONENT_NAME: CitySituationPage

INTERACTIVE_FEATURES:
  - situation explainer (what to expect, what to look for in an agent)
  - checklist download (e.g., "Divorce Real Estate Checklist")
  - agent contact form with situation-specific fields
  - FAQ accordion (situation-specific questions)

INTERNAL_LINKS_TO:
  - city-directory (parent)
  - city-specialty (related specialties)
  - related situation pages

SCHEMA_MARKUP: FAQPage + ItemList

FRESHNESS_SIGNAL: low — situation pages are evergreen
FRESHNESS_DAYS: 90

USEFUL_WITHOUT_SEARCH: Yes. People navigating difficult life situations actively research their options. A comprehensive guide on what to look for in an agent for divorce, probate, or military relocation has significant standalone value regardless of search engine discovery.
```

---

# PHASE 3: JSON SCHEMAS

---

## Schema 01: CityDirectorySchema

```typescript
interface CityDirectorySchema {
  meta: {
    page_type: "city-directory";              // DETERMINISTIC
    generated_at: string;                      // DETERMINISTIC — ISO timestamp
    source_record_ids: string[];               // FROM-DB — profile UUIDs included
    combination: {
      city: string;                            // DETERMINISTIC — e.g., "Austin"
      state: string;                           // DETERMINISTIC — e.g., "Texas"
      state_abbr: string;                      // DETERMINISTIC — e.g., "TX"
      city_slug: string;                       // DETERMINISTIC — e.g., "austin"
      state_slug: string;                      // DETERMINISTIC — e.g., "texas"
    };
    agent_count: number;                       // FROM-DB
    freshness_days: number;                    // DETERMINISTIC — 30
  };
  seo: {
    title: string;                             // DETERMINISTIC — use title template
    description: string;                       // AI-FILL — max 155 chars, include city + agent count
    keywords: string[];                        // AI-FILL — exactly 6-8 items
    canonical_url: string;                     // DETERMINISTIC
    schema_type: "ItemList";                   // DETERMINISTIC
    og_title: string;                          // DETERMINISTIC — same as title
    og_description: string;                    // AI-FILL — max 100 chars, punchy
  };
  hero: {
    headline: string;                          // AI-FILL — city-specific, mentions agent count
    subheadline: string;                       // AI-FILL — market-specific value prop, 1 sentence
    intro: string;                             // AI-FILL — exactly 2-3 sentences, city market context
    market_snapshot: {                         // FROM-DB + DETERMINISTIC
      agent_count: number;                     // FROM-DB
      avg_rating: number;                      // FROM-DB — rounded to 1 decimal
      active_listings_count: number;           // FROM-DB
      median_home_price?: number;              // FROM-DB — include if available in city context
    };
  };
  filters: {
    available_specialties: string[];           // FROM-DB — specialties present in this city's agents
    available_transaction_types: string[];     // FROM-DB — ["buyer", "seller"] based on profile data
    sort_options: [                            // DETERMINISTIC
      "Most Reviewed",
      "Highest Rated",
      "Most Active Listings",
      "Newest Members"
    ];
  };
  agents: {                                    // FROM-DB — min: 5, max: 24 per page
    profile_id: string;                        // FROM-DB
    username: string;                          // FROM-DB
    full_name: string;                         // FROM-DB
    avatar_url: string;                        // FROM-DB
    brokerage_name: string;                    // FROM-DB
    bio_excerpt: string;                       // FROM-DB — first 120 chars of bio
    specialties: string[];                     // FROM-DB
    years_experience?: number;                 // FROM-DB — include if present
    rating?: number;                           // FROM-DB — include if ≥1 testimonial
    review_count?: number;                     // FROM-DB
    active_listings_count: number;             // FROM-DB
    profile_url: string;                       // DETERMINISTIC — /[username]
    why_featured?: string;                     // AI-FILL — only for top 3 agents, 1 sentence each, city-specific
  }[];
  content: {
    market_overview: string;                   // AI-FILL — exactly 3 sentences about this city's RE market
    how_to_choose: {                           // exactly 4 items
      tip_title: string;                       // AI-FILL — specific to this market
      tip_body: string;                        // AI-FILL — 2 sentences, market-specific advice
    }[];
    local_insight: string;                     // AI-FILL — 1 paragraph (3-4 sentences) unique to this city
  };
  faq: {                                       // exactly 4 entries
    question: string;                          // AI-FILL — mix of process + market questions
    answer: string;                            // AI-FILL — 2-3 sentences, city-specific where possible
  }[];
  related_pages: {                             // exactly 4-6 entries
    title: string;                             // DETERMINISTIC
    url: string;                               // DETERMINISTIC
    relationship: "specialty" | "transaction" | "geography" | "situation";  // DETERMINISTIC
    description: string;                       // AI-FILL — 1 sentence why this page is useful
  }[];
  cta: {
    headline: string;                          // AI-FILL — 1 line, action-oriented
    subtext: string;                           // AI-FILL — 1 sentence, overcome hesitation
    button_text: string;                       // DETERMINISTIC — "Get Agent Recommendations"
    form_fields: ["name", "email", "timeline", "buying_or_selling"];  // DETERMINISTIC
  };
}
```

---

## Schema 02: CitySpecialtySchema

```typescript
interface CitySpecialtySchema {
  meta: {
    page_type: "city-specialty";               // DETERMINISTIC
    generated_at: string;                      // DETERMINISTIC
    source_record_ids: string[];               // FROM-DB
    combination: {
      city: string;                            // DETERMINISTIC
      state: string;                           // DETERMINISTIC
      state_abbr: string;                      // DETERMINISTIC
      specialty: string;                       // DETERMINISTIC — e.g., "luxury"
      specialty_display: string;               // DETERMINISTIC — e.g., "Luxury"
      city_slug: string;                       // DETERMINISTIC
      state_slug: string;                      // DETERMINISTIC
      specialty_slug: string;                  // DETERMINISTIC
    };
    agent_count: number;                       // FROM-DB
    freshness_days: number;                    // DETERMINISTIC — 30
  };
  seo: {
    title: string;                             // DETERMINISTIC — use title template
    description: string;                       // AI-FILL — max 155 chars, specialty + city specific
    keywords: string[];                        // AI-FILL — exactly 6-8 items, specialty-focused
    canonical_url: string;                     // DETERMINISTIC
    schema_type: "ItemList";                   // DETERMINISTIC
    og_description: string;                    // AI-FILL — max 100 chars
  };
  hero: {
    headline: string;                          // AI-FILL — specialty + city, specific not generic
    subheadline: string;                       // AI-FILL — specialty-specific value prop for this city
    intro: string;                             // AI-FILL — exactly 3 sentences: market context, specialty value, what to expect
    badge_copy: string;                        // AI-FILL — 5-7 word phrase for specialty badge, e.g., "Austin's Luxury Market Specialists"
  };
  specialty_explainer: {
    what_it_means: string;                     // AI-FILL — 2 sentences defining this specialty in context of this city
    what_to_look_for: string[];                // AI-FILL — exactly 4 bullet points, specialty + city specific signals
    certification_callout?: string;            // AI-FILL — include ONLY if specialty has common certifications (CLHMS, SRES, MRP, etc.)
    city_specific_context: string;             // AI-FILL — 2 sentences about how this specialty plays out specifically in [city]
  };
  agents: {                                    // FROM-DB — min: 3, max: 20
    profile_id: string;                        // FROM-DB
    username: string;                          // FROM-DB
    full_name: string;                         // FROM-DB
    avatar_url: string;                        // FROM-DB
    brokerage_name: string;                    // FROM-DB
    bio_excerpt: string;                       // FROM-DB
    specialties: string[];                     // FROM-DB
    specialty_credentials?: string[];          // FROM-DB — certifications relevant to this specialty
    rating?: number;                           // FROM-DB
    review_count?: number;                     // FROM-DB
    active_listings_count: number;             // FROM-DB
    profile_url: string;                       // DETERMINISTIC
    why_fits: string;                          // AI-FILL — 1-2 sentences, MUST reference this specialty in this city specifically
  }[];
  faq: {                                       // exactly 4 entries, specialty + city specific
    question: string;                          // AI-FILL — common question about finding this specialty agent in this city
    answer: string;                            // AI-FILL — 2-3 sentences, specific not generic
  }[];
  related_pages: {                             // exactly 4-6 entries
    title: string;                             // DETERMINISTIC
    url: string;                               // DETERMINISTIC
    relationship: string;                      // DETERMINISTIC
    description: string;                       // AI-FILL — 1 sentence
  }[];
  cta: {
    headline: string;                          // AI-FILL — specialty + city specific
    subtext: string;                           // AI-FILL — specialty-specific reassurance
    button_text: string;                       // DETERMINISTIC — "Find My [Specialty] Agent"
  };
}
```

---

## Schema 03: CityBuyersAgentSchema

```typescript
interface CityBuyersAgentSchema {
  meta: {
    page_type: "city-buyers-agent";            // DETERMINISTIC
    generated_at: string;                      // DETERMINISTIC
    source_record_ids: string[];               // FROM-DB
    combination: {
      city: string;                            // DETERMINISTIC
      state: string;                           // DETERMINISTIC
      state_abbr: string;                      // DETERMINISTIC
      city_slug: string;                       // DETERMINISTIC
      state_slug: string;                      // DETERMINISTIC
    };
    agent_count: number;                       // FROM-DB
    freshness_days: number;                    // DETERMINISTIC — 30
  };
  seo: {
    title: string;                             // DETERMINISTIC
    description: string;                       // AI-FILL — max 155 chars
    keywords: string[];                        // AI-FILL — 6-8 items
    canonical_url: string;                     // DETERMINISTIC
    schema_type: "ItemList";                   // DETERMINISTIC
  };
  hero: {
    headline: string;                          // AI-FILL — buyer-focused, mentions city challenge
    subheadline: string;                       // AI-FILL — why buyer representation matters in this market
    intro: string;                             // AI-FILL — 3 sentences: market condition + buyer challenge + solution
    market_conditions_badge: string;           // AI-FILL — e.g., "Austin: Competitive Market — Buyer Representation Critical"
  };
  buyers_agent_explainer: {
    what_they_do: string;                      // AI-FILL — 2 sentences, specific to buyer side
    nar_settlement_context: string;            // AI-FILL — 2 sentences explaining post-Aug 2024 compensation changes
    fiduciary_duty_explanation: string;        // AI-FILL — 1 sentence on representation vs. dual agency risk
    city_specific_buyer_tips: string[];        // AI-FILL — exactly 3 tips specific to buying in this city
  };
  agents: {                                    // FROM-DB — min: 5, max: 24
    profile_id: string;                        // FROM-DB
    username: string;                          // FROM-DB
    full_name: string;                         // FROM-DB
    avatar_url: string;                        // FROM-DB
    brokerage_name: string;                    // FROM-DB
    bio_excerpt: string;                       // FROM-DB
    rating?: number;                           // FROM-DB
    review_count?: number;                     // FROM-DB
    buyer_testimonial_excerpt?: string;        // FROM-DB — first 100 chars of a buyer testimonial if available
    profile_url: string;                       // DETERMINISTIC
    why_fits: string;                          // AI-FILL — buyer-representation specific, city context required
  }[];
  comparison_tool_intro: string;               // AI-FILL — 1 sentence introducing the comparison feature
  faq: {                                       // exactly 5 entries — buyer focused + NAR settlement
    question: string;                          // AI-FILL
    answer: string;                            // AI-FILL — 2-3 sentences
  }[];
  related_pages: {                             // exactly 4-6 entries
    title: string;                             // DETERMINISTIC
    url: string;                               // DETERMINISTIC
    relationship: string;                      // DETERMINISTIC
    description: string;                       // AI-FILL
  }[];
  cta: {
    headline: string;                          // AI-FILL
    subtext: string;                           // AI-FILL
    button_text: "Find My Buyer's Agent";      // DETERMINISTIC
    form_fields: ["name", "email", "phone", "budget", "timeline", "pre_approved"];  // DETERMINISTIC
  };
}
```

---

## Schema 04: CityListingAgentSchema

```typescript
interface CityListingAgentSchema {
  meta: {
    page_type: "city-listing-agent";           // DETERMINISTIC
    generated_at: string;                      // DETERMINISTIC
    source_record_ids: string[];               // FROM-DB
    combination: {
      city: string;                            // DETERMINISTIC
      state: string;                           // DETERMINISTIC
      state_abbr: string;                      // DETERMINISTIC
      city_slug: string;                       // DETERMINISTIC
      state_slug: string;                      // DETERMINISTIC
    };
    agent_count: number;                       // FROM-DB
    avg_days_on_market?: number;               // FROM-DB — from active listings data
    freshness_days: number;                    // DETERMINISTIC — 30
  };
  seo: {
    title: string;                             // DETERMINISTIC
    description: string;                       // AI-FILL — max 155 chars, seller-focused
    keywords: string[];                        // AI-FILL — 6-8 items
    canonical_url: string;                     // DETERMINISTIC
    schema_type: "ItemList";                   // DETERMINISTIC
  };
  hero: {
    headline: string;                          // AI-FILL — seller-focused, market-aware
    subheadline: string;                       // AI-FILL — outcome-focused (sell faster, net more)
    intro: string;                             // AI-FILL — 3 sentences: market conditions + what listing agent does + what to look for
    market_conditions_summary: string;         // AI-FILL — 1 sentence current seller conditions in this city
  };
  seller_preparation: {
    market_snapshot: {
      avg_days_on_market?: number;             // FROM-DB — from listing data
      active_listings?: number;               // FROM-DB
      avg_list_to_sale_ratio?: string;         // FROM-DB — formatted as percentage
    };
    when_to_list: string;                      // AI-FILL — 2 sentences, city-specific seasonal advice
    pricing_strategy_tip: string;             // AI-FILL — 2 sentences, market-specific pricing context
  };
  agents: {                                    // FROM-DB — min: 5, max: 24
    profile_id: string;                        // FROM-DB
    username: string;                          // FROM-DB
    full_name: string;                         // FROM-DB
    avatar_url: string;                        // FROM-DB
    brokerage_name: string;                    // FROM-DB
    bio_excerpt: string;                       // FROM-DB
    rating?: number;                           // FROM-DB
    review_count?: number;                     // FROM-DB
    sold_count?: number;                       // FROM-DB — count of sold listings on platform
    profile_url: string;                       // DETERMINISTIC
    why_fits: string;                          // AI-FILL — seller-representation specific + city market context
  }[];
  faq: {                                       // exactly 4 entries — seller focused
    question: string;                          // AI-FILL — pricing, timing, commission, marketing
    answer: string;                            // AI-FILL — 2-3 sentences, city-specific
  }[];
  related_pages: {                             // exactly 4-6 entries
    title: string;                             // DETERMINISTIC
    url: string;                               // DETERMINISTIC
    relationship: string;                      // DETERMINISTIC
    description: string;                       // AI-FILL
  }[];
  cta: {
    headline: string;                          // AI-FILL — home valuation focused
    subtext: string;                           // AI-FILL
    button_text: "Request a Free Home Valuation";  // DETERMINISTIC
    form_fields: ["name", "email", "phone", "property_address", "timeline"];  // DETERMINISTIC
  };
}
```

---

## Schema 05: StateDirectorySchema

```typescript
interface StateDirectorySchema {
  meta: {
    page_type: "state-directory";              // DETERMINISTIC
    generated_at: string;                      // DETERMINISTIC
    source_record_ids: string[];               // FROM-DB — sample profile IDs
    combination: {
      state: string;                           // DETERMINISTIC
      state_abbr: string;                      // DETERMINISTIC
      state_slug: string;                      // DETERMINISTIC
    };
    total_agent_count: number;                 // FROM-DB
    city_count: number;                        // FROM-DB — cities with agents
    freshness_days: number;                    // DETERMINISTIC — 30
  };
  seo: {
    title: string;                             // DETERMINISTIC
    description: string;                       // AI-FILL — max 155 chars
    keywords: string[];                        // AI-FILL — 6-8 items
    canonical_url: string;                     // DETERMINISTIC
    schema_type: "ItemList";                   // DETERMINISTIC
  };
  hero: {
    headline: string;                          // AI-FILL — state-specific, mentions scale
    intro: string;                             // AI-FILL — 2-3 sentences, state market overview
    state_market_character: string;            // AI-FILL — 1 sentence, state's defining RE characteristic
  };
  cities: {                                    // FROM-DB — all cities with agents, min: 3
    city_display: string;                      // FROM-DB
    city_slug: string;                         // FROM-DB
    state_slug: string;                        // DETERMINISTIC
    agent_count: number;                       // FROM-DB
    directory_url: string;                     // DETERMINISTIC
    top_specialties: string[];                 // FROM-DB — top 3 specialties in this city
  }[];
  state_overview: {
    market_summary: string;                    // AI-FILL — 3 sentences, state-level market context
    license_body_name: string;                 // DETERMINISTIC — from state context
    popular_cities: string[];                  // FROM-DB — top 5 by agent count
    market_segments: string;                   // AI-FILL — 2 sentences on dominant market types in state
  };
  faq: {                                       // exactly 4 entries — state level
    question: string;                          // AI-FILL — state licensing, market, finding agents
    answer: string;                            // AI-FILL — 2-3 sentences
  }[];
  related_pages: {                             // exactly 4-6 entries — top cities + specialty pages
    title: string;                             // DETERMINISTIC
    url: string;                               // DETERMINISTIC
    relationship: "city" | "specialty";        // DETERMINISTIC
    description: string;                       // AI-FILL
  }[];
}
```

---

## Schema 06: NeighborhoodDirectorySchema

```typescript
interface NeighborhoodDirectorySchema {
  meta: {
    page_type: "neighborhood-directory";       // DETERMINISTIC
    generated_at: string;                      // DETERMINISTIC
    source_record_ids: string[];               // FROM-DB
    combination: {
      neighborhood: string;                    // DETERMINISTIC
      city: string;                            // DETERMINISTIC
      state: string;                           // DETERMINISTIC
      state_abbr: string;                      // DETERMINISTIC
      neighborhood_slug: string;               // DETERMINISTIC
      city_slug: string;                       // DETERMINISTIC
      state_slug: string;                      // DETERMINISTIC
    };
    agent_count: number;                       // FROM-DB
    freshness_days: number;                    // DETERMINISTIC — 30
  };
  seo: {
    title: string;                             // DETERMINISTIC
    description: string;                       // AI-FILL — max 155 chars, neighborhood-specific
    keywords: string[];                        // AI-FILL — 5-7 items, hyper-local
    canonical_url: string;                     // DETERMINISTIC
    schema_type: "ItemList";                   // DETERMINISTIC
  };
  hero: {
    headline: string;                          // AI-FILL — neighborhood + city, local knowledge angle
    intro: string;                             // AI-FILL — 2-3 sentences, neighborhood character + why local agent matters
    neighborhood_snapshot: {
      character: string;                       // FROM-DB — neighborhood context object
      median_price?: number;                   // FROM-DB — from listing data if available
      dominant_property_types: string[];       // FROM-DB — from listing data
    };
  };
  agents: {                                    // FROM-DB — min: 2, max: 12
    profile_id: string;                        // FROM-DB
    username: string;                          // FROM-DB
    full_name: string;                         // FROM-DB
    avatar_url: string;                        // FROM-DB
    brokerage_name: string;                    // FROM-DB
    bio_excerpt: string;                       // FROM-DB
    rating?: number;                           // FROM-DB
    review_count?: number;                     // FROM-DB
    listings_in_neighborhood?: number;         // FROM-DB — count of listings in this neighborhood
    profile_url: string;                       // DETERMINISTIC
    why_fits: string;                          // AI-FILL — neighborhood-specific, 1-2 sentences
  }[];
  neighborhood_guide: {
    overview: string;                          // AI-FILL — 2-3 sentences, neighborhood character
    who_buys_here: string;                     // AI-FILL — 1-2 sentences, buyer profile
    local_knowledge_value: string;             // AI-FILL — 2 sentences on why local agent expertise matters here specifically
  };
  faq: {                                       // exactly 3 entries
    question: string;                          // AI-FILL — neighborhood-specific questions
    answer: string;                            // AI-FILL — 2 sentences each
  }[];
  related_pages: {                             // exactly 4 entries
    title: string;                             // DETERMINISTIC
    url: string;                               // DETERMINISTIC
    relationship: string;                      // DETERMINISTIC
    description: string;                       // AI-FILL
  }[];
}
```

---

## Schema 07: CitySituationSchema

```typescript
interface CitySituationSchema {
  meta: {
    page_type: "city-situation";               // DETERMINISTIC
    generated_at: string;                      // DETERMINISTIC
    source_record_ids: string[];               // FROM-DB
    combination: {
      city: string;                            // DETERMINISTIC
      state: string;                           // DETERMINISTIC
      state_abbr: string;                      // DETERMINISTIC
      situation: string;                       // DETERMINISTIC — e.g., "divorce"
      situation_display: string;               // DETERMINISTIC — e.g., "Divorce"
      city_slug: string;                       // DETERMINISTIC
      state_slug: string;                      // DETERMINISTIC
      situation_slug: string;                  // DETERMINISTIC
    };
    agent_count: number;                       // FROM-DB
    freshness_days: number;                    // DETERMINISTIC — 90 (evergreen)
  };
  seo: {
    title: string;                             // DETERMINISTIC
    description: string;                       // AI-FILL — max 155 chars, empathetic + informational
    keywords: string[];                        // AI-FILL — 5-7 items
    canonical_url: string;                     // DETERMINISTIC
    schema_type: "FAQPage";                    // DETERMINISTIC
  };
  hero: {
    headline: string;                          // AI-FILL — situation-aware, NOT sensationalist
    intro: string;                             // AI-FILL — 2-3 sentences, empathetic tone, what this page helps with
    tone_note: "empathetic";                   // DETERMINISTIC — signals to renderer to use softer design
  };
  situation_guide: {
    overview: string;                          // AI-FILL — 3 sentences on how this situation intersects with real estate
    unique_challenges: string[];               // AI-FILL — exactly 4 bullet points, situation-specific challenges
    what_to_look_for: string[];                // AI-FILL — exactly 3 signals of the right agent for this situation
    certifications_to_ask_about?: string;      // AI-FILL — include ONLY if certifications exist for this situation (RCS-D for divorce, SRES for seniors, MRP for military)
    timeline_expectations: string;             // AI-FILL — 2 sentences on what the process looks like timeline-wise
  };
  agents: {                                    // FROM-DB — min: 2, max: 16
    profile_id: string;                        // FROM-DB
    username: string;                          // FROM-DB
    full_name: string;                         // FROM-DB
    avatar_url: string;                        // FROM-DB
    brokerage_name: string;                    // FROM-DB
    bio_excerpt: string;                       // FROM-DB
    rating?: number;                           // FROM-DB
    review_count?: number;                     // FROM-DB
    situation_credential?: string;             // FROM-DB — relevant certification if present
    profile_url: string;                       // DETERMINISTIC
    why_fits: string;                          // AI-FILL — situation-specific, 1-2 sentences, must NOT be generic praise
  }[];
  checklist?: {                                // AI-FILL — include for divorce, probate, military (high-need situations)
    title: string;                             // AI-FILL — e.g., "Divorce Real Estate Checklist"
    items: string[];                           // AI-FILL — exactly 6-8 items, actionable
  };
  faq: {                                       // exactly 5 entries — situation + real estate specific
    question: string;                          // AI-FILL
    answer: string;                            // AI-FILL — 2-3 sentences, situation-specific
  }[];
  related_pages: {                             // exactly 4 entries
    title: string;                             // DETERMINISTIC
    url: string;                               // DETERMINISTIC
    relationship: string;                      // DETERMINISTIC
    description: string;                       // AI-FILL
  }[];
  cta: {
    headline: string;                          // AI-FILL — situation-aware, not pushy
    subtext: string;                           // AI-FILL — empathetic, no pressure framing
    button_text: string;                       // DETERMINISTIC — "Find an Agent Who Understands [Situation]"
    form_fields: ["name", "email", "situation_detail", "timeline"];  // DETERMINISTIC
  };
}
```

---

# PHASE 4: GENERATION PROMPT LIBRARY

---

## PROMPT: city-directory

```
--- PROMPT: city-directory ---

SYSTEM:
You are a local real estate content specialist. You produce structured JSON 
for an agent discovery platform. You ONLY fill schemas. Your output is always 
valid JSON that exactly matches the provided schema. You write for real people 
making real financial decisions — never use vague filler or tourist-brochure 
language.

CONTEXT INJECTION:
[CITY_CONTEXT]: {{city_context_object}}
[STATE_CONTEXT]: {{state_context_object}}
[SITE_CONTEXT]: Content appears on AgentBio.net, a platform where real estate 
agents create professional profiles. These directory pages help buyers and 
sellers find the right agent for their specific needs.

DATA INJECTION:
These agent profiles from our database match this city. Use ONLY these 
records for the agents array:
{{agent_profiles_json}}

SCHEMA TO FILL:
Fill every field marked AI-FILL. Leave DETERMINISTIC and FROM-DB fields empty.
{{empty_schema_json}}

OUTPUT RULES:
1. Return ONLY valid JSON. No markdown. No explanation. No preamble.
2. Every AI-FILL field must be filled. No empty strings.
3. hero.intro: 2-3 sentences. Must reference this specific city's market 
   character (not generic "the real estate market is competitive").
4. content.market_overview: 3 sentences. Each must contain a specific fact 
   about this city's market (price tier, inventory, buyer profile, etc.).
5. content.local_insight: Must contain something ONLY true of this city, 
   not applicable to any other market.
6. faq: Questions must mix process questions (how do I find an agent?) with 
   market questions (what's the market like in [city]?).
7. agents[].why_featured (top 3 only): Must mention something from that 
   agent's actual bio or specialties — not generic praise.
8. related_pages[].description: Must explain WHY the page is related, not 
   just what it is.

BANNED PHRASES:
- "vibrant", "bustling", "thriving", "dynamic"
- "[City] has something for everyone"
- "the real estate market is competitive" (too generic — specify HOW)
- "experienced agent" without specifying the experience
- "passionate about helping clients"
- Any phrase that would be equally true in any other city

QUALITY TEST (apply before returning):
For hero.intro: Could this intro be copy-pasted onto a page about a different 
city with only the city name changed? If yes, rewrite it.
For content.local_insight: Is there a specific detail that only someone 
familiar with this city would know? If not, add one.
```

---

## PROMPT: city-specialty

```
--- PROMPT: city-specialty ---

SYSTEM:
You are a real estate content specialist who understands both local markets 
and agent specializations deeply. You produce structured JSON for an agent 
discovery platform. Output ONLY valid JSON matching the schema exactly.

CONTEXT INJECTION:
[CITY_CONTEXT]: {{city_context_object}}
[SPECIALTY_CONTEXT]: {{specialty_context_object}}
[SITE_CONTEXT]: AgentBio.net is where real estate agents build professional 
profiles. Specialty pages help people who already know what type of agent 
they need find the right one in their specific city.

DATA INJECTION:
These agents have this specialty in this city. Use ONLY these records:
{{agent_profiles_json}}

SCHEMA TO FILL:
{{empty_schema_json}}

OUTPUT RULES:
1. Return ONLY valid JSON. No markdown. No preamble.
2. Every AI-FILL field must be filled. No empty strings.
3. specialty_explainer.city_specific_context: MUST reference how this 
   specialty specifically plays out in THIS city — not a generic explanation 
   of the specialty.
4. specialty_explainer.what_to_look_for: Each of the 4 bullets must be 
   specific to BOTH this specialty AND this city's market conditions.
5. agents[].why_fits: Cannot be generic praise. Must reference this specialty 
   in the context of this city. Example of BAD why_fits: "She is passionate 
   about helping luxury buyers." Example of GOOD: "Her 8 years selling $2M+ 
   homes in Austin's Tarrytown and Westlake neighborhoods gives her deep 
   insight into the luxury submarkets where discretion and off-market access 
   matter most."
6. faq: All 4 questions must be answerable ONLY with knowledge of both this 
   specialty AND this city. Generic specialty FAQs that work in any city 
   are not acceptable.
7. hero.badge_copy: 5-7 words, memorable, specific. Avoid generic formulas 
   like "[City]'s Best [Specialty] Agents".

BANNED PHRASES:
- "white-glove service" (unless specialty is luxury AND explaining specifically 
  what that means in this city)
- "proven track record" without specifics
- "passionate about" anything
- "vibrant", "bustling", "thriving"
- Any why_fits that would still be accurate if the city were different

QUALITY TEST:
For each agent's why_fits: Remove the agent's name and the city name. 
Does the sentence still make sense? If yes, rewrite it — it must be 
city-specific AND agent-specific.
```

---

## PROMPT: city-buyers-agent

```
--- PROMPT: city-buyers-agent ---

SYSTEM:
You are a real estate content specialist with deep knowledge of buyer 
representation, the August 2024 NAR settlement changes, and local market 
dynamics. You produce structured JSON for an agent discovery platform. 
Output ONLY valid JSON matching the schema.

CONTEXT INJECTION:
[CITY_CONTEXT]: {{city_context_object}}
[NAR_SETTLEMENT_CONTEXT]: {
  "summary": "As of August 17, 2024, NAR settlement changes took effect. Buyer's agent commissions are no longer included in MLS listings. Buyers must now sign a written representation agreement before touring homes. Compensation is negotiated directly between buyer and buyer's agent, though sellers may still offer concessions.",
  "implication": "This makes choosing the right buyer's agent more intentional than ever — buyers are now explicitly agreeing to the relationship."
}

DATA INJECTION:
{{agent_profiles_json}}

SCHEMA TO FILL:
{{empty_schema_json}}

OUTPUT RULES:
1. Return ONLY valid JSON. No markdown. No preamble.
2. buyers_agent_explainer.nar_settlement_context: Must accurately summarize 
   post-August 2024 rules in 2 sentences. Do NOT say commissions are gone 
   — they've changed structure, not disappeared.
3. buyers_agent_explainer.city_specific_buyer_tips: All 3 tips must be 
   specific to challenges in THIS city (competition level, offer strategies, 
   neighborhood dynamics, etc.).
4. hero.market_conditions_badge: Must accurately reflect this city's 
   buyer market conditions from the city context object.
5. faq: 1 of the 5 FAQs must address buyer's agent compensation post-NAR 
   settlement specifically. Others should address city-specific buying challenges.
6. agents[].why_fits: Must be buyer-representation-focused. Cannot just 
   restate the agent's bio.

BANNED PHRASES:
- "buyer's agent is FREE" (no longer accurate post-NAR settlement)
- "passionate about helping buyers"
- "dedicated professional"
- Any claim about agent compensation that contradicts NAR settlement reality

QUALITY TEST:
buyers_agent_explainer.nar_settlement_context: Is it accurate as of 
August 2024? Does it help a buyer understand their new responsibility 
without being alarmist? If either answer is no, rewrite.
```

---

## PROMPT: city-listing-agent

```
--- PROMPT: city-listing-agent ---

SYSTEM:
You are a real estate content specialist focused on home selling and 
listing agent selection. You produce structured JSON for an agent discovery 
platform. Output ONLY valid JSON matching the schema.

CONTEXT INJECTION:
[CITY_CONTEXT]: {{city_context_object}}
[MARKET_DATA]: {{aggregated_listing_data_json}}

DATA INJECTION:
{{agent_profiles_json}}

SCHEMA TO FILL:
{{empty_schema_json}}

OUTPUT RULES:
1. Return ONLY valid JSON. No markdown. No preamble.
2. seller_preparation.when_to_list: Must reference seasonal patterns 
   specific to this city's climate and market (spring markets vary 
   significantly — Phoenix spring is different from Minneapolis spring).
3. seller_preparation.pricing_strategy_tip: Must reference this city's 
   current inventory level and buyer demand from the city context object. 
   Do not give generic pricing advice.
4. hero.market_conditions_summary: 1 sentence. Must accurately reflect 
   whether this is currently a buyer's or seller's market based on city 
   context data.
5. faq: At least 1 question must address commission/fee structure. At 
   least 1 must address timing in this specific market.
6. cta.headline: Must be home-valuation-focused, not agent-search-focused.

BANNED PHRASES:
- "maximize your home's value" (overused)
- "selling in today's market" (too vague)
- "top dollar" unless you specify what that means in this market context
- Any claim about average days on market not supported by the market data injection
```

---

## PROMPT: city-situation

```
--- PROMPT: city-situation ---

SYSTEM:
You are a real estate content specialist with expertise in complex life 
situations that intersect with real estate transactions. You write with 
empathy, clarity, and specificity. You produce structured JSON for an 
agent discovery platform. Output ONLY valid JSON matching the schema.

CONTEXT INJECTION:
[CITY_CONTEXT]: {{city_context_object}}
[SITUATION_CONTEXT]: {{situation_context_object}}
[TONE_DIRECTIVE]: This page addresses people in potentially difficult 
circumstances. Write with empathy. Avoid clinical language, avoid making 
assumptions about their emotional state, and focus on practical value. 
Do not dramatize. Do not minimize.

DATA INJECTION:
{{agent_profiles_json}}

SCHEMA TO FILL:
{{empty_schema_json}}

OUTPUT RULES:
1. Return ONLY valid JSON. No markdown. No preamble.
2. hero.intro: Must acknowledge the situation with empathy without being 
   presumptuous about the reader's emotional state.
3. situation_guide.unique_challenges: All 4 bullets must be specific to 
   THIS situation (not generic real estate challenges).
4. situation_guide.what_to_look_for: The 3 signals must be specific to 
   finding an agent skilled in this situation — not generic quality signals.
5. checklist (if applicable): All items must be actionable. No items like 
   "consider your options" — must be specific steps.
6. faq: At least 2 of the 5 questions must be about the process, not just 
   about real estate generally. 1 must address a common misconception about 
   this situation.
7. agents[].why_fits: Must reference something specific to this situation. 
   Cannot be generic agent praise.
8. cta.headline and cta.subtext: Must be empathetic. Not pushy. No urgency 
   language. No "act now."

BANNED PHRASES:
- "going through a difficult time" (presumptuous)
- "we understand how hard this is" (hollow)
- "passionate about helping" anything
- Urgency language of any kind on situation pages
- Any framing that implies the reader is making a mistake
```

---

# PHASE 5: REACT COMPONENT SPECS

---

## COMPONENT: CityDirectoryPage

```
COMPONENT: CityDirectoryPage
FILE: src/pages/pseo/CityDirectoryPage.tsx
DATA SOURCE: Supabase — pseo_pages WHERE page_type = 'city-directory' AND 
             combination->>'city_slug' = [param] AND combination->>'state_slug' = [param]

LAYOUT SECTIONS (in order):
1. Breadcrumb — Home > [State] > [City] Real Estate Agents
2. Hero — headline, subheadline, intro paragraph, market snapshot stats bar
3. Filter Bar — sticky below hero, specialty/transaction/sort filters
4. Agent Grid — responsive card grid, paginated (12 per page)
5. Market Overview — prose section from content.market_overview
6. How to Choose — 4-item card grid from content.how_to_choose
7. Local Insight — pull-quote style section, city-specific insight
8. FAQ Accordion — 4 questions/answers
9. Related Pages Grid — 4-6 cards
10. CTA Block — lead capture form

PROPS INTERFACE:
interface CityDirectoryPageProps {
  pageData: CityDirectorySchema;
  params: { state_slug: string; city_slug: string };
}

INTERACTIVE FEATURES:
- Specialty filter: client-side filter on agents[] array by specialties field
- Transaction filter: client-side filter by buyer/seller representation signals
- Sort: client-side re-sort of agents[] array
- Map view: toggle between grid and Mapbox map (lazy-loaded)
  Map implementation: agents plotted by brokerage office location if available
  Fallback: city center point
- Pagination: 12 agents per page, client-side
- Agent card hover: expand to show bio excerpt + testimonial snippet

SCHEMA MARKUP:
- JSON-LD ItemList in document <head> — each agent as ListItem with Person schema
- BreadcrumbList schema
- FAQPage schema for faq array

INTERNAL LINKING:
- Breadcrumb links: / > /real-estate-agents/[state] > current page
- Each agent card links to /[username]
- Related pages grid links to specialty/transaction/state pages
- "View all [specialty] agents" contextual links in filter results

PERFORMANCE REQUIREMENTS:
- NO Three.js or heavy 3D — these are SEO pages, not marketing pages
- Mapbox lazy-loaded (import only when user toggles map view)
- Agent avatars: lazy-loaded with Intersection Observer
- Target LCP < 1.8s (text content loads first, images progressive)
- Agent grid: first 12 agents server-rendered, additional pages client-side
- Filter/sort: pure client-side (no additional fetches after initial load)
- Total JS budget for this page: < 150KB gzipped (excluding shared vendor chunks)

AGENT CARD COMPONENT:
interface AgentCardProps {
  agent: CityDirectorySchema['agents'][number];
  variant: 'compact' | 'featured';  // featured for top 3 with why_featured
}
Renders: avatar, name, brokerage, specialties badges, rating stars, 
         listings count, why_featured (if featured variant), CTA button
```

---

## COMPONENT: CitySpecialtyPage

```
COMPONENT: CitySpecialtyPage
FILE: src/pages/pseo/CitySpecialtyPage.tsx
DATA SOURCE: pseo_pages WHERE page_type = 'city-specialty' AND 
             combination->>'city_slug' = [param] AND 
             combination->>'specialty_slug' = [param]

LAYOUT SECTIONS (in order):
1. Breadcrumb — Home > [State] > [City] Agents > [Specialty]
2. Hero — headline, specialty badge, subheadline, intro
3. Specialty Explainer Card — what_it_means, what_to_look_for (4 bullets), 
   city_specific_context, certification callout (conditional)
4. Agent Grid — specialty-filtered agent cards with why_fits visible
5. FAQ Accordion
6. Lead Capture Form — specialty-labeled ("Find My [Specialty] Agent")
7. Related Pages Grid

PROPS INTERFACE:
interface CitySpecialtyPageProps {
  pageData: CitySpecialtySchema;
  params: { state_slug: string; city_slug: string; specialty_slug: string };
}

INTERACTIVE FEATURES:
- Specialty explainer: expandable "Learn more" section for certification details
- Agent cards: why_fits always visible (key differentiator on specialty pages)
- Lead form: pre-fills specialty field based on page context
- "Compare agents" toggle: select up to 3 agents, side-by-side modal

SCHEMA MARKUP:
- ItemList (agents)
- FAQPage
- BreadcrumbList

PERFORMANCE REQUIREMENTS:
- Same constraints as CityDirectoryPage
- Specialty explainer section: above-fold priority for LCP
- why_fits text: visible without hover/expand (important for conversion)
```

---

## COMPONENT: CityBuyersAgentPage

```
COMPONENT: CityBuyersAgentPage
FILE: src/pages/pseo/CityBuyersAgentPage.tsx
DATA SOURCE: pseo_pages WHERE page_type = 'city-buyers-agent'

LAYOUT SECTIONS (in order):
1. Breadcrumb
2. Hero — market conditions badge prominent, headline, subheadline, intro
3. Buyer's Agent Explainer — what they do, NAR settlement context callout box,
   fiduciary duty section, city-specific buyer tips (3 items)
4. Agent Grid — buyer-focused agent cards
5. Comparison Tool Intro + Agent Comparison (select up to 3)
6. FAQ Accordion (5 questions including NAR settlement FAQ)
7. CTA — lead form with pre-approval status field
8. Related Pages

PROPS INTERFACE:
interface CityBuyersAgentPageProps {
  pageData: CityBuyersAgentSchema;
  params: { state_slug: string; city_slug: string };
}

INTERACTIVE FEATURES:
- NAR Settlement callout box: expandable "What this means for you" section
- Agent comparison: select 2-3 agents, modal with side-by-side comparison
  Comparison fields: specialties, rating, years experience, listings count
- Pre-approval status field in lead form (checkbox: yes/no/in progress)
- Buyer readiness checklist: interactive 5-item checklist, printable

UNIQUE DESIGN NOTE:
- NAR settlement information must be visually distinct (info box, not inline)
  to ensure buyers register it — this is legally/practically important info
- Market conditions badge: color-coded (green = buyer-friendly, 
  orange = balanced, red = highly competitive seller's market)

SCHEMA MARKUP:
- ItemList (agents)
- FAQPage (include NAR settlement Q&A for featured snippet opportunity)
- BreadcrumbList
```

---

## COMPONENT: CityListingAgentPage

```
COMPONENT: CityListingAgentPage
FILE: src/pages/pseo/CityListingAgentPage.tsx
DATA SOURCE: pseo_pages WHERE page_type = 'city-listing-agent'

LAYOUT SECTIONS (in order):
1. Breadcrumb
2. Hero — market conditions summary badge, headline, seller-focused intro
3. Market Snapshot Bar — avg DOM, active listings count, list-to-sale ratio
4. Seller Preparation Section — when_to_list, pricing_strategy_tip
5. Agent Grid — sold history highlighted on cards
6. Downloadable Seller Checklist CTA (PDF or interactive)
7. Home Valuation Lead Capture Form (prominent, above FAQ)
8. FAQ Accordion (4 questions)
9. Related Pages

PROPS INTERFACE:
interface CityListingAgentPageProps {
  pageData: CityListingAgentSchema;
  params: { state_slug: string; city_slug: string };
}

INTERACTIVE FEATURES:
- Market snapshot bar: tooltips explaining each metric
- Seller checklist: interactive (check items off), option to email to self
- Home valuation form: address autocomplete, connects to agent lead system
- Agent cards: sold count badge prominent (key seller trust signal)

SCHEMA MARKUP:
- ItemList (agents)
- FAQPage
- BreadcrumbList
```

---

## COMPONENT: CitySituationPage

```
COMPONENT: CitySituationPage
FILE: src/pages/pseo/CitySituationPage.tsx
DATA SOURCE: pseo_pages WHERE page_type = 'city-situation'

LAYOUT SECTIONS (in order):
1. Breadcrumb (simplified — no situation in breadcrumb for sensitive topics)
2. Hero — empathetic headline, intro (no market conditions badge)
3. Situation Guide — overview, unique challenges, what to look for, 
   certifications callout (conditional), timeline expectations
4. Agent Grid — situation credentials highlighted
5. Downloadable Checklist (conditional — divorce, probate, military only)
6. FAQ Accordion (5 questions)
7. CTA — empathetic framing, no urgency language
8. Related Pages

DESIGN DIRECTIVES:
- Softer visual palette (situation pages use muted colors, not high-contrast CTAs)
- No countdown timers, urgency badges, or "limited spots" language
- Agent cards: credential badges prominent, no "featured" ranking language
- CTA button: "Find an Agent Who Understands [Situation]" — not "Get Started Now"

PROPS INTERFACE:
interface CitySituationPageProps {
  pageData: CitySituationSchema;
  params: { state_slug: string; city_slug: string; situation_slug: string };
}

SCHEMA MARKUP:
- FAQPage (primary — situation pages are FAQ-rich)
- ItemList (agents)
- BreadcrumbList
```

---

## COMPONENT: StateDirectoryPage

```
COMPONENT: StateDirectoryPage
FILE: src/pages/pseo/StateDirectoryPage.tsx
DATA SOURCE: pseo_pages WHERE page_type = 'state-directory'

LAYOUT SECTIONS (in order):
1. Breadcrumb — Home > [State] Real Estate Agents
2. Hero — state headline, market character, intro
3. State Market Overview — market_summary, license body info
4. City Browser Grid — all cities with agents, agent count badges
5. State Stats Bar — total agents, city count, top specialties state-wide
6. FAQ Accordion
7. Related Pages (top cities + top specialty pages)

INTERACTIVE FEATURES:
- City search/filter (client-side search within city grid)
- Specialty filter on city grid (highlights cities with most agents of that specialty)
- Map view: Mapbox state map with city markers and agent density

PERFORMANCE:
- City grid: server-rendered for SEO
- Map: lazy-loaded
- Target LCP < 2.0s
```

---

# PHASE 6: GENERATION PIPELINE SPEC

---

## 6A. Generation Sequence

### Step-by-Step: Taxonomy → Published Page

```
1. COMBINATION VALIDATION
   Input: (page_type, city_slug, state_slug, specialty_slug?)
   Check: Has this combination been generated before? (pseo_pages table lookup)
   Check: Does this combination meet minimum data threshold?
   Action: If yes to both → skip. If new and data meets threshold → proceed.

2. DATA RETRIEVAL (Supabase)
   Query profiles WHERE city = [city] AND is_published = true
   Query listings (JOIN profiles) for market data aggregation
   Query testimonials (JOIN profiles) for aggregate ratings
   Query user_subscriptions for tier (paid agents ranked higher)
   Validate: agent_count >= MINIMUM_DATA_THRESHOLD for this page type

3. CONTEXT ASSEMBLY
   Load city_context_object from pseo_taxonomy table
   Load state_context_object from pseo_taxonomy table
   Load specialty_context_object if applicable
   Load situation_context_object if applicable
   Aggregate market data: avg rating, active listing counts, sold counts

4. SCHEMA PREPARATION
   Select appropriate TypeScript schema interface for this page_type
   Pre-populate all DETERMINISTIC fields:
     - title (from title template)
     - canonical_url
     - page_type
     - generated_at
     - combination object
     - freshness_days
   Pre-populate all FROM-DB fields from step 2 data
   Zero out all AI-FILL fields (empty strings/arrays as placeholders)

5. PROMPT CONSTRUCTION
   Select prompt template for this page_type
   Inject: city_context, state_context, specialty_context (if applicable)
   Inject: agent profiles JSON (filtered, ordered by subscription tier)
   Inject: empty schema JSON (with DETERMINISTIC and FROM-DB already filled)
   Apply rate limiting: max 10 generations per minute

6. CLAUDE API CALL
   Model: claude-sonnet-4-20250514
   Max tokens: 4000
   Temperature: 0 (deterministic — we want consistent, predictable outputs)
   System prompt: from prompt library for this page_type
   Response format: JSON only

7. SCHEMA VALIDATION
   Parse response as JSON
   Validate against TypeScript interface (use zod schema)
   Check: all AI-FILL fields are non-empty
   Check: array counts within min/max bounds
   Check: no banned phrases present (string scan)
   Check: canonical_url matches expected pattern
   Check: faq count matches required count for this page type

8. QUALITY CHECKS (automated)
   Word count per AI-FILL text field ≥ minimum (hero.intro ≥ 40 words, etc.)
   Duplicate content check: compare hero.intro against existing pages 
     (Levenshtein distance > 0.85 = reject)
   City name appears in: hero.headline, hero.intro, at least 2 FAQ answers
   Specialty/situation name appears in: hero.headline, at least 2 agent why_fits
   No banned phrases detected

9. STORAGE
   If all checks pass:
     INSERT into pseo_pages table
     Set is_published = false (pending manual spot-check or auto-publish rule)
   If any check fails:
     INSERT into pseo_generation_errors table with error details
     Flag for manual review

10. PROGRESSIVE PUBLISH
    Week 1-2: Manual review of first 50 pages before auto-publish enabled
    Week 3+: Auto-publish if quality score = 100% on all automated checks
    Pages with agent_count < 5: always require manual review before publish

11. SITEMAP UPDATE
    After each publish batch: regenerate sitemap via Edge Function
    Ping Google Search Console for indexing

12. FRESHNESS MONITORING
    Cron job (daily): check pseo_pages WHERE 
      is_published = true AND 
      updated_at < NOW() - INTERVAL freshness_days DAY
    Re-queue expired pages for regeneration
    Skip if agent data unchanged (hash comparison)
```

### Prioritization Queue Logic

```typescript
interface GenerationQueueItem {
  priority: number;           // 1 = highest
  page_type: string;
  combination: Record<string, string>;
  estimated_search_volume: 'high' | 'medium' | 'long-tail';
  agent_count: number;        // more agents = higher priority
  city_tier: 1 | 2 | 3;
}

// Priority scoring formula:
// priority = (city_tier_weight * 3) + (search_volume_weight * 2) + agent_density_weight
// Tier 1 city, high volume, 10+ agents = highest priority (generates first)
// Tier 3 city, long-tail, 2 agents = lowest priority (generates last)
```

---

## 6B. n8n Workflow Structure

```
WORKFLOW: AgentBio pSEO Generation Pipeline

TRIGGER OPTIONS:
  A) Schedule: Daily at 2 AM CT (daily incremental generation)
  B) Manual: Admin dashboard "Generate Now" button
  C) Data-change: Webhook from Supabase when agent profile published 
     in a new city (triggers city-directory check for that city)

NODE 1: Get Pending Combinations
  Type: Supabase query
  Operation: SELECT from pseo_combination_queue 
             WHERE status = 'pending' 
             ORDER BY priority ASC 
             LIMIT 20 (batch size)
  Output: Array of combination objects

NODE 2: Check Data Threshold
  Type: Function (for each combination)
  Logic: Query profiles count for this combination
         If count < threshold → mark queue item as 'insufficient_data'
         If count >= threshold → proceed
  Branch: sufficient / insufficient

NODE 3: Retrieve Agent Data (sufficient branch)
  Type: Supabase query
  Operation: SELECT profiles + listings + testimonials for this combination
  Output: agent_profiles_json

NODE 4: Load Context Objects
  Type: Supabase query  
  Operation: SELECT from pseo_taxonomy WHERE id IN [city_id, state_id, ...]
  Output: context objects

NODE 5: Assemble Schema
  Type: Function
  Logic: 
    - Load appropriate schema template for page_type
    - Pre-fill DETERMINISTIC fields
    - Pre-fill FROM-DB fields from Node 3 output
    - Zero out AI-FILL fields
  Output: partially-filled schema JSON

NODE 6: Build Prompt
  Type: Function
  Logic: Load prompt template for page_type from pseo_prompts table
         Inject context, agent data, and schema
  Output: complete prompt string

NODE 7: Claude API Call
  Type: HTTP Request
  URL: https://api.anthropic.com/v1/messages
  Method: POST
  Headers: Content-Type: application/json (no API key — handled by proxy)
  Body: { model, max_tokens: 4000, messages: [prompt] }
  Rate limit: 10 requests/minute
  Timeout: 30 seconds
  Retry: 2x on timeout, 0x on API error

NODE 8: Parse & Validate
  Type: Function
  Logic:
    - Parse JSON response
    - Run zod validation against schema interface
    - Run quality checks (word count, duplicate detection, banned phrases)
    - Score: 0-100 (all checks pass = 100)
  Branch: score = 100 → proceed / score < 100 → error branch

NODE 9: Store Result (success branch)
  Type: Supabase
  Operation: INSERT into pseo_pages
             Set is_published based on auto-publish rule
             Update pseo_combination_queue status to 'complete'

NODE 10: Update Sitemap
  Type: HTTP Request
  URL: [supabase edge function URL]/generate-sitemap
  Trigger: After each batch completion (not per page)

NODE 11: Error Handling (error branch)
  Type: Supabase
  Operation: INSERT into pseo_generation_errors
             { combination, error_type, error_detail, raw_response, timestamp }
  Then: Update pseo_combination_queue status to 'failed'
  Then: HTTP Request → Slack/email notification if error_count > 5 in 1 hour

NODE 12: Batch Complete Notification
  Type: HTTP Request (Slack webhook or email)
  Payload: { pages_generated, pages_failed, batch_time, next_run }
```

---

## 6C. Supabase Table Definitions

```sql
-- Core pSEO pages table
CREATE TABLE pseo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN (
    'city-directory', 
    'city-specialty', 
    'city-buyers-agent',
    'city-listing-agent', 
    'state-directory',
    'neighborhood-directory',
    'city-situation'
  )),
  url_path TEXT NOT NULL UNIQUE,           -- e.g., /real-estate-agents/texas/austin
  combination JSONB NOT NULL,             -- dimension values for this page
  content JSONB NOT NULL,                 -- full generated schema (CityDirectorySchema, etc.)
  is_published BOOLEAN DEFAULT false,
  quality_score INTEGER DEFAULT 0,        -- 0-100 from validation checks
  agent_count INTEGER NOT NULL DEFAULT 0, -- agents at time of generation
  content_hash TEXT,                      -- hash of agent data used (for freshness check)
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  next_refresh_at TIMESTAMPTZ,            -- generated_at + freshness_days
  generation_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  error_count INTEGER DEFAULT 0,
  CONSTRAINT valid_url_path CHECK (url_path ~ '^/[a-z0-9-/]+$')
);

-- Indexes for React app queries
CREATE INDEX idx_pseo_pages_url_path ON pseo_pages(url_path);
CREATE INDEX idx_pseo_pages_page_type ON pseo_pages(page_type);
CREATE INDEX idx_pseo_pages_published ON pseo_pages(is_published) WHERE is_published = true;
CREATE INDEX idx_pseo_pages_combination_city ON pseo_pages USING gin(combination);
CREATE INDEX idx_pseo_pages_refresh ON pseo_pages(next_refresh_at) WHERE is_published = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pseo_pages_updated_at
  BEFORE UPDATE ON pseo_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE pseo_pages ENABLE ROW LEVEL SECURITY;

-- Public can read published pages (for React app)
CREATE POLICY "Public read published pages"
  ON pseo_pages FOR SELECT
  USING (is_published = true);

-- Admins can do everything
CREATE POLICY "Admin full access"
  ON pseo_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Generation queue table
CREATE TABLE pseo_combination_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  combination JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,      -- 1 = highest, 10 = lowest
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'complete', 'failed', 'insufficient_data')),
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  UNIQUE (page_type, combination)
);

CREATE INDEX idx_queue_status_priority ON pseo_combination_queue(status, priority, queued_at);

-- Taxonomy table (city/state/specialty/situation context objects)
CREATE TABLE pseo_taxonomy (
  id TEXT PRIMARY KEY,                       -- e.g., 'austin-tx', 'luxury', 'divorce'
  taxonomy_type TEXT NOT NULL 
    CHECK (taxonomy_type IN ('city', 'state', 'neighborhood', 'specialty', 'situation', 'property_type')),
  display_name TEXT NOT NULL,
  parent_id TEXT REFERENCES pseo_taxonomy(id),  -- state for city, city for neighborhood
  context JSONB NOT NULL,                    -- full context object
  is_active BOOLEAN DEFAULT true,
  tier INTEGER DEFAULT 3,                    -- 1 = highest priority
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_taxonomy_type ON pseo_taxonomy(taxonomy_type);
CREATE INDEX idx_taxonomy_parent ON pseo_taxonomy(parent_id);

-- Generation errors log
CREATE TABLE pseo_generation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  combination JSONB NOT NULL,
  error_type TEXT NOT NULL 
    CHECK (error_type IN ('api_error', 'validation_failed', 'quality_check_failed', 'timeout', 'parse_error')),
  error_detail TEXT,
  quality_check_failures JSONB,             -- which specific checks failed
  raw_response TEXT,                        -- truncated Claude response for debugging
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_errors_created_at ON pseo_generation_errors(created_at DESC);
CREATE INDEX idx_errors_type ON pseo_generation_errors(error_type);

-- Prompt templates table (allows updating prompts without code deploys)
CREATE TABLE pseo_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: prompts readable by admins only
ALTER TABLE pseo_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read prompts" ON pseo_prompts FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
```

---

## 6D. Quality Control Checklist

Automated checks that run before `is_published = true`:

```typescript
interface QualityCheck {
  check_id: string;
  description: string;
  severity: 'blocking' | 'warning';
  pass_condition: string;
}

const QUALITY_CHECKS: QualityCheck[] = [
  // Schema completeness
  {
    check_id: 'all_ai_fields_filled',
    description: 'All AI-FILL fields must be non-empty strings',
    severity: 'blocking',
    pass_condition: 'Every field marked AI-FILL is a non-empty string'
  },
  {
    check_id: 'array_counts_valid',
    description: 'All arrays must meet min/max counts from schema',
    severity: 'blocking',
    pass_condition: 'agents.length >= MIN, faq.length === required_count, related_pages.length in [4,6]'
  },
  {
    check_id: 'agents_minimum',
    description: 'Must have minimum agents for this page type',
    severity: 'blocking',
    pass_condition: 'agents.length >= page_type.MINIMUM_DATA_THRESHOLD'
  },

  // Word counts per field
  {
    check_id: 'hero_intro_length',
    description: 'hero.intro must be at least 2 full sentences (40+ words)',
    severity: 'blocking',
    pass_condition: 'wordCount(hero.intro) >= 40'
  },
  {
    check_id: 'faq_answer_length',
    description: 'Each FAQ answer must be 30+ words',
    severity: 'blocking',
    pass_condition: 'every faq answer wordCount >= 30'
  },
  {
    check_id: 'why_fits_substantive',
    description: 'Each agent why_fits must be 15+ words',
    severity: 'blocking',
    pass_condition: 'every agents[].why_fits wordCount >= 15'
  },

  // Specificity checks
  {
    check_id: 'city_name_in_hero',
    description: 'City name must appear in hero.headline or hero.intro',
    severity: 'blocking',
    pass_condition: 'hero.headline.includes(city) || hero.intro.includes(city)'
  },
  {
    check_id: 'specialty_in_why_fits',
    description: 'For specialty pages: specialty keyword in ≥50% of why_fits',
    severity: 'blocking',
    pass_condition: 'specialty pages only: count(why_fits contains specialty keyword) / agents.length >= 0.5'
  },
  {
    check_id: 'no_banned_phrases',
    description: 'Banned phrases must not appear in any AI-FILL field',
    severity: 'blocking',
    pass_condition: 'BANNED_PHRASES.every(phrase => !content_string.includes(phrase))',
    // BANNED_PHRASES = ['vibrant', 'bustling', 'thriving', 'passionate about', 
    //   'white-glove service', 'proven track record', 'has something for everyone']
  },

  // Duplicate detection
  {
    check_id: 'unique_hero_intro',
    description: 'hero.intro must not be substantially similar to existing pages',
    severity: 'blocking',
    pass_condition: 'Levenshtein similarity to any existing hero.intro < 0.75'
  },
  {
    check_id: 'unique_market_overview',
    description: 'content.market_overview must not be substantially similar to existing pages',
    severity: 'warning',
    pass_condition: 'similarity to any existing market_overview < 0.80'
  },

  // Internal link validity
  {
    check_id: 'related_pages_exist',
    description: 'All related_pages URLs must point to existing published pages or valid profile paths',
    severity: 'warning',
    pass_condition: 'each related_page.url resolves to a pseo_page or valid profile'
  },

  // Data freshness
  {
    check_id: 'agent_data_current',
    description: 'Agent data used in generation must be <24 hours old',
    severity: 'warning',
    pass_condition: 'data retrieval timestamp < 24 hours before generation'
  },

  // SEO basics
  {
    check_id: 'title_length',
    description: 'SEO title must be 50-65 characters',
    severity: 'warning',
    pass_condition: 'seo.title.length >= 50 && seo.title.length <= 65'
  },
  {
    check_id: 'description_length',
    description: 'Meta description must be 120-155 characters',
    severity: 'warning',
    pass_condition: 'seo.description.length >= 120 && seo.description.length <= 155'
  }
];

// Scoring: Each blocking check pass = required. Each warning check = 10 points.
// quality_score = (warning_checks_passed / total_warning_checks) * 100
// Page publishes if: all blocking checks pass AND quality_score >= 70
```

---

# PHASE 7: LAUNCH ROADMAP

## 6-Week Progressive Rollout

---

### Week 1: Tier 1 Cities — Core Page Types (Target: 50 pages)

**Generate:**
- 25 `city-directory` pages — Tier 1 cities (highest agent density)
- 25 `city-buyers-agent` pages — same Tier 1 cities

**Process:**
- Manual review of every page before publishing (no auto-publish yet)
- Spot-check: read at least 5 pages fully, verify city-specificity
- Fix prompt issues before generating more
- Submit sitemap to Google Search Console on Day 3
- Submit sitemap to Bing Webmaster Tools on Day 3

**GSC Signals to Watch (Day 7):**
- Crawled but not indexed: normal at this stage
- Discovered URL count increasing: good sign
- Any manual penalties: investigate immediately

**Decision Point — End of Week 1:**
- ✅ Proceed if: 0 manual penalties, quality reviews passing at 90%+
- ⚠️ Pause if: multiple quality issues requiring prompt fixes
- ❌ Stop if: manual penalty or Google sends quality-related signals

---

### Week 2: Adjust + Tier 1 Specialties (Target: 75 more pages)

**Generate:**
- 25 `city-listing-agent` pages — Tier 1 cities
- 25 `city-specialty` (luxury) — top 25 cities
- 25 `city-specialty` (first-time buyer) — top 25 cities

**Process:**
- Review first week's indexing rate from GSC
- Enable auto-publish for pages scoring 100 on all quality checks
- Refine prompts for any recurring issues from Week 1

**GSC Signals to Watch:**
- Impressions starting: expect to see first impressions week 2-3
- Indexed count growing: target 50%+ of Week 1 pages crawled
- Any CTR data: gives early signal on title/description quality

**Decision Point — End of Week 2:**
- ✅ Proceed if: Week 1 pages showing indexing progress
- ⚠️ Adjust if: Titles need optimization based on early impressions data
- Adjust title templates if CTR < 2% on indexed pages with impressions

---

### Week 3: Tier 2 Cities + Remaining Specialties (Target: 150 more pages)

**Generate:**
- 50 `city-directory` pages — Tier 2 cities
- 25 `city-specialty` (investment) — top 50 cities
- 25 `city-specialty` (relocation) — top 50 cities
- 25 `city-specialty` (military/VA) — cities near major military bases
- 25 `city-situation` (divorce) — top 50 cities

**Process:**
- Batch size increased (auto-publish enabled for Tier 1 cities)
- Begin internal linking audit: ensure all related_pages links resolve
- Publish state-directory pages for top 10 states

**Traffic Projection (Week 3 end):**
- Pages published: ~275
- Indexed: ~120-140 (40-50% rate typical for week 3)
- Organic clicks: 0-50/day (too early for significant traffic)

---

### Week 4: Tier 2 Expansion + Long-Tail Begin (Target: 200 more pages)

**Generate:**
- 50 `city-buyers-agent` pages — Tier 2 cities
- 50 `city-listing-agent` pages — Tier 2 cities  
- 50 `neighborhood-directory` pages — top neighborhoods in Tier 1 cities
- 25 `city-situation` (probate/estate) — top 50 cities
- 25 `state-directory` — remaining 40 states

**GSC Signals to Watch (Week 4):**
- Impressions: target 500+/day
- Clicks: target 20-50/day first organic visits
- Position tracking: any pages appearing in top 20 for target queries?
- Index coverage: target 60%+ of published pages crawled

**Decision Point — End of Week 4:**
- ✅ Scale if: organic clicks growing week-over-week
- ⚠️ Adjust if: pages indexed but CTR very low → optimize titles/descriptions
- 🔄 Improve if: pages not indexing → check technical SEO, canonical tags

---

### Week 5: Tier 3 Cities + Specialty Depth (Target: 250 more pages)

**Generate:**
- 100 `city-directory` pages — Tier 3 cities
- 75 `city-specialty` — remaining specialties across Tier 1-2 cities
- 50 `neighborhood-directory` — Tier 1 city neighborhoods
- 25 `city-situation` (remaining situations) — top cities

**Process:**
- First content refresh cycle: regenerate any Week 1 pages with stale data
- A/B test: create 10 page variants with alternative title templates
  Compare CTR after 2 weeks in GSC
- Internal linking health check: crawl all published pages

---

### Week 6: Full Scale + Optimization (Target: 300+ more pages)

**Generate:**
- Remaining combination gaps in Tier 1-2 cities
- Long-tail combos: city + specialty + property type (top 100)
- Additional neighborhood pages

**Traffic Projection (Week 6 end):**
- Pages published: ~1,300+
- Indexed: ~600-750 (40-50% indexing rate is typical at 6 weeks)
- Organic clicks: 150-400/day (based on industry benchmarks for similar platforms)
- Top performing page types: city-directory and city-buyers-agent expected to lead

---

## Traffic Projections — 90-Day View

| Metric | Month 1 | Month 2 | Month 3 |
|--------|---------|---------|---------|
| Pages Published | 275 | 800 | 1,500+ |
| Pages Indexed | 100 | 400 | 750 |
| Monthly Organic Sessions | 200 | 1,500 | 5,000 |
| Agent Profile Views from pSEO | 50 | 400 | 1,200 |
| Lead Form Submissions from pSEO | 5 | 40 | 120 |

*Projections based on 40-50% indexing rate, 2-4% CTR on indexed pages, 1-3% conversion from sessions to leads*

---

## GSC Monitoring Dashboard — Key Signals

**Weekly Reviews:**
1. New pages indexed (target: 40-50% of pages submitted)
2. Impressions per page (growing week-over-week = good)
3. Average position for target queries (top 20 = in the game)
4. CTR by page type (below 2% = title/description needs revision)
5. Any manual actions or coverage errors

**Red Flags That Require Immediate Pause:**
- Manual penalty from Google
- Coverage errors > 20% of submitted pages
- GSC "Crawled — currently not indexed" for majority of pages (thin content signal)
- Sudden impression drop after initial gains (algorithm update or quality issue)

**Optimization Triggers:**
- Pages in position 11-20 with 50+ impressions → optimize title/description
- Pages in position 1-10 with low CTR → test richer title variants
- High impressions, zero clicks → likely ranking for wrong queries → review content

---

# DELIVERABLES CHECKLIST

- [x] **Taxonomy:** All dimension values with full context objects (geography, specialty, property type, transaction side, life situation)
- [x] **Combination matrix** with tier priorities and estimated page counts
- [x] **Page type definitions** for all 7 page types (city-directory, city-specialty, city-buyers-agent, city-listing-agent, state-directory, neighborhood-directory, city-situation)
- [x] **TypeScript schema interfaces** for all 7 page types with field-level annotations (DETERMINISTIC / AI-FILL / FROM-DB)
- [x] **Generation prompts** for all page types with injection architecture, output rules, banned phrases, and quality tests
- [x] **React component specs** for all page types with layout, props interface, interactive features, schema markup, and performance requirements
- [x] **Supabase table SQL** — pseo_pages, pseo_combination_queue, pseo_taxonomy, pseo_generation_errors, pseo_prompts
- [x] **n8n workflow description** — 12-node workflow with triggers, branches, error handling
- [x] **6-week rollout roadmap** with targets, GSC signals, and decision points
- [x] **Estimated total pages** — ~9,550 at full build-out; ~1,500 after 6 weeks

---

## QUALITY BAR VERIFICATION

**Test: "Would this page be useful if search engines didn't exist?"**
→ Yes. A buyer researching Austin luxury agents would find real agent profiles, market context, and selection guidance regardless of how they arrived.

**Test: "If someone bookmarked this page, would they find it valuable a week later?"**
→ Yes. Agent directories and specialty pages serve as reference tools during extended home search processes that typically run 3-6 months.

**Test: "Is there anything generic filler rather than specific value?"**
→ The prompts specifically ban generic phrases and require city/specialty specificity. Quality checks enforce minimum specificity levels before publication. The structured data sources (real agent profiles, real listing data, real testimonials) ensure content is grounded in real platform data rather than invented.

---

*Document Version: 1.0 — AgentBio pSEO Complete Specification*  
*Generated: March 2026*  
*Next Review: After Week 2 launch results*
