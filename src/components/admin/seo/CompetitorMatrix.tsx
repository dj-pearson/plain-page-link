import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface CompetitorTracking {
  id: string;
  competitor_domain: string;
  competitor_name: string;
  keywords: string[];
  check_frequency: string;
  last_checked_at: string;
  alert_on_rank_change: boolean;
  alert_on_new_backlinks: boolean;
  rank_change_threshold: number;
  active: boolean;
  created_at: string;
}

interface CompetitorAnalysis {
  id: string;
  competitor_domain: string;
  keyword: string;
  their_position: number;
  our_position: number;
  gap: number;
  search_volume: number;
  analyzed_at: string;
}

export const CompetitorMatrix = () => {
  const { toast } = useToast();
  const [competitors, setCompetitors] = useState<CompetitorTracking[]>([]);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    competitor_domain: '',
    competitor_name: '',
    keywords: '',
    check_frequency: 'weekly',
    alert_on_rank_change: true,
    alert_on_new_backlinks: true,
    rank_change_threshold: 5,
  });

  useEffect(() => {
    loadCompetitors();
    loadAnalysis();
  }, []);

  const loadCompetitors = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_competitor_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompetitors(data || []);
    } catch (error: any) {
      console.error('Error loading competitors:', error);
    }
  };

  const loadAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_competitor_analysis')
        .select('*')
        .order('analyzed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAnalysis(data || []);
    } catch (error: any) {
      console.error('Error loading analysis:', error);
    }
  };

  const addCompetitor = async () => {
    if (!formData.competitor_domain) {
      toast({
        title: "Domain Required",
        description: "Please enter a competitor domain",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const { error } = await supabase
        .from('seo_competitor_tracking')
        .insert([
          {
            competitor_domain: formData.competitor_domain,
            competitor_name: formData.competitor_name || formData.competitor_domain,
            keywords: keywordsArray,
            check_frequency: formData.check_frequency,
            alert_on_rank_change: formData.alert_on_rank_change,
            alert_on_new_backlinks: formData.alert_on_new_backlinks,
            rank_change_threshold: formData.rank_change_threshold,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Competitor Added",
        description: "Competitor tracking has been configured",
      });

      setIsDialogOpen(false);
      setFormData({
        competitor_domain: '',
        competitor_name: '',
        keywords: '',
        check_frequency: 'weekly',
        alert_on_rank_change: true,
        alert_on_new_backlinks: true,
        rank_change_threshold: 5,
      });

      await loadCompetitors();
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

  const deleteCompetitor = async (id: string) => {
    if (!confirm('Are you sure you want to stop tracking this competitor?')) return;

    try {
      const { error } = await supabase
        .from('seo_competitor_tracking')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Competitor Removed",
        description: "Competitor tracking has been stopped",
      });

      await loadCompetitors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const refreshAnalysis = async () => {
    setLoading(true);
    try {
      // This would call an edge function to refresh competitor analysis
      toast({
        title: "Analysis Refreshing",
        description: "Competitor analysis is being updated...",
      });

      // Simulate refresh - in production, call edge function
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadAnalysis();

      toast({
        title: "Analysis Complete",
        description: "Competitor data has been refreshed",
      });
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

  // Calculate insights
  const keywordGaps = analysis.filter(a => a.gap < 0 && Math.abs(a.gap) <= 10);
  const winningKeywords = analysis.filter(a => a.gap > 0 && a.our_position <= 10);
  const opportunityKeywords = analysis.filter(
    a => a.their_position <= 10 && a.our_position > 10 && a.search_volume > 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Competitor Matrix
          </h3>
          <p className="text-muted-foreground">
            Monitor competitor rankings and identify opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAnalysis} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Competitor</DialogTitle>
                <DialogDescription>
                  Configure automated competitor tracking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Competitor Domain *</Label>
                  <Input
                    id="domain"
                    placeholder="competitor.com"
                    value={formData.competitor_domain}
                    onChange={(e) =>
                      setFormData({ ...formData, competitor_domain: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Competitor Name</Label>
                  <Input
                    id="name"
                    placeholder="Competitor Inc."
                    value={formData.competitor_name}
                    onChange={(e) =>
                      setFormData({ ...formData, competitor_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords to Track</Label>
                  <Input
                    id="keywords"
                    placeholder="keyword1, keyword2, keyword3"
                    value={formData.keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, keywords: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of keywords
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">Rank Change Alert Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={formData.rank_change_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rank_change_threshold: parseInt(e.target.value) || 5,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when position changes by more than this number
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="rank-alert">Alert on Rank Changes</Label>
                  <Switch
                    id="rank-alert"
                    checked={formData.alert_on_rank_change}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, alert_on_rank_change: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="backlink-alert">Alert on New Backlinks</Label>
                  <Switch
                    id="backlink-alert"
                    checked={formData.alert_on_new_backlinks}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, alert_on_new_backlinks: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addCompetitor} disabled={loading}>
                  {loading ? "Adding..." : "Add Competitor"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tracked Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{competitors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Being monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Keyword Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {keywordGaps.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Close to outranking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Winning Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {winningKeywords.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outranking competitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {opportunityKeywords.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              High-value targets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tracked Competitors */}
      <Card>
        <CardHeader>
          <CardTitle>Tracked Competitors</CardTitle>
          <CardDescription>
            {competitors.length} competitors being monitored
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No competitors tracked yet</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Competitor
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{competitor.competitor_name}</h4>
                      <a
                        href={`https://${competitor.competitor_domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Badge variant={competitor.active ? "default" : "secondary"}>
                        {competitor.active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {competitor.competitor_domain}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {competitor.keywords?.length || 0} keywords
                      </Badge>
                      <Badge variant="outline">
                        Check {competitor.check_frequency}
                      </Badge>
                      {competitor.alert_on_rank_change && (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Rank alerts
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-sm text-muted-foreground">Last checked</p>
                      <p className="text-sm font-semibold">
                        {competitor.last_checked_at
                          ? new Date(competitor.last_checked_at).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCompetitor(competitor.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opportunity Keywords */}
      {opportunityKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Opportunities</CardTitle>
            <CardDescription>
              High-value keywords where competitors rank well and you don't
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Competitor</TableHead>
                  <TableHead>Their Position</TableHead>
                  <TableHead>Your Position</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>Search Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunityKeywords.slice(0, 10).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.keyword}</TableCell>
                    <TableCell>{item.competitor_domain}</TableCell>
                    <TableCell>
                      <Badge variant="default">#{item.their_position}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{item.our_position}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-red-600">
                        <TrendingDown className="h-4 w-4" />
                        {item.gap}
                      </div>
                    </TableCell>
                    <TableCell>{item.search_volume?.toLocaleString() || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Keyword Gaps */}
      {keywordGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Close Keyword Gaps</CardTitle>
            <CardDescription>
              Keywords where you're close to outranking competitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {keywordGaps.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.keyword}</h4>
                    <p className="text-sm text-muted-foreground">
                      vs {item.competitor_domain}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">You</div>
                      <Badge variant="outline">#{item.our_position}</Badge>
                    </div>
                    <div className="text-yellow-600 font-bold">
                      {Math.abs(item.gap)} positions
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Them</div>
                      <Badge variant="default">#{item.their_position}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
