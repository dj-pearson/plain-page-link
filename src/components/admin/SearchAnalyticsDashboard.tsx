import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Settings as SettingsIcon } from 'lucide-react';
import { PlatformConnections } from './searchAnalytics/PlatformConnections';
import { MetricsOverview } from './searchAnalytics/MetricsOverview';
import { AnalyticsCharts } from './searchAnalytics/AnalyticsCharts';
import { TopQueriesTable } from './searchAnalytics/TopQueriesTable';
import { TopPagesTable } from './searchAnalytics/TopPagesTable';
import { DateRangePicker } from './searchAnalytics/DateRangePicker';
import { PlatformFilter } from './searchAnalytics/PlatformFilter';
import { useAggregateAnalytics } from '@/hooks/useSearchAnalytics';
import { useToast } from '@/hooks/use-toast';
import type { SearchPlatform } from '@/types/searchAnalytics';

export function SearchAnalyticsDashboard() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<SearchPlatform[]>([
    'google_search_console',
    'google_analytics',
  ]);

  const aggregateMutation = useAggregateAnalytics();

  const handleRefreshData = async () => {
    try {
      await aggregateMutation.mutateAsync({
        start_date: dateRange.start,
        end_date: dateRange.end,
        force_refresh: true,
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleExportData = () => {
    toast({
      title: 'Export Started',
      description: 'Your analytics data is being prepared for export...',
    });
    // TODO: Implement export functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Search Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Unified view of all your search traffic and analytics platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshData}
            disabled={aggregateMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${aggregateMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Platform Connections */}
      <PlatformConnections />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Customize your analytics view</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={(start, end) => setDateRange({ start, end })}
          />
          <PlatformFilter
            selectedPlatforms={selectedPlatforms}
            onChange={setSelectedPlatforms}
          />
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queries">Top Queries</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Metrics Overview */}
          <MetricsOverview
            startDate={dateRange.start}
            endDate={dateRange.end}
            platforms={selectedPlatforms}
          />

          {/* Charts */}
          <AnalyticsCharts
            startDate={dateRange.start}
            endDate={dateRange.end}
            platforms={selectedPlatforms}
          />

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Queries</CardTitle>
                <CardDescription>Highest performing search queries</CardDescription>
              </CardHeader>
              <CardContent>
                <TopQueriesTable
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  platforms={selectedPlatforms}
                  limit={10}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Pages</CardTitle>
                <CardDescription>Highest performing pages</CardDescription>
              </CardHeader>
              <CardContent>
                <TopPagesTable
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  platforms={selectedPlatforms}
                  limit={10}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Search Queries</CardTitle>
              <CardDescription>Complete list of search queries with performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <TopQueriesTable
                startDate={dateRange.start}
                endDate={dateRange.end}
                platforms={selectedPlatforms}
                limit={100}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Pages</CardTitle>
              <CardDescription>Complete list of pages with traffic metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <TopPagesTable
                startDate={dateRange.start}
                endDate={dateRange.end}
                platforms={selectedPlatforms}
                limit={100}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Performance metrics by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Device analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Performance metrics by country</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Geographic analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
