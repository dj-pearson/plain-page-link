// ============================================
// AgentBio.net Advanced Features Types
// ============================================

// ============================================
// PRICING & USAGE TRACKING
// ============================================

export interface FeatureCatalog {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  category: 'ai_generation' | 'analytics' | 'automation' | 'tools';
  pricing_model: 'per_use' | 'monthly_limit' | 'unlimited' | 'tiered';
  price_per_use?: number;
  cost_to_provide?: number;
  requires_api_keys: boolean;
  api_provider?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  monthly_limit: number | null; // null = unlimited, 0 = disabled
  overage_allowed: boolean;
  overage_price?: number;
  enabled: boolean;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FeatureUsage {
  id: string;
  user_id: string;
  feature_key: string;
  usage_count: number;
  usage_metadata?: Record<string, any>;
  included_in_plan: boolean;
  charged_amount: number;
  billing_status: 'pending' | 'billed' | 'failed';
  stripe_invoice_id?: string;
  used_at: string;
  billed_at?: string;
  created_at: string;
}

export interface MonthlyUsageSummary {
  id: string;
  user_id: string;
  feature_key: string;
  year: number;
  month: number;
  total_usage: number;
  included_usage: number;
  overage_usage: number;
  total_charged: number;
  finalized: boolean;
  stripe_invoice_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureLimitCheck {
  allowed: boolean;
  remaining: number;
  limit_reached: boolean;
  overage_allowed: boolean;
}

// ============================================
// FEATURE 1: AI LISTING DESCRIPTION GENERATOR
// ============================================

export interface AIListingGenerator {
  inputs: {
    propertyType: string;
    keyFeatures: string[];
    neighborhood: string;
    pricePoint: number;
    targetBuyer: string;
    tone: 'professional' | 'luxury' | 'warm' | 'investment-focused';
  };

  outputs: {
    headline: string;
    shortDescription: string;
    fullDescription: string;
    socialMediaCaption: string;
    emailSubjectLine: string;
    seoKeywords: string[];
    fairHousingCompliant: boolean;
  };
}

export interface AIListingDescription {
  id: string;
  user_id: string;
  listing_id: string;

  // Inputs
  property_type: string;
  key_features: string[];
  neighborhood: string;
  price_point: number;
  target_buyer: string;
  tone: 'professional' | 'luxury' | 'warm' | 'investment-focused';

  // Outputs
  headline: string;
  short_description: string;
  full_description: string;
  social_media_caption: string;
  email_subject_line: string;
  seo_keywords: string[];
  fair_housing_compliant: boolean;
  fair_housing_notes?: string;

  // Metadata
  model_used: string;
  tokens_used: number;
  generation_time_ms: number;
  cost_incurred: number;

  status: 'draft' | 'approved' | 'published';
  created_at: string;
  updated_at: string;
}

// ============================================
// FEATURE 2: SMART LEAD SCORING
// ============================================

export interface IntentSignal {
  type: string;
  weight: 'low' | 'medium' | 'high' | 'very_high';
}

export interface LeadBehavior {
  profileVisits: number;
  listingsViewed: number;
  timeOnSite: number;
  returnVisitor: boolean;
  clickedPhone: boolean;
  clickedEmail: boolean;
  clickedCalendar: boolean;
  downloadedDocument: boolean;
}

export interface Recommendations {
  nextAction: string;
  talkingPoints: string[];
  estimatedConversionProbability: number;
}

export interface LeadScore {
  id: string;
  lead_id: string;
  user_id: string;

  // Score
  overall_score: number; // 0-100
  priority: 'hot' | 'warm' | 'cold';

  // Intent signals
  profile_visits: number;
  listings_viewed: number;
  time_on_site: number;
  return_visitor: boolean;

  // Engagement signals
  clicked_phone: boolean;
  clicked_email: boolean;
  clicked_calendar: boolean;
  downloaded_document: boolean;

  // Form data signals
  timeframe?: string;
  pre_approval_status?: 'yes' | 'no' | 'unknown';
  has_agent: boolean;
  first_time_buyer?: boolean;

