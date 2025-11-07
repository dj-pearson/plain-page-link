import * as React from "react";
import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Eye, ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/Breadcrumbs";

// Category content configuration
const categoryContent: Record<string, {
  title: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  faqs: Array<{ question: string; answer: string }>;
}> = {
  "real-estate-tips": {
    title: "Real Estate Tips & Best Practices",
    description: "Expert advice and proven strategies for real estate professionals to grow their business, attract more clients, and close more deals. Whether you're a new agent or seasoned professional, these tips will help you succeed in today's competitive market. Learn about marketing strategies, client communication, negotiation tactics, and industry best practices from experienced agents who have built successful careers.",
    metaDescription: "Expert real estate tips for agents and professionals. Marketing strategies, client communication, negotiation tactics, and best practices to grow your business.",
    keywords: ["real estate tips", "agent advice", "realtor best practices", "real estate marketing", "agent success tips", "real estate professional development"],
    faqs: [
      {
        question: "What are the most important skills for real estate agents?",
        answer: "The most critical skills include strong communication, negotiation expertise, market knowledge, marketing prowess, time management, and relationship building. Successful agents also need tech proficiency, problem-solving abilities, and emotional intelligence to navigate complex transactions and client relationships."
      },
      {
        question: "How can new real estate agents get their first clients?",
        answer: "New agents should start by building their sphere of influence—tell everyone you know about your new career. Leverage social media to showcase your expertise, attend networking events, partner with experienced agents, offer exceptional customer service, and consider open house hosting. Creating valuable content and maintaining a professional online presence are also key strategies."
      },
      {
        question: "What marketing strategies work best for real estate agents?",
        answer: "Effective marketing strategies include social media marketing (especially Instagram and Facebook), email campaigns to your database, professional photography and virtual tours, local SEO optimization, content marketing through blogs and videos, paid advertising on platforms like Zillow and Realtor.com, and maintaining an updated personal website or portfolio like AgentBio."
      },
      {
        question: "How do successful agents manage their time effectively?",
        answer: "Top agents use CRM systems to manage contacts, block schedule their days for specific activities, automate repetitive tasks, delegate administrative work, prioritize high-value activities like client meetings and showings, and maintain strict boundaries between work and personal time. They also batch similar tasks together for efficiency."
      }
    ]
  },
  "market-insights": {
    title: "Real Estate Market Insights & Analysis",
    description: "Stay informed with the latest real estate market trends, data-driven analysis, and economic indicators affecting property values. Our market insights help agents, buyers, and sellers make informed decisions based on current conditions, seasonal patterns, and emerging trends. From housing inventory levels to interest rate impacts, we cover the factors that drive real estate markets locally and nationally.",
    metaDescription: "Real estate market insights, trends, and analysis. Housing data, economic indicators, market predictions, and expert analysis for informed real estate decisions.",
    keywords: ["real estate market trends", "housing market analysis", "market insights", "real estate data", "property market trends", "housing market forecast"],
    faqs: [
      {
        question: "What factors affect real estate market trends?",
        answer: "Key factors include interest rates, economic conditions (employment, GDP growth), housing supply and demand, local job market strength, population growth, government policies and regulations, seasonal patterns, and consumer confidence. Infrastructure development and school quality also significantly impact local markets."
      },
      {
        question: "How do interest rates impact the housing market?",
        answer: "Higher interest rates increase mortgage costs, reducing buyer purchasing power and often cooling demand. This can lead to slower price growth or price decreases. Conversely, lower rates make borrowing cheaper, typically increasing buyer demand and putting upward pressure on prices. A 1% rate change can affect purchasing power by about 10%."
      },
      {
        question: "Is now a good time to buy or sell a home?",
        answer: "The answer depends on local market conditions, personal financial situation, and long-term goals. Generally, seller's markets (low inventory, high demand) favor sellers with higher prices and faster sales. Buyer's markets (high inventory, lower demand) offer buyers more negotiating power. Consult local market data and a real estate professional for personalized advice."
      },
      {
        question: "How can I predict future market trends?",
        answer: "While prediction is challenging, monitor leading indicators: new housing permits, mortgage application volume, employment data, consumer confidence indices, and local economic development. Watch for seasonal patterns, track days on market metrics, and analyze inventory levels. Historical data provides context, but remember that past performance doesn't guarantee future results."
      }
    ]
  },
  "buying-guide": {
    title: "Home Buying Guide & First-Time Buyer Tips",
    description: "Navigate the home buying process with confidence using our comprehensive guides. From getting pre-approved for a mortgage to closing day, we cover every step of the home buying journey. First-time buyers will find valuable information about down payments, loan types, home inspections, and what to expect during the purchase process. Learn how to find the right home, make competitive offers, and avoid common pitfalls that could derail your purchase.",
    metaDescription: "Complete home buying guide for first-time and experienced buyers. Mortgage tips, home search strategies, offer negotiations, and closing process explained.",
    keywords: ["home buying guide", "first time home buyer", "buying a house", "home purchase process", "mortgage advice", "home buyer tips"],
    faqs: [
      {
        question: "How much do I need for a down payment?",
        answer: "Down payment requirements vary by loan type. Conventional loans typically require 3-20% down, FHA loans require as little as 3.5%, VA loans (for veterans) and USDA loans (for rural properties) may require 0% down. While 20% down avoids PMI (private mortgage insurance), many buyers successfully purchase with less. First-time buyer programs may offer down payment assistance."
      },
      {
        question: "What credit score do I need to buy a home?",
        answer: "Minimum credit scores vary by loan type: FHA loans accept scores as low as 580 (sometimes 500 with larger down payment), conventional loans typically require 620+, and VA loans generally need 580+. Higher scores (740+) qualify for better interest rates. If your score is low, spend 6-12 months improving it before applying to save thousands in interest."
      },
      {
        question: "How long does the home buying process take?",
        answer: "From offer acceptance to closing typically takes 30-45 days for financed purchases. The timeline includes home inspection (7-10 days), appraisal (1-2 weeks), mortgage underwriting (2-3 weeks), and final walk-through. Cash purchases can close in as little as 1-2 weeks. Pre-approval before house hunting can expedite the process significantly."
      },
      {
        question: "What should I look for during a home showing?",
        answer: "Beyond aesthetics, check for: foundation cracks, roof condition, water damage signs, HVAC age, electrical panel capacity, plumbing condition, window quality, signs of pests, neighborhood noise levels, and natural light. Take notes and photos, test all faucets and appliances, open closets, and don't hesitate to ask questions about age of major systems and recent updates."
      }
    ]
  },
  "selling-guide": {
    title: "Home Selling Guide & Seller Strategies",
    description: "Maximize your home's value and sell faster with expert selling strategies. Our guides cover home staging, pricing strategies, negotiation tactics, and marketing approaches that attract qualified buyers. Learn how to prepare your home for sale, what repairs to make (and skip), how to price competitively, and how to navigate multiple offers. Whether you're selling in a hot market or facing challenges, we provide actionable advice to help you achieve your selling goals and maximize your return on investment.",
    metaDescription: "Home selling guide with expert strategies for pricing, staging, marketing, and negotiations. Maximize your home's value and sell faster with proven tactics.",
    keywords: ["home selling guide", "sell house fast", "home staging tips", "pricing strategy", "home seller advice", "maximize home value"],
    faqs: [
      {
        question: "How do I price my home correctly?",
        answer: "Work with a local agent to conduct a Comparative Market Analysis (CMA) examining recently sold homes (within 6 months) with similar features in your area. Consider current market conditions, your home's condition, unique features, and days on market for comparable properties. Price slightly below market value to generate multiple offers, or at market value for a more measured approach. Overpricing typically leads to longer market time and lower final sale prices."
      },
      {
        question: "What home improvements should I make before selling?",
        answer: "Focus on high-ROI improvements: fresh paint (neutral colors), deep cleaning, landscaping/curb appeal, minor repairs, updating light fixtures, replacing worn carpet, decluttering/depersonalizing. Avoid major renovations unless necessary for function. Kitchen and bathroom updates offer good returns but keep them modest. Professional staging (even virtual) typically pays for itself in faster sales and higher prices."
      },
      {
        question: "How long does it take to sell a house?",
        answer: "In balanced markets, expect 30-60 days from listing to closing. Hot markets may see multiple offers within days and close in 2-3 weeks. Slower markets could take 3-6 months. Factors affecting timeline: price, condition, location, season, marketing quality, and local inventory levels. Well-priced, well-presented homes in good locations typically sell fastest."
      },
      {
        question: "Should I sell my home as-is or make repairs?",
        answer: "Depends on your situation and local market. Making repairs typically yields higher net proceeds, but requires upfront capital and time. Selling as-is works for: inherited properties, financial hardship, major repair needs, or hot markets with low inventory. Price as-is homes 5-15% below market value to account for needed repairs. Consult with agents for cost-benefit analysis specific to your situation."
      }
    ]
  },
  "investment": {
    title: "Real Estate Investment & Wealth Building",
    description: "Build wealth through real estate investment with strategies for rental properties, fix-and-flip projects, and long-term portfolio growth. Learn how to analyze deals, calculate returns, finance investment properties, and manage tenants effectively. Whether you're looking to buy your first rental property or expand your real estate portfolio, our investment guides provide the knowledge and tools you need to make informed decisions and maximize your returns.",
    metaDescription: "Real estate investment guide covering rental properties, fix-and-flip, ROI analysis, financing strategies, and wealth building through property investment.",
    keywords: ["real estate investment", "rental property investing", "investment property", "real estate ROI", "property investing", "wealth building real estate"],
    faqs: [
      {
        question: "How much money do I need to start investing in real estate?",
        answer: "Investment property down payments typically require 15-25% (conventional loans), though creative strategies exist. For a $200,000 property, expect $30,000-$50,000 down plus closing costs ($4,000-$8,000) and reserves (3-6 months expenses). House hacking (living in one unit of a multi-family) allows 3.5% down. Partner with others, use home equity, or start with wholesaling to begin with less capital."
      },
      {
        question: "What is a good ROI for rental property?",
        answer: "Target metrics: 1% rule (monthly rent = 1% of purchase price), 8-12% cash-on-cash return, 15%+ total return including appreciation and principal paydown. Cap rate of 6-10% indicates good investment. However, returns vary by market—appreciation markets may have lower cash flow but higher long-term returns. Run thorough pro forma calculations including all expenses: taxes, insurance, maintenance, vacancies (8-10%), and property management."
      },
      {
        question: "Is fix-and-flip or rental property investment better?",
        answer: "Fix-and-flip offers quick profits (ideally 15-20% ROI in 3-6 months) but requires active work, carries more risk, and creates ordinary income tax. Rentals provide passive income, tax benefits, appreciation, and equity buildup but need more capital and management. Many investors use flip profits to fund rental property purchases, combining both strategies. Your choice depends on capital, time, skills, market conditions, and financial goals."
      },
      {
        question: "How do I find good investment properties?",
        answer: "Strategies: work with investor-friendly agents who understand numbers, search MLS for distressed properties or high days-on-market listings, drive for dollars in target neighborhoods, network at REI meetups, use online platforms (Roofstock, Bigger Pockets), direct mail to out-of-state owners, estate sales, foreclosure auctions, and off-market deals through wholesalers. Run numbers on many properties—expect to analyze 100+ to find one great deal."
      }
    ]
  },
  "neighborhood-guides": {
    title: "Neighborhood Guides & Community Profiles",
    description: "Explore detailed neighborhood guides featuring local amenities, schools, demographics, and lifestyle information. Our community profiles help buyers find the perfect neighborhood that matches their lifestyle preferences and budget. Learn about commute times, local attractions, school ratings, crime statistics, and what makes each neighborhood unique. Whether you're moving across town or to a new city, these guides provide the local insight you need to make an informed decision about where to call home.",
    metaDescription: "Comprehensive neighborhood guides with school ratings, amenities, demographics, and lifestyle information. Find the perfect community for your family and budget.",
    keywords: ["neighborhood guides", "community profiles", "best neighborhoods", "school ratings", "local amenities", "neighborhood analysis"],
    faqs: [
      {
        question: "What should I research about a neighborhood before buying?",
        answer: "Key factors: school quality (even if no children—affects resale), crime rates and safety, walkability score, proximity to work/amenities, property tax rates, HOA fees and rules, noise levels at different times, future development plans, demographic trends, local government stability, flood zones, and resale history. Visit at different times and days, talk to neighbors, and check community Facebook groups for insider perspectives."
      },
      {
        question: "How important are school ratings when choosing a neighborhood?",
        answer: "Very important, even for buyers without children. Highly-rated school districts command premium prices (10-20% higher) and sell faster. They attract quality buyers, maintain property values better, and indicate strong community investment. Check GreatSchools.org ratings, state test scores, graduation rates, and student-teacher ratios. Visit schools and talk to parents for real insights beyond ratings."
      },
      {
        question: "What makes a neighborhood 'up-and-coming'?",
        answer: "Signs include: new restaurants/cafes opening, home renovations increasing, young professionals/families moving in, improving crime statistics, new infrastructure/transit development, developer interest, rising property values (but still below surrounding areas), and increasing investor activity. Look for proximity to established desirable areas, good bones (walkable, character homes), and planned improvements. These neighborhoods offer value and appreciation potential."
      },
      {
        question: "How do I determine if a neighborhood is a good investment?",
        answer: "Analyze: property value trends (3-5 year appreciation), employment growth in the area, population growth, new business development, school quality trajectory, inventory levels, days on market, rental demand and rates, crime trends, infrastructure investment, and master development plans. Compare to citywide averages. Strong rental demand, low inventory, and consistent appreciation indicate solid investment neighborhoods."
      }
    ]
  },
  "home-improvement": {
    title: "Home Improvement & Property Value Enhancement",
    description: "Increase your home's value with strategic improvements and renovations. Our guides cover which projects offer the best return on investment, how to plan major renovations, and DIY tips for common home updates. From kitchen remodels to landscaping projects, learn how to prioritize improvements that buyers value most. Discover cost-effective upgrades that make a big impact, avoid over-improving for your neighborhood, and understand which renovations add the most value to your property.",
    metaDescription: "Home improvement guide with ROI analysis, renovation tips, DIY projects, and strategies to increase property value through strategic updates and remodeling.",
    keywords: ["home improvement ROI", "renovation tips", "home remodeling", "increase home value", "DIY home projects", "property improvements"],
    faqs: [
      {
        question: "Which home improvements have the best ROI?",
        answer: "Top ROI projects: minor kitchen remodel (70-80% return), bathroom remodel (60-70%), new garage door (90-95%), manufactured stone veneer (95-100%), deck addition (70-75%), entry door replacement (75-90%), and siding replacement (75-85%). However, ROI varies by market, home age, and current condition. Generally, repairs and updates yield better returns than additions or luxury upgrades."
      },
      {
        question: "Should I renovate my kitchen before selling?",
        answer: "Depends on current condition and budget. Full kitchen remodels ($30,000-$70,000) recoup 50-70%, so major renovations aren't always worthwhile before selling. Instead, consider minor updates: paint cabinets, replace hardware, update lighting, add new countertops, modern faucet, or new appliances. If your kitchen is outdated but functional, price accordingly or offer credit—some buyers prefer choosing finishes themselves."
      },
      {
        question: "What home improvements should I avoid before selling?",
        answer: "Avoid: personal taste projects (exotic paint colors, unique tile), luxury upgrades that exceed neighborhood standards, swimming pools (limit buyer pool), extensive landscaping (maintenance concerns), converting bedrooms (reduces appeal), unfinished projects, and high-cost items like solar panels (won't recoup costs). Focus on repairs, maintenance, and neutral updates with broad appeal instead."
      },
      {
        question: "How can I improve my home's curb appeal on a budget?",
        answer: "Affordable curb appeal boosters: paint or replace front door, clean/repair gutters and downspouts, power wash exterior, add mulch and flowers to beds, trim bushes and trees, replace mailbox, add outdoor lighting, clean/repair walkways, paint house numbers, mow and edge lawn regularly. These projects cost $500-$2,000 total but can increase perceived value significantly—first impressions greatly impact buyer interest."
      }
    ]
  },
  "general": {
    title: "General Real Estate Information & Resources",
    description: "Comprehensive real estate information covering industry news, legal considerations, technology trends, and professional development for agents and consumers. Stay updated on changing regulations, emerging PropTech solutions, market shifts, and best practices in real estate. Whether you're a consumer looking to understand real estate processes or an agent seeking professional growth, these resources provide valuable insights into all aspects of the real estate industry.",
    metaDescription: "General real estate information, industry news, legal updates, technology trends, and professional resources for agents and home buyers/sellers.",
    keywords: ["real estate information", "real estate news", "real estate industry", "property information", "real estate resources", "real estate education"],
    faqs: [
      {
        question: "What are the current challenges facing the real estate industry?",
        answer: "Key challenges include: affordability crisis with rising home prices outpacing wage growth, interest rate volatility affecting buyer demand, inventory shortages in many markets, regulatory compliance complexity, climate change impacts on insurance and property values, technology disruption requiring agent adaptation, and changing consumer expectations for digital experiences. Agents must evolve with market conditions and embrace technology to stay competitive."
      },
      {
        question: "How is technology changing real estate?",
        answer: "PropTech innovations include: virtual tours and 3D walkthroughs, AI-powered property valuation, blockchain for transactions, digital closing platforms, CRM automation, predictive analytics for pricing, drone photography, IoT smart home integration, instant online offers (iBuyers), and virtual staging. These tools improve efficiency, enhance marketing, and provide better customer experiences. Agents who leverage technology effectively gain competitive advantages."
      },
      {
        question: "Do I need a real estate agent or can I buy/sell on my own?",
        answer: "While FSBO (For Sale By Owner) is possible, agents provide: market expertise, pricing accuracy, marketing reach, negotiation skills, legal protection, transaction coordination, and access to MLS. Seller agents typically achieve 5-10% higher sale prices, offsetting commission costs. Buyer agents are usually free to buyers (paid by sellers), provide market insights, and protect your interests. Complex transactions especially benefit from professional representation."
      },
      {
        question: "What legal documents are involved in real estate transactions?",
        answer: "Key documents include: purchase agreement (offer), seller disclosures, title report and insurance, home inspection reports, appraisal, loan documents (mortgage note, deed of trust), closing disclosure, deed transfer, and various addenda for contingencies. Each state has specific requirements. Agents and attorneys help navigate these documents, ensuring all parties understand their rights and obligations. Never sign documents you don't understand—seek clarification."
      }
    ]
  }
};

