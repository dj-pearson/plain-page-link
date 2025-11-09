import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  FileText,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ErrorLog {
  id: string;
  user_id: string;
  error_type: string;
  error_message: string;
  stack_trace: string;
  user_context: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_by: string;
  resolved_at: string;
  resolution_notes: string;
  created_at: string;
}

export const ErrorLogViewer = () => {
  const { toast } = useToast();
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("unresolved");
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    unresolved: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => {
    loadErrors();
  }, []);

  useEffect(() => {
    filterErrors();
  }, [searchTerm, severityFilter, statusFilter, errors]);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      setErrors(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const unresolved = data?.filter((e) => !e.resolved).length || 0;
      const critical = data?.filter((e) => e.severity === 'critical').length || 0;
      const high = data?.filter((e) => e.severity === 'high').length || 0;
      const medium = data?.filter((e) => e.severity === 'medium').length || 0;
      const low = data?.filter((e) => e.severity === 'low').length || 0;

      setStats({ total, unresolved, critical, high, medium, low });
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

  const filterErrors = () => {
    let filtered = [...errors];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (error) =>
          error.error_type?.toLowerCase().includes(term) ||
          error.error_message?.toLowerCase().includes(term) ||
          error.user_id?.toLowerCase().includes(term)
      );
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((error) => error.severity === severityFilter);
    }

    // Status filter
    if (statusFilter === "resolved") {
      filtered = filtered.filter((error) => error.resolved);
    } else if (statusFilter === "unresolved") {
      filtered = filtered.filter((error) => !error.resolved);
    }

    setFilteredErrors(filtered);
  };

  const viewErrorDetails = (error: ErrorLog) => {
    setSelectedError(error);
    setResolutionNotes(error.resolution_notes || "");
    setShowErrorDetails(true);
  };

  const markAsResolved = async () => {
    if (!selectedError) return;

    try {
      const currentUser = await supabase.auth.getUser();

      const { error } = await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_by: currentUser.data.user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
        })
        .eq('id', selectedError.id);

      if (error) throw error;

      toast({
        title: "Error Resolved",
        description: "The error has been marked as resolved",
      });

      setShowErrorDetails(false);
      await loadErrors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
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
      <Badge variant={variants[severity] || 'default'} className="capitalize">
        {severity}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Error Log Viewer
          </h2>
          <p className="text-muted-foreground">
            Centralized error tracking and debugging
          </p>
        </div>
        <Button variant="outline" onClick={loadErrors} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.unresolved}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.high}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.medium}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.low}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle>Error Log</CardTitle>
          <CardDescription>
            {filteredErrors.length} errors found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredErrors.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No errors found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErrors.map((error) => (
                <div
                  key={error.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => viewErrorDetails(error)}
                >
                  <div className="pt-0.5">
                    {getSeverityIcon(error.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{error.error_type}</h4>
                      {getSeverityBadge(error.severity)}
                      {error.resolved && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {error.error_message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(error.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {error.user_id && (
                        <span className="truncate">
                          User: {error.user_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Details Dialog */}
      <Dialog open={showErrorDetails} onOpenChange={setShowErrorDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedError && getSeverityIcon(selectedError.severity)}
              Error Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this error
            </DialogDescription>
          </DialogHeader>

          {selectedError && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Error Type</Label>
                  <p className="text-sm">{selectedError.error_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Severity</Label>
                  <div className="mt-1">{getSeverityBadge(selectedError.severity)}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Occurred</Label>
                  <p className="text-sm">
                    {new Date(selectedError.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">User ID</Label>
                  <p className="text-sm font-mono text-xs">
                    {selectedError.user_id || 'Anonymous'}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <div>
                <Label className="text-sm font-semibold">Error Message</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="text-sm">{selectedError.error_message}</p>
                </div>
              </div>

              {/* Stack Trace */}
              {selectedError.stack_trace && (
                <div>
                  <Label className="text-sm font-semibold">Stack Trace</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md overflow-auto max-h-60">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {selectedError.stack_trace}
                    </pre>
                  </div>
                </div>
              )}

              {/* User Context */}
              {selectedError.user_context && Object.keys(selectedError.user_context).length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">User Context</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md overflow-auto max-h-40">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(selectedError.user_context, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Resolution */}
              {!selectedError.resolved ? (
                <div>
                  <Label htmlFor="resolution-notes">Resolution Notes</Label>
                  <Textarea
                    id="resolution-notes"
                    placeholder="Describe how this error was resolved..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-semibold">Resolution</Label>
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">
                        Resolved {formatDistanceToNow(new Date(selectedError.resolved_at), { addSuffix: true })}
                      </span>
                    </div>
                    {selectedError.resolution_notes && (
                      <p className="text-sm text-green-800">
                        {selectedError.resolution_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowErrorDetails(false)}>
              Close
            </Button>
            {selectedError && !selectedError.resolved && (
              <Button onClick={markAsResolved}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
