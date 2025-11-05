import { Navigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, BrainCircuit, Share2, FileText, ArrowLeft, Users, Database, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIConfigurationManager } from "@/components/admin/AIConfigurationManager";
import { SocialMediaManager } from "@/components/admin/SocialMediaManager";
import { ArticlesManager } from "@/components/admin/ArticlesManager";
import { KeywordImportDialog } from "@/components/admin/KeywordImportDialog";
import { SEOManager } from "@/components/admin/SEOManager";

export function AdminDashboard() {
  const { user, role } = useAuthStore();

  // Redirect if not admin
  if (!user || role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage AI, content, and platform settings</p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="ai" className="gap-2">
              <BrainCircuit className="h-4 w-4" />
              AI Settings
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Share2 className="h-4 w-4" />
              Social Media
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="keywords" className="gap-2">
              <Database className="h-4 w-4" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              User Roles
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Platform
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6">
            <AIConfigurationManager />
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <SocialMediaManager />
          </TabsContent>

          <TabsContent value="articles" className="space-y-6">
            <ArticlesManager />
          </TabsContent>

          <TabsContent value="keywords" className="space-y-6">
            <div className="rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Keyword Management</h2>
                  <p className="text-muted-foreground">Import and manage keywords from CSV files</p>
                </div>
                <KeywordImportDialog />
              </div>
              <p className="text-sm text-muted-foreground">
                Use the import button to bulk upload keywords from a CSV file. 
                Keywords help improve content generation and SEO optimization.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <SEOManager />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="rounded-lg border p-6">
              <h2 className="text-2xl font-bold mb-4">User Role Management</h2>
              <p className="text-muted-foreground">User role management interface coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="rounded-lg border p-6">
              <h2 className="text-2xl font-bold mb-4">Platform Settings</h2>
              <p className="text-muted-foreground">Additional platform configuration coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
