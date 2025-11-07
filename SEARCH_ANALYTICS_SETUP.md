# Search Analytics Dashboard - Setup Guide

## Overview

The Search Analytics Dashboard provides a unified view of all your search traffic analytics from multiple platforms:
- **Google Analytics 4** - Website traffic and user behavior
- **Google Search Console** - Search performance and indexing
- **Bing Webmaster Tools** - Bing search performance
- **Yandex Webmaster** - Yandex search performance

## Features

### Enterprise-Level Dashboard
- ✅ **Unified Analytics View** - All platforms in one dashboard
- ✅ **Real-time Data Sync** - Automatic or manual synchronization
- ✅ **OAuth Integration** - Secure authentication for all platforms
- ✅ **Advanced Visualizations** - Interactive charts and graphs
- ✅ **Granular Drill-down** - From high-level to page-specific metrics
- ✅ **SEO Insights** - Track rankings, CTR, impressions, and more
- ✅ **Multi-device Analytics** - Desktop, mobile, and tablet breakdowns
- ✅ **Geographic Data** - Country-level performance tracking
- ✅ **Export Capabilities** - Export data in multiple formats

### Key Metrics Tracked
- **Search Performance**: Clicks, Impressions, CTR, Average Position
- **Traffic**: Sessions, Users, Pageviews
- **Engagement**: Bounce Rate, Engagement Rate, Session Duration
- **Conversions**: Goals, Revenue (GA4 only)
- **SEO**: Top Queries, Top Pages, Rankings

## Prerequisites

1. **Supabase Account** - Your database and backend
2. **API Credentials** for each platform:
   - Google Cloud Console (for GA4 & GSC)
   - Microsoft Azure (for Bing)
   - Yandex OAuth Application

## Step 1: Database Setup

### Run Migration

```bash
# Apply the search analytics migration
supabase migration up 20251107000000_search_analytics_dashboard
```

This creates the following tables:
- `ga4_oauth_credentials` & `ga4_properties` & `ga4_traffic_data`
- `bing_webmaster_oauth_credentials` & `bing_webmaster_sites` & `bing_webmaster_search_data`
- `yandex_webmaster_oauth_credentials` & `yandex_webmaster_sites` & `yandex_webmaster_search_data`
- `unified_search_analytics` - Aggregated view of all platforms
- `search_dashboard_config` - User preferences

## Step 2: Configure OAuth Applications

### Google (Analytics & Search Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Analytics Data API
   - Google Analytics Admin API
   - Google Search Console API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     https://your-domain.com/admin/search-analytics/oauth/callback/google-analytics
     https://your-domain.com/admin/search-analytics/oauth/callback/google-search-console
     ```
5. Copy the Client ID and Client Secret

### Microsoft (Bing Webmaster Tools)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Set up OAuth:
   - Redirect URI: `https://your-domain.com/admin/search-analytics/oauth/callback/bing-webmaster`
   - API Permissions: Add `https://api.bing.microsoft.com/webmaster.read`
4. Copy the Application (client) ID and create a Client Secret

### Yandex Webmaster