  // Recommendations
  next_action: string;
  talking_points: string[];
  estimated_conversion_probability: number;

  // ML
  ml_prediction_score?: number;
  ml_model_version?: string;

  scored_at: string;
  updated_at: string;
}

export interface LeadConversion {
  id: string;
  lead_id: string;
  user_id: string;
  converted: boolean;
  conversion_type?: 'listing_signed' | 'buyer_representation' | 'closed_deal';
  conversion_value?: number;
  days_to_convert?: number;
  conversion_notes?: string;
  converted_at?: string;
  created_at: string;
}

// ============================================
// FEATURE 3: AUTOMATED FOLLOW-UP SEQUENCES
// ============================================

export interface FollowUpSequence {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: 'form_submission' | 'calendar_no_show' | 'listing_view' | 'cold_lead';

  // Settings
  send_from_agent: boolean;
  pause_if_replies: boolean;
  business_hours_only: boolean;
  skip_weekends: boolean;

  active: boolean;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowUpMessage {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_minutes: number;
  channel: 'email' | 'sms' | 'both';

  subject?: string;
  body: string;
  attachment_urls?: string[];

  call_to_action?: 'schedule_call' | 'view_listings' | 'reply' | 'visit_profile';
  cta_url?: string;

  created_at: string;
  updated_at: string;
}

export interface ActiveSequence {
  id: string;
  lead_id: string;
  sequence_id: string;
  user_id: string;

  current_step: number;
  next_message_at?: string;

  status: 'active' | 'paused' | 'completed' | 'stopped';
  pause_reason?: string;

  messages_sent: number;
  lead_responded: boolean;
  response_step?: number;

