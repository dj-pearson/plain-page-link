/**
 * Audit Log Viewer Component
 * Displays user's security activity history
 */

import { useState } from 'react';
import { History, ChevronDown, ChevronUp, Shield, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useAuditLog, AuditLogEntry } from '@/hooks/useAuditLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AuditLogViewer() {
  const {
    logs,
    totalLogs,
    isLoading,
    error,
    refetch,
    getActionLabel,
    getRiskLevelColor,
    formatLogDetails,
    groupLogsByDate,
  } = useAuditLog({ limit: 20 });

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'failure':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    const colorMap: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };

    return (
      <Badge variant="outline" className={`text-xs ${colorMap[riskLevel] || colorMap.low}`}>
        {riskLevel}
      </Badge>
    );
  };

  const displayedLogs = isExpanded ? logs : logs.slice(0, 5);
  const groupedLogs = groupLogsByDate(displayedLogs);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Security Activity</CardTitle>
            <CardDescription>
              Recent security-related actions on your account
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading activity...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>Failed to load activity</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No security activity recorded yet
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
              <div key={date} className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {date}
                </div>
                <div className="space-y-1">
                  {dateLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="font-medium text-sm">
                            {getActionLabel(log.action)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                            {log.ip_address && ` • ${log.ip_address}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.risk_level !== 'low' && getRiskBadge(log.risk_level)}
                        <Badge
                          variant={log.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Expand/collapse button */}
            {logs.length > 5 && (
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-sm"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More ({totalLogs - 5} more)
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Selected log details */}
        {selectedLog && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{getActionLabel(selectedLog.action)}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span>{selectedLog.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span>{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
              {selectedLog.ip_address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono text-xs">{selectedLog.ip_address}</span>
                </div>
              )}
              {selectedLog.resource_type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resource:</span>
                  <span>{selectedLog.resource_type} {selectedLog.resource_id?.slice(0, 8)}</span>
                </div>
              )}
              {selectedLog.details && (
                <div className="mt-2">
                  <span className="text-muted-foreground block mb-1">Details:</span>
                  <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
