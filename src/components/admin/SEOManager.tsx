import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { edgeFunctions } from "@/lib/edgeFunctions";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  BarChart3,
  Users,
  FileText,
  Bell,
  FileCode,
  Bot,
  Map,
  Link,
  Database,
  Zap,
  TrendingUp,
  Shield,
  ExternalLink,
  Image,
  Repeat,
  Copy,
  Smartphone,
  Clock,
  Globe,
  Code,
  Activity,
  Wand2,
} from "lucide-react";
import { AlertsDashboard } from "./seo/AlertsDashboard";
import { AutoFixEngine } from "./seo/AutoFixEngine";
import { KeywordsTracker } from "./seo/KeywordsTracker";
import { CompetitorMatrix } from "./seo/CompetitorMatrix";

export const SEOManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [auditUrl, setAuditUrl] = useState("");
  const [auditResults, setAuditResults] = useState<any>(null);

  const runSEOAudit = async () => {
    if (!auditUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to audit",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await edgeFunctions.invoke("seo-audit", {
        body: { url: auditUrl, auditType: "full", saveResults: true },
      });

      if (error) throw error;

      setAuditResults(data.audit);
      toast({
        title: "Audit Complete",
        description: `Overall score: ${data.audit.overallScore}/100`,
      });
    } catch (error: any) {
      toast({
        title: "Audit Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">SEO Management</h1>
        <p className="text-muted-foreground">
          Comprehensive SEO tools and analytics for your website
        </p>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        {/* Automation & Alerts Row */}
        <TabsList className="grid grid-cols-4 lg:grid-cols-4 gap-2 h-auto mb-2">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="autofix" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            <span className="hidden sm:inline">Auto-Fix</span>
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Keywords</span>
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Competitors</span>
          </TabsTrigger>
        </TabsList>

        <TabsList className="grid grid-cols-6 lg:grid-cols-11 gap-2 h-auto">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Pages</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            <span className="hidden sm:inline">Meta Tags</span>
          </TabsTrigger>
          <TabsTrigger value="robots" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">robots.txt</span>
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline">Sitemap</span>
          </TabsTrigger>
          <TabsTrigger value="structured" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Schema</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="backlinks" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Backlinks</span>
          </TabsTrigger>
        </TabsList>

        <TabsList className="grid grid-cols-6 lg:grid-cols-11 gap-2 h-auto mt-2">
          <TabsTrigger value="broken-links" className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Broken Links</span>
          </TabsTrigger>
          <TabsTrigger value="link-structure" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            <span className="hidden sm:inline">Links</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="crawler" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Crawler</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Images</span>
          </TabsTrigger>
          <TabsTrigger value="redirects" className="flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            <span className="hidden sm:inline">Redirects</span>
          </TabsTrigger>
          <TabsTrigger value="duplicate" className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Duplicates</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Budget</span>
          </TabsTrigger>
          <TabsTrigger value="semantic" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Semantic</span>
          </TabsTrigger>
        </TabsList>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>SEO Audit</CardTitle>
              <CardDescription>
                Run a comprehensive SEO audit on any URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="audit-url">URL to Audit</Label>
                    <Input
                      id="audit-url"
                      placeholder="https://example.com"
                      value={auditUrl}
                      onChange={(e) => setAuditUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={runSEOAudit} disabled={loading}>
                      {loading ? "Running..." : "Run Audit"}
                    </Button>
                  </div>
                </div>

                {auditResults && (
                  <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Overall Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{auditResults.overallScore}/100</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">SEO Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{auditResults.seoScore}/100</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{auditResults.performanceScore}/100</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Accessibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{auditResults.accessibilityScore}/100</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {auditResults && (
                  <div className="mt-6 space-y-4">
                    {auditResults.criticalIssues.length > 0 && (
                      <Card className="border-red-500">
                        <CardHeader>
                          <CardTitle className="text-red-600">Critical Issues ({auditResults.criticalIssues.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1">
                            {auditResults.criticalIssues.map((issue: string, i: number) => (
                              <li key={i} className="text-red-600">{issue}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {auditResults.warnings.length > 0 && (
                      <Card className="border-yellow-500">
                        <CardHeader>
                          <CardTitle className="text-yellow-600">Warnings ({auditResults.warnings.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1">
                            {auditResults.warnings.map((warning: string, i: number) => (
                              <li key={i} className="text-yellow-600">{warning}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {auditResults.recommendations.length > 0 && (
                      <Card className="border-blue-500">
                        <CardHeader>
                          <CardTitle className="text-blue-600">Recommendations ({auditResults.recommendations.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1">
                            {auditResults.recommendations.map((rec: string, i: number) => (
                              <li key={i} className="text-blue-600">{rec}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Dashboard */}
        <TabsContent value="alerts">
          <AlertsDashboard />
        </TabsContent>

        {/* Auto-Fix Engine */}
        <TabsContent value="autofix">
          <AutoFixEngine />
        </TabsContent>

        {/* Keywords Tracker */}
        <TabsContent value="keywords">
          <KeywordsTracker />
        </TabsContent>

        {/* Competitor Matrix */}
        <TabsContent value="competitors">
          <CompetitorMatrix />
        </TabsContent>

        {/* Add other tab contents with placeholders for now */}
        {['pages', 'monitoring', 'meta', 'robots', 'sitemap', 'structured', 'performance', 'backlinks', 'broken-links', 'link-structure', 'content', 'crawler', 'images', 'redirects', 'duplicate', 'security', 'mobile', 'budget', 'semantic'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{tab.replace('-', ' ')}</CardTitle>
                <CardDescription>
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')} management and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>This feature is under development.</p>
                  <p className="text-sm mt-2">The backend functions are ready. UI coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
