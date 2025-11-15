;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './state-stores-legacy-80VekGrm.js', './ui-components-legacy-oJhN_-ge.js', './utils-legacy-B2316hnE.js', './supabase-legacy-CQONYrP8.js', './icons-legacy-C8x4ypXf.js', './themeUtils-legacy-DfEs9Knn.js', './charts-legacy-D2SqRQVB.js'], function (exports, module) {
    'use strict';

    var useNavigate, reactExports, jsxRuntimeExports, useAuthStore, usePageBuilderStore, createNewPage, getBlockTemplates, Button, Card, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Input, Tabs, TabsList, TabsTrigger, TabsContent, Label, ue, supabase, Plus, Globe, CircleCheck, SquarePen, Eye, ExternalLink, Trash2, Sparkles, ArrowLeft, Undo, Redo, Settings, Monitor, Smartphone, Save, GripVertical, Copy, EyeOff, preloadThemeFonts, getThemedStyles, BlockRenderer;
    return {
      setters: [module => {
        useNavigate = module.g;
        reactExports = module.r;
        jsxRuntimeExports = module.j;
      }, module => {
        useAuthStore = module.u;
        usePageBuilderStore = module.a;
        createNewPage = module.c;
        getBlockTemplates = module.g;
      }, module => {
        Button = module.j;
        Card = module.C;
        Badge = module.B;
        Dialog = module.D;
        DialogContent = module.l;
        DialogHeader = module.m;
        DialogTitle = module.n;
        DialogDescription = module.G;
        Input = module.I;
        Tabs = module.J;
        TabsList = module.K;
        TabsTrigger = module.M;
        TabsContent = module.N;
        Label = module.L;
      }, module => {
        ue = module.u;
      }, module => {
        supabase = module.s;
      }, module => {
        Plus = module.aw;
        Globe = module.G;
        CircleCheck = module.n;
        SquarePen = module.ay;
        Eye = module.E;
        ExternalLink = module.h;
        Trash2 = module.az;
        Sparkles = module.g;
        ArrowLeft = module.a2;
        Undo = module.aV;
        Redo = module.aW;
        Settings = module.an;
        Monitor = module.aH;
        Smartphone = module.aI;
        Save = module.aE;
        GripVertical = module.aJ;
        Copy = module.ae;
        EyeOff = module.a4;
      }, module => {
        preloadThemeFonts = module.p;
        getThemedStyles = module.g;
        BlockRenderer = module.B;
      }, null],
      execute: function () {
        exports("default", PageBuilderEditor);
        const luxuryAgentTemplate = {
          id: "luxury-agent",
          name: "Luxury Agent",
          description: "Professional layout for luxury real estate specialists",
          category: "real-estate",
          blocks: [{
            type: "bio",
            visible: true,
            config: {
              type: "bio",
              title: "Your Name",
              subtitle: "Luxury Real Estate Specialist",
              description: "Specializing in high-end properties and exclusive listings. Let me help you find your dream home in the most prestigious neighborhoods.",
              showSocialLinks: true,
              showContactButton: true
            }
          }, {
            type: "listings",
            visible: true,
            config: {
              type: "listings",
              title: "Featured Luxury Properties",
              layout: "grid",
              filter: "featured",
              maxItems: 6,
              showPrices: true,
              showStatus: true
            }
          }, {
            type: "social",
            visible: true,
            config: {
              type: "social",
              title: "Connect With Me",
              links: [],
              layout: "horizontal",
              iconSize: "medium"
            }
          }, {
            type: "contact",
            visible: true,
            config: {
              type: "contact",
              title: "Schedule a Consultation",
              fields: [{
                id: "name",
                type: "text",
                label: "Name",
                placeholder: "Your name",
                required: true
              }, {
                id: "email",
                type: "email",
                label: "Email",
                placeholder: "your@email.com",
                required: true
              }, {
                id: "phone",
                type: "phone",
                label: "Phone",
                placeholder: "(555) 555-5555",
                required: false
              }, {
                id: "interest",
                type: "select",
                label: "I'm interested in",
                placeholder: "Select one",
                required: true,
                options: ["Buying", "Selling", "Both"]
              }, {
                id: "message",
                type: "textarea",
                label: "Tell me about your goals",
                placeholder: "What can I help you with?",
                required: true
              }],
              submitButtonText: "Request Consultation",
              successMessage: "Thank you! I'll be in touch within 24 hours."
            }
          }]
        };
        const firstTimeBuyerTemplate = {
          id: "first-time-buyer",
          name: "First-Time Buyer Specialist",
          description: "Friendly layout for agents helping first-time buyers",
          category: "real-estate",
          blocks: [{
            type: "bio",
            visible: true,
            config: {
              type: "bio",
              title: "Your Name",
              subtitle: "First-Time Homebuyer Specialist",
              description: "Making your first home purchase stress-free! I guide first-time buyers through every step of the process with patience and expertise.",
              showSocialLinks: true,
              showContactButton: true
            }
          }, {
            type: "text",
            visible: true,
            config: {
              type: "text",
              content: "🏠 New to homebuying? You're in the right place! I'll walk you through every step, from getting pre-approved to closing day.",
              align: "center",
              fontSize: "medium"
            }
          }, {
            type: "listings",
            visible: true,
            config: {
              type: "listings",
              title: "Starter Homes & Condos",
              layout: "grid",
              filter: "active",
              maxItems: 6,
              showPrices: true,
              showStatus: true
            }
          }, {
            type: "link",
            visible: true,
            config: {
              type: "link",
              title: "📚 First-Time Buyer Guide (Free Download)",
              url: "#",
              style: "button",
              openInNewTab: false
            }
          }, {
            type: "contact",
            visible: true,
            config: {
              type: "contact",
              title: "Let's Get Started!",
              fields: [{
                id: "name",
                type: "text",
                label: "Name",
                placeholder: "Your name",
                required: true
              }, {
                id: "email",
                type: "email",
                label: "Email",
                placeholder: "your@email.com",
                required: true
              }, {
                id: "phone",
                type: "phone",
                label: "Phone",
                placeholder: "(555) 555-5555",
                required: false
              }, {
                id: "timeline",
                type: "select",
                label: "When are you looking to buy?",
                placeholder: "Select timeframe",
                required: true,
                options: ["1-3 months", "3-6 months", "6-12 months", "Just exploring"]
              }],
              submitButtonText: "Start My Journey",
              successMessage: "Exciting! I'll reach out soon to help you find your first home."
            }
          }, {
            type: "social",
            visible: true,
            config: {
              type: "social",
              title: "Follow for Home Buying Tips",
              links: [],
              layout: "horizontal",
              iconSize: "large"
            }
          }]
        };
        const investorFocusedTemplate = {
          id: "investor-focused",
          name: "Investment Property Specialist",
          description: "Perfect for agents working with real estate investors",
          category: "real-estate",
          blocks: [{
            type: "bio",
            visible: true,
            config: {
              type: "bio",
              title: "Your Name",
              subtitle: "Investment Property Specialist",
              description: "Helping investors build wealth through strategic real estate acquisitions. Data-driven analysis and proven ROI.",
              showSocialLinks: true,
              showContactButton: true
            }
          }, {
            type: "listings",
            visible: true,
            config: {
              type: "listings",
              title: "Investment Opportunities",
              layout: "list",
              filter: "active",
              maxItems: 8,
              showPrices: true,
              showStatus: true
            }
          }, {
            type: "text",
            visible: true,
            config: {
              type: "text",
              content: "💰 All properties analyzed for cap rate, cash-on-cash return, and appreciation potential.",
              align: "center",
              fontSize: "medium"
            }
          }, {
            type: "link",
            visible: true,
            config: {
              type: "link",
              title: "📊 Market Analysis Report",
              url: "#",
              style: "button",
              openInNewTab: false
            }
          }, {
            type: "contact",
            visible: true,
            config: {
              type: "contact",
              title: "Discuss Investment Strategy",
              fields: [{
                id: "name",
                type: "text",
                label: "Name",
                placeholder: "Your name",
                required: true
              }, {
                id: "email",
                type: "email",
                label: "Email",
                placeholder: "your@email.com",
                required: true
              }, {
                id: "investment_type",
                type: "select",
                label: "Investment Type",
                placeholder: "Select type",
                required: true,
                options: ["Single Family Rental", "Multi-Family", "Commercial", "Fix & Flip", "Mixed Use"]
              }, {
                id: "budget",
                type: "select",
                label: "Investment Budget",
                placeholder: "Select range",
                required: false,
                options: ["Under $250K", "$250K - $500K", "$500K - $1M", "Over $1M"]
              }],
              submitButtonText: "Get Investment Analysis",
              successMessage: "I'll prepare a custom market analysis for you."
            }
          }, {
            type: "social",
            visible: true,
            config: {
              type: "social",
              title: "Connect for Market Insights",
              links: [],
              layout: "horizontal",
              iconSize: "medium"
            }
          }]
        };
        const simpleCleanTemplate = {
          id: "simple-clean",
          name: "Simple & Clean",
          description: "Minimalist layout that works for any real estate professional",
          category: "general",
          blocks: [{
            type: "bio",
            visible: true,
            config: {
              type: "bio",
              title: "Your Name",
              subtitle: "Real Estate Professional",
              description: "Helping clients buy and sell properties with expertise and dedication.",
              showSocialLinks: false,
              showContactButton: true
            }
          }, {
            type: "listings",
            visible: true,
            config: {
              type: "listings",
              title: "Current Listings",
              layout: "grid",
              filter: "active",
              maxItems: 6,
              showPrices: true,
              showStatus: false
            }
          }, {
            type: "contact",
            visible: true,
            config: {
              type: "contact",
              title: "Get in Touch",
              fields: [{
                id: "name",
                type: "text",
                label: "Name",
                placeholder: "Your name",
                required: true
              }, {
                id: "email",
                type: "email",
                label: "Email",
                placeholder: "your@email.com",
                required: true
              }, {
                id: "message",
                type: "textarea",
                label: "Message",
                placeholder: "How can I help?",
                required: true
              }],
              submitButtonText: "Send Message",
              successMessage: "Thanks! I'll get back to you soon."
            }
          }]
        };
        const pageTemplates = [luxuryAgentTemplate, firstTimeBuyerTemplate, investorFocusedTemplate, simpleCleanTemplate];
        function applyTemplate(template, userId, slug) {
          const blocks = template.blocks.map((block, index) => ({
            ...block,
            id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            order: index
          }));
          return blocks;
        }
        function PageList() {
          const navigate = useNavigate();
          const {
            user,
            profile
          } = useAuthStore();
          const {
            setPage,
            loadUserPages,
            setAsActivePage
          } = usePageBuilderStore();
          const [pages, setPages] = reactExports.useState([]);
          const [loading, setLoading] = reactExports.useState(true);
          const [activating, setActivating] = reactExports.useState(null);
          const [showTemplates, setShowTemplates] = reactExports.useState(false);
          reactExports.useEffect(() => {
            loadPages();
          }, []);
          const loadPages = async () => {
            try {
              const userPages = await loadUserPages();
              setPages(userPages);
            } catch (error) {
              console.error("Failed to load pages:", error);
              ue.error("Failed to load pages");
            } finally {
              setLoading(false);
            }
          };
          const handleCreateNew = () => {
            if (!user || !profile) {
              ue.error("Please log in to create a page");
              return;
            }
            setShowTemplates(true);
          };
          const handleSelectTemplate = templateId => {
            if (!user || !profile) {
              ue.error("Please log in to create a page");
              return;
            }
            const newPage = createNewPage(user.id, profile.username || "my-page");
            if (templateId) {
              const template = pageTemplates.find(t => t.id === templateId);
              if (template) {
                newPage.blocks = applyTemplate(template, user.id, newPage.slug);
                ue.success(`Created page from "${template.name}" template!`);
              }
            }
            setPage(newPage);
            setShowTemplates(false);
            navigate("/dashboard/page-builder");
          };
          const handleEdit = page => {
            setPage(page);
            navigate("/dashboard/page-builder");
          };
          const handleSetActive = async pageId => {
            setActivating(pageId);
            try {
              await setAsActivePage(pageId);
              await loadPages();
            } catch (error) {
              console.error("Failed to set active page:", error);
            } finally {
              setActivating(null);
            }
          };
          const handleDelete = async pageId => {
            if (!confirm("Are you sure you want to delete this page?")) return;
            try {
              const {
                error
              } = await supabase.from("custom_pages").delete().eq("id", pageId);
              if (error) throw error;
              ue.success("Page deleted successfully");
              await loadPages();
            } catch (error) {
              console.error("Failed to delete page:", error);
              ue.error("Failed to delete page");
            }
          };
          if (loading) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "flex items-center justify-center py-12",
              children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-muted-foreground",
                children: "Loading pages..."
              })
            });
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "text-2xl font-bold",
                  children: "Your Pages"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-muted-foreground",
                  children: "Create custom link-in-bio pages"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                onClick: handleCreateNew,
                className: "gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Plus, {
                  className: "h-4 w-4"
                }), "Create New Page"]
              })]
            }), pages.length === 0 ? /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
              className: "p-12 text-center",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "max-w-md mx-auto",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Globe, {
                  className: "h-12 w-12 mx-auto mb-4 text-muted-foreground"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                  className: "text-lg font-semibold mb-2",
                  children: "No pages yet"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-muted-foreground mb-6",
                  children: "Create your first custom page to get started"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: handleCreateNew,
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Plus, {
                    className: "h-4 w-4"
                  }), "Create Your First Page"]
                })]
              })
            }) : /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
              children: pages.map(page => {
                const isActive = page.is_active || false;
                return /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                  className: "p-6 space-y-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "space-y-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-start justify-between",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex-1",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                          className: "font-semibold text-lg truncate",
                          children: page.title
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                          className: "text-sm text-muted-foreground truncate",
                          children: ["/", page.slug]
                        })]
                      }), isActive && /* @__PURE__ */jsxRuntimeExports.jsxs(Badge, {
                        variant: "default",
                        className: "gap-1",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheck, {
                          className: "h-3 w-3"
                        }), "Active"]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex gap-2",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                        variant: page.published ? "default" : "secondary",
                        children: page.published ? "Published" : "Draft"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs(Badge, {
                        variant: "outline",
                        children: [page.blocks.length, " blocks"]
                      })]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex flex-col gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                      variant: "outline",
                      size: "sm",
                      onClick: () => handleEdit(page),
                      className: "gap-2 w-full",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SquarePen, {
                        className: "h-4 w-4"
                      }), "Edit"]
                    }), page.published && /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                        variant: "outline",
                        size: "sm",
                        asChild: true,
                        className: "gap-2 w-full",
                        children: /* @__PURE__ */jsxRuntimeExports.jsxs("a", {
                          href: `/p/${page.slug}`,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Eye, {
                            className: "h-4 w-4"
                          }), "Preview", /* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                            className: "h-3 w-3 ml-auto"
                          })]
                        })
                      }), !isActive && /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                        variant: "default",
                        size: "sm",
                        onClick: () => handleSetActive(page.id),
                        disabled: activating === page.id,
                        className: "gap-2 w-full",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheck, {
                          className: "h-4 w-4"
                        }), activating === page.id ? "Setting..." : "Set as Active"]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                      variant: "outline",
                      size: "sm",
                      onClick: () => handleDelete(page.id),
                      className: "gap-2 w-full text-destructive hover:text-destructive",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Trash2, {
                        className: "h-4 w-4"
                      }), "Delete"]
                    })]
                  }), page.description && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-muted-foreground line-clamp-2",
                    children: page.description
                  })]
                }, page.id);
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsx(Dialog, {
              open: showTemplates,
              onOpenChange: setShowTemplates,
              children: /* @__PURE__ */jsxRuntimeExports.jsxs(DialogContent, {
                className: "max-w-4xl max-h-[80vh] overflow-y-auto",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(DialogHeader, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(DialogTitle, {
                    children: "Choose a Template"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(DialogDescription, {
                    children: "Start with a pre-built template or create a blank page"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                    className: "p-6 cursor-pointer hover:border-primary transition-colors",
                    onClick: () => handleSelectTemplate(null),
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex flex-col h-full",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-3 mb-3",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "p-2 bg-gray-100 rounded",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx(Plus, {
                            className: "h-6 w-6"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                            className: "font-semibold",
                            children: "Blank Page"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                            className: "text-sm text-muted-foreground",
                            children: "Start from scratch"
                          })]
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm text-muted-foreground flex-1",
                        children: "Create a completely custom page by adding blocks one at a time."
                      })]
                    })
                  }), pageTemplates.map(template => /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                    className: "p-6 cursor-pointer hover:border-primary transition-colors",
                    onClick: () => handleSelectTemplate(template.id),
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex flex-col h-full",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-3 mb-3",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "p-2 bg-primary/10 rounded",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx(Sparkles, {
                            className: "h-6 w-6 text-primary"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                            className: "font-semibold",
                            children: template.name
                          }), /* @__PURE__ */jsxRuntimeExports.jsxs(Badge, {
                            variant: "outline",
                            className: "mt-1",
                            children: [template.blocks.length, " blocks"]
                          })]
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm text-muted-foreground flex-1",
                        children: template.description
                      })]
                    })
                  }, template.id))]
                })]
              })
            })]
          });
        }
        function PageBuilderEditor() {
          const {
            user,
            profile
          } = useAuthStore();
          const [showPageList, setShowPageList] = reactExports.useState(true);
          const [lastSaved, setLastSaved] = reactExports.useState(null);
          const [isMobilePreview, setIsMobilePreview] = reactExports.useState(false);
          const {
            page,
            selectedBlockId,
            isPreviewMode,
            isSaving,
            canUndo,
            canRedo,
            setPage,
            selectBlock,
            addBlockToPage,
            removeBlockFromPage,
            duplicatePageBlock,
            toggleBlockVisible,
            undo,
            redo,
            togglePreviewMode,
            savePage,
            publishPage,
            updatePageMeta
          } = usePageBuilderStore();
          reactExports.useEffect(() => {
            setShowPageList(!page);
          }, [page]);
          reactExports.useEffect(() => {
            if (page?.theme) {
              preloadThemeFonts(page.theme);
            }
          }, [page?.theme]);
          reactExports.useEffect(() => {
            if (!page || isSaving) return;
            const autoSaveTimer = setTimeout(async () => {
              try {
                await savePage();
                const savedTime = /* @__PURE__ */new Date();
                setLastSaved(savedTime);
                console.log("Auto-saved at", savedTime.toLocaleTimeString());
              } catch (error) {
                console.error("Auto-save failed:", error);
                ue.error("Auto-save failed - please save manually");
              }
            }, 3e3);
            return () => clearTimeout(autoSaveTimer);
          }, [page, isSaving, savePage]);
          const handleSave = async () => {
            try {
              await savePage();
              setLastSaved(/* @__PURE__ */new Date());
              ue.success("Page saved successfully!");
            } catch (error) {
              ue.error("Failed to save page");
            }
          };
          const handlePublish = async () => {
            try {
              await publishPage();
              ue.success("Page published successfully!");
            } catch (error) {
              ue.error("Failed to publish page");
            }
          };
          const selectedBlock = page?.blocks.find(b => b.id === selectedBlockId);
          const blockTemplates = getBlockTemplates();
          if (showPageList || !page) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "container mx-auto py-8",
              children: /* @__PURE__ */jsxRuntimeExports.jsx(PageList, {})
            });
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "flex h-screen bg-gray-50",
            children: [!isPreviewMode && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "w-64 bg-white border-r flex flex-col",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "p-4 border-b",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "font-semibold text-lg",
                  children: "Add Blocks"
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "flex-1 overflow-y-auto p-4 space-y-2",
                children: blockTemplates.map(template => /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                  onClick: () => addBlockToPage(template.type),
                  className: "w-full p-3 text-left rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Plus, {
                      className: "w-5 h-5 text-gray-400 group-hover:text-primary"
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "font-medium text-sm",
                        children: template.name
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-xs text-gray-500",
                        children: template.description
                      })]
                    })]
                  })
                }, template.type))
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex-1 flex flex-col",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "bg-white border-b p-4 flex items-center justify-between",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                    variant: "outline",
                    size: "sm",
                    onClick: () => {
                      setPage(null);
                      setShowPageList(true);
                    },
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(ArrowLeft, {
                      className: "w-4 h-4 mr-2"
                    }), "Back to Pages"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-px h-6 bg-gray-300 mx-2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: "outline",
                    size: "sm",
                    onClick: undo,
                    disabled: !canUndo(),
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Undo, {
                      className: "w-4 h-4"
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: "outline",
                    size: "sm",
                    onClick: redo,
                    disabled: !canRedo(),
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Redo, {
                      className: "w-4 h-4"
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-px h-6 bg-gray-300 mx-2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    type: "text",
                    value: page.title,
                    onChange: e => updatePageMeta({
                      title: e.target.value
                    }),
                    className: "w-64",
                    placeholder: "Page Title"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                    variant: page.published ? "default" : "secondary",
                    children: page.published ? "Published" : "Draft"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      variant: "outline",
                      size: "sm",
                      onClick: togglePreviewMode,
                      children: isPreviewMode ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Settings, {
                          className: "w-4 h-4 mr-2"
                        }), "Edit"]
                      }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Eye, {
                          className: "w-4 h-4 mr-2"
                        }), "Preview"]
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex border rounded-md",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                        variant: !isMobilePreview ? "default" : "ghost",
                        size: "sm",
                        onClick: () => setIsMobilePreview(false),
                        className: "rounded-r-none",
                        title: "Desktop Preview",
                        children: /* @__PURE__ */jsxRuntimeExports.jsx(Monitor, {
                          className: "w-4 h-4"
                        })
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                        variant: isMobilePreview ? "default" : "ghost",
                        size: "sm",
                        onClick: () => setIsMobilePreview(true),
                        className: "rounded-l-none",
                        title: "Mobile Preview",
                        children: /* @__PURE__ */jsxRuntimeExports.jsx(Smartphone, {
                          className: "w-4 h-4"
                        })
                      })]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                      variant: "outline",
                      size: "sm",
                      onClick: handleSave,
                      disabled: isSaving,
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Save, {
                        className: "w-4 h-4 mr-2"
                      }), isSaving ? "Saving..." : "Save"]
                    }), lastSaved && !isSaving && /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                      className: "text-xs text-gray-500",
                      children: ["Saved ", lastSaved.toLocaleTimeString()]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                    size: "sm",
                    onClick: handlePublish,
                    disabled: isSaving,
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Globe, {
                      className: "w-4 h-4 mr-2"
                    }), "Publish"]
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "flex-1 overflow-y-auto p-8",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mx-auto rounded-lg shadow-lg min-h-full transition-all duration-300",
                  style: {
                    ...getThemedStyles(page.theme),
                    backgroundColor: page.theme.colors.background,
                    color: page.theme.colors.text,
                    fontFamily: `'${page.theme.fonts.body}', sans-serif`,
                    maxWidth: isMobilePreview ? "375px" : "672px"
                    // Mobile: 375px, Desktop: 672px (2xl)
                  },
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "p-8",
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      gap: page.theme.spacing === "compact" ? "1rem" : page.theme.spacing === "spacious" ? "3rem" : "2rem"
                    },
                    children: page.blocks.length === 0 ? /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "text-center py-20 text-gray-500",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Plus, {
                        className: "w-12 h-12 mx-auto mb-4 text-gray-300"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "font-medium",
                        children: "Your page is empty"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm mt-1",
                        children: "Add blocks from the left sidebar to get started"
                      })]
                    }) : page.blocks.map(block => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "relative group",
                      children: [!isPreviewMode && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("button", {
                          className: "p-1 bg-white border rounded hover:bg-gray-50",
                          title: "Drag to reorder",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx(GripVertical, {
                            className: "w-4 h-4"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                          onClick: () => duplicatePageBlock(block.id),
                          className: "p-1 bg-white border rounded hover:bg-gray-50",
                          title: "Duplicate",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                            className: "w-4 h-4"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                          onClick: () => toggleBlockVisible(block.id),
                          className: "p-1 bg-white border rounded hover:bg-gray-50",
                          title: block.visible ? "Hide" : "Show",
                          children: block.visible ? /* @__PURE__ */jsxRuntimeExports.jsx(Eye, {
                            className: "w-4 h-4"
                          }) : /* @__PURE__ */jsxRuntimeExports.jsx(EyeOff, {
                            className: "w-4 h-4"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                          onClick: () => removeBlockFromPage(block.id),
                          className: "p-1 bg-white border rounded hover:bg-red-50 text-red-600",
                          title: "Delete",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx(Trash2, {
                            className: "w-4 h-4"
                          })
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(BlockRenderer, {
                        block,
                        isEditing: !isPreviewMode,
                        isSelected: selectedBlockId === block.id,
                        onSelect: () => selectBlock(block.id),
                        userId: page.userId
                      })]
                    }, block.id))
                  })
                })
              })]
            }), !isPreviewMode && selectedBlock && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "w-80 bg-white border-l flex flex-col",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "p-4 border-b",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "font-semibold text-lg",
                  children: "Block Settings"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: selectedBlock.type
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "flex-1 overflow-y-auto p-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(Tabs, {
                  defaultValue: "content",
                  className: "w-full",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsList, {
                    className: "grid w-full grid-cols-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                      value: "content",
                      children: "Content"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                      value: "style",
                      children: "Style"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsContent, {
                    value: "content",
                    className: "space-y-4 mt-4",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "space-y-2",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                        children: "Block Type"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm text-gray-600 capitalize",
                        children: selectedBlock.type
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "p-4 bg-gray-50 rounded text-sm text-gray-600",
                      children: "Block-specific settings will appear here"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                    value: "style",
                    className: "space-y-4 mt-4",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "p-4 bg-gray-50 rounded text-sm text-gray-600",
                      children: "Style settings coming soon"
                    })
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "p-4 border-t",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  variant: "outline",
                  className: "w-full",
                  onClick: () => removeBlockFromPage(selectedBlock.id),
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Trash2, {
                    className: "w-4 h-4 mr-2"
                  }), "Delete Block"]
                })
              })]
            })]
          });
        }
      }
    };
  });
})();
