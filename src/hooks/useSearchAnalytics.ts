import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  ConnectedPlatform,
  GA4Property,
  BingWebmasterSite,
  YandexWebmasterSite,
  UnifiedSearchAnalytics,
  SearchDashboardConfig,
  SyncRequest,
  AggregateRequest,
  OAuthCallbackRequest,
  SearchPlatform,
  AggregatedMetrics,
  TimeSeriesDataPoint,
  TopQuery,
  TopPage,
} from '@/types/searchAnalytics';

// Hook to get connected platforms status
export function useConnectedPlatforms() {
  return useQuery({
    queryKey: ['connected-platforms'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_connected_search_platforms', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as ConnectedPlatform[];
    },
  });
}

// Hook to initiate OAuth flow
export function useOAuthInit() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (platform: SearchPlatform) => {
      // Get OAuth URLs based on platform
      const redirectUris: Record<SearchPlatform, string> = {
        google_analytics: `${window.location.origin}/admin/search-analytics/oauth/callback/google-analytics`,
        google_search_console: `${window.location.origin}/admin/search-analytics/oauth/callback/google-search-console`,
        bing_webmaster: `${window.location.origin}/admin/search-analytics/oauth/callback/bing-webmaster`,
        yandex_webmaster: `${window.location.origin}/admin/search-analytics/oauth/callback/yandex-webmaster`,
      };

      // Platform-specific OAuth URLs
      const oauthUrls: Record<SearchPlatform, string> = {
        google_analytics: 'https://accounts.google.com/o/oauth2/v2/auth',
        google_search_console: 'https://accounts.google.com/o/oauth2/v2/auth',
        bing_webmaster: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        yandex_webmaster: 'https://oauth.yandex.ru/authorize',
      };

      // Build OAuth URL with parameters
      const params = new URLSearchParams({
        client_id: platform.includes('google')
          ? import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
          : platform === 'bing_webmaster'
          ? import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
          : import.meta.env.VITE_YANDEX_CLIENT_ID || '',
        redirect_uri: redirectUris[platform],
        response_type: 'code',
        scope: platform === 'google_analytics'
          ? 'https://www.googleapis.com/auth/analytics.readonly'
          : platform === 'google_search_console'
          ? 'https://www.googleapis.com/auth/webmasters.readonly'
          : platform === 'bing_webmaster'
          ? 'https://api.bing.microsoft.com/webmaster.read offline_access'
          : 'webmaster:read',
        access_type: 'offline',
        prompt: 'consent',
      });

      const oauthUrl = `${oauthUrls[platform]}?${params.toString()}`;

      // Redirect to OAuth provider
      window.location.href = oauthUrl;
    },
    onError: (error: Error) => {
      toast({
        title: 'OAuth Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to handle OAuth callback
export function useOAuthCallback() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ platform, code, state }: OAuthCallbackRequest) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Determine which Edge Function to call
      const functionName = platform === 'google_analytics'
        ? 'google-analytics-oauth-callback'
        : platform === 'google_search_console'
        ? 'google-search-console-oauth-callback' // Would need to create this
        : platform === 'bing_webmaster'
        ? 'bing-webmaster-oauth-callback'
        : 'yandex-webmaster-oauth-callback';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { code, state },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Platform connected successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['connected-platforms'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to sync data from a platform
export function useSyncPlatform() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ platform, property_id, site_id, start_date, end_date }: SyncRequest) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const functionName = platform === 'google_analytics'
        ? 'google-analytics-sync'
        : platform === 'google_search_console'
        ? 'google-search-console-sync' // Would need to create this or use existing
        : platform === 'bing_webmaster'
        ? 'bing-webmaster-sync'
        : 'yandex-webmaster-sync';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { property_id, site_id, start_date, end_date },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Sync Started',
        description: 'Data synchronization started successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['search-analytics'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to aggregate analytics data
