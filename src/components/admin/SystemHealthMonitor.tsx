import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Zap,
  Database,
  Link2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";

interface SystemMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  value: number;
  unit: string;
  metadata: any;
  recorded_at: string;
}

interface HealthSummary {
  metric_type: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  count: number;
}

export const SystemHealthMonitor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [healthSummary, setHealthSummary] = useState<HealthSummary[]>([]);
  const [recentMetrics, setRecentMetrics] = useState<SystemMetric[]>([]);
  const [edgeFunctionMetrics, setEdgeFunctionMetrics] = useState<SystemMetric[]>([]);
  const [databaseMetrics, setDatabaseMetrics] = useState<SystemMetric[]>([]);
  const [webhookMetrics, setWebhookMetrics] = useState<SystemMetric[]>([]);

  useEffect(() => {
    loadSystemHealth();

    // Refresh every 30 seconds
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    setLoading(true);
    try {
      // Get health summary
      const { data: summary, error: summaryError } = await supabase
        .rpc('get_system_health_summary');

      if (summaryError) throw summaryError;
      setHealthSummary(summary || []);

      // Get recent metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('system_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (metricsError) throw metricsError;

      setRecentMetrics(metrics || []);

      // Group by type
      setEdgeFunctionMetrics(
        (metrics || []).filter((m) => m.metric_type === 'edge_function')
      );
      setDatabaseMetrics(
        (metrics || []).filter((m) => m.metric_type === 'database')
      );
      setWebhookMetrics(
        (metrics || []).filter((m) => m.metric_type === 'webhook')
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (avgValue: number, metricType: string) => {
    // Different thresholds for different metric types
    if (metricType === 'edge_function') {
      // Response time in ms
      if (avgValue < 500) return { status: 'healthy', color: 'text-green-600', icon: CheckCircle2 };
      if (avgValue < 1000) return { status: 'warning', color: 'text-yellow-600', icon: AlertCircle };
      return { status: 'critical', color: 'text-red-600', icon: AlertCircle };
    }

    if (metricType === 'database') {
      // Query time in ms
      if (avgValue < 100) return { status: 'healthy', color: 'text-green-600', icon: CheckCircle2 };
      if (avgValue < 500) return { status: 'warning', color: 'text-yellow-600', icon: AlertCircle };
      return { status: 'critical', color: 'text-red-600', icon: AlertCircle };
    }

    if (metricType === 'webhook') {
      // Success percentage
      if (avgValue > 95) return { status: 'healthy', color: 'text-green-600', icon: CheckCircle2 };
      if (avgValue > 80) return { status: 'warning', color: 'text-yellow-600', icon: AlertCircle };
      return { status: 'critical', color: 'text-red-600', icon: AlertCircle };
    }

    return { status: 'unknown', color: 'text-gray-600', icon: Activity };
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    }
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'bytes') {
      if (value > 1024 * 1024) {
        return `${(value / (1024 * 1024)).toFixed(2)} MB`;
      }
      if (value > 1024) {
        return `${(value / 1024).toFixed(2)} KB`;
      }
      return `${value} B`;
    }
    return value.toString();
  };

  // Prepare chart data for edge functions (last 24 metrics)
  const edgeFunctionChartData = edgeFunctionMetrics
    .slice(0, 24)
    .reverse()
    .map((m) => ({
      time: new Date(m.recorded_at).toLocaleTimeString(),
      value: m.value,
      name: m.metric_name,
    }));

  // Calculate overall health score
  const overallHealthScore = healthSummary.reduce((acc, summary) => {
    const health = getHealthStatus(summary.avg_value, summary.metric_type);
    if (health.status === 'healthy') return acc + 100;
    if (health.status === 'warning') return acc + 70;
    if (health.status === 'critical') return acc + 30;
    return acc + 50;
  }, 0) / (healthSummary.length || 1);

  const getOverallHealthBadge = () => {
    if (overallHealthScore >= 90) {
      return (
        <Badge className="bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Healthy
        </Badge>
      );
    }
    if (overallHealthScore >= 70) {
      return (
        <Badge className="bg-yellow-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Critical
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            System Health Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time system performance and health metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getOverallHealthBadge()}
          <Button variant="outline" onClick={loadSystemHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall System Health</CardTitle>
          <CardDescription>Aggregated health score (last hour)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {overallHealthScore.toFixed(0)}
              </div>
              <div className="text-muted-foreground">Health Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {healthSummary.map((summary) => {
          const health = getHealthStatus(summary.avg_value, summary.metric_type);
          const Icon = health.icon;

          return (
            <Card key={summary.metric_type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="capitalize">{summary.metric_type.replace('_', ' ')}</span>
                  <Icon className={`h-5 w-5 ${health.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-2xl font-bold">
                      {formatValue(summary.avg_value, 'ms')}
                    </div>
                    <div className="text-xs text-muted-foreground">Average</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="font-semibold flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-green-600" />
                        {formatValue(summary.min_value, 'ms')}
                      </div>
                      <div className="text-xs text-muted-foreground">Min</div>
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-red-600" />
                        {formatValue(summary.max_value, 'ms')}
                      </div>
                      <div className="text-xs text-muted-foreground">Max</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {summary.count} measurements
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edge Function Performance */}
      {edgeFunctionMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Edge Function Performance
            </CardTitle>
            <CardDescription>Response times over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={edgeFunctionChartData}>
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Response Time']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Top Functions */}
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">Recent Function Calls</h4>
              <div className="space-y-2">
                {edgeFunctionMetrics.slice(0, 5).map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{metric.metric_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(metric.recorded_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatValue(metric.value, metric.unit)}</div>
                      {metric.value < 500 ? (
                        <Badge variant="outline" className="text-green-600">
                          Fast
                        </Badge>
                      ) : metric.value < 1000 ? (
                        <Badge variant="outline" className="text-yellow-600">
                          Slow
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Very Slow</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Performance */}
      {databaseMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Performance
            </CardTitle>
            <CardDescription>Query execution times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {databaseMetrics.slice(0, 8).map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{metric.metric_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(metric.recorded_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatValue(metric.value, metric.unit)}</div>
                    {metric.value < 100 ? (
                      <Badge variant="outline" className="text-green-600">
                        Fast
                      </Badge>
                    ) : metric.value < 500 ? (
                      <Badge variant="outline" className="text-yellow-600">
                        Moderate
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Slow</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Status */}
      {webhookMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Webhook Status
            </CardTitle>
            <CardDescription>Webhook delivery metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {webhookMetrics.slice(0, 5).map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{metric.metric_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(metric.recorded_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatValue(metric.value, metric.unit)}</div>
                    {metric.value > 95 ? (
                      <Badge variant="outline" className="text-green-600">
                        Healthy
                      </Badge>
                    ) : metric.value > 80 ? (
                      <Badge variant="outline" className="text-yellow-600">
                        Degraded
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Failing</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recentMetrics.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No metrics recorded yet</p>
            <p className="text-sm mt-2">
              System metrics will appear here as the application is used
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
