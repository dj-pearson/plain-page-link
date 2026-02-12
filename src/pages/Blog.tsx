import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BlogListSEO } from "@/components/blog/BlogListSEO";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["published-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const categories = [
    { name: "all", slug: "all", label: "All Articles" },
    { name: "Real Estate Tips", slug: "real-estate-tips", label: "Real Estate Tips" },
    { name: "Market Insights", slug: "market-insights", label: "Market Insights" },
    { name: "Buying Guide", slug: "buying-guide", label: "Buying Guide" },
    { name: "Selling Guide", slug: "selling-guide", label: "Selling Guide" },
    { name: "Investment", slug: "investment", label: "Investment" },
    { name: "Neighborhood Guides", slug: "neighborhood-guides", label: "Neighborhood Guides" },
    { name: "Home Improvement", slug: "home-improvement", label: "Home Improvement" },
    { name: "General", slug: "general", label: "General" },
  ];

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      article.category === categories.find(c => c.slug === selectedCategory)?.name ||
      article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get latest article date for SEO
  const latestArticleDate = useMemo(() => {
    if (articles.length === 0) return undefined;
    return articles[0]?.published_at;
  }, [articles]);

  return (
    <>
      {/* SEO for Blog Listing Page */}
      <BlogListSEO totalArticles={articles.length} latestArticleDate={latestArticleDate} />

      <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <PublicHeader />

      <main id="main-content" tabIndex={-1}>
      {/* Page Title Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            {/* Breadcrumbs */}
            <div className="mb-4">
              <Breadcrumbs items={[{ name: "Blog", href: "/blog" }]} />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Real Estate Blog</h1>
            <p className="text-lg text-gray-600">
              Expert tips, market insights, and comprehensive guides for homebuyers, sellers, and real estate professionals
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.slug} value={category.slug}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Cards */}
        <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {categories.slice(1).map((category) => (
            <Link
              key={category.slug}
              to={`/blog/category/${category.slug}`}
              className="group"
            >
              <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {category.label}
                  </CardTitle>
                  <CardDescription>
                    {articles.filter(a => a.category === category.name).length} articles
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link key={article.id} to={`/blog/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  {article.featured_image_url && (
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{article.category}</Badge>
                      {article.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(article.published_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {article.view_count} views
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      </main>

      {/* Footer */}
      <PublicFooter />
      </div>
    </>
  );
}