export function useAggregateAnalytics() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ start_date, end_date, force_refresh }: AggregateRequest) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('aggregate-search-analytics', {
        body: { start_date, end_date, force_refresh },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Aggregation Complete',
        description: 'Analytics data aggregated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['unified-analytics'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Aggregation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to fetch GA4 properties
export function useGA4Properties() {
  return useQuery({
    queryKey: ['ga4-properties'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ga4_properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GA4Property[];
    },
  });
}

// Hook to fetch Bing sites
export function useBingSites() {
  return useQuery({
    queryKey: ['bing-sites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bing_webmaster_sites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BingWebmasterSite[];
    },
  });
}

// Hook to fetch Yandex sites
export function useYandexSites() {
  return useQuery({
    queryKey: ['yandex-sites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('yandex_webmaster_sites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as YandexWebmasterSite[];
    },
  });
}

// Hook to fetch unified analytics with filters
export function useUnifiedAnalytics(filters: {
  startDate: string;
  endDate: string;
  platforms?: SearchPlatform[];
}) {
  return useQuery({
    queryKey: ['unified-analytics', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('unified_search_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', filters.startDate)
        .lte('date', filters.endDate);

      if (filters.platforms && filters.platforms.length > 0) {
        query = query.in('source_platform', filters.platforms);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return data as UnifiedSearchAnalytics[];
    },
  });
}

// Hook to get aggregated metrics
export function useAggregatedMetrics(filters: {
  startDate: string;
  endDate: string;
  platforms?: SearchPlatform[];
}) {
  const { data: analyticsData } = useUnifiedAnalytics(filters);

  if (!analyticsData) return null;

  const metrics: AggregatedMetrics = {
    total_clicks: analyticsData.reduce((sum, row) => sum + (row.clicks || 0), 0),
    total_impressions: analyticsData.reduce((sum, row) => sum + (row.impressions || 0), 0),
    total_sessions: analyticsData.reduce((sum, row) => sum + (row.sessions || 0), 0),
    total_users: analyticsData.reduce((sum, row) => sum + (row.users || 0), 0),
    total_pageviews: analyticsData.reduce((sum, row) => sum + (row.pageviews || 0), 0),
    average_ctr: analyticsData.length > 0
      ? analyticsData.reduce((sum, row) => sum + (row.ctr || 0), 0) / analyticsData.length
      : 0,
    average_position: analyticsData.length > 0
      ? analyticsData.reduce((sum, row) => sum + (row.average_position || 0), 0) / analyticsData.length
      : 0,
    average_bounce_rate: analyticsData.length > 0
      ? analyticsData.reduce((sum, row) => sum + (row.bounce_rate || 0), 0) / analyticsData.length
      : 0,
    clicks_change: 0, // Would need comparison period data
    impressions_change: 0,
    sessions_change: 0,
  };

  return metrics;
}

// Hook to get time series data for charts
export function useTimeSeriesData(filters: {
  startDate: string;
  endDate: string;
  platforms?: SearchPlatform[];
}): TimeSeriesDataPoint[] | null {
  const { data: analyticsData } = useUnifiedAnalytics(filters);

  if (!analyticsData) return null;

  // Group by date
  const grouped = analyticsData.reduce((acc, row) => {
    const date = row.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        clicks: 0,
        impressions: 0,
        sessions: 0,
        users: 0,
        ctr: 0,
        position: 0,
        count: 0,
      };
    }

    acc[date].clicks += row.clicks || 0;
    acc[date].impressions += row.impressions || 0;
    acc[date].sessions += row.sessions || 0;
    acc[date].users += row.users || 0;
    acc[date].ctr += row.ctr || 0;
    acc[date].position += row.average_position || 0;
    acc[date].count += 1;

    return acc;
  }, {} as Record<string, any>);

  // Calculate averages and format
  return Object.values(grouped).map(item => ({
    date: item.date,
    clicks: item.clicks,
    impressions: item.impressions,
    sessions: item.sessions,
    users: item.users,
    ctr: item.count > 0 ? item.ctr / item.count : 0,
    position: item.count > 0 ? item.position / item.count : 0,
  })) as TimeSeriesDataPoint[];
}

// Hook to get top queries
export function useTopQueries(filters: {
  startDate: string;
  endDate: string;
  platforms?: SearchPlatform[];
  limit?: number;
}): TopQuery[] | null {
  const { data: analyticsData } = useUnifiedAnalytics(filters);

  if (!analyticsData) return null;

  // Filter only rows with queries
  const withQueries = analyticsData.filter(row => row.query);

  // Group by query
  const grouped = withQueries.reduce((acc, row) => {
    const query = row.query!;
    if (!acc[query]) {
      acc[query] = {
        query,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        count: 0,
        change: 0,
      };
    }

    acc[query].clicks += row.clicks || 0;
    acc[query].impressions += row.impressions || 0;
    acc[query].ctr += row.ctr || 0;
    acc[query].position += row.average_position || 0;
    acc[query].count += 1;

    return acc;
  }, {} as Record<string, any>);

  // Calculate averages, sort by clicks, and limit
  const topQueries = Object.values(grouped)
    .map(item => ({
      query: item.query,
      clicks: item.clicks,
      impressions: item.impressions,
      ctr: item.count > 0 ? item.ctr / item.count : 0,
      position: item.count > 0 ? item.position / item.count : 0,
      change: 0, // Would need historical data
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, filters.limit || 10) as TopQuery[];

  return topQueries;
}

// Hook to get top pages
export function useTopPages(filters: {
  startDate: string;
  endDate: string;
  platforms?: SearchPlatform[];
  limit?: number;
}): TopPage[] | null {
  const { data: analyticsData } = useUnifiedAnalytics(filters);

  if (!analyticsData) return null;

  // Filter only rows with page URLs
  const withPages = analyticsData.filter(row => row.page_url);

  // Group by page URL
  const grouped = withPages.reduce((acc, row) => {
    const url = row.page_url!;
    if (!acc[url]) {
      acc[url] = {
        url,
        title: row.page_title,
        clicks: 0,
        impressions: 0,
        sessions: 0,
        ctr: 0,
        position: 0,
        count: 0,
        change: 0,
      };
    }

    acc[url].clicks += row.clicks || 0;
    acc[url].impressions += row.impressions || 0;
    acc[url].sessions += row.sessions || 0;
    acc[url].ctr += row.ctr || 0;
    acc[url].position += row.average_position || 0;
    acc[url].count += 1;

    return acc;
  }, {} as Record<string, any>);

  // Calculate averages, sort by clicks, and limit
  const topPages = Object.values(grouped)
    .map(item => ({
      url: item.url,
      title: item.title,
      clicks: item.clicks,
      impressions: item.impressions,
      sessions: item.sessions,
      ctr: item.count > 0 ? item.ctr / item.count : 0,
      position: item.count > 0 ? item.position / item.count : 0,
      change: 0, // Would need historical data
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, filters.limit || 10) as TopPage[];

  return topPages;
}

// Hook to get or create dashboard config
export function useDashboardConfig() {
  return useQuery({
    queryKey: ['dashboard-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('search_dashboard_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Create default config if doesn't exist
      if (!data) {
        const { data: newConfig, error: insertError } = await supabase
          .from('search_dashboard_config')
          .insert({
            user_id: user.id,
            default_date_range: '30days',
            default_comparison_period: 'previous_period',
            default_grouping: 'daily',
            enabled_platforms: ['google_search_console', 'google_analytics'],
            primary_platform: 'google_search_console',
            visible_metrics: ['clicks', 'impressions', 'ctr', 'position', 'sessions', 'users'],
            enable_alerts: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newConfig as SearchDashboardConfig;
      }

      return data as SearchDashboardConfig;
    },
  });
}
