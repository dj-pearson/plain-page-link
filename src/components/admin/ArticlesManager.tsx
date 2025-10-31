import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Edit, Trash, CheckCircle, Plus, Hash } from "lucide-react";
import { format } from "date-fns";
import { useArticles } from "@/hooks/useArticles";
import { useKeywords } from "@/hooks/useKeywords";
import { CreateArticleDialog } from "./CreateArticleDialog";

export function ArticlesManager() {
  const [activeTab, setActiveTab] = useState("all");
  const { articles, isLoading, deleteArticle, publishArticle } = useArticles();
  const { keywords, isLoading: isLoadingKeywords } = useKeywords();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      case 'archived': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredArticles = activeTab === "all" 
    ? articles 
    : articles?.filter(a => a.status === activeTab);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blog Articles</CardTitle>
              <CardDescription>
                Manage your real estate blog content and articles
              </CardDescription>
            </div>
            <CreateArticleDialog />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Articles</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {filteredArticles && filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <div key={article.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{article.title}</h4>
                          <Badge className={`${getStatusColor(article.status)} text-white`}>
                            {article.status}
                          </Badge>
                        </div>
                        {article.excerpt && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {article.excerpt.substring(0, 150)}...
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{article.category}</Badge>
                          {article.keyword_id && (
                            <Badge variant="secondary" className="gap-1">
                              <Hash className="h-3 w-3" />
                              {keywords?.find(k => k.id === article.keyword_id)?.keyword || 'Keyword'}
                            </Badge>
                          )}
                          {article.tags?.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.view_count} views
                          </span>
                          <span>Created: {format(new Date(article.created_at), 'MMM d, yyyy')}</span>
                          {article.published_at && (
                            <span>Published: {format(new Date(article.published_at), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {article.status === 'draft' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (confirm('Publish this article?')) {
                                publishArticle(article.id);
                              }
                            }}
                            title="Publish"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this article?')) {
                              deleteArticle(article.id);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No articles found</p>
                  <div className="mt-4">
                    <CreateArticleDialog />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Keyword Management */}
      <Card>
        <CardHeader>
          <CardTitle>Keyword Management</CardTitle>
          <CardDescription>Track SEO keyword usage across articles</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingKeywords ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Keywords</p>
                  <p className="text-2xl font-bold">{keywords?.length || 0}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Unused</p>
                  <p className="text-2xl font-bold text-green-600">
                    {keywords?.filter(k => k.usage_count === 0).length || 0}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Most Used</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.max(...(keywords?.map(k => k.usage_count) || [0]))}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Keywords are automatically tracked when articles are published. Import your keywords.csv to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>AI Content Suggestions</CardTitle>
          <CardDescription>Generate article ideas based on market trends and topics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered content suggestion system coming soon
          </p>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Get Suggestions
          </Button>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Article Webhooks</CardTitle>
          <CardDescription>Configure webhooks for automatic article distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Send published articles to external platforms automatically
          </p>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
