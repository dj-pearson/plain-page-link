;
(function () {
  System.register(['./three-addons-legacy-COT_Kqtz.js', './react-vendor-legacy-BZejsv6W.js', './themeUtils-legacy-DfEs9Knn.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js', './three-legacy-VFAp7wzH.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js', './supabase-legacy-CQONYrP8.js'], function (exports, module) {
    'use strict';

    var __vitePreload, useParams, reactExports, jsxRuntimeExports, preloadThemeFonts, getThemedStyles, BlockRenderer, Helmet, LoaderCircle;
    return {
      setters: [module => {
        __vitePreload = module._;
      }, module => {
        useParams = module.f;
        reactExports = module.r;
        jsxRuntimeExports = module.j;
      }, module => {
        preloadThemeFonts = module.p;
        getThemedStyles = module.g;
        BlockRenderer = module.B;
      }, module => {
        Helmet = module.x;
      }, module => {
        LoaderCircle = module.L;
      }, null, null, null, null],
      execute: function () {
        exports("default", PublicPage);
        function PublicPage() {
          const {
            slug
          } = useParams();
          const [page, setPage] = reactExports.useState(null);
          const [loading, setLoading] = reactExports.useState(true);
          const [error, setError] = reactExports.useState(null);
          reactExports.useEffect(() => {
            const fetchPage = async () => {
              if (!slug) {
                setError("No page slug provided");
                setLoading(false);
                return;
              }
              try {
                const {
                  supabase
                } = await __vitePreload(async () => {
                  const {
                    supabase
                  } = await module.import('./supabase-legacy-CQONYrP8.js').then(n => n.f);
                  return {
                    supabase
                  };
                }, false              ? __VITE_PRELOAD__ : void 0);
                const {
                  data,
                  error: error2
                } = await supabase.from("custom_pages").select("*").eq("slug", slug).eq("published", true).single();
                if (error2) throw error2;
                if (!data) {
                  setError("Page not found or not published");
                  setLoading(false);
                  return;
                }
                const pageConfig = {
                  id: data.id,
                  userId: data.user_id,
                  slug: data.slug,
                  title: data.title,
                  description: data.description || "",
                  blocks: data.blocks,
                  theme: data.theme,
                  seo: data.seo,
                  published: data.published,
                  createdAt: new Date(data.created_at),
                  updatedAt: new Date(data.updated_at)
                };
                setPage(pageConfig);
              } catch (err) {
                console.error("Failed to fetch page:", err);
                setError("Page not found or not published");
              } finally {
                setLoading(false);
              }
            };
            fetchPage();
          }, [slug]);
          reactExports.useEffect(() => {
            if (page?.theme) {
              preloadThemeFonts(page.theme);
            }
          }, [page?.theme]);
          if (loading) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "flex items-center justify-center min-h-screen",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "text-center",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(LoaderCircle, {
                  className: "w-8 h-8 animate-spin mx-auto mb-4 text-primary"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-gray-600",
                  children: "Loading page..."
                })]
              })
            });
          }
          if (error || !page) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "flex items-center justify-center min-h-screen",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "text-center",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                  className: "text-4xl font-bold text-gray-900 mb-2",
                  children: "404"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-gray-600 mb-4",
                  children: error || "Page not found"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("a", {
                  href: "/",
                  className: "text-primary hover:underline",
                  children: "Go to homepage"
                })]
              })
            });
          }
          const themeStyles = getThemedStyles(page.theme);
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Helmet, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("title", {
                children: page.seo.title || page.title
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "description",
                content: page.seo.description || page.description
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "keywords",
                content: page.seo.keywords.join(", ")
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                property: "og:title",
                content: page.seo.title || page.title
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                property: "og:description",
                content: page.seo.description || page.description
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                property: "og:type",
                content: "website"
              }), page.seo.ogImage && /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                property: "og:image",
                content: page.seo.ogImage
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "twitter:card",
                content: page.seo.twitterCard
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "twitter:title",
                content: page.seo.title || page.title
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "twitter:description",
                content: page.seo.description || page.description
              }), page.seo.ogImage && /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "twitter:image",
                content: page.seo.ogImage
              }), page.seo.structuredData && /* @__PURE__ */jsxRuntimeExports.jsx("script", {
                type: "application/ld+json",
                children: JSON.stringify(page.seo.structuredData)
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              style: themeStyles,
              className: "min-h-screen",
              "data-theme": page.theme.preset || "default",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "max-w-4xl mx-auto py-12 px-4",
                style: {
                  backgroundColor: page.theme.colors.background,
                  color: page.theme.colors.text,
                  fontFamily: `'${page.theme.fonts.body}', sans-serif`
                },
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: page.theme.spacing === "compact" ? "1rem" : page.theme.spacing === "spacious" ? "3rem" : "2rem"
                  },
                  children: page.blocks.filter(block => block.visible).sort((a, b) => a.order - b.order).map(block => /* @__PURE__ */jsxRuntimeExports.jsx(BlockRenderer, {
                    block,
                    isEditing: false,
                    userId: page.userId
                  }, block.id))
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mt-16 pt-8 border-t text-center text-sm text-gray-500",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    children: ["Powered by", " ", /* @__PURE__ */jsxRuntimeExports.jsx("a", {
                      href: "https://agentbio.net",
                      className: "text-primary hover:underline",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      children: "AgentBio"
                    })]
                  })
                })]
              })
            })]
          });
        }
      }
    };
  });
})();
