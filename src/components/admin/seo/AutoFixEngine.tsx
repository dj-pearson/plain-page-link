import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Wand2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Trash2,
  Edit,
  Play,
  Pause,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AutoFixRule {
  id: string;
  name: string;
  description: string;
  issue_type: string;
  conditions: any;
  fix_action: any;
  requires_approval: boolean;
  auto_apply: boolean;
  priority: number;
  applied_count: number;
  success_count: number;
  failure_count: number;
  active: boolean;
  created_at: string;
}

interface AutoFixHistory {
  id: string;
  rule_id: string;
  issue_type: string;
  fix_applied: any;
  result: string;
  error_message?: string;
  applied_at: string;
}

const ISSUE_TYPES = [
  { value: 'missing_meta_description', label: 'Missing Meta Description' },
  { value: 'missing_alt_text', label: 'Missing Alt Text' },
  { value: 'broken_link', label: 'Broken Link' },
  { value: 'missing_h1', label: 'Missing H1' },
  { value: 'duplicate_title', label: 'Duplicate Title' },
  { value: 'thin_content', label: 'Thin Content' },
  { value: 'slow_page', label: 'Slow Page Speed' },
  { value: 'missing_schema', label: 'Missing Schema Markup' },
];

const FIX_ACTIONS = [
  { value: 'generate_meta_description', label: 'Generate Meta Description (AI)' },
  { value: 'generate_alt_text', label: 'Generate Alt Text (AI)' },
  { value: 'update_link', label: 'Update Link' },
  { value: 'add_schema_markup', label: 'Add Schema Markup' },
  { value: 'optimize_image', label: 'Optimize Image' },
  { value: 'fix_heading_structure', label: 'Fix Heading Structure' },
];

export const AutoFixEngine = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutoFixRule[]>([]);
  const [history, setHistory] = useState<AutoFixHistory[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<AutoFixHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    issue_type: '',
    fix_action: '',
    requires_approval: true,
    auto_apply: false,
    priority: 50,
  });

  useEffect(() => {
    loadRules();
    loadHistory();
    loadPendingApprovals();
  }, []);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_autofix_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      console.error('Error loading rules:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_autofix_history')
        .select('*')
        .order('applied_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_autofix_history')
        .select('*')
        .eq('result', 'pending_approval')
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error: any) {
      console.error('Error loading pending approvals:', error);
    }
  };

  const createRule = async () => {
    if (!formData.name || !formData.issue_type || !formData.fix_action) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seo_autofix_rules')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            issue_type: formData.issue_type,
            conditions: {},
            fix_action: { action: formData.fix_action },
            requires_approval: formData.requires_approval,
            auto_apply: formData.auto_apply,
            priority: formData.priority,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Rule Created",
        description: "Auto-fix rule has been created successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        issue_type: '',
        fix_action: '',
        requires_approval: true,
        auto_apply: false,
        priority: 50,
      });

      await loadRules();
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

  const toggleRuleActive = async (ruleId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('seo_autofix_rules')
        .update({ active: !currentActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: currentActive ? "Rule Disabled" : "Rule Enabled",
        description: `Auto-fix rule has been ${currentActive ? 'disabled' : 'enabled'}`,
      });

      await loadRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { error } = await supabase
        .from('seo_autofix_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Rule Deleted",
        description: "Auto-fix rule has been deleted",
      });

      await loadRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const approveFix = async (historyId: string) => {
    try {
      const { error } = await supabase
        .from('seo_autofix_history')
        .update({
          result: 'success',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', historyId);

      if (error) throw error;

      toast({
        title: "Fix Approved",
        description: "The fix has been approved and will be applied",
      });

      loadPendingApprovals();
      loadHistory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectFix = async (historyId: string) => {
    try {
      const { error } = await supabase
        .from('seo_autofix_history')
        .update({ result: 'failed', error_message: 'Rejected by admin' })
        .eq('id', historyId);

      if (error) throw error;

      toast({
        title: "Fix Rejected",
        description: "The fix has been rejected",
      });

      loadPendingApprovals();
      loadHistory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending_approval':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="h-6 w-6" />
            Auto-Fix Engine
          </h2>
          <p className="text-muted-foreground">
            Automatically detect and fix common SEO issues
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Auto-Fix Rule</DialogTitle>
              <DialogDescription>
                Define a rule to automatically fix SEO issues
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name *</Label>
                <Input
                  id="rule-name"
                  placeholder="e.g., Auto-generate missing alt text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-description">Description</Label>
                <Textarea
                  id="rule-description"
                  placeholder="Describe what this rule does..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue-type">Issue Type *</Label>
                  <Select
                    value={formData.issue_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, issue_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fix-action">Fix Action *</Label>
                  <Select
                    value={formData.fix_action}
                    onValueChange={(value) =>
                      setFormData({ ...formData, fix_action: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fix action" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIX_ACTIONS.map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority (0-100)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 50,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Higher priority rules are executed first
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires-approval"
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requires_approval: checked })
                    }
                  />
                  <Label htmlFor="requires-approval">Requires Approval</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-apply"
                    checked={formData.auto_apply}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_apply: checked })
                    }
                    disabled={formData.requires_approval}
                  />
                  <Label htmlFor="auto-apply">Auto Apply</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createRule} disabled={loading}>
                {loading ? "Creating..." : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {rules.filter((r) => r.active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {pendingApprovals.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Fixes Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {rules.reduce((sum, r) => sum + r.applied_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {rules.reduce((sum, r) => sum + r.applied_count, 0) > 0
                ? Math.round(
                    (rules.reduce((sum, r) => sum + r.success_count, 0) /
                      rules.reduce((sum, r) => sum + r.applied_count, 0)) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">
            Rules ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Approvals ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Wand2 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No auto-fix rules created yet</p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {rule.name}
                        <Badge variant={rule.active ? "default" : "secondary"}>
                          {rule.active ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                          {rule.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                      </CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRuleActive(rule.id, rule.active)}
                      >
                        {rule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Issue Type</p>
                      <p className="font-semibold">
                        {ISSUE_TYPES.find((t) => t.value === rule.issue_type)?.label || rule.issue_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Applied</p>
                      <p className="font-semibold">{rule.applied_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success</p>
                      <p className="font-semibold text-green-600">{rule.success_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="font-semibold text-red-600">{rule.failure_count}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {rule.requires_approval && (
                      <Badge variant="outline">Requires Approval</Badge>
                    )}
                    {rule.auto_apply && (
                      <Badge variant="outline">Auto Apply</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Pending Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map((approval) => (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getResultIcon(approval.result)}
                        Pending Fix Approval
                      </CardTitle>
                      <CardDescription>
                        {formatDistanceToNow(new Date(approval.applied_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveFiximestamp(approval.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectFix(approval.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold">Issue Type:</p>
                      <p className="text-sm text-muted-foreground">{approval.issue_type}</p>
                    </div>
                    {approval.fix_applied && (
                      <div>
                        <p className="text-sm font-semibold">Proposed Fix:</p>
                        <pre className="text-xs bg-muted p-2 rounded-md mt-1 overflow-auto">
                          {JSON.stringify(approval.fix_applied, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No fix history yet</p>
              </CardContent>
            </Card>
          ) : (
            history.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getResultIcon(item.result)}
                        {item.issue_type}
                      </CardTitle>
                      <CardDescription>
                        {formatDistanceToNow(new Date(item.applied_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        item.result === 'success'
                          ? 'default'
                          : item.result === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {item.result}
                    </Badge>
                  </div>
                </CardHeader>
                {item.error_message && (
                  <CardContent>
                    <p className="text-sm text-red-600">{item.error_message}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
