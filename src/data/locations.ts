/**
 * Location Data for Programmatic SEO
 * Scalable city-specific landing pages for real estate agents
 */

export interface LocationData {
  city: string;
  state: string;
  stateAbbr: string;
  slug: string;
  medianPrice: string;
  marketTrend: 'Rising' | 'Stable' | 'Cooling' | 'Hot';
  agentCount: string;
  marketDescription: string;
  neighborhoods: string[];
  metroArea?: string;
  population?: string;
  avgDaysOnMarket?: string;
}

/**
 * All location data for programmatic pages
 * Each location generates a unique landing page at /for/{slug}
 */
export const LOCATIONS: LocationData[] = [
  // Existing locations (enhanced)
  {
    city: 'Miami',
    state: 'Florida',
    stateAbbr: 'FL',
    slug: 'miami-real-estate-agents',
    medianPrice: '$565,000',
    marketTrend: 'Rising',
    agentCount: '8,500+',
    population: '450,000',
    avgDaysOnMarket: '42',
    marketDescription: "Miami's luxury condo market and international buyer demand create unique opportunities for agents with strong Instagram presence and bilingual capabilities.",
    neighborhoods: [
      'Brickell', 'Coconut Grove', 'Coral Gables', 'Miami Beach', 'Wynwood',
      'Design District', 'Key Biscayne', 'Aventura', 'Bal Harbour',
      'Sunny Isles Beach', 'Pinecrest', 'South Beach',
    ],
  },
  {
    city: 'Austin',
    state: 'Texas',
    stateAbbr: 'TX',
    slug: 'austin-real-estate-agents',
    medianPrice: '$525,000',
    marketTrend: 'Stable',
    agentCount: '6,200+',
    population: '1,000,000',
    avgDaysOnMarket: '55',
    marketDescription: "Austin's tech-driven economy and influx of California transplants have reshaped the market. Agents succeed by showcasing modern homes and lifestyle amenities.",
    neighborhoods: [
      'Downtown', 'East Austin', 'South Congress', 'Zilker', 'Hyde Park',
      'Mueller', 'Domain', 'Westlake', 'Lakeway', 'Round Rock',
      'Cedar Park', 'Pflugerville',
    ],
  },
  {
    city: 'Phoenix',
    state: 'Arizona',
    stateAbbr: 'AZ',
    slug: 'phoenix-real-estate-agents',
    medianPrice: '$445,000',
    marketTrend: 'Stable',
    agentCount: '7,800+',
    population: '1,600,000',
    avgDaysOnMarket: '48',
    marketDescription: "Phoenix offers affordability compared to coastal markets, attracting remote workers and retirees. Agents benefit from showcasing desert lifestyle and modern communities.",
    neighborhoods: [
      'Scottsdale', 'Paradise Valley', 'Arcadia', 'Biltmore', 'Downtown Phoenix',
      'Tempe', 'Gilbert', 'Chandler', 'Mesa', 'Ahwatukee',
      'Camelback East', 'North Mountain',
    ],
  },
  {
    city: 'Denver',
    state: 'Colorado',
    stateAbbr: 'CO',
    slug: 'denver-real-estate-agents',
    medianPrice: '$595,000',
    marketTrend: 'Stable',
    agentCount: '5,500+',
    population: '715,000',
    avgDaysOnMarket: '38',
    marketDescription: "Denver's outdoor lifestyle appeal and growing tech sector drive consistent demand. Agents succeed by highlighting mountain access and urban amenities.",
    neighborhoods: [
      'LoDo', 'RiNo', 'Cherry Creek', 'Highlands', 'Wash Park',
      'Capitol Hill', 'Congress Park', 'Stapleton', 'Park Hill', 'Sloan Lake',
      'Golden Triangle', 'Five Points',
    ],
  },
  {
    city: 'Los Angeles',
    state: 'California',
    stateAbbr: 'CA',
    slug: 'los-angeles-real-estate-agents',
    medianPrice: '$975,000',
    marketTrend: 'Stable',
    agentCount: '25,000+',
    population: '3,900,000',
    avgDaysOnMarket: '45',
    marketDescription: "LA's diverse neighborhoods and entertainment industry create a dynamic market. Agents with strong social media presence capture high-value clients from Instagram.",
    neighborhoods: [
      'Beverly Hills', 'Santa Monica', 'Hollywood Hills', 'Bel Air', 'Brentwood',
      'Pacific Palisades', 'Venice', 'Silver Lake', 'Echo Park', 'Los Feliz',
      'Manhattan Beach', 'Malibu',
    ],
  },

  // New locations for programmatic SEO
  {
    city: 'New York',
    state: 'New York',
    stateAbbr: 'NY',
    slug: 'new-york-real-estate-agents',
    medianPrice: '$750,000',
    marketTrend: 'Stable',
    agentCount: '45,000+',
    population: '8,300,000',
    avgDaysOnMarket: '65',
    marketDescription: "NYC's competitive market demands agents with strong digital presence. Instagram-savvy agents showcase luxury listings and neighborhood expertise to stand out.",
    neighborhoods: [
      'Manhattan', 'Brooklyn Heights', 'Tribeca', 'SoHo', 'Upper East Side',
      'Upper West Side', 'Chelsea', 'Greenwich Village', 'Williamsburg', 'DUMBO',
      'Park Slope', 'Long Island City',
    ],
  },
  {
    city: 'San Francisco',
    state: 'California',
    stateAbbr: 'CA',
    slug: 'san-francisco-real-estate-agents',
    medianPrice: '$1,350,000',
    marketTrend: 'Cooling',
    agentCount: '8,200+',
    population: '875,000',
    avgDaysOnMarket: '52',
    marketDescription: "SF's tech wealth creates demand for premium properties. Agents leverage Instagram to reach tech professionals seeking urban living with Bay Area lifestyle.",
    neighborhoods: [
      'Pacific Heights', 'Marina', 'Noe Valley', 'Mission District', 'SOMA',
      'Hayes Valley', 'Castro', 'Russian Hill', 'North Beach', 'Presidio Heights',
      'Cole Valley', 'Potrero Hill',
    ],
  },
  {
    city: 'Seattle',
    state: 'Washington',
    stateAbbr: 'WA',
    slug: 'seattle-real-estate-agents',
    medianPrice: '$825,000',
    marketTrend: 'Stable',
    agentCount: '6,800+',
    population: '750,000',
    avgDaysOnMarket: '35',
    marketDescription: "Seattle's tech giants drive consistent housing demand. Agents use Instagram to showcase waterfront properties and access to Pacific Northwest outdoor lifestyle.",
    neighborhoods: [
      'Capitol Hill', 'Queen Anne', 'Ballard', 'Fremont', 'Green Lake',
      'Wallingford', 'Madison Park', 'Magnolia', 'West Seattle', 'Columbia City',
      'Beacon Hill', 'University District',
    ],
  },
  {
    city: 'Chicago',
    state: 'Illinois',
    stateAbbr: 'IL',
    slug: 'chicago-real-estate-agents',
    medianPrice: '$335,000',
    marketTrend: 'Rising',
    agentCount: '12,000+',
    population: '2,700,000',
    avgDaysOnMarket: '42',
    marketDescription: "Chicago offers urban living at accessible prices. Agents showcase diverse neighborhoods from luxury high-rises to classic brownstones via social media.",
    neighborhoods: [
      'Lincoln Park', 'Lakeview', 'Wicker Park', 'River North', 'Gold Coast',
      'Old Town', 'Logan Square', 'Bucktown', 'West Loop', 'South Loop',
      'Andersonville', 'Hyde Park',
    ],
  },
  {
    city: 'Dallas',
    state: 'Texas',
    stateAbbr: 'TX',
    slug: 'dallas-real-estate-agents',
    medianPrice: '$395,000',
    marketTrend: 'Rising',
    agentCount: '9,500+',
    population: '1,300,000',
    avgDaysOnMarket: '38',
    marketDescription: "Dallas attracts corporate relocations with no state income tax. Agents succeed by showcasing master-planned communities and urban revitalization projects.",
    neighborhoods: [
      'Uptown', 'Highland Park', 'Preston Hollow', 'Lakewood', 'Deep Ellum',
      'Bishop Arts', 'Oak Lawn', 'Knox-Henderson', 'M Streets', 'Kessler Park',
      'Frisco', 'Plano',
    ],
  },
  {
    city: 'Houston',
    state: 'Texas',
    stateAbbr: 'TX',
    slug: 'houston-real-estate-agents',
    medianPrice: '$335,000',
    marketTrend: 'Rising',
    agentCount: '11,000+',
    population: '2,300,000',
    avgDaysOnMarket: '45',
    marketDescription: "Houston's energy sector and medical center drive diverse housing needs. Agents leverage Instagram to reach relocating professionals and international buyers.",
    neighborhoods: [
      'River Oaks', 'Memorial', 'Heights', 'Montrose', 'West University',
      'Midtown', 'Bellaire', 'Sugar Land', 'The Woodlands', 'Katy',
      'Galleria', 'Museum District',
    ],
  },
  {
    city: 'San Diego',
    state: 'California',
    stateAbbr: 'CA',
    slug: 'san-diego-real-estate-agents',
    medianPrice: '$895,000',
    marketTrend: 'Stable',
    agentCount: '7,200+',
    population: '1,400,000',
    avgDaysOnMarket: '35',
    marketDescription: "San Diego's beach lifestyle and military presence create steady demand. Agents showcase coastal living and perfect weather year-round on Instagram.",
    neighborhoods: [
      'La Jolla', 'Del Mar', 'Coronado', 'Pacific Beach', 'Mission Beach',
      'Encinitas', 'Carlsbad', 'North Park', 'Hillcrest', 'Point Loma',
      'Rancho Santa Fe', 'Carmel Valley',
    ],
  },
  {
    city: 'Atlanta',
    state: 'Georgia',
    stateAbbr: 'GA',
    slug: 'atlanta-real-estate-agents',
    medianPrice: '$415,000',
    marketTrend: 'Rising',
    agentCount: '8,500+',
    population: '500,000',
    avgDaysOnMarket: '35',
    marketDescription: "Atlanta's film industry and corporate headquarters drive relocation demand. Agents use social media to showcase diverse neighborhoods and Southern charm.",
    neighborhoods: [
      'Buckhead', 'Midtown', 'Virginia-Highland', 'Decatur', 'Inman Park',
      'Grant Park', 'Old Fourth Ward', 'West Midtown', 'Brookhaven', 'Sandy Springs',
      'Alpharetta', 'Marietta',
    ],
  },
  {
    city: 'Nashville',
    state: 'Tennessee',
    stateAbbr: 'TN',
    slug: 'nashville-real-estate-agents',
    medianPrice: '$450,000',
    marketTrend: 'Hot',
    agentCount: '5,800+',
    population: '690,000',
    avgDaysOnMarket: '32',
    marketDescription: "Nashville's music industry and low taxes attract relocations from coastal cities. Agents showcase the city's unique culture and growing neighborhoods.",
    neighborhoods: [
      'The Gulch', 'East Nashville', '12 South', 'Germantown', 'Sylvan Park',
      'Green Hills', 'Belle Meade', 'Brentwood', 'Franklin', 'Hillsboro Village',
      'Wedgewood-Houston', 'Berry Hill',
    ],
  },
  {
    city: 'Charlotte',
    state: 'North Carolina',
    stateAbbr: 'NC',
    slug: 'charlotte-real-estate-agents',
    medianPrice: '$395,000',
    marketTrend: 'Rising',
    agentCount: '6,200+',
    population: '880,000',
    avgDaysOnMarket: '38',
    marketDescription: "Charlotte's banking sector and NASCAR culture create unique market dynamics. Agents succeed by highlighting family-friendly suburbs and urban revitalization.",
    neighborhoods: [
      'South End', 'NoDa', 'Plaza Midwood', 'Dilworth', 'Myers Park',
      'Uptown', 'SouthPark', 'Ballantyne', 'Huntersville', 'Lake Norman',
      'Matthews', 'Mint Hill',
    ],
  },
  {
    city: 'Las Vegas',
    state: 'Nevada',
    stateAbbr: 'NV',
    slug: 'las-vegas-real-estate-agents',
    medianPrice: '$425,000',
    marketTrend: 'Stable',
    agentCount: '7,500+',
    population: '650,000',
    avgDaysOnMarket: '42',
    marketDescription: "Las Vegas attracts retirees and remote workers with no state income tax. Agents showcase luxury properties and master-planned communities on Instagram.",
    neighborhoods: [
      'Summerlin', 'Henderson', 'Green Valley', 'The Lakes', 'Southern Highlands',
      'Seven Hills', 'Anthem', 'Mountains Edge', 'Centennial Hills', 'Downtown',
      'Spring Valley', 'Enterprise',
    ],
  },
  {
    city: 'Boston',
    state: 'Massachusetts',
    stateAbbr: 'MA',
    slug: 'boston-real-estate-agents',
    medianPrice: '$795,000',
    marketTrend: 'Stable',
    agentCount: '6,500+',
    population: '685,000',
    avgDaysOnMarket: '28',
    marketDescription: "Boston's universities and biotech sector drive consistent demand. Agents showcase historic brownstones and waterfront condos to educated buyers.",
    neighborhoods: [
      'Back Bay', 'Beacon Hill', 'South End', 'Seaport', 'Cambridge',
      'Brookline', 'Jamaica Plain', 'Charlestown', 'North End', 'Fenway',
      'Somerville', 'Newton',
    ],
  },
  {
    city: 'Portland',
    state: 'Oregon',
    stateAbbr: 'OR',
    slug: 'portland-real-estate-agents',
    medianPrice: '$525,000',
    marketTrend: 'Cooling',
    agentCount: '4,800+',
    population: '650,000',
    avgDaysOnMarket: '48',
    marketDescription: "Portland's creative culture and outdoor access appeal to buyers seeking work-life balance. Agents highlight unique neighborhoods and sustainable living.",
    neighborhoods: [
      'Pearl District', 'Alberta Arts', 'Hawthorne', 'Division', 'Mississippi',
      'Sellwood', 'Lake Oswego', 'West Hills', 'Laurelhurst', 'Irvington',
      'St Johns', 'Beaverton',
    ],
  },
  {
    city: 'Tampa',
    state: 'Florida',
    stateAbbr: 'FL',
    slug: 'tampa-real-estate-agents',
    medianPrice: '$395,000',
    marketTrend: 'Rising',
    agentCount: '6,800+',
    population: '400,000',
    avgDaysOnMarket: '38',
    marketDescription: "Tampa's waterfront living and no state income tax attract Northeast relocations. Agents showcase beach access and growing downtown development.",
    neighborhoods: [
      'South Tampa', 'Hyde Park', 'Channelside', 'Seminole Heights', 'Ybor City',
      'Westshore', 'Davis Islands', 'Harbour Island', 'Clearwater Beach', 'St Pete Beach',
      'Wesley Chapel', 'Brandon',
    ],
  },
  {
    city: 'Orlando',
    state: 'Florida',
    stateAbbr: 'FL',
    slug: 'orlando-real-estate-agents',
    medianPrice: '$385,000',
    marketTrend: 'Rising',
    agentCount: '7,200+',
    population: '310,000',
    avgDaysOnMarket: '42',
    marketDescription: "Orlando's tourism industry and theme parks create unique investment opportunities. Agents market vacation rentals and family homes to diverse buyers.",
    neighborhoods: [
      'Winter Park', 'Dr Phillips', 'Lake Nona', 'College Park', 'Thornton Park',
      'Celebration', 'Windermere', 'Baldwin Park', 'Maitland', 'Altamonte Springs',
      'Kissimmee', 'Lake Mary',
    ],
  },
  {
    city: 'San Antonio',
    state: 'Texas',
    stateAbbr: 'TX',
    slug: 'san-antonio-real-estate-agents',
    medianPrice: '$295,000',
    marketTrend: 'Rising',
    agentCount: '5,500+',
    population: '1,500,000',
    avgDaysOnMarket: '45',
    marketDescription: "San Antonio offers Texas affordability with rich history and culture. Agents showcase military-friendly communities and historic neighborhoods.",
    neighborhoods: [
      'Alamo Heights', 'King William', 'Stone Oak', 'The Dominion', 'Southtown',
      'Monte Vista', 'Olmos Park', 'Terrell Hills', 'Helotes', 'Boerne',
      'New Braunfels', 'Shavano Park',
    ],
  },
  {
    city: 'Raleigh',
    state: 'North Carolina',
    stateAbbr: 'NC',
    slug: 'raleigh-real-estate-agents',
    medianPrice: '$425,000',
    marketTrend: 'Hot',
    agentCount: '4,500+',
    population: '470,000',
    avgDaysOnMarket: '32',
    marketDescription: "Raleigh's Research Triangle drives tech relocations with affordable living. Agents showcase growing suburbs and access to universities and innovation.",
    neighborhoods: [
      'North Hills', 'Five Points', 'Cameron Village', 'Glenwood South', 'Cary',
      'Apex', 'Holly Springs', 'Wake Forest', 'Morrisville', 'Chapel Hill',
      'Durham', 'ITB (Inside the Beltline)',
    ],
  },
  {
    city: 'Salt Lake City',
    state: 'Utah',
    stateAbbr: 'UT',
    slug: 'salt-lake-city-real-estate-agents',
    medianPrice: '$550,000',
    marketTrend: 'Stable',
    agentCount: '3,800+',
    population: '200,000',
    avgDaysOnMarket: '35',
    marketDescription: "Salt Lake's outdoor recreation and growing tech scene attract active buyers. Agents highlight ski access and family-friendly communities on social media.",
    neighborhoods: [
      'Sugar House', 'The Avenues', 'Federal Heights', 'Cottonwood Heights', 'Holladay',
      'Millcreek', 'Park City', 'Draper', 'Sandy', 'Murray',
      'South Jordan', 'Daybreak',
    ],
  },
];

