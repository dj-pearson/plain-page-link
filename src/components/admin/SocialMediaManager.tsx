import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Edit, Trash, Calendar, Send, Plus, Link2, ToggleLeft, ToggleRight } from "lucide-react";
import { format } from "date-fns";
import { useSocialMedia } from "@/hooks/useSocialMedia";
import { CreateSocialPostDialog } from "./CreateSocialPostDialog";
import { SocialMediaWebhookDialog } from "./SocialMediaWebhookDialog";

export function SocialMediaManager() {
  const [activeTab, setActiveTab] = useState("all");
  const { 
    posts,
    marketingPosts,
    webhooks, 
    isLoading, 
    deletePost, 
    updateWebhook, 
    deleteWebhook,
    testWebhook,
    isTestingWebhook,
    generateMarketingPost,
    isGeneratingMarketingPost,
    marketingPostData,
    retryMarketingPost,
    isRetryingPost,
  } = useSocialMedia();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      case 'archived': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getContentTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredPosts = activeTab === "all" 
    ? posts 
    : posts?.filter(p => p.status === activeTab);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Social Media Content</CardTitle>
              <CardDescription>
                Manage and generate social media posts for your real estate business
              </CardDescription>
            </div>
            <CreateSocialPostDialog />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="posted">Posted</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {filteredPosts && filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{post.post_title || 'Untitled Post'}</h4>
                          <Badge className={`${getStatusColor(post.status)} text-white`}>
                            {post.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-3">
                          <span className="inline-flex items-center gap-1">
                            <Badge variant="outline">{getContentTypeLabel(post.content_type)}</Badge>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Badge variant="outline">{getContentTypeLabel(post.subject_type)}</Badge>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Badge variant="outline">{getContentTypeLabel(post.platform_type)}</Badge>
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}</span>
                          {post.scheduled_for && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Scheduled: {format(new Date(post.scheduled_for), 'MMM d, yyyy h:mm a')}
                            </span>
                          )}
                          {post.posted_at && (
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3" />
                              Posted: {format(new Date(post.posted_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this post?')) {
                              deletePost(post.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts found</p>
                  <CreateSocialPostDialog />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Configure webhooks for automatic post distribution</CardDescription>
            </div>
            <SocialMediaWebhookDialog />
          </div>
        </CardHeader>
        <CardContent>
          {webhooks && webhooks.length > 0 ? (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{webhook.name}</p>
                      <p className="text-sm text-muted-foreground">{webhook.platform}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                        {webhook.webhook_url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testWebhook(webhook.id)}
                      disabled={isTestingWebhook}
                      title="Test webhook with sample post"
                    >
                      {isTestingWebhook ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateWebhook({ 
                        id: webhook.id, 
                        updates: { is_active: !webhook.is_active } 
                      })}
                    >
                      {webhook.is_active ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this webhook?')) {
                          deleteWebhook(webhook.id);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                No webhooks configured yet. Add a webhook to automatically distribute posts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marketing Post Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Post Generator</CardTitle>
          <CardDescription>
            Generate unique, catchy social media posts to drive agent signups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => generateMarketingPost()}
              disabled={isGeneratingMarketingPost}
              className="flex-1"
            >
              {isGeneratingMarketingPost ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Post
                </>
              )}
            </Button>
            {webhooks && webhooks.length > 0 && (
              <Button 
                variant="outline"
                onClick={() => {
                  const activeWebhook = webhooks.find(w => w.is_active);
                  if (activeWebhook) {
                    generateMarketingPost(activeWebhook.webhook_url);
                  }
                }}
                disabled={isGeneratingMarketingPost || !webhooks.some(w => w.is_active)}
              >
                Generate & Send
              </Button>
            )}
          </div>

          {marketingPostData && marketingPostData.payload && (
            <div className="space-y-4 mt-4 border-t pt-4">
              <div>
                <h4 className="font-semibold mb-2">Long Form (LinkedIn/Facebook):</h4>
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {marketingPostData.payload.longFormPost}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Short Form (Twitter/Threads):</h4>
                <div className="bg-muted p-4 rounded-lg text-sm">
                  {marketingPostData.payload.shortFormPost}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Hashtags:</h4>
                <div className="flex flex-wrap gap-2">
                  {marketingPostData.payload.hashtags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marketing Post History */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Post History</CardTitle>
          <CardDescription>
            View and redeploy previously generated marketing posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marketingPosts && marketingPosts.length > 0 ? (
            <div className="space-y-4">
              {marketingPosts.map((post) => {
                const content = post.post_content as any;
                return (
                  <div key={post.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(post.status)} text-white`}>
                          {post.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {webhooks && webhooks.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const activeWebhook = webhooks.find(w => w.is_active);
                              if (activeWebhook) {
                                retryMarketingPost({ 
                                  postId: post.id, 
                                  webhookUrl: activeWebhook.webhook_url 
                                });
                              }
                            }}
                            disabled={isRetryingPost || !webhooks.some(w => w.is_active)}
                          >
                            {isRetryingPost ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Resend
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this post?')) {
                              deletePost(post.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Long Form:</h4>
                        <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                          {content.longFormPost}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Short Form:</h4>
                        <div className="bg-muted p-3 rounded text-sm">
                          {content.shortFormPost}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {content.hashtags?.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No marketing posts generated yet. Create your first one above!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
