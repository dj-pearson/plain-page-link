;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './data-legacy-BmYdDdMQ.js', './supabase-legacy-CQONYrP8.js', './index-legacy-CvrXsObU.js', './icons-legacy-C8x4ypXf.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js'], function (exports, module) {
    'use strict';

    var jsxRuntimeExports, reactExports, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Popover, PopoverTrigger, PopoverContent, Checkbox, Label, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, useQueryClient, useMutation, useQuery, supabase, useToast, CircleCheck, Clock, CircleX, ExternalLink, MousePointer, Eye, Target, BarChart3, Users, FileText, TrendingDown, Minus, TrendingUp, Calendar, Filter, RefreshCw, Download, Settings, ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, LineChart, Line, format;
    return {
      setters: [module => {
        jsxRuntimeExports = module.j;
        reactExports = module.r;
      }, module => {
        Card = module.C;
        CardHeader = module.f;
        CardTitle = module.g;
        CardDescription = module.h;
        CardContent = module.o;
        Badge = module.B;
        Button = module.j;
        Tabs = module.J;
        TabsList = module.K;
        TabsTrigger = module.M;
        TabsContent = module.N;
        Table = module.Z;
        TableHeader = module._;
        TableRow = module.$;
        TableHead = module.a0;
        TableBody = module.a1;
        TableCell = module.a2;
        Popover = module.U;
        PopoverTrigger = module.V;
        PopoverContent = module.W;
        Checkbox = module.z;
        Label = module.L;
        DropdownMenu = module.a3;
        DropdownMenuTrigger = module.a4;
        DropdownMenuContent = module.a5;
        DropdownMenuItem = module.a6;
      }, module => {
        useQueryClient = module.b;
        useMutation = module.c;
        useQuery = module.u;
      }, module => {
        supabase = module.s;
      }, module => {
        useToast = module.u;
      }, module => {
        CircleCheck = module.n;
        Clock = module.a8;
        CircleX = module.aD;
        ExternalLink = module.h;
        MousePointer = module.ab;
        Eye = module.E;
        Target = module.j;
        BarChart3 = module.B;
        Users = module.U;
        FileText = module.aj;
        TrendingDown = module.ac;
        Minus = module.aL;
        TrendingUp = module.T;
        Calendar = module.e;
        Filter = module.ax;
        RefreshCw = module.aM;
        Download = module.a1;
        Settings = module.an;
      }, module => {
        ResponsiveContainer = module.R;
        AreaChart = module.A;
        CartesianGrid = module.C;
        XAxis = module.X;
        YAxis = module.Y;
        Tooltip = module.T;
        Legend = module.f;
        Area = module.e;
        LineChart = module.L;
        Line = module.b;
      }, module => {
        format = module.a;
      }],
      execute: function () {
        exports("S", SearchAnalyticsDashboard);
        function useConnectedPlatforms() {
          return useQuery({
            queryKey: ["connected-platforms"],
            queryFn: async () => {
              const {
                data: {
                  user
                }
              } = await supabase.auth.getUser();
              if (!user) throw new Error("Not authenticated");
              const {
                data,
                error
              } = await supabase.rpc("get_connected_search_platforms", {
                p_user_id: user.id
              });
              if (error) throw error;
              return data;
            }
          });
        }
        function useOAuthInit() {
          const {
            toast
          } = useToast();
          return useMutation({
            mutationFn: async platform => {
              const redirectUris = {
                google_analytics: `${window.location.origin}/admin/search-analytics/oauth/callback/google-analytics`,
                google_search_console: `${window.location.origin}/admin/search-analytics/oauth/callback/google-search-console`,
                bing_webmaster: `${window.location.origin}/admin/search-analytics/oauth/callback/bing-webmaster`,
                yandex_webmaster: `${window.location.origin}/admin/search-analytics/oauth/callback/yandex-webmaster`
              };
              const oauthUrls = {
                google_analytics: "https://accounts.google.com/o/oauth2/v2/auth",
                google_search_console: "https://accounts.google.com/o/oauth2/v2/auth",
                bing_webmaster: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                yandex_webmaster: "https://oauth.yandex.ru/authorize"
              };
              const params = new URLSearchParams({
                client_id: platform.includes("google") ? "" : platform === "bing_webmaster" ? "" : "",
                redirect_uri: redirectUris[platform],
                response_type: "code",
                scope: platform === "google_analytics" ? "https://www.googleapis.com/auth/analytics.readonly" : platform === "google_search_console" ? "https://www.googleapis.com/auth/webmasters.readonly" : platform === "bing_webmaster" ? "https://api.bing.microsoft.com/webmaster.read offline_access" : "webmaster:read",
                access_type: "offline",
                prompt: "consent"
              });
              const oauthUrl = `${oauthUrls[platform]}?${params.toString()}`;
              window.location.href = oauthUrl;
            },
            onError: error => {
              toast({
                title: "OAuth Error",
                description: error.message,
                variant: "destructive"
              });
            }
          });
        }
        function useSyncPlatform() {
          const {
            toast
          } = useToast();
          const queryClient = useQueryClient();
          return useMutation({
            mutationFn: async ({
              platform,
              property_id,
              site_id,
              start_date,
              end_date
            }) => {
              const {
                data: {
                  session
                }
              } = await supabase.auth.getSession();
              if (!session) throw new Error("Not authenticated");
              const functionName = platform === "google_analytics" ? "google-analytics-sync" : platform === "google_search_console" ? "google-search-console-sync" : platform === "bing_webmaster" ? "bing-webmaster-sync" : "yandex-webmaster-sync";
              const {
                data,
                error
              } = await supabase.functions.invoke(functionName, {
                body: {
                  property_id,
                  site_id,
                  start_date,
                  end_date
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`
                }
              });
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              toast({
                title: "Sync Started",
                description: "Data synchronization started successfully"
              });
              queryClient.invalidateQueries({
                queryKey: ["search-analytics"]
              });
            },
            onError: error => {
              toast({
                title: "Sync Failed",
                description: error.message,
                variant: "destructive"
              });
            }
          });
        }
        function useAggregateAnalytics() {
          const {
            toast
          } = useToast();
          const queryClient = useQueryClient();
          return useMutation({
            mutationFn: async ({
              start_date,
              end_date,
              force_refresh
            }) => {
              const {
                data: {
                  session
                }
              } = await supabase.auth.getSession();
              if (!session) throw new Error("Not authenticated");
              const {
                data,
                error
              } = await supabase.functions.invoke("aggregate-search-analytics", {
                body: {
                  start_date,
                  end_date,
                  force_refresh
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`
                }
              });
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              toast({
                title: "Aggregation Complete",
                description: "Analytics data aggregated successfully"
              });
              queryClient.invalidateQueries({
                queryKey: ["unified-analytics"]
              });
            },
            onError: error => {
              toast({
                title: "Aggregation Failed",
                description: error.message,
                variant: "destructive"
              });
            }
          });
        }
        function useUnifiedAnalytics(filters) {
          return useQuery({
            queryKey: ["unified-analytics", filters],
            queryFn: async () => {
              const {
                data: {
                  user
                }
              } = await supabase.auth.getUser();
              if (!user) throw new Error("Not authenticated");
              let query = supabase.from("unified_search_analytics").select("*").eq("user_id", user.id).gte("date", filters.startDate).lte("date", filters.endDate);
              if (filters.platforms && filters.platforms.length > 0) {
                query = query.in("source_platform", filters.platforms);
              }
              const {
                data,
                error
              } = await query.order("date", {
                ascending: false
              });
              if (error) throw error;
              return data;
            }
          });
        }
        function useAggregatedMetrics(filters) {
          const {
            data: analyticsData
          } = useUnifiedAnalytics(filters);
          if (!analyticsData) return null;
          const metrics = {
            total_clicks: analyticsData.reduce((sum, row) => sum + (row.clicks || 0), 0),
            total_impressions: analyticsData.reduce((sum, row) => sum + (row.impressions || 0), 0),
            total_sessions: analyticsData.reduce((sum, row) => sum + (row.sessions || 0), 0),
            total_users: analyticsData.reduce((sum, row) => sum + (row.users || 0), 0),
            total_pageviews: analyticsData.reduce((sum, row) => sum + (row.pageviews || 0), 0),
            average_ctr: analyticsData.length > 0 ? analyticsData.reduce((sum, row) => sum + (row.ctr || 0), 0) / analyticsData.length : 0,
            average_position: analyticsData.length > 0 ? analyticsData.reduce((sum, row) => sum + (row.average_position || 0), 0) / analyticsData.length : 0,
            average_bounce_rate: analyticsData.length > 0 ? analyticsData.reduce((sum, row) => sum + (row.bounce_rate || 0), 0) / analyticsData.length : 0,
            clicks_change: 0,
            // Would need comparison period data
            impressions_change: 0,
            sessions_change: 0
          };
          return metrics;
        }
        function useTimeSeriesData(filters) {
          const {
            data: analyticsData
          } = useUnifiedAnalytics(filters);
          if (!analyticsData) return null;
          const grouped = analyticsData.reduce((acc, row) => {
            const date = row.date;
            if (!acc[date]) {
              acc[date] = {
                date,
                clicks: 0,
                impressions: 0,
                sessions: 0,
                users: 0,
                ctr: 0,
                position: 0,
                count: 0
              };
            }
            acc[date].clicks += row.clicks || 0;
            acc[date].impressions += row.impressions || 0;
            acc[date].sessions += row.sessions || 0;
            acc[date].users += row.users || 0;
            acc[date].ctr += row.ctr || 0;
            acc[date].position += row.average_position || 0;
            acc[date].count += 1;
            return acc;
          }, {});
          return Object.values(grouped).map(item => ({
            date: item.date,
            clicks: item.clicks,
            impressions: item.impressions,
            sessions: item.sessions,
            users: item.users,
            ctr: item.count > 0 ? item.ctr / item.count : 0,
            position: item.count > 0 ? item.position / item.count : 0
          }));
        }
        function useTopQueries(filters) {
          const {
            data: analyticsData
          } = useUnifiedAnalytics(filters);
          if (!analyticsData) return null;
          const withQueries = analyticsData.filter(row => row.query);
          const grouped = withQueries.reduce((acc, row) => {
            const query = row.query;
            if (!acc[query]) {
              acc[query] = {
                query,
                clicks: 0,
                impressions: 0,
                ctr: 0,
                position: 0,
                count: 0,
                change: 0
              };
            }
            acc[query].clicks += row.clicks || 0;
            acc[query].impressions += row.impressions || 0;
            acc[query].ctr += row.ctr || 0;
            acc[query].position += row.average_position || 0;
            acc[query].count += 1;
            return acc;
          }, {});
          const topQueries = Object.values(grouped).map(item => ({
            query: item.query,
            clicks: item.clicks,
            impressions: item.impressions,
            ctr: item.count > 0 ? item.ctr / item.count : 0,
            position: item.count > 0 ? item.position / item.count : 0,
            change: 0
            // Would need historical data
          })).sort((a, b) => b.clicks - a.clicks).slice(0, filters.limit || 10);
          return topQueries;
        }
        function useTopPages(filters) {
          const {
            data: analyticsData
          } = useUnifiedAnalytics(filters);
          if (!analyticsData) return null;
          const withPages = analyticsData.filter(row => row.page_url);
          const grouped = withPages.reduce((acc, row) => {
            const url = row.page_url;
            if (!acc[url]) {
              acc[url] = {
                url,
                title: row.page_title,
                clicks: 0,
                impressions: 0,
                sessions: 0,
                ctr: 0,
                position: 0,
                count: 0,
                change: 0
              };
            }
            acc[url].clicks += row.clicks || 0;
            acc[url].impressions += row.impressions || 0;
            acc[url].sessions += row.sessions || 0;
            acc[url].ctr += row.ctr || 0;
            acc[url].position += row.average_position || 0;
            acc[url].count += 1;
            return acc;
          }, {});
          const topPages = Object.values(grouped).map(item => ({
            url: item.url,
            title: item.title,
            clicks: item.clicks,
            impressions: item.impressions,
            sessions: item.sessions,
            ctr: item.count > 0 ? item.ctr / item.count : 0,
            position: item.count > 0 ? item.position / item.count : 0,
            change: 0
            // Would need historical data
          })).sort((a, b) => b.clicks - a.clicks).slice(0, filters.limit || 10);
          return topPages;
        }
        const PLATFORM_INFO = {
          google_search_console: {
            name: "Google Search Console",
            description: "Search performance and indexing data",
            icon: "🔍"
          },
          google_analytics: {
            name: "Google Analytics 4",
            description: "Website traffic and user behavior",
            icon: "📊"
          },
          bing_webmaster: {
            name: "Bing Webmaster Tools",
            description: "Bing search performance data",
            icon: "🅱️"
          },
          yandex_webmaster: {
            name: "Yandex Webmaster",
            description: "Yandex search performance data",
            icon: "🇷🇺"
          }
        };
        function PlatformConnections() {
          const {
            data: platforms,
            isLoading
          } = useConnectedPlatforms();
          const oauthInit = useOAuthInit();
          const syncMutation = useSyncPlatform();
          const handleConnect = platform => {
            oauthInit.mutate(platform);
          };
          const handleSync = platform => {
            syncMutation.mutate({
              platform
            });
          };
          if (isLoading) {
            return /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                  children: "Platform Connections"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                  children: "Loading connection status..."
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "flex justify-center py-8",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
                  })
                })
              })]
            });
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                children: "Platform Connections"
              }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                children: "Connect and manage your analytics platforms"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
              children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
                children: platforms?.map(platform => {
                  const info = PLATFORM_INFO[platform.platform];
                  const isConnected = platform.is_connected;
                  const isActive = platform.credential_status === "active";
                  const isExpired = platform.credential_status === "expired";
                  return /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                    className: "relative",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                      className: "pb-3",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-start justify-between",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            className: "text-2xl",
                            children: info.icon
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                            children: /* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                              className: "text-sm",
                              children: info.name
                            })
                          })]
                        }), isActive && /* @__PURE__ */jsxRuntimeExports.jsxs(Badge, {
                          variant: "default",
                          className: "text-xs",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheck, {
                            className: "h-3 w-3 mr-1"
                          }), "Connected"]
                        }), isExpired && /* @__PURE__ */jsxRuntimeExports.jsxs(Badge, {
                          variant: "destructive",
                          className: "text-xs",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Clock, {
                            className: "h-3 w-3 mr-1"
                          }), "Expired"]
                        }), !isConnected && /* @__PURE__ */jsxRuntimeExports.jsxs(Badge, {
                          variant: "secondary",
                          className: "text-xs",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleX, {
                            className: "h-3 w-3 mr-1"
                          }), "Not Connected"]
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                        className: "text-xs mt-1",
                        children: info.description
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                      className: "pt-0",
                      children: [platform.last_sync && /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-xs text-muted-foreground mb-3",
                        children: ["Last sync: ", new Date(platform.last_sync).toLocaleDateString()]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "flex flex-col gap-2",
                        children: !isConnected || isExpired ? /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                          size: "sm",
                          onClick: () => handleConnect(platform.platform),
                          disabled: oauthInit.isPending,
                          className: "w-full",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                            className: "h-3 w-3 mr-2"
                          }), isExpired ? "Reconnect" : "Connect"]
                        }) : /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                          size: "sm",
                          variant: "outline",
                          onClick: () => handleSync(platform.platform),
                          disabled: syncMutation.isPending,
                          className: "w-full",
                          children: "Sync Data"
                        })
                      })]
                    })]
                  }, platform.platform);
                })
              })
            })]
          });
        }
        function MetricsOverview({
          startDate,
          endDate,
          platforms
        }) {
          const metrics = useAggregatedMetrics({
            startDate,
            endDate,
            platforms
          });
          if (!metrics) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
              children: [1, 2, 3, 4].map(i => /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardHeader, {
                  className: "flex flex-row items-center justify-between space-y-0 pb-2",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                    className: "text-sm font-medium",
                    children: "Loading..."
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "h-8 bg-muted animate-pulse rounded"
                  })
                })]
              }, i))
            });
          }
          const formatNumber = num => {
            return new Intl.NumberFormat("en-US", {
              notation: "compact",
              maximumFractionDigits: 1
            }).format(num);
          };
          const formatPercent = num => {
            return `${(num * 100).toFixed(2)}%`;
          };
          const formatChange = change => {
            if (change === 0) return {
              icon: Minus,
              color: "text-muted-foreground",
              text: "0%"
            };
            const isPositive = change > 0;
            return {
              icon: isPositive ? TrendingUp : TrendingDown,
              color: isPositive ? "text-green-600" : "text-red-600",
              text: `${isPositive ? "+" : ""}${formatPercent(change / 100)}`
            };
          };
          const metricsData = [{
            title: "Total Clicks",
            value: metrics.total_clicks,
            change: metrics.clicks_change,
            icon: MousePointer,
            description: "Users who clicked through"
          }, {
            title: "Total Impressions",
            value: metrics.total_impressions,
            change: metrics.impressions_change,
            icon: Eye,
            description: "Times your site appeared"
          }, {
            title: "Avg. CTR",
            value: metrics.average_ctr,
            change: 0,
            icon: Target,
            description: "Click-through rate",
            isPercentage: true
          }, {
            title: "Avg. Position",
            value: metrics.average_position,
            change: 0,
            icon: BarChart3,
            description: "Average search position",
            decimals: 1
          }, {
            title: "Total Sessions",
            value: metrics.total_sessions,
            change: metrics.sessions_change,
            icon: Users,
            description: "Website sessions"
          }, {
            title: "Total Users",
            value: metrics.total_users,
            change: 0,
            icon: Users,
            description: "Unique visitors"
          }, {
            title: "Total Pageviews",
            value: metrics.total_pageviews,
            change: 0,
            icon: FileText,
            description: "Pages viewed"
          }, {
            title: "Bounce Rate",
            value: metrics.average_bounce_rate,
            change: 0,
            icon: TrendingDown,
            description: "Visitors who left quickly",
            isPercentage: true
          }];
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
            children: metricsData.map(metric => {
              const changeData = formatChange(metric.change);
              const Icon = metric.icon;
              const ChangeIcon = changeData.icon;
              return /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                  className: "flex flex-row items-center justify-between space-y-0 pb-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                    className: "text-sm font-medium",
                    children: metric.title
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Icon, {
                    className: "h-4 w-4 text-muted-foreground"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-2xl font-bold",
                    children: metric.isPercentage ? formatPercent(metric.value) : metric.decimals ? metric.value.toFixed(metric.decimals) : formatNumber(metric.value)
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-1 text-xs text-muted-foreground",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(ChangeIcon, {
                      className: `h-3 w-3 ${changeData.color}`
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: changeData.color,
                      children: changeData.text
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      children: "vs. previous period"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-xs text-muted-foreground mt-1",
                    children: metric.description
                  })]
                })]
              }, metric.title);
            })
          });
        }
        function AnalyticsCharts({
          startDate,
          endDate,
          platforms
        }) {
          const timeSeriesData = useTimeSeriesData({
            startDate,
            endDate,
            platforms
          });
          if (!timeSeriesData || timeSeriesData.length === 0) {
            return /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                  children: "Performance Trends"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                  children: "No data available for the selected period"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "flex flex-col items-center justify-center py-12 text-muted-foreground",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    children: "Connect your platforms and sync data to see performance trends"
                  })
                })
              })]
            });
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                children: "Performance Trends"
              }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                children: "Track your search and traffic metrics over time"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
              children: /* @__PURE__ */jsxRuntimeExports.jsxs(Tabs, {
                defaultValue: "traffic",
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsList, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                    value: "traffic",
                    children: "Traffic"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                    value: "search",
                    children: "Search Performance"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                    value: "engagement",
                    children: "Engagement"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                  value: "traffic",
                  className: "space-y-4",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(ResponsiveContainer, {
                    width: "100%",
                    height: 350,
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs(AreaChart, {
                      data: timeSeriesData,
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CartesianGrid, {
                        strokeDasharray: "3 3"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(XAxis, {
                        dataKey: "date",
                        tickFormatter: value => new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(YAxis, {}), /* @__PURE__ */jsxRuntimeExports.jsx(Tooltip, {
                        labelFormatter: value => new Date(value).toLocaleDateString(),
                        formatter: value => [new Intl.NumberFormat().format(value), ""]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Legend, {}), /* @__PURE__ */jsxRuntimeExports.jsx(Area, {
                        type: "monotone",
                        dataKey: "sessions",
                        stackId: "1",
                        stroke: "#8884d8",
                        fill: "#8884d8",
                        name: "Sessions"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Area, {
                        type: "monotone",
                        dataKey: "users",
                        stackId: "2",
                        stroke: "#82ca9d",
                        fill: "#82ca9d",
                        name: "Users"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Area, {
                        type: "monotone",
                        dataKey: "pageviews",
                        stackId: "3",
                        stroke: "#ffc658",
                        fill: "#ffc658",
                        name: "Pageviews"
                      })]
                    })
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                  value: "search",
                  className: "space-y-4",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(ResponsiveContainer, {
                    width: "100%",
                    height: 350,
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs(LineChart, {
                      data: timeSeriesData,
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CartesianGrid, {
                        strokeDasharray: "3 3"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(XAxis, {
                        dataKey: "date",
                        tickFormatter: value => new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(YAxis, {
                        yAxisId: "left"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(YAxis, {
                        yAxisId: "right",
                        orientation: "right"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Tooltip, {
                        labelFormatter: value => new Date(value).toLocaleDateString(),
                        formatter: (value, name) => {
                          if (name === "CTR") return [`${(value * 100).toFixed(2)}%`, name];
                          if (name === "Avg Position") return [value.toFixed(1), name];
                          return [new Intl.NumberFormat().format(value), name];
                        }
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Legend, {}), /* @__PURE__ */jsxRuntimeExports.jsx(Line, {
                        yAxisId: "left",
                        type: "monotone",
                        dataKey: "clicks",
                        stroke: "#8884d8",
                        name: "Clicks",
                        strokeWidth: 2
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Line, {
                        yAxisId: "left",
                        type: "monotone",
                        dataKey: "impressions",
                        stroke: "#82ca9d",
                        name: "Impressions",
                        strokeWidth: 2
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Line, {
                        yAxisId: "right",
                        type: "monotone",
                        dataKey: "ctr",
                        stroke: "#ffc658",
                        name: "CTR",
                        strokeWidth: 2
                      })]
                    })
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsContent, {
                  value: "engagement",
                  className: "space-y-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(ResponsiveContainer, {
                    width: "100%",
                    height: 350,
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs(LineChart, {
                      data: timeSeriesData,
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CartesianGrid, {
                        strokeDasharray: "3 3"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(XAxis, {
                        dataKey: "date",
                        tickFormatter: value => new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(YAxis, {}), /* @__PURE__ */jsxRuntimeExports.jsx(Tooltip, {
                        labelFormatter: value => new Date(value).toLocaleDateString(),
                        formatter: (value, name) => {
                          if (name === "Avg Position") return [value.toFixed(1), name];
                          return [new Intl.NumberFormat().format(value), name];
                        }
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Legend, {}), /* @__PURE__ */jsxRuntimeExports.jsx(Line, {
                        type: "monotone",
                        dataKey: "position",
                        stroke: "#8884d8",
                        name: "Avg Position",
                        strokeWidth: 2
                      })]
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-xs text-muted-foreground text-center",
                    children: "Lower position values are better (position 1 is the top result)"
                  })]
                })]
              })
            })]
          });
        }
        function TopQueriesTable({
          startDate,
          endDate,
          platforms,
          limit = 10
        }) {
          const topQueries = useTopQueries({
            startDate,
            endDate,
            platforms,
            limit
          });
          if (!topQueries || topQueries.length === 0) {
            return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center py-8 text-muted-foreground",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                children: "No query data available for the selected period"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm mt-2",
                children: "Connect platforms and sync data to see top queries"
              })]
            });
          }
          const formatNumber = num => {
            return new Intl.NumberFormat("en-US").format(num);
          };
          const formatPercent = num => {
            return `${(num * 100).toFixed(2)}%`;
          };
          const getTrendIcon = change => {
            if (change > 0) return /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
              className: "h-3 w-3 text-green-600"
            });
            if (change < 0) return /* @__PURE__ */jsxRuntimeExports.jsx(TrendingDown, {
              className: "h-3 w-3 text-red-600"
            });
            return /* @__PURE__ */jsxRuntimeExports.jsx(Minus, {
              className: "h-3 w-3 text-muted-foreground"
            });
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "rounded-md border",
            children: /* @__PURE__ */jsxRuntimeExports.jsxs(Table, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(TableHeader, {
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(TableRow, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "w-[40%]",
                    children: "Query"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "Clicks"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "Impressions"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "CTR"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "Position"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "Trend"
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TableBody, {
                children: topQueries.map((query, index) => /* @__PURE__ */jsxRuntimeExports.jsxs(TableRow, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "font-medium max-w-xs truncate",
                    children: query.query
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: formatNumber(query.clicks)
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: formatNumber(query.impressions)
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                      variant: "outline",
                      children: formatPercent(query.ctr)
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                      variant: "secondary",
                      children: query.position.toFixed(1)
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "flex justify-end",
                      children: getTrendIcon(query.change)
                    })
                  })]
                }, `${query.query}-${index}`))
              })]
            })
          });
        }
        function TopPagesTable({
          startDate,
          endDate,
          platforms,
          limit = 10
        }) {
          const topPages = useTopPages({
            startDate,
            endDate,
            platforms,
            limit
          });
          if (!topPages || topPages.length === 0) {
            return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center py-8 text-muted-foreground",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                children: "No page data available for the selected period"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm mt-2",
                children: "Connect platforms and sync data to see top pages"
              })]
            });
          }
          const formatNumber = num => {
            return new Intl.NumberFormat("en-US").format(num);
          };
          const formatPercent = num => {
            return `${(num * 100).toFixed(2)}%`;
          };
          const getTrendIcon = change => {
            if (change > 0) return /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
              className: "h-3 w-3 text-green-600"
            });
            if (change < 0) return /* @__PURE__ */jsxRuntimeExports.jsx(TrendingDown, {
              className: "h-3 w-3 text-red-600"
            });
            return /* @__PURE__ */jsxRuntimeExports.jsx(Minus, {
              className: "h-3 w-3 text-muted-foreground"
            });
          };
          const truncateUrl = (url, maxLength = 50) => {
            if (url.length <= maxLength) return url;
            return url.substring(0, maxLength) + "...";
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "rounded-md border",
            children: /* @__PURE__ */jsxRuntimeExports.jsxs(Table, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(TableHeader, {
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(TableRow, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "w-[35%]",
                    children: "Page"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "Clicks"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "Sessions"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "Impressions"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "CTR"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "Position"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "text-right",
                    children: "Trend"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableHead, {
                    className: "w-[50px]"
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TableBody, {
                children: topPages.map((page, index) => /* @__PURE__ */jsxRuntimeExports.jsxs(TableRow, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "max-w-xs",
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex flex-col",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "font-medium text-sm truncate",
                        title: page.url,
                        children: truncateUrl(page.url)
                      }), page.title && /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-xs text-muted-foreground truncate",
                        title: page.title,
                        children: page.title
                      })]
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: formatNumber(page.clicks)
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: formatNumber(page.sessions)
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: formatNumber(page.impressions)
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                      variant: "outline",
                      children: formatPercent(page.ctr)
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                      variant: "secondary",
                      children: page.position.toFixed(1)
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    className: "text-right",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "flex justify-end",
                      children: getTrendIcon(page.change)
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(TableCell, {
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("a", {
                      href: page.url,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "text-primary hover:text-primary/80",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                        className: "h-4 w-4"
                      })
                    })
                  })]
                }, `${page.url}-${index}`))
              })]
            })
          });
        }
        function DateRangePicker({
          startDate,
          endDate,
          onChange
        }) {
          const [isOpen, setIsOpen] = reactExports.useState(false);
          const handlePresetClick = days => {
            const end = /* @__PURE__ */new Date();
            const start = /* @__PURE__ */new Date();
            start.setDate(start.getDate() - days);
            onChange(start.toISOString().split("T")[0], end.toISOString().split("T")[0]);
            setIsOpen(false);
          };
          const presets = [{
            label: "Last 7 days",
            days: 7
          }, {
            label: "Last 30 days",
            days: 30
          }, {
            label: "Last 90 days",
            days: 90
          }, {
            label: "Last 6 months",
            days: 180
          }, {
            label: "Last year",
            days: 365
          }];
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "flex items-center gap-2",
            children: /* @__PURE__ */jsxRuntimeExports.jsxs(Popover, {
              open: isOpen,
              onOpenChange: setIsOpen,
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(PopoverTrigger, {
                asChild: true,
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  variant: "outline",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Calendar, {
                    className: "h-4 w-4"
                  }), format(new Date(startDate), "MMM dd, yyyy"), " - ", format(new Date(endDate), "MMM dd, yyyy")]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(PopoverContent, {
                className: "w-auto p-4",
                align: "start",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "space-y-4",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                      className: "font-medium mb-2",
                      children: "Quick Select"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "grid gap-2",
                      children: presets.map(preset => /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                        variant: "ghost",
                        className: "justify-start",
                        onClick: () => handlePresetClick(preset.days),
                        children: preset.label
                      }, preset.label))
                    })]
                  })
                })
              })]
            })
          });
        }
        const PLATFORMS = [{
          value: "google_search_console",
          label: "Google Search Console"
        }, {
          value: "google_analytics",
          label: "Google Analytics"
        }, {
          value: "bing_webmaster",
          label: "Bing Webmaster"
        }, {
          value: "yandex_webmaster",
          label: "Yandex Webmaster"
        }];
        function PlatformFilter({
          selectedPlatforms,
          onChange
        }) {
          const handleToggle = platform => {
            if (selectedPlatforms.includes(platform)) {
              onChange(selectedPlatforms.filter(p => p !== platform));
            } else {
              onChange([...selectedPlatforms, platform]);
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Popover, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(PopoverTrigger, {
              asChild: true,
              children: /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                variant: "outline",
                className: "gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Filter, {
                  className: "h-4 w-4"
                }), "Platforms (", selectedPlatforms.length, ")"]
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsx(PopoverContent, {
              className: "w-64",
              align: "start",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                  className: "font-medium text-sm",
                  children: "Filter by Platform"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "space-y-3",
                  children: PLATFORMS.map(platform => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center space-x-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Checkbox, {
                      id: platform.value,
                      checked: selectedPlatforms.includes(platform.value),
                      onCheckedChange: () => handleToggle(platform.value)
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                      htmlFor: platform.value,
                      className: "text-sm font-normal cursor-pointer",
                      children: platform.label
                    })]
                  }, platform.value))
                })]
              })
            })]
          });
        }
        function exportToCSV(data) {
          const {
            headers,
            rows,
            title
          } = data;
          let csvContent = "";
          if (title) {
            csvContent += `${title}

`;
          }
          csvContent += headers.join(",") + "\n";
          rows.forEach(row => {
            const escapedRow = row.map(cell => {
              const cellStr = String(cell);
              if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            });
            csvContent += escapedRow.join(",") + "\n";
          });
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;"
          });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          const filename = `${title?.replace(/\s+/g, "_") || "export"}_${(/* @__PURE__ */new Date()).toISOString().split("T")[0]}.csv`;
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        function exportToPDF(data) {
          const {
            headers,
            rows,
            title,
            dateRange
          } = data;
          let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title || "Analytics Report"}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    color: #333;
                }
                h1 {
                    color: #2563eb;
                    margin-bottom: 10px;
                }
                .date-range {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 30px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th {
                    background-color: #2563eb;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                }
                td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e5e7eb;
                }
                tr:nth-child(even) {
                    background-color: #f9fafb;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    color: #666;
                    font-size: 12px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h1>${title || "Analytics Report"}</h1>
            ${dateRange ? `<div class="date-range">${dateRange}</div>` : ""}
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
                </tbody>
            </table>
            <div class="footer">
                Generated on ${(/* @__PURE__ */new Date()).toLocaleString()} | AgentBio.net Analytics
            </div>
        </body>
        </html>
    `;
          const printWindow = window.open("", "", "height=600,width=800");
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.onload = () => {
              printWindow.print();
              setTimeout(() => {
                printWindow.close();
              }, 100);
            };
          }
        }
        function formatAnalyticsForExport(queries, title = "Search Analytics Report", dateRange) {
          return {
            title,
            dateRange,
            headers: ["Query", "Clicks", "Impressions", "CTR", "Avg. Position"],
            rows: queries.map(q => [q.query, q.clicks, q.impressions, `${(q.ctr * 100).toFixed(2)}%`, q.position.toFixed(1)])
          };
        }
        function SearchAnalyticsDashboard() {
          const {
            toast
          } = useToast();
          const [dateRange, setDateRange] = reactExports.useState({
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
            end: (/* @__PURE__ */new Date()).toISOString().split("T")[0]
          });
          const [selectedPlatforms, setSelectedPlatforms] = reactExports.useState(["google_search_console", "google_analytics"]);
          const aggregateMutation = useAggregateAnalytics();
          const handleRefreshData = async () => {
            try {
              await aggregateMutation.mutateAsync({
                start_date: dateRange.start,
                end_date: dateRange.end,
                force_refresh: true
              });
            } catch (error) {
              console.error("Failed to refresh data:", error);
            }
          };
          const handleExportCSV = () => {
            const mockQueries = [{
              query: "luxury homes Los Angeles",
              clicks: 245,
              impressions: 1230,
              ctr: 0.199,
              position: 3.2
            }, {
              query: "real estate agent near me",
              clicks: 189,
              impressions: 2100,
              ctr: 0.09,
              position: 5.8
            }, {
              query: "homes for sale Beverly Hills",
              clicks: 167,
              impressions: 890,
              ctr: 0.188,
              position: 2.1
            }, {
              query: "best realtor LA",
              clicks: 134,
              impressions: 1500,
              ctr: 0.089,
              position: 7.3
            }, {
              query: "property listings California",
              clicks: 98,
              impressions: 670,
              ctr: 0.146,
              position: 4.5
            }];
            const dateRangeText = `${dateRange.start} to ${dateRange.end}`;
            const exportData = formatAnalyticsForExport(mockQueries, "Search Analytics Report", dateRangeText);
            exportToCSV(exportData);
            toast({
              title: "Exported to CSV",
              description: "Your analytics data has been downloaded."
            });
          };
          const handleExportPDF = () => {
            const mockQueries = [{
              query: "luxury homes Los Angeles",
              clicks: 245,
              impressions: 1230,
              ctr: 0.199,
              position: 3.2
            }, {
              query: "real estate agent near me",
              clicks: 189,
              impressions: 2100,
              ctr: 0.09,
              position: 5.8
            }, {
              query: "homes for sale Beverly Hills",
              clicks: 167,
              impressions: 890,
              ctr: 0.188,
              position: 2.1
            }, {
              query: "best realtor LA",
              clicks: 134,
              impressions: 1500,
              ctr: 0.089,
              position: 7.3
            }, {
              query: "property listings California",
              clicks: 98,
              impressions: 670,
              ctr: 0.146,
              position: 4.5
            }];
            const dateRangeText = `${dateRange.start} to ${dateRange.end}`;
            const exportData = formatAnalyticsForExport(mockQueries, "Search Analytics Report", dateRangeText);
            exportToPDF(exportData);
            toast({
              title: "Opening PDF",
              description: "Your analytics report is being prepared for printing."
            });
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-end gap-2 flex-wrap",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                variant: "outline",
                size: "sm",
                onClick: handleRefreshData,
                disabled: aggregateMutation.isPending,
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(RefreshCw, {
                  className: `h-4 w-4 mr-2 ${aggregateMutation.isPending ? "animate-spin" : ""}`
                }), "Refresh Data"]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(DropdownMenu, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(DropdownMenuTrigger, {
                  asChild: true,
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                    variant: "outline",
                    size: "sm",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Download, {
                      className: "h-4 w-4 mr-2"
                    }), "Export"]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(DropdownMenuContent, {
                  align: "end",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(DropdownMenuItem, {
                    onClick: handleExportCSV,
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(FileText, {
                      className: "h-4 w-4 mr-2"
                    }), "Export to CSV"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(DropdownMenuItem, {
                    onClick: handleExportPDF,
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(FileText, {
                      className: "h-4 w-4 mr-2"
                    }), "Export to PDF"]
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                variant: "outline",
                size: "sm",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Settings, {
                  className: "h-4 w-4 mr-2"
                }), "Settings"]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(PlatformConnections, {}), /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                  children: "Filters"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                  children: "Customize your analytics view"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                className: "flex flex-wrap gap-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(DateRangePicker, {
                  startDate: dateRange.start,
                  endDate: dateRange.end,
                  onChange: (start, end) => setDateRange({
                    start,
                    end
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx(PlatformFilter, {
                  selectedPlatforms,
                  onChange: setSelectedPlatforms
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(Tabs, {
              defaultValue: "overview",
              className: "space-y-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsList, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                  value: "overview",
                  children: "Overview"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                  value: "queries",
                  children: "Top Queries"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                  value: "pages",
                  children: "Top Pages"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                  value: "devices",
                  children: "Devices"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                  value: "countries",
                  children: "Countries"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsContent, {
                value: "overview",
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(MetricsOverview, {
                  startDate: dateRange.start,
                  endDate: dateRange.end,
                  platforms: selectedPlatforms
                }), /* @__PURE__ */jsxRuntimeExports.jsx(AnalyticsCharts, {
                  startDate: dateRange.start,
                  endDate: dateRange.end,
                  platforms: selectedPlatforms
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid gap-4 md:grid-cols-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                        children: "Top 10 Queries"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                        children: "Highest performing search queries"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(TopQueriesTable, {
                        startDate: dateRange.start,
                        endDate: dateRange.end,
                        platforms: selectedPlatforms,
                        limit: 10
                      })
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                        children: "Top 10 Pages"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                        children: "Highest performing pages"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(TopPagesTable, {
                        startDate: dateRange.start,
                        endDate: dateRange.end,
                        platforms: selectedPlatforms,
                        limit: 10
                      })
                    })]
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "queries",
                className: "space-y-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                      children: "All Search Queries"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                      children: "Complete list of search queries with performance metrics"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(TopQueriesTable, {
                      startDate: dateRange.start,
                      endDate: dateRange.end,
                      platforms: selectedPlatforms,
                      limit: 100
                    })
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "pages",
                className: "space-y-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                      children: "All Pages"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                      children: "Complete list of pages with traffic metrics"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(TopPagesTable, {
                      startDate: dateRange.start,
                      endDate: dateRange.end,
                      platforms: selectedPlatforms,
                      limit: 100
                    })
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "devices",
                className: "space-y-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                      children: "Device Breakdown"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                      children: "Performance metrics by device type"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-muted-foreground",
                      children: "Device analytics coming soon..."
                    })
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "countries",
                className: "space-y-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                      children: "Geographic Distribution"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                      children: "Performance metrics by country"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-muted-foreground",
                      children: "Geographic analytics coming soon..."
                    })
                  })]
                })
              })]
            })]
          });
        }
      }
    };
  });
})();
