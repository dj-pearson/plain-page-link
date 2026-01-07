import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Settings as SettingsIcon, FileText } from 'lucide-react';
import { PlatformConnections } from './searchAnalytics/PlatformConnections';
import { MetricsOverview } from './searchAnalytics/MetricsOverview';
import { AnalyticsCharts } from './searchAnalytics/AnalyticsCharts';
import { TopQueriesTable } from './searchAnalytics/TopQueriesTable';
import { TopPagesTable } from './searchAnalytics/TopPagesTable';
import { DateRangePicker } from './searchAnalytics/DateRangePicker';
import { PlatformFilter } from './searchAnalytics/PlatformFilter';
import { useAggregateAnalytics, useTopQueries } from '@/hooks/useSearchAnalytics';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, exportToPDF, formatAnalyticsForExport } from '@/lib/exportUtils';
import type { SearchPlatform } from '@/types/searchAnalytics';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  // Fetch real query data for exports
  const topQueries = useTopQueries({
    startDate: dateRange.start,
    endDate: dateRange.end,
    platforms: selectedPlatforms,
    limit: 100,
  });

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

  const handleExportCSV = () => {
    // Use real query data from the hook
    if (!topQueries || topQueries.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'Connect a platform and sync data before exporting.',
        variant: 'destructive',
      });
      return;
    }

    const dateRangeText = `${dateRange.start} to ${dateRange.end}`;
    const exportData = formatAnalyticsForExport(topQueries, 'Search Analytics Report', dateRangeText);

    exportToCSV(exportData);

    toast({
      title: 'Exported to CSV',
      description: `Exported ${topQueries.length} queries to CSV.`,
    });
  };

  const handleExportPDF = () => {
    // Use real query data from the hook
    if (!topQueries || topQueries.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'Connect a platform and sync data before exporting.',
        variant: 'destructive',
      });
      return;
    }

    const dateRangeText = `${dateRange.start} to ${dateRange.end}`;
    const exportData = formatAnalyticsForExport(topQueries, 'Search Analytics Report', dateRangeText);

    exportToPDF(exportData);

    toast({
      title: 'Opening PDF',
      description: `Preparing PDF report with ${topQueries.length} queries.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshData}
          disabled={aggregateMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${aggregateMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileText className="h-4 w-4 mr-2" />
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export to PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm">
          <SettingsIcon className="h-4 w-4 mr-2" />
          Settings
        </Button>
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
