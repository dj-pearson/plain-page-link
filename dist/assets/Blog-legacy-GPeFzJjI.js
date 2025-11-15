;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './data-legacy-BmYdDdMQ.js', './supabase-legacy-CQONYrP8.js', './ui-components-legacy-oJhN_-ge.js', './index-legacy-CvrXsObU.js', './Breadcrumbs-legacy-D7s6hr2N.js', './icons-legacy-C8x4ypXf.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js', './three-addons-legacy-COT_Kqtz.js', './three-legacy-VFAp7wzH.js', './state-stores-legacy-80VekGrm.js', './forms-legacy-BImVIBp0.js'], function (exports, module) {
    'use strict';

    var jsxRuntimeExports, reactExports, Link, useQuery, supabase, Helmet, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Card, CardHeader, CardTitle, CardDescription, Badge, CardFooter, PublicHeader, PublicFooter, Breadcrumbs, Search, Calendar, Eye;
    return {
      setters: [module => {
        jsxRuntimeExports = module.j;
        reactExports = module.r;
        Link = module.L;
      }, module => {
        useQuery = module.u;
      }, module => {
        supabase = module.s;
      }, module => {
        Helmet = module.x;
        Input = module.I;
        Select = module.S;
        SelectTrigger = module.a;
        SelectValue = module.b;
        SelectContent = module.d;
        SelectItem = module.e;
        Card = module.C;
        CardHeader = module.f;
        CardTitle = module.g;
        CardDescription = module.h;
        Badge = module.B;
        CardFooter = module.i;
      }, module => {
        PublicHeader = module.P;
        PublicFooter = module.a;
      }, module => {
        Breadcrumbs = module.B;
      }, module => {
        Search = module.S;
        Calendar = module.e;
        Eye = module.E;
      }, null, null, null, null, null, null],
      execute: function () {
        exports("default", Blog);
        function BlogListSEO({
          totalArticles,
          latestArticleDate
        }) {
          const siteName = "Plain Page Link";
          const siteUrl = window.location.origin;
          const blogUrl = `${siteUrl}/blog`;
          const title = "Real Estate Blog - Tips, Guides & Market Insights";
          const description = "Discover expert real estate advice, market insights, buying and selling guides, investment tips, and neighborhood information. Stay informed with our comprehensive blog for agents, buyers, and sellers.";
          const blogStructuredData = {
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": blogUrl,
            name: title,
            description,
            url: blogUrl,
            publisher: {
              "@type": "Organization",
              name: siteName,
              logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/Cover.png`
              }
            },
            inLanguage: "en-US",
            ...(latestArticleDate && {
              dateModified: latestArticleDate
            })
          };
          const organizationStructuredData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteName,
            url: siteUrl,
            logo: {
              "@type": "ImageObject",
              url: `${siteUrl}/Cover.png`
            },
            sameAs: [
              // Add your social media URLs here
            ]
          };
          const websiteStructuredData = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": siteUrl,
            name: siteName,
            url: siteUrl,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${blogUrl}?search={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          };
          const breadcrumbStructuredData = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [{
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: siteUrl
            }, {
              "@type": "ListItem",
              position: 2,
              name: "Blog",
              item: blogUrl
            }]
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Helmet, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("title", {
              children: title
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "description",
              content: description
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "keywords",
              content: "real estate blog, real estate tips, home buying guide, selling guide, market insights, investment tips, neighborhood guides, real estate agents, property advice"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("link", {
              rel: "canonical",
              href: blogUrl
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:type",
              content: "website"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:url",
              content: blogUrl
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:title",
              content: title
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:description",
              content: description
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:image",
              content: `${siteUrl}/Cover.png`
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:image:width",
              content: "1200"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:image:height",
              content: "630"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:site_name",
              content: siteName
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:card",
              content: "summary_large_image"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:url",
              content: blogUrl
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:title",
              content: title
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:description",
              content: description
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:image",
              content: `${siteUrl}/Cover.png`
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "robots",
              content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "googlebot",
              content: "index, follow"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "bingbot",
              content: "index, follow"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "article:publisher",
              content: siteName
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "article:section",
              content: "Real Estate"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "author",
              content: siteName
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "language",
              content: "English"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              httpEquiv: "content-language",
              content: "en-US"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("script", {
              type: "application/ld+json",
              children: JSON.stringify(blogStructuredData)
            }), /* @__PURE__ */jsxRuntimeExports.jsx("script", {
              type: "application/ld+json",
              children: JSON.stringify(organizationStructuredData)
            }), /* @__PURE__ */jsxRuntimeExports.jsx("script", {
              type: "application/ld+json",
              children: JSON.stringify(websiteStructuredData)
            }), /* @__PURE__ */jsxRuntimeExports.jsx("script", {
              type: "application/ld+json",
              children: JSON.stringify(breadcrumbStructuredData)
            })]
          });
        }
        function Blog() {
          const [searchQuery, setSearchQuery] = reactExports.useState("");
          const [selectedCategory, setSelectedCategory] = reactExports.useState("all");
          const {
            data: articles = [],
            isLoading
          } = useQuery({
            queryKey: ["published-articles"],
            queryFn: async () => {
              const {
                data,
                error
              } = await supabase.from("articles").select("*").eq("status", "published").order("published_at", {
                ascending: false
              });
              if (error) throw error;
              return data;
            }
          });
          const categories = [{
            name: "all",
            slug: "all",
            label: "All Articles"
          }, {
            name: "Real Estate Tips",
            slug: "real-estate-tips",
            label: "Real Estate Tips"
          }, {
            name: "Market Insights",
            slug: "market-insights",
            label: "Market Insights"
          }, {
            name: "Buying Guide",
            slug: "buying-guide",
            label: "Buying Guide"
          }, {
            name: "Selling Guide",
            slug: "selling-guide",
            label: "Selling Guide"
          }, {
            name: "Investment",
            slug: "investment",
            label: "Investment"
          }, {
            name: "Neighborhood Guides",
            slug: "neighborhood-guides",
            label: "Neighborhood Guides"
          }, {
            name: "Home Improvement",
            slug: "home-improvement",
            label: "Home Improvement"
          }, {
            name: "General",
            slug: "general",
            label: "General"
          }];
          const filteredArticles = articles.filter(article => {
            const matchesSearch = !searchQuery || article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || article.category === categories.find(c => c.slug === selectedCategory)?.name || article.category === selectedCategory;
            return matchesSearch && matchesCategory;
          });
          const latestArticleDate = reactExports.useMemo(() => {
            if (articles.length === 0) return void 0;
            return articles[0]?.published_at;
          }, [articles]);
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(BlogListSEO, {
              totalArticles: articles.length,
              latestArticleDate
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "min-h-screen bg-background flex flex-col",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(PublicHeader, {}), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "bg-gradient-to-br from-blue-50 to-purple-50 border-b",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "container mx-auto px-4 py-12",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "max-w-3xl",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "mb-4",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(Breadcrumbs, {
                        items: [{
                          name: "Blog",
                          href: "/blog"
                        }]
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                      className: "text-4xl md:text-5xl font-bold text-gray-900 mb-4",
                      children: "Real Estate Blog"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-lg text-gray-600",
                      children: "Expert tips, market insights, and comprehensive guides for homebuyers, sellers, and real estate professionals"
                    })]
                  })
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "container mx-auto px-4 py-8",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex flex-col sm:flex-row gap-4 mb-8",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "relative flex-1",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Search, {
                      className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      placeholder: "Search articles...",
                      value: searchQuery,
                      onChange: e => setSearchQuery(e.target.value),
                      className: "pl-10"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    value: selectedCategory,
                    onValueChange: setSelectedCategory,
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      className: "w-full sm:w-[200px]",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {})
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectContent, {
                      children: categories.map(category => /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: category.slug,
                        children: category.label
                      }, category.slug))
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12",
                  children: categories.slice(1).map(category => /* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                    to: `/blog/category/${category.slug}`,
                    className: "group",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                      className: "h-full hover:shadow-lg transition-all hover:border-primary/50",
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                          className: "text-lg group-hover:text-primary transition-colors",
                          children: category.label
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardDescription, {
                          children: [articles.filter(a => a.category === category.name).length, " articles"]
                        })]
                      })
                    })
                  }, category.slug))
                }), isLoading ? /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-center py-12",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-muted-foreground",
                    children: "Loading articles..."
                  })
                }) : filteredArticles.length === 0 ? /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-center py-12",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-muted-foreground",
                    children: "No articles found"
                  })
                }) : /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                  children: filteredArticles.map(article => /* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                    to: `/blog/${article.slug}`,
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                      className: "h-full hover:shadow-lg transition-shadow cursor-pointer",
                      children: [article.featured_image_url && /* @__PURE__ */jsxRuntimeExports.jsx("img", {
                        src: article.featured_image_url,
                        alt: article.title,
                        className: "w-full h-48 object-cover rounded-t-lg"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "flex items-center gap-2 mb-2",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                            variant: "secondary",
                            children: article.category
                          }), article.tags?.slice(0, 2).map(tag => /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                            variant: "outline",
                            className: "text-xs",
                            children: tag
                          }, tag))]
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                          className: "line-clamp-2",
                          children: article.title
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                          className: "line-clamp-3",
                          children: article.excerpt
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardFooter, {
                        className: "flex items-center justify-between text-sm text-muted-foreground",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "flex items-center gap-1",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Calendar, {
                            className: "h-4 w-4"
                          }), new Date(article.published_at).toLocaleDateString()]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "flex items-center gap-1",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Eye, {
                            className: "h-4 w-4"
                          }), article.view_count, " views"]
                        })]
                      })]
                    })
                  }, article.id))
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(PublicFooter, {})]
            })]
          });
        }
      }
    };
  });
})();
