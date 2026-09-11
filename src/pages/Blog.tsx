import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BLOG_CATEGORIES } from '@/config/blog-categories';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BlogListSEO } from '@/components/blog/BlogListSEO';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function Blog() {
  /**
   * The search term lives in the URL (US-179).
   *
   * BlogListSEO has always declared a SearchAction against
   * /blog?search={search_term_string} — that is the schema Google reads to
   * offer a searchbox — and nothing here read the parameter, so following one
   * of those URLs landed on an unfiltered blog. Reading it makes the claim
   * true, and makes a filtered view a link somebody can share.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') ?? '';
  const selectedCategory = searchParams.get('category') ?? 'all';

  const setSearchQuery = (value: string) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set('search', value);
        else next.delete('search');
        return next;
      },
      // A keystroke should not be a history entry to back out of.
      { replace: true }
    );
  };

  const setSelectedCategory = (value: string) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value && value !== 'all') next.set('category', value);
      else next.delete('category');
      return next;
    });
  };

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['published-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // The filter list and the category pages read the same registry (US-166).
  // This was a second hardcoded copy of it, in agreement with BlogCategory's by
  // coincidence rather than by construction.
  const categories = [
    { name: 'all', slug: 'all', label: 'All Articles' },
    ...BLOG_CATEGORIES.map((c) => ({ name: c.name, slug: c.slug, label: c.label })),
  ];

  /**
   * The categories that actually have something to show.
   *
   * scripts/lib/articles.mts generates a /blog/category/{slug} route only for a
   * category with a published article (US-166), so linking a category with none
   * is linking a page the build did not render.
   */
  const categoriesWithArticles = BLOG_CATEGORIES.map((category) => ({
    category,
    count: articles.filter((article) => article.category === category.name).length,
  })).filter(({ count }) => count > 0);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      article.category === categories.find((c) => c.slug === selectedCategory)?.name ||
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
      <BlogListSEO
        totalArticles={articles.length}
        latestArticleDate={latestArticleDate ?? undefined}
      />

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
                  <Breadcrumbs emitSchema={false} items={[{ name: 'Blog', href: '/blog' }]} />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Real Estate Blog
                </h1>
                <p className="text-lg text-gray-600">
                  Expert tips, market insights, and comprehensive guides for homebuyers, sellers,
                  and real estate professionals
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
                {/*
                  US-208: the same unnamed combobox US-206 fixed in
                  BlogSection. Two components render this filter and only one of
                  them was on a page the a11y suite looked at.
                */}
                <SelectTrigger
                  className="w-full sm:w-[200px]"
                  aria-label="Filter articles by category"
                >
                  <SelectValue placeholder="All Categories" />
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

            {/* Category Cards.
                Only the categories that have an article. This grid used to
                render all eight from the registry, including the ones with
                nothing in them — and US-166 stopped generating a route for a
                category with no articles, so /blog was linking to six pages the
                build does not render. Under the old `/* /index.html 200`
                fallback they answered with the homepage; since US-176 they are
                real 404s. Six broken links, on the page that exists to send
                people into the blog (US-184). */}
            {categoriesWithArticles.length > 0 && (
              <>
                <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                  {categoriesWithArticles.map(({ category, count }) => (
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
                            {count} {count === 1 ? 'article' : 'articles'}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}

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
                          {article.published_at
                            ? new Date(article.published_at).toLocaleDateString()
                            : '—'}
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
