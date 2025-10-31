import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Calendar, Send } from "lucide-react";
import { format } from "date-fns";

interface SocialMediaPost {
  id: string;
  content_type: string;
  subject_type: string;
  platform_type: string;
  post_title: string;
  status: string;
  created_at: string;
  scheduled_for: string | null;
  posted_at: string | null;
}

export function SocialMediaManager() {
  const [activeTab, setActiveTab] = useState("all");

  // Fetch posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['social-media-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SocialMediaPost[];
    },
  });

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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
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
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts found</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>Configure webhooks for automatic post distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Webhook management coming soon - automate posting to multiple platforms
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
