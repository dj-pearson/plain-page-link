;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './state-stores-legacy-80VekGrm.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js', './index-legacy-CvrXsObU.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js', './supabase-legacy-CQONYrP8.js', './data-legacy-BmYdDdMQ.js', './three-addons-legacy-COT_Kqtz.js', './three-legacy-VFAp7wzH.js', './forms-legacy-BImVIBp0.js'], function (exports, module) {
    'use strict';

    var useLocation, useNavigate, reactExports, jsxRuntimeExports, Link, Outlet, useAuthStore, cn, Dialog, DialogContent, DialogHeader, DialogTitle, Badge, Button, Home, ListTodo, Users, BarChart3, Menu, Star, Link$1, Zap, FileText, User, Palette, Settings, ExternalLink, Shield, LogOut, LayoutDashboard, Building2, Check, Copy, Share2, useToast;
    return {
      setters: [module => {
        useLocation = module.u;
        useNavigate = module.g;
        reactExports = module.r;
        jsxRuntimeExports = module.j;
        Link = module.L;
        Outlet = module.O;
      }, module => {
        useAuthStore = module.u;
      }, module => {
        cn = module.c;
        Dialog = module.D;
        DialogContent = module.l;
        DialogHeader = module.m;
        DialogTitle = module.n;
        Badge = module.B;
        Button = module.j;
      }, module => {
        Home = module.H;
        ListTodo = module.al;
        Users = module.U;
        BarChart3 = module.B;
        Menu = module.$;
        Star = module.i;
        Link$1 = module.a7;
        Zap = module.Z;
        FileText = module.aj;
        User = module.a0;
        Palette = module.am;
        Settings = module.an;
        ExternalLink = module.h;
        Shield = module.ao;
        LogOut = module.ap;
        LayoutDashboard = module.aq;
        Building2 = module.m;
        Check = module.b;
        Copy = module.ae;
        Share2 = module.u;
      }, module => {
        useToast = module.u;
      }, null, null, null, null, null, null, null],
      execute: function () {
        exports("default", DashboardLayout);
        function MobileNav() {
          const location = useLocation();
          const navigate = useNavigate();
          const {
            profile,
            signOut,
            role
          } = useAuthStore();
          const [isMenuOpen, setIsMenuOpen] = reactExports.useState(false);
          const navItems = [{
            label: "Home",
            icon: Home,
            href: "/dashboard"
          }, {
            label: "Listings",
            icon: ListTodo,
            href: "/dashboard/listings"
          }, {
            label: "Leads",
            icon: Users,
            href: "/dashboard/leads"
          }, {
            label: "Analytics",
            icon: BarChart3,
            href: "/dashboard/analytics"
          }];
          const secondaryNavItems = [{
            label: "Testimonials",
            icon: Star,
            href: "/dashboard/testimonials"
          }, {
            label: "Custom Links",
            icon: Link$1,
            href: "/dashboard/links"
          }, {
            label: "Quick Actions",
            icon: Zap,
            href: "/dashboard/quick-actions"
          }, {
            label: "Page Builder",
            icon: FileText,
            href: "/dashboard/page-builder"
          }, {
            label: "Profile",
            icon: User,
            href: "/dashboard/profile"
          }, {
            label: "Theme",
            icon: Palette,
            href: "/dashboard/theme"
          }, {
            label: "Settings",
            icon: Settings,
            href: "/dashboard/settings"
          }];
          const handleLogout = async () => {
            setIsMenuOpen(false);
            await signOut();
            navigate("/auth/login");
          };
          const handleNavigate = href => {
            setIsMenuOpen(false);
            navigate(href);
          };
          const isActive = path => {
            return location.pathname === path || location.pathname.startsWith(path + "/");
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("nav", {
              className: "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-area-inset-bottom shadow-lg",
              "aria-label": "Mobile navigation",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex justify-around items-center h-16 px-1",
                children: [navItems.map(item => {
                  const isItemActive = isActive(item.href);
                  const Icon = item.icon;
                  return /* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                    to: item.href,
                    className: cn("flex flex-col items-center justify-center flex-1 h-full relative", "transition-all duration-200 rounded-lg mx-0.5", "min-w-[44px] min-h-[44px]",
                    // iOS touch target minimum
                    "active:scale-95 active:bg-gray-100",
                    // Touch feedback
                    isItemActive ? "text-primary bg-primary/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"),
                    "aria-label": item.label,
                    "aria-current": isItemActive ? "page" : void 0,
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "relative",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Icon, {
                        className: cn("w-6 h-6 transition-transform", isItemActive && "scale-110")
                      }), item.badge && item.badge > 0 && /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse",
                        "aria-label": `${item.badge} unread`,
                        children: item.badge > 99 ? "99+" : item.badge
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: cn("text-xs mt-1 font-medium transition-all", isItemActive && "font-semibold"),
                      children: item.label
                    })]
                  }, item.href);
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                  onClick: () => setIsMenuOpen(true),
                  className: cn("flex flex-col items-center justify-center flex-1 h-full relative", "transition-all duration-200 rounded-lg mx-0.5", "min-w-[44px] min-h-[44px]", "active:scale-95 active:bg-gray-100",
                  // Touch feedback
                  "text-gray-600 hover:text-gray-900 hover:bg-gray-50"),
                  "aria-label": "Open menu with more options",
                  "aria-expanded": isMenuOpen,
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Menu, {
                    className: "w-6 h-6"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "text-xs mt-1 font-medium",
                    children: "More"
                  })]
                })]
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsx(Dialog, {
              open: isMenuOpen,
              onOpenChange: setIsMenuOpen,
              children: /* @__PURE__ */jsxRuntimeExports.jsxs(DialogContent, {
                className: "sm:max-w-md max-h-[80vh] overflow-y-auto",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(DialogHeader, {
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(DialogTitle, {
                    children: "Menu"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "space-y-1 py-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                    to: `/${profile?.username || ""}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]",
                    onClick: () => setIsMenuOpen(false),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                      className: "h-5 w-5 text-blue-600 flex-shrink-0"
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex-1",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "font-medium text-sm",
                        children: "View My Public Profile"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-xs text-gray-500",
                        children: "See how visitors see your page"
                      })]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "border-t border-gray-200 my-2"
                  }), role === "admin" && /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                      onClick: () => handleNavigate("/admin"),
                      className: cn("flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full text-left min-h-[44px]", isActive("/admin") ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"),
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Shield, {
                        className: "h-5 w-5 flex-shrink-0"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-2 flex-1",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          children: "Admin Panel"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                          variant: "secondary",
                          className: "text-xs",
                          children: "ROOT"
                        })]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "border-t border-gray-200 my-2"
                    })]
                  }), secondaryNavItems.map(item => {
                    const Icon = item.icon;
                    const itemActive = isActive(item.href);
                    return /* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                      onClick: () => handleNavigate(item.href),
                      className: cn("flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full text-left min-h-[44px]", itemActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"),
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Icon, {
                        className: "h-5 w-5 flex-shrink-0"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        children: item.label
                      })]
                    }, item.href);
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "border-t border-gray-200 my-2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                    onClick: handleLogout,
                    className: "flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left min-h-[44px]",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(LogOut, {
                      className: "h-5 w-5 flex-shrink-0"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      children: "Log Out"
                    })]
                  })]
                })]
              })
            })]
          });
        }
        function SkipLink({
          href = "#main-content",
          children = "Skip to main content"
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsx("a", {
            href,
            className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            children
          });
        }
        function DashboardLayout() {
          const location = useLocation();
          const navigate = useNavigate();
          const {
            profile,
            signOut,
            role
          } = useAuthStore();
          const {
            toast
          } = useToast();
          const [copied, setCopied] = reactExports.useState(false);
          const isActive = path => {
            return location.pathname === path;
          };
          const handleLogout = async () => {
            await signOut();
            navigate("/auth/login");
          };
          const getInitials = name => {
            if (!name) return "U";
            return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          };
          const handleCopyProfileURL = async () => {
            if (!profile?.username) return;
            const profileURL = `${window.location.origin}/${profile.username}`;
            try {
              if (navigator.share && /mobile|android|ios|iphone|ipad/i.test(navigator.userAgent)) {
                await navigator.share({
                  title: `${profile.full_name || "My"} AgentBio Profile`,
                  url: profileURL
                });
                toast({
                  title: "Shared!",
                  description: "Profile link shared successfully"
                });
              } else {
                await navigator.clipboard.writeText(profileURL);
                setCopied(true);
                toast({
                  title: "Copied!",
                  description: "Profile link copied to clipboard"
                });
                setTimeout(() => setCopied(false), 2e3);
              }
            } catch (error) {
              console.error("Failed to copy/share:", error);
              toast({
                title: "Failed to copy",
                description: "Please try again",
                variant: "destructive"
              });
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "min-h-screen bg-gray-50",
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(SkipLink, {}), /* @__PURE__ */jsxRuntimeExports.jsxs("aside", {
              className: "hidden md:fixed md:block left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "p-6",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                  to: "/",
                  className: "flex items-center gap-2 text-xl font-bold text-gray-900",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Home, {
                    className: "h-6 w-6 text-blue-600"
                  }), "AgentBio.net"]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("nav", {
                className: "px-3 space-y-1",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                  to: "/dashboard",
                  icon: /* @__PURE__ */jsxRuntimeExports.jsx(LayoutDashboard, {
                    className: "h-5 w-5"
                  }),
                  label: "Dashboard",
                  active: isActive("/dashboard")
                }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                  to: "/dashboard/listings",
                  icon: /* @__PURE__ */jsxRuntimeExports.jsx(Building2, {
                    className: "h-5 w-5"
                  }),
                  label: "Listings",
                  active: isActive("/dashboard/listings")
                }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                  to: "/dashboard/leads",
                  icon: /* @__PURE__ */jsxRuntimeExports.jsx(Users, {
                    className: "h-5 w-5"
                  }),
                  label: "Leads",
                  active: isActive("/dashboard/leads")
                }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                  to: "/dashboard/testimonials",
                  icon: /* @__PURE__ */jsxRuntimeExports.jsx(Star, {
                    className: "h-5 w-5"
                  }),
                  label: "Testimonials",
                  active: isActive("/dashboard/testimonials")
                }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                  to: "/dashboard/links",
                  icon: /* @__PURE__ */jsxRuntimeExports.jsx(Link$1, {
                    className: "h-5 w-5"
                  }),
                  label: "Custom Links",
                  active: isActive("/dashboard/links")
                }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                  to: "/dashboard/analytics",
                  icon: /* @__PURE__ */jsxRuntimeExports.jsx(BarChart3, {
                    className: "h-5 w-5"
                  }),
                  label: "Analytics",
                  active: isActive("/dashboard/analytics")
                }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                  to: "/dashboard/quick-actions",
                  icon: /* @__PURE__ */jsxRuntimeExports.jsx(Zap, {
                    className: "h-5 w-5"
                  }),
                  label: "Quick Actions",
                  active: isActive("/dashboard/quick-actions")
                }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                  to: "/dashboard/page-builder",
                  icon: /* @__PURE__ */jsxRuntimeExports.jsx(FileText, {
                    className: "h-5 w-5"
                  }),
                  label: "Page Builder",
                  active: isActive("/dashboard/page-builder")
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "pt-4 mt-4 border-t border-gray-200",
                  children: [role === "admin" && /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                    to: "/admin",
                    icon: /* @__PURE__ */jsxRuntimeExports.jsx(Shield, {
                      className: "h-5 w-5"
                    }),
                    label: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: ["Admin", /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                        variant: "secondary",
                        className: "text-xs",
                        children: "ROOT"
                      })]
                    }),
                    active: isActive("/admin")
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                    to: "/dashboard/profile",
                    icon: /* @__PURE__ */jsxRuntimeExports.jsx(User, {
                      className: "h-5 w-5"
                    }),
                    label: "Profile",
                    active: isActive("/dashboard/profile")
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                    to: "/dashboard/theme",
                    icon: /* @__PURE__ */jsxRuntimeExports.jsx(Palette, {
                      className: "h-5 w-5"
                    }),
                    label: "Theme",
                    active: isActive("/dashboard/theme")
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(NavLink, {
                    to: "/dashboard/settings",
                    icon: /* @__PURE__ */jsxRuntimeExports.jsx(Settings, {
                      className: "h-5 w-5"
                    }),
                    label: "Settings",
                    active: isActive("/dashboard/settings")
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                  onClick: handleLogout,
                  className: "flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(LogOut, {
                    className: "h-5 w-5"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    children: "Log Out"
                  })]
                })
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "md:ml-64 min-h-screen",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("header", {
                className: "bg-white border-b border-gray-200 sticky top-0 z-30 safe-area-inset-top",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                    className: "text-xl sm:text-2xl font-bold text-gray-900 truncate",
                    children: "Dashboard"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2 sm:gap-3 flex-shrink-0",
                    children: [profile?.username && /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                        variant: "outline",
                        size: "sm",
                        onClick: handleCopyProfileURL,
                        className: "gap-2 hidden md:flex",
                        "aria-label": "Copy profile URL to clipboard",
                        children: copied ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                            className: "h-4 w-4 text-green-600"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            children: "Copied!"
                          })]
                        }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                            className: "h-4 w-4"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            children: "Copy Link"
                          })]
                        })
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                        variant: "outline",
                        size: "sm",
                        onClick: handleCopyProfileURL,
                        className: "md:hidden p-2",
                        "aria-label": "Share profile URL",
                        children: copied ? /* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                          className: "h-4 w-4 text-green-600"
                        }) : /* @__PURE__ */jsxRuntimeExports.jsx(Share2, {
                          className: "h-4 w-4"
                        })
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                      to: `/${profile?.username || ""}`,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap min-h-[44px] flex items-center hidden sm:flex",
                      "aria-label": `View your public profile page as ${profile?.username}`,
                      children: "View Profile →"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-sm sm:text-base text-blue-600 font-semibold",
                        children: getInitials(profile?.full_name)
                      })
                    })]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("main", {
                id: "main-content",
                className: "p-4 sm:p-5 md:p-6 pb-24 sm:pb-24 md:pb-6 safe-area-inset-bottom",
                tabIndex: -1,
                children: /* @__PURE__ */jsxRuntimeExports.jsx(Outlet, {})
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(MobileNav, {})]
          });
        }
        function NavLink({
          to,
          icon,
          label,
          active
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
            to,
            className: `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`,
            children: [icon, /* @__PURE__ */jsxRuntimeExports.jsx("span", {
              children: label
            })]
          });
        }
      }
    };
  });
})();
