import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, MousePointer, Eye, Users, FileText, Target, BarChart3 } from 'lucide-react';
import { useAggregatedMetrics } from '@/hooks/useSearchAnalytics';
import type { SearchPlatform } from '@/types/searchAnalytics';

interface MetricsOverviewProps {
  startDate: string;
  endDate: string;
  platforms?: SearchPlatform[];
}

export function MetricsOverview({ startDate, endDate, platforms }: MetricsOverviewProps) {
  const metrics = useAggregatedMetrics({ startDate, endDate, platforms });

  if (!metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
  };

  const formatPercent = (num: number) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  const formatChange = (change: number) => {
    if (change === 0) return { icon: Minus, color: 'text-muted-foreground', text: '0%' };
    const isPositive = change > 0;
    return {
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      text: `${isPositive ? '+' : ''}${formatPercent(change / 100)}`,
    };
  };

  const metricsData = [
    {
      title: 'Total Clicks',
      value: metrics.total_clicks,
      change: metrics.clicks_change,
      icon: MousePointer,
      description: 'Users who clicked through',
    },
    {
      title: 'Total Impressions',
      value: metrics.total_impressions,
      change: metrics.impressions_change,
      icon: Eye,
      description: 'Times your site appeared',
    },
    {
      title: 'Avg. CTR',
      value: metrics.average_ctr,
      change: 0,
      icon: Target,
      description: 'Click-through rate',
      isPercentage: true,
    },
    {
      title: 'Avg. Position',
      value: metrics.average_position,
      change: 0,
      icon: BarChart3,
      description: 'Average search position',
      decimals: 1,
    },
    {
      title: 'Total Sessions',
      value: metrics.total_sessions,
      change: metrics.sessions_change,
      icon: Users,
      description: 'Website sessions',
    },
    {
      title: 'Total Users',
      value: metrics.total_users,
      change: 0,
      icon: Users,
      description: 'Unique visitors',
    },
    {
      title: 'Total Pageviews',
      value: metrics.total_pageviews,
      change: 0,
      icon: FileText,
      description: 'Pages viewed',
    },
    {
      title: 'Bounce Rate',
      value: metrics.average_bounce_rate,
      change: 0,
      icon: TrendingDown,
      description: 'Visitors who left quickly',
      isPercentage: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricsData.map((metric) => {
        const changeData = formatChange(metric.change);
        const Icon = metric.icon;
        const ChangeIcon = changeData.icon;

        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.isPercentage
                  ? formatPercent(metric.value)
                  : metric.decimals
                  ? metric.value.toFixed(metric.decimals)
                  : formatNumber(metric.value)}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ChangeIcon className={`h-3 w-3 ${changeData.color}`} />
                <span className={changeData.color}>{changeData.text}</span>
                <span>vs. previous period</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