1. Go to [Yandex OAuth](https://oauth.yandex.com/)
2. Create a new application
3. Set permissions: `webmaster:read`
4. Set callback URL: `https://your-domain.com/admin/search-analytics/oauth/callback/yandex-webmaster`
5. Copy the Client ID and Client Secret

## Step 3: Environment Variables

### Frontend (.env)

Add these to your `.env` file:

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Microsoft OAuth (Bing)
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id

# Yandex OAuth
VITE_YANDEX_CLIENT_ID=your_yandex_client_id
```

### Backend (Supabase Edge Functions)

Set these secrets in your Supabase project (Dashboard > Project Settings > Edge Functions > Secrets):

```bash
# Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_ANALYTICS_REDIRECT_URI=https://your-domain.com/admin/search-analytics/oauth/callback/google-analytics

# Microsoft (Bing)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
BING_WEBMASTER_REDIRECT_URI=https://your-domain.com/admin/search-analytics/oauth/callback/bing-webmaster

# Yandex
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
YANDEX_WEBMASTER_REDIRECT_URI=https://your-domain.com/admin/search-analytics/oauth/callback/yandex-webmaster
```

## Step 4: Deploy Edge Functions

Deploy all the new Edge Functions to Supabase:

```bash
# Deploy OAuth callback functions
supabase functions deploy google-analytics-oauth-callback
supabase functions deploy bing-webmaster-oauth-callback
supabase functions deploy yandex-webmaster-oauth-callback

# Deploy sync functions
supabase functions deploy google-analytics-sync
supabase functions deploy bing-webmaster-sync
supabase functions deploy yandex-webmaster-sync

# Deploy aggregation function
supabase functions deploy aggregate-search-analytics
```

## Step 5: Using the Dashboard

### Accessing the Dashboard

1. Log in as an admin user
2. Navigate to **Admin Dashboard** → **Search Analytics** tab

### Connecting Platforms

1. Click the "Connect" button for each platform you want to use
2. You'll be redirected to the OAuth provider
3. Grant the necessary permissions
4. You'll be redirected back to the dashboard

### Syncing Data

**Manual Sync:**
1. Click "Sync Data" button on a connected platform
2. Or click "Refresh Data" to sync all platforms

**Automatic Sync:**
- Data syncs automatically based on configured frequency (hourly, daily, weekly)
- Configure in platform settings

### Viewing Analytics

**Overview Tab:**
- High-level KPIs (clicks, impressions, CTR, position, sessions, users)
- Performance trends charts
- Top 10 queries and pages

**Queries Tab:**
- Complete list of all search queries
- Performance metrics for each query
- Sortable and filterable

**Pages Tab:**
- All pages with traffic data
- Sessions, clicks, impressions per page
- Direct links to view pages

**Devices & Countries:**
- Performance breakdown by device type
- Geographic distribution of traffic

### Filters

Use the filter controls to customize your view:
- **Date Range**: Last 7 days, 30 days, 90 days, 6 months, 1 year, or custom
- **Platforms**: Select which platforms to include in the analysis
- **Device**: Filter by desktop, mobile, or tablet
- **Country**: Filter by geographic location

### Export Data

Click the "Export" button to download your analytics data in:
- CSV
- Excel (XLSX)
- JSON
- PDF Report

## Architecture

### Data Flow

```
1. User connects platform via OAuth
   ↓
2. OAuth credentials stored securely in database
   ↓
3. Platform data synced via Edge Functions
   ↓
4. Raw data stored in platform-specific tables
   ↓
5. Data aggregated into unified_search_analytics table
   ↓
6. Dashboard queries unified data for visualization
```

### Database Schema

**OAuth Credentials Tables:**
- Securely store access tokens and refresh tokens
- Support automatic token refresh
- Track expiration and last refresh times

**Platform Data Tables:**
- Store raw data from each platform
- Maintain historical data (configurable retention)
- Support incremental updates

**Unified Analytics Table:**
- Normalized data across all platforms
- Optimized for fast querying
- Aggregated views for common reports

### Security

- **Row-Level Security (RLS)**: Users can only access their own data
- **Admin Override**: Admins can view all data for support
- **Token Encryption**: OAuth tokens stored securely
- **Automatic Token Refresh**: Expired tokens refreshed automatically

## Troubleshooting

### OAuth Connection Fails

**Issue**: "Failed to exchange authorization code for tokens"

**Solution:**
1. Verify redirect URIs match exactly in OAuth provider settings
2. Check that client ID and secret are correct
3. Ensure the OAuth app has the required scopes/permissions

### Data Not Syncing

**Issue**: No data appearing in dashboard

**Solution:**
1. Check that platforms are connected (green "Connected" badge)
2. Manually trigger a sync using "Sync Data" button
3. Check Edge Function logs in Supabase Dashboard
4. Verify API quotas haven't been exceeded

### Expired Credentials

**Issue**: "Expired" badge on platform

**Solution:**
1. Click "Reconnect" to re-authorize
2. Check that refresh tokens are being stored
3. Verify automatic token refresh is working

## API Rate Limits

Be aware of API rate limits for each platform:

- **Google Analytics**: 50,000 requests/day
- **Google Search Console**: 1,200 requests/day
- **Bing Webmaster**: Varies by tier
- **Yandex Webmaster**: 100 requests/minute

Configure sync frequency accordingly to avoid hitting limits.

## Advanced Configuration

### Custom Aggregation

Modify the `refresh_unified_analytics` database function to customize how data is aggregated.

### Alert Thresholds

Set custom thresholds for alerts in the `search_dashboard_config` table:

```json
{
  "clicks_threshold": 1000,
  "impressions_threshold": 10000,
  "ctr_threshold": 0.05,
  "position_threshold": 10
}
```

### Data Retention

Configure data retention in Edge Functions:

```typescript
// Clean up data older than 90 days
await supabase.rpc('cleanup_old_gsc_data', { days_to_keep: 90 });
```

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Review browser console for errors
3. Verify all environment variables are set
4. Check OAuth provider documentation for API changes

## Future Enhancements

Planned features:
- [ ] Automated reports via email
- [ ] Real-time alerts for ranking changes
- [ ] Competitor analysis
- [ ] AI-powered SEO recommendations
- [ ] Integration with more platforms (Baidu, DuckDuckGo)
- [ ] Advanced data visualization (heatmaps, geo maps)
- [ ] Scheduled data exports
- [ ] Custom dashboard layouts
- [ ] Collaboration features (team sharing)

---

**Built with:** React, TypeScript, Supabase, PostgreSQL, Deno Edge Functions
**Visualization:** Recharts
**UI:** Tailwind CSS, Radix UI, shadcn/ui