export default function BlogCategory() {
  const { category } = useParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState("");

  // Get category content
  const content = category ? categoryContent[category] : null;

  // Fetch articles for this category
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["category-articles", category],
    queryFn: async () => {
      if (!category) return [];

      // Convert URL slug back to category name
      const categoryName = category
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .ilike("category", `%${categoryName}%`)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!category,
  });

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;

    return articles.filter((article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, searchQuery]);

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Generate schema
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `https://agentbio.net/blog/category/${category}#webpage`,
        "url": `https://agentbio.net/blog/category/${category}`,
        "name": content.title,
        "description": content.description,
        "isPartOf": {
          "@id": "https://agentbio.net/#website"
        },
        "about": {
          "@type": "Thing",
          "name": content.title
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://agentbio.net"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": "https://agentbio.net/blog"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": content.title,
            "item": `https://agentbio.net/blog/category/${category}`
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": content.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  };

  return (
    <>
      <SEOHead
        title={`${content.title} | AgentBio Blog`}
        description={content.metaDescription}
        keywords={content.keywords}
        canonicalUrl={`https://agentbio.net/blog/category/${category}`}
        schema={schema}
      />

      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />

        {/* Category Header */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl">
              {/* Breadcrumbs */}
              <div className="mb-4">
                <Breadcrumbs
                  items={[
                    { name: "Blog", href: "/blog" },
                    { name: content.title, href: `/blog/category/${category}` }
                  ]}
                />
              </div>

              {/* Back to Blog */}
              <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to All Articles
              </Link>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {content.title}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {content.description}
              </p>
            </div>
          </div>
        </div>

        {/* Articles Section */}
        <div className="container mx-auto px-4 py-12">
          {/* Search */}
          <div className="max-w-md mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles in this category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Article Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading articles...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No articles found matching your search."
                  : "No articles in this category yet."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  {article.featured_image_url && (
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{article.category}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.view_count || 0}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(article.published_at).toLocaleDateString()}
                    </span>
                    <Link to={`/blog/${article.slug}`}>
                      <Button variant="ghost" size="sm">
                        Read More →
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto mt-16 pt-16 border-t">
            <h2 className="text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {content.faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </div>

        <PublicFooter />
      </div>
    </>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold pr-4">{question}</h3>
        <svg
          className={`w-5 h-5 text-primary transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <CardContent className="pt-0 pb-4">
          <p className="text-muted-foreground leading-relaxed">{answer}</p>
        </CardContent>
      )}
    </Card>
  );
}