  started_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface SequenceMessageLog {
  id: string;
  active_sequence_id: string;
  message_id?: string;
  lead_id: string;

  channel: 'email' | 'sms';
  recipient_email?: string;
  recipient_phone?: string;

  subject?: string;
  body: string;

  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  provider_message_id?: string;
  error_message?: string;

  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

// ============================================
// FEATURE 4: INTERACTIVE MARKET REPORTS
// ============================================

export interface PriceTrends {
  medianHomePrice: {
    current: number;
    yearAgo: number;
    percentChange: number;
  };
  chart: {
    type: 'line';
    data: Array<{ month: string; price: number }>;
  };
  insights: string[];
}

export interface InventoryMetrics {
  averageDaysOnMarket: number;
  inventoryMonths: number;
  listToSaleRatio: number;
  interpretation: string;
}

export interface NeighborhoodScores {
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  schoolRatings: {
    elementary: Array<{ name: string; rating: number; distance: string }>;
    middle: Array<{ name: string; rating: number; distance: string }>;
    high: Array<{ name: string; rating: number; distance: string }>;
    averageRating: number;
  };
  crimeRate: {
    rating: 'low' | 'medium' | 'high';
    comparedToNationalAverage: string;
  };
}

export interface Demographics {
  medianHouseholdIncome: number;
  medianAge: number;
  populationGrowth: number;
  educationLevel: {
    highSchool: number;
    bachelors: number;
    graduate: number;
  };
}

export interface MarketReport {
  id: string;
  user_id: string;

  // Location
  zip_code: string;
  city: string;
  neighborhood?: string;
  county?: string;
  state: string;

  // Filters
  property_type: 'all' | 'single_family' | 'condo' | 'townhouse';
  price_min?: number;
  price_max?: number;

  // Generated data
  price_trends?: PriceTrends;
  inventory_metrics?: InventoryMetrics;
  neighborhood_scores?: NeighborhoodScores;
  demographics?: Demographics;
  recent_sales?: any;

  // Outputs
  report_url?: string;
  pdf_url?: string;
  social_graphics_urls?: string[];

  // Analytics
  views: number;
  leads_captured: number;
  shares: number;

  status: 'generating' | 'published' | 'archived';
  generation_error?: string;

  agent_message?: string;
  custom_branding?: Record<string, any>;

  created_at: string;
  published_at?: string;
  updated_at: string;
}

export interface MarketReportLead {
  id: string;
  market_report_id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  property_address?: string;
  form_type: 'home_valuation' | 'contact_agent' | 'subscribe';
  referrer_url?: string;
  lead_id?: string;
  created_at: string;
}

// ============================================
// FEATURE 5: VIRTUAL STAGING & AI PHOTO ENHANCEMENT
// ============================================

export interface PhotoEnhancement {
  id: string;
  user_id: string;
  listing_id?: string;

  // Original
  original_url: string;
  original_filename: string;
  original_size_bytes: number;

  // Enhancement
  enhancement_type: 'virtual_staging' | 'enhancement' | 'declutter' | 'sky_replacement';
  style?: string;
  room_type?: string;

  // Output
  enhanced_url?: string;
  enhanced_filename?: string;

  // Processing
  ai_provider: string;
  processing_time_ms?: number;
  cost_incurred?: number;

  status: 'processing' | 'completed' | 'failed';
  error_message?: string;

  created_at: string;
  completed_at?: string;
}

// ============================================
// FEATURE 6: PREDICTIVE ANALYTICS
// ============================================

export interface PredictiveAnalytics {
  id: string;
  user_id: string;
  prediction_type: 'lead_conversion' | 'listing_sale_time' | 'optimal_price';
  entity_type: 'lead' | 'listing';
  entity_id: string;

  prediction_value: Record<string, any>;
  confidence_score: number;

  model_version: string;
  features_used: string[];

  actual_outcome?: Record<string, any>;
  prediction_accuracy?: number;

  predicted_at: string;
  outcome_recorded_at?: string;
}

// ============================================
// FEATURE 7: VIDEO TOUR & REEL GENERATOR
// ============================================

export interface VideoTour {
  id: string;
  user_id: string;
  listing_id: string;

  // Input
  photo_urls: string[];
  music_track?: string;
  video_style: 'luxury' | 'modern' | 'cinematic';
  duration_seconds?: number;

  // Customization
  include_agent_intro: boolean;
  include_call_to_action: boolean;
  custom_text_overlay?: string[];

  // Output
  video_url?: string;
  thumbnail_url?: string;
  instagram_reel_url?: string;
  youtube_short_url?: string;
  tiktok_url?: string;

  // Processing
  ai_provider: string;
  processing_time_ms?: number;
  cost_incurred?: number;

  status: 'queued' | 'processing' | 'completed' | 'failed';
  error_message?: string;

  // Analytics
  views: number;
  shares: number;
  leads_generated: number;

  created_at: string;
  completed_at?: string;
  updated_at: string;
}

// ============================================
// FEATURE 8: OPEN HOUSE MANAGEMENT
// ============================================

export interface OpenHouse {
  id: string;
  user_id: string;
  listing_id: string;

  title: string;
  description?: string;
  start_time: string;
  end_time: string;

  // Location
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;

  // Settings
  require_registration: boolean;
  send_reminders: boolean;
  collect_feedback: boolean;

  registration_url?: string;
  custom_questions?: Record<string, any>;

  status: 'scheduled' | 'active' | 'completed' | 'cancelled';

  // Stats
  registered_count: number;
  attended_count: number;
  leads_captured: number;

  created_at: string;
  updated_at: string;
}

export interface OpenHouseRegistration {
  id: string;
  open_house_id: string;

  name: string;
  email: string;
  phone?: string;

  buyer_status?: 'pre_approved' | 'looking' | 'just_browsing';
  timeframe?: string;
  custom_responses?: Record<string, any>;

  attended: boolean;
  check_in_time?: string;
  check_out_time?: string;
  time_spent_minutes?: number;

  feedback_submitted: boolean;
  feedback_rating?: number;
  feedback_comments?: string;

  lead_id?: string;

  created_at: string;
  updated_at: string;
}

// ============================================
// FEATURE 9: MORTGAGE CALCULATOR
// ============================================

export interface MortgageCalculation {
  id: string;
  user_id: string;
  listing_id?: string;

  // Inputs
  home_price: number;
  down_payment: number;
  down_payment_percent: number;
  interest_rate: number;
  loan_term_years: number;

  // Additional costs
  property_tax_annual: number;
  home_insurance_annual: number;
  hoa_monthly: number;
  pmi_monthly: number;

  // Calculated
  loan_amount: number;
  monthly_payment: number;
  monthly_payment_breakdown: {
    principal: number;
    interest: number;
    tax: number;
    insurance: number;
    hoa: number;
    pmi: number;
  };
  total_interest: number;
  total_cost: number;

  // Lead capture
  visitor_name?: string;
  visitor_email?: string;
  visitor_phone?: string;
  lead_id?: string;

  session_id?: string;
  referrer_url?: string;

  created_at: string;
}

// ============================================
// FEATURE 10: AI-POWERED CMA GENERATOR
// ============================================

export interface CMAgenerator {
  inputs: {
    subjectProperty: {
      address: string;
      beds: number;
      baths: number;
      sqft: number;
      lotSize: number;
      yearBuilt: number;
      condition: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
      upgrades: string[];
    };
    sellerGoals: {
      timeline: '0-3 months' | '3-6 months' | 'flexible';
      priceGoal: 'maximize' | 'sell_fast' | 'balanced';
    };
  };
}

export interface CMAReport {
  id: string;
  user_id: string;

  // Subject property
  subject_address: string;
  subject_city: string;
  subject_state: string;
  subject_zip: string;

  beds: number;
  baths: number;
  sqft: number;
  lot_size: number;
  year_built: number;
  property_condition: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
  upgrades: string[];

  // Goals
  timeline: '0-3 months' | '3-6 months' | 'flexible';
  price_goal: 'maximize' | 'sell_fast' | 'balanced';

  // Analysis
  comparables?: any;
  active_listings?: any;
  market_analysis?: any;
  valuation?: {
    conservative: number;
    recommended: number;
    optimistic: number;
  };
  pricing_strategy?: any;
  marketing_plan?: any;
  net_proceeds?: any;

  // Outputs
  report_url?: string;
  pdf_url?: string;

  // Requester
  requester_name: string;
  requester_email: string;
  requester_phone?: string;
  lead_id?: string;

  status: 'generating' | 'completed' | 'failed';
  generation_error?: string;

  // Analytics
  views: number;
  time_spent_seconds: number;
  lead_converted: boolean;

  created_at: string;
  completed_at?: string;
  updated_at: string;
}

// ============================================
// STRIPE INTEGRATION
// ============================================

export interface StripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name?: string;
  default_payment_method_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StripeUsageRecord {
  id: string;
  user_id: string;
  stripe_subscription_item_id: string;
  feature_key: string;
  quantity: number;
  stripe_usage_record_id?: string;
  timestamp: string;
  synced_to_stripe: boolean;
  sync_error?: string;
  created_at: string;
  synced_at?: string;
}

export interface StripeInvoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  stripe_subscription_id?: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  paid: boolean;
  hosted_invoice_url?: string;
  invoice_pdf_url?: string;
  created_at_stripe: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface GenerateListingDescriptionRequest {
  listing_id: string;
  property_type: string;
  key_features: string[];
  neighborhood: string;
  price_point: number;
  target_buyer: string;
  tone: 'professional' | 'luxury' | 'warm' | 'investment-focused';
}

export interface GenerateMarketReportRequest {
  zip_code: string;
  city: string;
  neighborhood?: string;
  property_type: 'all' | 'single_family' | 'condo' | 'townhouse';
  price_min?: number;
  price_max?: number;
}

export interface GenerateCMARequest {
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  lot_size: number;
  year_built: number;
  condition: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
  upgrades: string[];
  timeline: '0-3 months' | '3-6 months' | 'flexible';
  price_goal: 'maximize' | 'sell_fast' | 'balanced';
  requester_name: string;
  requester_email: string;
  requester_phone?: string;
}

export interface UsageStatsResponse {
  feature_key: string;
  current_period_usage: number;
  monthly_limit: number | null;
  remaining: number;
  overage_count: number;
  overage_charges: number;
  limit_reached: boolean;
}
