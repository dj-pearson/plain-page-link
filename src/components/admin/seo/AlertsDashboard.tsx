import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Bell,
  X,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SEONotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  data: any;
  created_at: string;
}

interface AuditSchedule {
  id: string;
  name: string;
  last_run_at: string;
  last_run_status: string;
  last_run_results: any;
}

export const AlertsDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<SEONotification[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditSchedule[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [opportunityCount, setOpportunityCount] = useState(0);

  useEffect(() => {
    loadAlerts();
    loadRecentAudits();

    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('seo_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'seo_notification_queue',
        },
        (payload) => {
          setNotifications((prev) => [payload.new as SEONotification, ...prev]);
          updateCounts([payload.new as SEONotification, ...notifications]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_notification_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      updateCounts(data || []);
    } catch (error: any) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadRecentAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_audit_schedules')
        .select('*')
        .not('last_run_at', 'is', null)
        .order('last_run_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setRecentAudits(data || []);
    } catch (error: any) {
      console.error('Error loading recent audits:', error);
    }
  };

  const updateCounts = (notifs: SEONotification[]) => {
    const critical = notifs.filter(n => n.severity === 'critical' && n.status === 'pending').length;
    const warnings = notifs.filter(n => n.severity === 'medium' && n.status === 'pending').length;
    const opportunities = notifs.filter(n => n.notification_type === 'opportunity' && n.status === 'pending').length;

    setCriticalCount(critical);
    setWarningCount(warnings);
    setOpportunityCount(opportunities);
  };

  const dismissNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('seo_notification_queue')
        .update({ status: 'sent' })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      updateCounts(notifications.filter(n => n.id !== id));

      toast({
        title: "Notification dismissed",
        description: "The notification has been marked as read",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const refreshAlerts = async () => {
    setLoading(true);
    await loadAlerts();
    await loadRecentAudits();
    setLoading(false);

    toast({
      title: "Alerts refreshed",
      description: "Latest alerts and audit results loaded",
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high':
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };

    return (
      <Badge variant={variants[severity] || 'default'}>
        {severity}
      </Badge>
    );
  };

  const criticalIssues = notifications.filter(n =>
    (n.severity === 'critical' || n.severity === 'high') &&
    n.notification_type === 'critical_issue' &&
    n.status === 'pending'
  );

  const warnings = notifications.filter(n =>
    n.severity === 'medium' &&
    n.notification_type === 'warning' &&
    n.status === 'pending'
  );

  const opportunities = notifications.filter(n =>
    n.notification_type === 'opportunity' &&
    n.status === 'pending'
  );

  const competitorAlerts = notifications.filter(n =>
    n.notification_type === 'competitor_alert' &&
    n.status === 'pending'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SEO Alerts Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of SEO issues, warnings, and opportunities
          </p>
        </div>
        <Button onClick={refreshAlerts} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Should be addressed soon
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{opportunityCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Potential improvements
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {recentAudits[0]?.last_run_results?.overall_score || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Latest audit score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different alert types */}
      <Tabs defaultValue="critical" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="critical">
            Critical ({criticalIssues.length})
          </TabsTrigger>
          <TabsTrigger value="warnings">
            Warnings ({warnings.length})
          </TabsTrigger>
          <TabsTrigger value="opportunities">
            Opportunities ({opportunities.length})
          </TabsTrigger>
          <TabsTrigger value="competitor">
            Competitors ({competitorAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="critical" className="space-y-4">
          {criticalIssues.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No critical issues detected</p>
              </CardContent>
            </Card>
          ) : (
            criticalIssues.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={dismissNotification}
                getSeverityIcon={getSeverityIcon}
                getSeverityBadge={getSeverityBadge}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          {warnings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No warnings at this time</p>
              </CardContent>
            </Card>
          ) : (
            warnings.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={dismissNotification}
                getSeverityIcon={getSeverityIcon}
                getSeverityBadge={getSeverityBadge}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {opportunities.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                <p>No new opportunities identified</p>
              </CardContent>
            </Card>
          ) : (
            opportunities.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={dismissNotification}
                getSeverityIcon={getSeverityIcon}
                getSeverityBadge={getSeverityBadge}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="competitor" className="space-y-4">
          {competitorAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No competitor alerts</p>
              </CardContent>
            </Card>
          ) : (
            competitorAlerts.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={dismissNotification}
                getSeverityIcon={getSeverityIcon}
                getSeverityBadge={getSeverityBadge}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Audits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audits</CardTitle>
          <CardDescription>Latest automated audit results</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAudits.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No recent audits found
            </p>
          ) : (
            <div className="space-y-4">
              {recentAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{audit.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {audit.last_run_at &&
                        `Ran ${formatDistanceToNow(new Date(audit.last_run_at), {
                          addSuffix: true,
                        })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {audit.last_run_results && (
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {audit.last_run_results.overall_score || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    )}
                    <Badge
                      variant={
                        audit.last_run_status === 'success'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {audit.last_run_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface NotificationCardProps {
  notification: SEONotification;
  onDismiss: (id: string) => void;
  getSeverityIcon: (severity: string) => JSX.Element;
  getSeverityBadge: (severity: string) => JSX.Element;
}

const NotificationCard = ({
  notification,
  onDismiss,
  getSeverityIcon,
  getSeverityBadge,
}: NotificationCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getSeverityIcon(notification.severity)}
            <div>
              <CardTitle className="text-lg">{notification.title}</CardTitle>
              <CardDescription>
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getSeverityBadge(notification.severity)}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDismiss(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{notification.message}</p>

        {/* Additional data */}
        {notification.data && (
          <div className="space-y-2">
            {notification.data.critical_issues && (
              <div>
                <h5 className="font-semibold text-sm mb-1">Critical Issues:</h5>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {notification.data.critical_issues.slice(0, 3).map((issue: string, idx: number) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {notification.data.warnings && (
              <div>
                <h5 className="font-semibold text-sm mb-1">Warnings:</h5>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {notification.data.warnings.slice(0, 3).map((warning: string, idx: number) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {notification.data.overall_score && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-semibold">Overall Score:</span>
                <span className="text-lg font-bold">
                  {notification.data.overall_score}/100
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
