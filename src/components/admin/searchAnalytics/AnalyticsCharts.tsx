import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTimeSeriesData } from '@/hooks/useSearchAnalytics';
import type { SearchPlatform } from '@/types/searchAnalytics';

interface AnalyticsChartsProps {
  startDate: string;
  endDate: string;
  platforms?: SearchPlatform[];
}

export function AnalyticsCharts({ startDate, endDate, platforms }: AnalyticsChartsProps) {
  const timeSeriesData = useTimeSeriesData({ startDate, endDate, platforms });

  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>No data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>Connect your platforms and sync data to see performance trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
        <CardDescription>Track your search and traffic metrics over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="traffic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
            <TabsTrigger value="search">Search Performance</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="traffic" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [new Intl.NumberFormat().format(value), '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Sessions"
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Users"
                />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  stackId="3"
                  stroke="#ffc658"
                  fill="#ffc658"
                  name="Pageviews"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => {
                    if (name === 'CTR') return [`${(value * 100).toFixed(2)}%`, name];
                    if (name === 'Avg Position') return [value.toFixed(1), name];
                    return [new Intl.NumberFormat().format(value), name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="clicks"
                  stroke="#8884d8"
                  name="Clicks"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="impressions"
                  stroke="#82ca9d"
                  name="Impressions"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ctr"
                  stroke="#ffc658"
                  name="CTR"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => {
                    if (name === 'Avg Position') return [value.toFixed(1), name];
                    return [new Intl.NumberFormat().format(value), name];
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="position"
                  stroke="#8884d8"
                  name="Avg Position"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center">
              Lower position values are better (position 1 is the top result)
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