/**
 * Get location by slug
 */
export const getLocationBySlug = (slug: string): LocationData | undefined => {
  return LOCATIONS.find(loc => loc.slug === slug);
};

/**
 * Get all location slugs for sitemap generation
 */
export const getAllLocationSlugs = (): string[] => {
  return LOCATIONS.map(loc => loc.slug);
};

/**
 * Get locations by state
 */
export const getLocationsByState = (stateAbbr: string): LocationData[] => {
  return LOCATIONS.filter(loc => loc.stateAbbr === stateAbbr);
};

/**
 * Get featured locations (for internal linking)
 */
export const getFeaturedLocations = (excludeSlug?: string, limit = 5): LocationData[] => {
  const filtered = excludeSlug
    ? LOCATIONS.filter(loc => loc.slug !== excludeSlug)
    : LOCATIONS;
  return filtered.slice(0, limit);
};

/**
 * Get nearby locations (same state or neighboring)
 */
export const getNearbyLocations = (slug: string, limit = 3): LocationData[] => {
  const current = getLocationBySlug(slug);
  if (!current) return LOCATIONS.slice(0, limit);

  // First get same-state locations
  const sameState = LOCATIONS.filter(
    loc => loc.stateAbbr === current.stateAbbr && loc.slug !== slug
  );

  // If not enough, add others
  const others = LOCATIONS.filter(
    loc => loc.stateAbbr !== current.stateAbbr && loc.slug !== slug
  );

  return [...sameState, ...others].slice(0, limit);
};

/**
 * Group locations by state for sitemap/navigation
 */
export const getLocationsByStateGrouped = (): Record<string, LocationData[]> => {
  return LOCATIONS.reduce((acc, loc) => {
    if (!acc[loc.state]) {
      acc[loc.state] = [];
    }
    acc[loc.state].push(loc);
    return acc;
  }, {} as Record<string, LocationData[]>);
};
