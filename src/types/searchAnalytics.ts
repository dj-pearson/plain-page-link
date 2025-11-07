// Search Analytics Types
// Types for the unified search traffic analytics dashboard

export type SearchPlatform =
  | 'google_search_console'
  | 'google_analytics'
  | 'bing_webmaster'
  | 'yandex_webmaster';

export type DeviceCategory = 'desktop' | 'mobile' | 'tablet' | 'Desktop' | 'Mobile' | 'Tablet' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'MOBILE_AND_TABLET' | 'ALL';

export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export type SyncFrequency = 'hourly' | 'daily' | 'weekly' | 'manual';

export type DateRange = '7days' | '30days' | '90days' | '6months' | '1year' | 'custom';

export type ComparisonPeriod = 'previous_period' | 'previous_year' | 'none';

export type Grouping = 'hourly' | 'daily' | 'weekly' | 'monthly';

// OAuth Credential Status
export type CredentialStatus = 'active' | 'expired' | 'not_connected';

// GA4 Types
export interface GA4OAuthCredential {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  scope: string;
  is_active: boolean;
  last_refreshed_at: string;
  created_at: string;
  updated_at: string;
}

export interface GA4Property {
  id: string;
  user_id: string;
  credential_id: string;
  property_id: string;
  property_name: string;
  display_name: string | null;
  property_type: string;
  currency_code: string;
  time_zone: string;
  is_primary: boolean;
  last_synced_at: string | null;
  sync_status: SyncStatus;
  sync_error: string | null;
  sync_frequency: SyncFrequency;
  auto_sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GA4TrafficData {
  id: string;
  property_id: string;
  date: string;
  page_path: string | null;
  page_title: string | null;
  landing_page: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  device_category: DeviceCategory | null;
  country: string | null;
  city: string | null;
  sessions: number;
  users: number;
  new_users: number;
  pageviews: number;
  engaged_sessions: number;
  average_session_duration: number | null;
  bounce_rate: number | null;
  engagement_rate: number | null;
  events_per_session: number | null;
  conversions: number;
  conversion_rate: number | null;
  total_revenue: number | null;
  sessions_change: number | null;
  users_change: number | null;
  pageviews_change: number | null;
  created_at: string;
}

// Bing Webmaster Types
export interface BingWebmasterOAuthCredential {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  scope: string;
  is_active: boolean;
  last_refreshed_at: string;
  created_at: string;
  updated_at: string;
}

export interface BingWebmasterSite {
  id: string;
  user_id: string;
  credential_id: string;
  site_url: string;
  site_name: string | null;
  is_verified: boolean;
  is_primary: boolean;
  last_synced_at: string | null;
  sync_status: SyncStatus;
  sync_error: string | null;
  sync_frequency: SyncFrequency;
  auto_sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface BingWebmasterSearchData {
  id: string;
  site_id: string;
  date: string;
  query: string | null;
  page_url: string | null;
  country: string | null;
  device: DeviceCategory | null;
  clicks: number;
  impressions: number;
  ctr: number | null;
  average_position: number | null;
  clicks_change: number | null;
  impressions_change: number | null;
  ctr_change: number | null;
  position_change: number | null;
  created_at: string;
}

// Yandex Webmaster Types
export interface YandexWebmasterOAuthCredential {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expires_at: string;
  is_active: boolean;
  last_refreshed_at: string;
  created_at: string;
  updated_at: string;
}

export interface YandexWebmasterSite {
  id: string;
  user_id: string;
  credential_id: string;
  host_id: string;
  host_url: string;
  host_display_name: string | null;
  verification_state: string | null;
  is_primary: boolean;
  last_synced_at: string | null;
  sync_status: SyncStatus;
  sync_error: string | null;
  sync_frequency: SyncFrequency;
  auto_sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface YandexWebmasterSearchData {
  id: string;
  site_id: string;
  date: string;
  query: string | null;
  page_url: string | null;
  device: DeviceCategory | null;
  clicks: number;
  shows: number; // Yandex uses "shows" instead of "impressions"
  ctr: number | null;
  position: number | null;
  clicks_change: number | null;
  shows_change: number | null;
  ctr_change: number | null;
  position_change: number | null;
  created_at: string;
}

// Unified Analytics Types
export interface UnifiedSearchAnalytics {
  id: string;
  user_id: string;
  source_platform: SearchPlatform;
  source_property_id: string | null;
  date: string;
  page_url: string | null;
  page_title: string | null;
  query: string | null;
  country: string | null;
  device: DeviceCategory | null;
  clicks: number;
  impressions: number;
  sessions: number;
  users: number;
  pageviews: number;
  ctr: number | null;
  average_position: number | null;
  bounce_rate: number | null;
  engagement_rate: number | null;
  created_at: string;
  updated_at: string;
}

// Dashboard Configuration
export interface SearchDashboardConfig {
  id: string;
  user_id: string;
  default_date_range: DateRange;
  default_comparison_period: ComparisonPeriod;
  default_grouping: Grouping;
  enabled_platforms: SearchPlatform[];
  primary_platform: SearchPlatform;
  dashboard_layout: any; // JSONB - widget positions
  visible_metrics: string[];
  enable_alerts: boolean;
  alert_thresholds: Record<string, number>; // JSONB
  export_format: 'csv' | 'xlsx' | 'json' | 'pdf';
  created_at: string;
  updated_at: string;
}

// Connected Platform Status
export interface ConnectedPlatform {
  platform: SearchPlatform;
  is_connected: boolean;
  last_sync: string | null;
  credential_status: CredentialStatus;
}

// Aggregated Metrics
export interface AggregatedMetrics {
  total_clicks: number;
  total_impressions: number;
  total_sessions: number;
  total_users: number;
  total_pageviews: number;
  average_ctr: number;
  average_position: number;
  average_bounce_rate: number;
  clicks_change: number;
  impressions_change: number;
  sessions_change: number;
}

// Platform Summary
export interface PlatformSummary {
  platform: SearchPlatform;
  metrics: AggregatedMetrics;
  trend: 'up' | 'down' | 'neutral';
  change_percentage: number;
}

// Chart Data
export interface TimeSeriesDataPoint {
  date: string;
  clicks: number;
  impressions: number;
  sessions?: number;
  users?: number;
  ctr: number;
  position: number;
}

export interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  change: number;
}

export interface TopPage {
  url: string;
  title: string | null;
  clicks: number;
  impressions: number;
  sessions: number;
  ctr: number;
  position: number;
  change: number;
}

// API Response Types
export interface OAuthCallbackResponse {
  success: boolean;
  credential_id: string;
  message: string;
}

export interface SyncResponse {
  success: boolean;
  properties_synced?: number;
  sites_synced?: number;
  records_synced: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface AggregateResponse {
  success: boolean;
  records_aggregated: number;
  date_range: {
    start: string;
    end: string;
  };
  platform_summary: Record<string, {
    total_clicks: number;
    total_impressions: number;
    total_sessions: number;
    total_users: number;
  }>;
  message: string;
}

export interface ConnectedPlatformsResponse {
  platforms: ConnectedPlatform[];
}

// OAuth Request Types
export interface OAuthInitRequest {
  platform: SearchPlatform;
  redirect_uri: string;
}

export interface OAuthCallbackRequest {
  platform: SearchPlatform;
  code: string;
  state?: string;
}

export interface SyncRequest {
  platform: SearchPlatform;
  property_id?: string;
  site_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface AggregateRequest {
  start_date?: string;
  end_date?: string;
  force_refresh?: boolean;
}

// Filter Types
export interface SearchAnalyticsFilters {
  date_range: {
    start: string;
    end: string;
  };
  platforms: SearchPlatform[];
  devices: DeviceCategory[];
  countries: string[];
  search_query?: string;
  page_url?: string;
  grouping: Grouping;
  comparison_period?: ComparisonPeriod;
}
