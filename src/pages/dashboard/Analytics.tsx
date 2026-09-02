import { useState, useMemo } from 'react';
import { subDays } from 'date-fns';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { LeadsTable } from '@/components/dashboard/LeadsTable';
import { InsightsWidget } from '@/components/analytics/InsightsWidget';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonAnalytics } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Users,
  UserPlus,
  TrendingUp,
  Calendar,
  Download,
  BarChart3,
  AlertCircle,
  RefreshCw,
  MousePointerClick,
  Link as LinkIcon,
  Filter,
  FileText,
} from 'lucide-react';
import { useAnalytics, type TimeRange } from '@/hooks/useAnalytics';
import { useLeads } from '@/hooks/useLeads';
import { useMLLeadScoring } from '@/hooks/useMLLeadScoring';
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel';
import { LeadSourceBreakdown } from '@/components/analytics/LeadSourceBreakdown';
import { InsightsPanel } from '@/components/analytics/InsightsPanel';
import { ReportBuilder, type ReportConfig } from '@/components/analytics/ReportBuilder';
import {
  calculateFunnel,
  analyzeLeadSources,
  generateInsights,
  type AnalyticsData,
} from '@/lib/analytics';
import { logger } from '@/lib/logger';

export default function Analytics() {
  const [dateRange, setDateRange] = useState<TimeRange>('30d');
  const {
    stats,
    previousStats,
    viewsData,
    leadsData,
    contactTaps,
    totalContactTaps,
    linkClicks,
    totalLinkClicks,
    recentLeads,
    isLoading,
    isError,
    error,
    refetch,
  } = useAnalytics(dateRange);
  const { leads } = useLeads();
  const { scoreLeadObject } = useMLLeadScoring();

  /**
   * The funnel, the source breakdown and the insights, moved here from
   * src/pages/AnalyticsDashboard.tsx — a 417-line page reachable only by typing
   * its URL, since nothing in the app linked to it (US-120).
   *
   * The second funnel stage is real now. It was `Math.round(uniqueVisitors *
   * 0.7)` labelled "Viewed Listing" — a number nothing measured, shown to the
   * agent as measurement. analytics_events records taps and link clicks since
   * US-115, so "Engaged" is counted rather than assumed.
   */
  const funnel = useMemo(
    () =>
      calculateFunnel({
        visitors: stats.uniqueVisitors,
        engaged: totalContactTaps + totalLinkClicks,
        contacted: stats.totalLeads,
        qualified: leads.filter((l) => l.status === 'qualified' || l.status === 'converted').length,
        converted: leads.filter((l) => l.status === 'converted').length,
      }),
    [stats, leads, totalContactTaps, totalLinkClicks]
  );

  const leadSources = useMemo(() => {
    const bySource: Record<string, { leads: number; conversions: number }> = {};
    for (const lead of leads) {
      const source = lead.source || 'website';
      bySource[source] ??= { leads: 0, conversions: 0 };
      bySource[source].leads++;
      if (lead.status === 'converted') bySource[source].conversions++;
    }

    const rows = Object.entries(bySource).map(([source, counts]) => ({
      source,
      leads: counts.leads,
      conversions: counts.conversions,
      // Neither is tracked anywhere in the product; they stay zero rather than
      // being invented.
      revenue: 0,
      cost: 0,
    }));

    return analyzeLeadSources(
      rows.length > 0
        ? rows
        : [{ source: 'website', leads: 0, conversions: 0, revenue: 0, cost: 0 }]
    );
  }, [leads]);

  const insights = useMemo(() => {
    const period: AnalyticsData['period'] =
      dateRange === '7d' ? 'week' : dateRange === '30d' ? 'month' : 'quarter';
    const days = { '7d': 7, '30d': 30, '90d': 90 }[dateRange];
    const now = new Date();
    const startDate = subDays(now, days);

    const current: AnalyticsData = {
      pageViews: stats.totalViews,
      uniqueVisitors: stats.uniqueVisitors,
      leads: stats.totalLeads,
      conversions: leads.filter((l) => l.status === 'converted').length,
      revenue: 0,
      avgResponseTime: stats.avgResponseMinutes ?? 0,
      period,
      startDate,
      endDate: now,
    };

    const previous: AnalyticsData = {
      pageViews: previousStats.views,
      uniqueVisitors: previousStats.visitors,
      leads: previousStats.leads,
      conversions: previousStats.conversions,
      revenue: 0,
      avgResponseTime: 0,
      period,
      startDate: subDays(startDate, days),
      endDate: startDate,
    };

    return generateInsights(current, previous, leadSources);
  }, [stats, previousStats, leads, leadSources, dateRange]);

  /** Rows for the report the agent builds. Real lead data, not a sample. */
  const handleGenerateReport = async (config: ReportConfig): Promise<Record<string, unknown>[]> => {
    if (config.reportType !== 'leads') {
      return [
        {
          metric: 'Total views',
          value: stats.totalViews,
        },
        { metric: 'Unique visitors', value: stats.uniqueVisitors },
        { metric: 'Leads', value: stats.totalLeads },
        { metric: 'Contact taps', value: totalContactTaps },
        { metric: 'Link clicks', value: totalLinkClicks },
        { metric: 'Conversion rate', value: `${stats.conversionRate.toFixed(2)}%` },
      ];
    }

    return leads.map((lead) => {
      // There is no `score` column on `leads`; the ML score is computed.
      let score = 0;
      try {
        score = scoreLeadObject(lead).score;
      } catch {
        // Scoring is best-effort here; an unscoreable lead exports as 0.
      }
      return {
        id: lead.id,
        name: lead.name || 'Unknown',
        email: lead.email || '',
        source: lead.source || 'website',
        status: lead.status || 'new',
        score,
        created_at: lead.created_at,
      };
    });
  };
  const { toast } = useToast();

  const handleExportAnalytics = () => {
    // Check if there's data to export
    if (
      stats.totalViews === 0 &&
      stats.totalLeads === 0 &&
      totalContactTaps === 0 &&
      totalLinkClicks === 0
    ) {
      toast({
        title: 'No data to export',
        description: "There's no analytics data for the selected time period.",
        variant: 'destructive',
      });
      return;
    }

    const dateRangeLabel =
      dateRange === '7d' ? '7 days' : dateRange === '30d' ? '30 days' : '90 days';

    // Build CSV content
    const lines: string[] = [];

    // Summary section
    lines.push('Analytics Summary');
    lines.push(`Date Range,Last ${dateRangeLabel}`);
    lines.push(`Export Date,${new Date().toLocaleDateString()}`);
    lines.push('');

    // Key metrics
    lines.push('Key Metrics');
    lines.push('Metric,Value');
    lines.push(`Total Views,${stats.totalViews}`);
    lines.push(`Unique Visitors,${stats.uniqueVisitors}`);
    lines.push(`Total Leads,${stats.totalLeads}`);
    lines.push(`Conversion Rate,${stats.conversionRate.toFixed(2)}%`);
    lines.push('');

    // The export used to omit taps and clicks entirely, because nothing
    // recorded them (US-115).
    lines.push('Taps and Clicks');
    lines.push('Interaction,Count');
    for (const tap of contactTaps) {
      lines.push(`${tap.name} taps,${tap.value}`);
    }
    lines.push(`Link clicks,${totalLinkClicks}`);
    for (const link of linkClicks) {
      lines.push(`  ${link.name.replace(/,/g, ' ')},${link.value}`);
    }
    lines.push('');
    lines.push('Note,Counts are indicative; visitors are identified by a browser-stored id.');
    lines.push('');

    // Views over time
    if (viewsData.length > 0) {
      lines.push('Views Over Time');
      lines.push('Date,Views,Visitors');
      viewsData.forEach((item) => {
        lines.push(`${item.name},${item.views},${item.visitors}`);
      });
      lines.push('');
    }

    // Leads by type
    if (leadsData.length > 0) {
      lines.push('Leads by Type');
      lines.push('Type,Count,Percentage');
      leadsData.forEach((item) => {
        const percentage =
          stats.totalLeads > 0 ? ((item.value / stats.totalLeads) * 100).toFixed(1) : '0';
        lines.push(`${item.name},${item.value},${percentage}%`);
      });
    }

    const csvContent = lines.join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Analytics exported',
      description: `Successfully exported analytics data for the last ${dateRangeLabel}`,
    });
  };

  if (isError) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Track your profile performance, lead generation, and search visibility
          </p>
        </div>
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-3 sm:mb-4">
              <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
              Failed to load analytics
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-sm mx-auto">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred. Please try again.'}
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonAnalytics />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Track your profile performance, lead generation, and search visibility
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-xs sm:text-sm">
                  {dateRange === '7d'
                    ? 'Last 7 days'
                    : dateRange === '30d'
                      ? 'Last 30 days'
                      : 'Last 90 days'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDateRange('7d')}>Last 7 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange('30d')}>Last 30 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange('90d')}>Last 90 days</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={handleExportAnalytics}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="text-xs sm:text-sm">Export</span>
          </Button>
        </div>
      </div>

      {/* Tabs for different analytics views.
          There used to be a "Search Analytics" tab here mounting
          @/components/admin/SearchAnalyticsDashboard — Google Search Console,
          GA4, Bing and Yandex OAuth connections — on the agent-facing page with
          no admin gate at all. That is the platform's own SEO tooling, not
          something a real estate agent has any use for or any business
          connecting. It lives under /admin now (US-120).

          Funnel and Reports come from src/pages/AnalyticsDashboard.tsx, a
          417-line page that nothing linked to. */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Profile Analytics</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-2">
            <Filter className="h-4 w-4" />
            <span>Funnel</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Key Metrics - Mobile optimized 2-column grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard
              title="Total Views"
              value={stats.totalViews.toLocaleString()}
              icon={Eye}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
            />
            <StatsCard
              title="Unique Visitors"
              value={stats.uniqueVisitors.toLocaleString()}
              icon={Users}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
            />
            <StatsCard
              title="Total Leads"
              value={stats.totalLeads}
              icon={UserPlus}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
            />
            <StatsCard
              title="Conversion Rate"
              value={`${stats.conversionRate.toFixed(2)}%`}
              icon={TrendingUp}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100"
            />
          </div>

          {/* Insights & Recommendations */}
          <InsightsWidget stats={stats} listingsCount={0} linksCount={0} />

          {/* Views Over Time Chart - Smaller height on mobile */}
          <AnalyticsChart
            title="Profile Views"
            description="Views and unique visitors over time"
            data={viewsData.length > 0 ? viewsData : [{ name: 'No data', views: 0, visitors: 0 }]}
            series={[
              { dataKey: 'views', name: 'Total Views', color: '#3B82F6' },
              {
                dataKey: 'visitors',
                name: 'Unique Visitors',
                color: '#10B981',
              },
            ]}
            type="area"
            height={window.innerWidth < 640 ? 200 : 300}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Leads by Type */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Leads by Type</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Distribution of lead inquiries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leadsData.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {leadsData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between py-2 min-h-[44px]"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {item.value} leads
                          </span>
                          <span className="text-xs sm:text-sm font-semibold min-w-[35px] text-right">
                            {stats.totalLeads > 0
                              ? ((item.value / stats.totalLeads) * 100).toFixed(0)
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                    No leads yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Taps and clicks.
                This card used to be "Recent Activity" and printed the total
                view count again, under a different heading. The interactions
                an agent actually wants — who tapped Call, which link people
                follow — were recorded nowhere at all until US-115. */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Taps &amp; Clicks</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  What visitors did on your page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {contactTaps.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-2 min-h-[44px]"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MousePointerClick className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between py-2 min-h-[44px]">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">Link clicks</span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">
                        {totalLinkClicks.toLocaleString()}
                      </span>
                    </div>

                    {linkClicks.slice(0, 5).map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between py-1.5 pl-7 text-muted-foreground"
                      >
                        <span className="text-xs truncate pr-3">{item.name}</span>
                        <span className="text-xs tabular-nums">{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {totalContactTaps === 0 && totalLinkClicks === 0 && (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center pt-3">
                      No taps or clicks in this period yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Criterion 4: say what these numbers are. Visitors are identified by
              an id this app generates in their browser and stores in
              localStorage — cleared or rotated, the same person counts twice;
              shared or scripted, one person can count many times. The rate
              limits bound that, they do not eliminate it. Presenting these as
              measurement would be the same overclaim the trend arrows made
              before US-087. */}
          <p className="text-xs text-muted-foreground">
            These counts are indicative, not exact. Visitors are recognised by an identifier stored
            in their own browser, so clearing it counts one person twice and automated traffic can
            inflate a total. Use them for direction, not for reporting.
          </p>

          {/* Recent Leads Table */}
          <LeadsTable
            leads={recentLeads}
            onLeadClick={(lead) => logger.debug('Lead clicked', { lead })}
          />
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4 sm:space-y-6">
          <ConversionFunnel stages={funnel} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <LeadSourceBreakdown sources={leadSources} />
            <InsightsPanel insights={insights} />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 sm:space-y-6">
          {/* The orphan page also had a grid of four "Available Reports" cards
              with cursor-pointer and no onClick at all. They are not carried
              over; the builder below is the part that produces anything. */}
          <ReportBuilder onGenerateReport={handleGenerateReport} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
