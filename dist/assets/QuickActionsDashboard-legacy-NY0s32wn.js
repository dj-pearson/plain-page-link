;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './utils-legacy-B2316hnE.js', './icons-legacy-C8x4ypXf.js', './KeyboardShortcutsHelper-legacy-DHl_C3qu.js', './charts-legacy-D2SqRQVB.js', './supabase-legacy-CQONYrP8.js'], function (exports, module) {
    'use strict';

    var reactExports, jsxRuntimeExports, Button, cn, Badge, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Input, Tabs, TabsList, TabsTrigger, TabsContent, ue, formatDistanceToNow, RefreshCw, CircleCheckBig, Clock, CircleX, Home, TriangleAlert, X, SquareCheckBig, Square, SquarePen, Trash2, Save, TrendingUp, Eye, Users, ArrowUp, ArrowDown, KeyboardShortcutsHelper;
    return {
      setters: [module => {
        reactExports = module.r;
        jsxRuntimeExports = module.j;
      }, module => {
        Button = module.j;
        cn = module.c;
        Badge = module.B;
        Label = module.L;
        Select = module.S;
        SelectTrigger = module.a;
        SelectValue = module.b;
        SelectContent = module.d;
        SelectItem = module.e;
        Input = module.I;
        Tabs = module.J;
        TabsList = module.K;
        TabsTrigger = module.M;
        TabsContent = module.N;
      }, module => {
        ue = module.u;
        formatDistanceToNow = module.b;
      }, module => {
        RefreshCw = module.aM;
        CircleCheckBig = module.J;
        Clock = module.a8;
        CircleX = module.aD;
        Home = module.H;
        TriangleAlert = module.aB;
        X = module.X;
        SquareCheckBig = module.aP;
        Square = module.ar;
        SquarePen = module.ay;
        Trash2 = module.az;
        Save = module.aE;
        TrendingUp = module.T;
        Eye = module.E;
        Users = module.U;
        ArrowUp = module.aQ;
        ArrowDown = module.aR;
      }, module => {
        KeyboardShortcutsHelper = module.K;
      }, null, null],
      execute: function () {
        exports("default", QuickActionsDashboard);
        function QuickStatusDashboard({
          listings,
          onStatusChange,
          onRefresh,
          isLoading = false
        }) {
          const [selectedListings, setSelectedListings] = reactExports.useState(/* @__PURE__ */new Set());
          const [updatingIds, setUpdatingIds] = reactExports.useState(/* @__PURE__ */new Set());
          const [filter, setFilter] = reactExports.useState("all");
          const isStale = listing => {
            const daysSinceUpdate = Math.floor((Date.now() - new Date(listing.updatedAt).getTime()) / (1e3 * 60 * 60 * 24));
            return daysSinceUpdate >= 7 && listing.status === "active";
          };
          const filteredListings = listings.filter(listing => {
            if (filter === "all") return true;
            if (filter === "stale") return isStale(listing);
            return listing.status === filter;
          });
          const stats = {
            total: listings.length,
            active: listings.filter(l => l.status === "active").length,
            pending: listings.filter(l => l.status === "pending").length,
            sold: listings.filter(l => l.status === "sold").length,
            stale: listings.filter(l => isStale(l)).length
          };
          const handleStatusChange = async (listingId, newStatus) => {
            setUpdatingIds(prev => new Set(prev).add(listingId));
            try {
              await onStatusChange(listingId, newStatus);
              ue.success(`Listing updated to ${newStatus}`);
            } catch (error) {
              console.error("Failed to update status:", error);
              ue.error("Failed to update listing");
            } finally {
              setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(listingId);
                return next;
              });
            }
          };
          const handleBulkStatusChange = async newStatus => {
            if (selectedListings.size === 0) {
              ue.warning("No listings selected");
              return;
            }
            const count = selectedListings.size;
            ue.info(`Updating ${count} listing(s)...`);
            const promises = Array.from(selectedListings).map(id => handleStatusChange(id, newStatus));
            await Promise.all(promises);
            setSelectedListings(/* @__PURE__ */new Set());
            ue.success(`${count} listing(s) updated to ${newStatus}`);
          };
          const toggleSelection = listingId => {
            setSelectedListings(prev => {
              const next = new Set(prev);
              if (next.has(listingId)) {
                next.delete(listingId);
              } else {
                next.add(listingId);
              }
              return next;
            });
          };
          const selectAll = () => {
            setSelectedListings(new Set(filteredListings.map(l => l.id)));
          };
          const clearSelection = () => {
            setSelectedListings(/* @__PURE__ */new Set());
          };
          reactExports.useEffect(() => {
            const handleKeyPress = e => {
              if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
              }
              if (selectedListings.size === 0) return;
              switch (e.key.toLowerCase()) {
                case "s":
                  e.preventDefault();
                  handleBulkStatusChange("sold");
                  break;
                case "p":
                  e.preventDefault();
                  handleBulkStatusChange("pending");
                  break;
                case "a":
                  e.preventDefault();
                  handleBulkStatusChange("active");
                  break;
                case "escape":
                  clearSelection();
                  break;
              }
            };
            window.addEventListener("keydown", handleKeyPress);
            return () => window.removeEventListener("keydown", handleKeyPress);
          }, [selectedListings]);
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-4",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "text-2xl font-bold",
                  children: "Quick Status Updates"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: "Click listings to select, then use buttons or keyboard shortcuts"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                variant: "outline",
                size: "sm",
                onClick: onRefresh,
                disabled: isLoading,
                className: "gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(RefreshCw, {
                  className: cn("w-4 h-4", isLoading && "animate-spin")
                }), "Refresh"]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "grid grid-cols-2 md:grid-cols-5 gap-3",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(StatsCard, {
                label: "Total",
                count: stats.total,
                active: filter === "all",
                onClick: () => setFilter("all")
              }), /* @__PURE__ */jsxRuntimeExports.jsx(StatsCard, {
                label: "Active",
                count: stats.active,
                active: filter === "active",
                onClick: () => setFilter("active"),
                color: "green"
              }), /* @__PURE__ */jsxRuntimeExports.jsx(StatsCard, {
                label: "Pending",
                count: stats.pending,
                active: filter === "pending",
                onClick: () => setFilter("pending"),
                color: "yellow"
              }), /* @__PURE__ */jsxRuntimeExports.jsx(StatsCard, {
                label: "Sold",
                count: stats.sold,
                color: "blue"
              }), /* @__PURE__ */jsxRuntimeExports.jsx(StatsCard, {
                label: "Stale",
                count: stats.stale,
                active: filter === "stale",
                onClick: () => setFilter("stale"),
                color: "orange",
                alert: stats.stale > 0
              })]
            }), selectedListings.size > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  className: "font-semibold",
                  children: [selectedListings.size, " selected"]
                }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  variant: "ghost",
                  size: "sm",
                  onClick: selectAll,
                  children: "Select All"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  variant: "ghost",
                  size: "sm",
                  onClick: clearSelection,
                  children: "Clear"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  size: "sm",
                  variant: "outline",
                  onClick: () => handleBulkStatusChange("active"),
                  className: "gap-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                    className: "w-4 h-4"
                  }), "Active ", /* @__PURE__ */jsxRuntimeExports.jsx("kbd", {
                    className: "ml-1 text-xs",
                    children: "A"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  size: "sm",
                  variant: "outline",
                  onClick: () => handleBulkStatusChange("pending"),
                  className: "gap-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Clock, {
                    className: "w-4 h-4"
                  }), "Pending ", /* @__PURE__ */jsxRuntimeExports.jsx("kbd", {
                    className: "ml-1 text-xs",
                    children: "P"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  size: "sm",
                  variant: "outline",
                  onClick: () => handleBulkStatusChange("sold"),
                  className: "gap-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleX, {
                    className: "w-4 h-4"
                  }), "Sold ", /* @__PURE__ */jsxRuntimeExports.jsx("kbd", {
                    className: "ml-1 text-xs",
                    children: "S"
                  })]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
              children: filteredListings.map(listing => /* @__PURE__ */jsxRuntimeExports.jsx(ListingQuickCard, {
                listing,
                isSelected: selectedListings.has(listing.id),
                isUpdating: updatingIds.has(listing.id),
                onSelect: () => toggleSelection(listing.id),
                onStatusChange: handleStatusChange,
                isStale: isStale(listing)
              }, listing.id))
            }), filteredListings.length === 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center py-12 text-gray-500",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Home, {
                className: "w-12 h-12 mx-auto mb-3 opacity-50"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-lg font-medium",
                children: "No listings found"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm",
                children: "Try adjusting your filters"
              })]
            })]
          });
        }
        function StatsCard({
          label,
          count,
          active,
          onClick,
          color,
          alert
        }) {
          const colors = {
            green: "text-green-600 bg-green-50 border-green-200",
            yellow: "text-yellow-600 bg-yellow-50 border-yellow-200",
            blue: "text-blue-600 bg-blue-50 border-blue-200",
            orange: "text-orange-600 bg-orange-50 border-orange-200"
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("button", {
            onClick,
            disabled: !onClick,
            className: cn("relative p-4 rounded-lg border-2 transition-all", active ? "border-primary bg-primary/5" : "border-gray-200 bg-white", onClick && "hover:border-primary/50 cursor-pointer", !onClick && "cursor-default"),
            children: [alert && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "text-3xl font-bold",
              children: count
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: cn("text-sm font-medium", color && colors[color]),
              children: label
            })]
          });
        }
        function ListingQuickCard({
          listing,
          isSelected,
          isUpdating,
          onSelect,
          onStatusChange,
          isStale
        }) {
          const statusColors = {
            active: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            sold: "bg-red-100 text-red-800",
            draft: "bg-gray-100 text-gray-800"
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            onClick: onSelect,
            className: cn("relative group p-4 rounded-lg border-2 transition-all cursor-pointer", isSelected ? "border-primary bg-primary/5 shadow-md" : "border-gray-200 bg-white hover:border-gray-300", isUpdating && "opacity-50 pointer-events-none", isStale && "border-l-4 border-l-orange-500"),
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: cn("absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-gray-300 group-hover:border-primary"),
              children: isSelected && /* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                className: "w-4 h-4 text-white"
              })
            }), isStale && /* @__PURE__ */jsxRuntimeExports.jsxs(Badge, {
              variant: "outline",
              className: "absolute top-2 right-2 bg-orange-100 text-orange-800 border-orange-300",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Clock, {
                className: "w-3 h-3 mr-1"
              }), "Stale"]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "mt-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "font-semibold text-sm truncate mb-1",
                children: listing.title
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                className: "text-lg font-bold text-primary mb-2",
                children: ["$", listing.price.toLocaleString()]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center justify-between mb-3",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                  className: statusColors[listing.status],
                  children: listing.status.toUpperCase()
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "text-xs text-gray-500",
                  children: formatDistanceToNow(new Date(listing.updatedAt), {
                    addSuffix: true
                  })
                })]
              }), (listing.views !== void 0 || listing.leads !== void 0) && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex gap-3 text-xs text-gray-600 mb-3",
                children: [listing.views !== void 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  children: ["👁️ ", listing.views, " views"]
                }), listing.leads !== void 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  children: ["👥 ", listing.leads, " leads"]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex gap-2",
                children: [listing.status !== "sold" && /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  size: "sm",
                  variant: "outline",
                  onClick: e => {
                    e.stopPropagation();
                    onStatusChange(listing.id, "sold");
                  },
                  className: "flex-1 text-xs",
                  children: "Mark Sold"
                }), listing.status !== "pending" && /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  size: "sm",
                  variant: "outline",
                  onClick: e => {
                    e.stopPropagation();
                    onStatusChange(listing.id, "pending");
                  },
                  className: "flex-1 text-xs",
                  children: "Pending"
                })]
              })]
            }), isUpdating && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg",
              children: /* @__PURE__ */jsxRuntimeExports.jsx(RefreshCw, {
                className: "w-6 h-6 animate-spin text-primary"
              })
            })]
          });
        }
        function StaleContentAlert({
          staleListings,
          onDismiss,
          onRefresh,
          onDismissAll,
          className
        }) {
          const [isExpanded, setIsExpanded] = reactExports.useState(true);
          const [dismissedIds, setDismissedIds] = reactExports.useState(/* @__PURE__ */new Set());
          reactExports.useEffect(() => {
            const saved = localStorage.getItem("dismissed-stale-alerts");
            if (saved) {
              try {
                setDismissedIds(new Set(JSON.parse(saved)));
              } catch (e) {
                console.error("Failed to parse dismissed alerts:", e);
              }
            }
          }, []);
          reactExports.useEffect(() => {
            localStorage.setItem("dismissed-stale-alerts", JSON.stringify(Array.from(dismissedIds)));
          }, [dismissedIds]);
          const visibleListings = staleListings.filter(listing => !dismissedIds.has(listing.id));
          if (visibleListings.length === 0) {
            return null;
          }
          const handleDismiss = listingId => {
            setDismissedIds(prev => new Set(prev).add(listingId));
            onDismiss?.(listingId);
          };
          const handleDismissAll = () => {
            setDismissedIds(new Set(staleListings.map(l => l.id)));
            onDismissAll?.();
          };
          const criticalCount = visibleListings.filter(l => l.daysSinceUpdate >= 14).length;
          const warningCount = visibleListings.length - criticalCount;
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: cn("bg-orange-50 border-2 border-orange-200 rounded-lg", className),
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between p-4 cursor-pointer",
              onClick: () => setIsExpanded(!isExpanded),
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "relative",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(TriangleAlert, {
                    className: "w-6 h-6 text-orange-600"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold",
                    children: visibleListings.length
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                    className: "font-semibold text-orange-900",
                    children: "Stale Listings Need Attention"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-sm text-orange-700",
                    children: [criticalCount > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                      className: "font-medium",
                      children: [criticalCount, " critical (14+ days)"]
                    }), criticalCount > 0 && warningCount > 0 && " · ", warningCount > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                      children: [warningCount, " warning (7+ days)"]
                    })]
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  size: "sm",
                  variant: "ghost",
                  onClick: e => {
                    e.stopPropagation();
                    handleDismissAll();
                  },
                  className: "text-orange-700 hover:text-orange-900",
                  children: "Dismiss All"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  size: "sm",
                  variant: "ghost",
                  className: "text-orange-700",
                  onClick: e => e.stopPropagation(),
                  children: isExpanded ? "▼" : "▶"
                })]
              })]
            }), isExpanded && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "border-t border-orange-200 divide-y divide-orange-200",
              children: visibleListings.map(listing => /* @__PURE__ */jsxRuntimeExports.jsx(StaleListingRow, {
                listing,
                onDismiss: () => handleDismiss(listing.id),
                onRefresh: () => onRefresh?.(listing.id)
              }, listing.id))
            }), isExpanded && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "p-4 bg-orange-100/50 border-t border-orange-200",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-xs text-orange-800 mb-2 font-medium",
                children: "💡 Quick Tips:"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("ul", {
                className: "text-xs text-orange-700 space-y-1 ml-4 list-disc",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("li", {
                  children: "Update listing descriptions with recent improvements or price changes"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                  children: "Add new photos to refresh your listing's appeal"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                  children: "Verify pricing is still competitive in current market"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                  children: "Check if property status has changed"
                })]
              })]
            })]
          });
        }
        function StaleListingRow({
          listing,
          onDismiss,
          onRefresh
        }) {
          const isCritical = listing.daysSinceUpdate >= 14;
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "p-4 flex items-center justify-between hover:bg-orange-100/30 transition-colors",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex-1",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-2 mb-1",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                  className: "font-medium text-gray-900",
                  children: listing.title
                }), /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                  variant: "outline",
                  className: cn("text-xs", isCritical ? "bg-red-100 text-red-800 border-red-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"),
                  children: isCritical ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(TriangleAlert, {
                      className: "w-3 h-3 mr-1"
                    }), "CRITICAL"]
                  }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Clock, {
                      className: "w-3 h-3 mr-1"
                    }), "WARNING"]
                  })
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-4 text-sm text-gray-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  children: ["Status: ", listing.status]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  children: ["Last updated:", " ", formatDistanceToNow(new Date(listing.updatedAt), {
                    addSuffix: true
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  className: "font-medium text-orange-700",
                  children: [listing.daysSinceUpdate, " days old"]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex gap-2 ml-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                size: "sm",
                variant: "outline",
                onClick: onRefresh,
                className: "gap-1 bg-white",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(RefreshCw, {
                  className: "w-3 h-3"
                }), "Update"]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                size: "sm",
                variant: "ghost",
                onClick: onDismiss,
                children: /* @__PURE__ */jsxRuntimeExports.jsx(X, {
                  className: "w-4 h-4"
                })
              })]
            })]
          });
        }
        function StaleContentBadge({
          count
        }) {
          if (count === 0) return null;
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Badge, {
            variant: "outline",
            className: "bg-orange-100 text-orange-800 border-orange-300 animate-pulse",
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(TriangleAlert, {
              className: "w-3 h-3 mr-1"
            }), count, " Stale"]
          });
        }
        function BulkEditMode({
          listings,
          selectedIds,
          onToggleSelect,
          onSelectAll,
          onClearSelection,
          onBulkUpdate,
          onBulkDelete
        }) {
          const [isEditing, setIsEditing] = reactExports.useState(false);
          const [bulkUpdates, setBulkUpdates] = reactExports.useState({});
          const [priceAdjustType, setPriceAdjustType] = reactExports.useState("increase");
          const [priceValue, setPriceValue] = reactExports.useState("");
          const [priceUnit, setPriceUnit] = reactExports.useState("percent");
          const selectedListings = listings.filter(l => selectedIds.includes(l.id));
          const allSelected = listings.length > 0 && selectedIds.length === listings.length;
          const handleSaveBulkEdit = async () => {
            if (selectedIds.length === 0) {
              ue.error("No listings selected");
              return;
            }
            const updates = {
              ...bulkUpdates
            };
            if (priceValue) {
              updates.priceAdjustment = {
                type: priceAdjustType,
                value: parseFloat(priceValue),
                unit: priceUnit
              };
            }
            if (Object.keys(updates).length === 0) {
              ue.warning("No changes to apply");
              return;
            }
            try {
              await onBulkUpdate(updates);
              ue.success(`${selectedIds.length} listing(s) updated`);
              setIsEditing(false);
              setBulkUpdates({});
              setPriceValue("");
            } catch (error) {
              console.error("Bulk update failed:", error);
              ue.error("Failed to update listings");
            }
          };
          const handleBulkDelete = async () => {
            if (selectedIds.length === 0) {
              ue.error("No listings selected");
              return;
            }
            if (!confirm(`Delete ${selectedIds.length} listing(s)? This cannot be undone.`)) {
              return;
            }
            try {
              await onBulkDelete(selectedIds);
              ue.success(`${selectedIds.length} listing(s) deleted`);
              onClearSelection();
            } catch (error) {
              console.error("Bulk delete failed:", error);
              ue.error("Failed to delete listings");
            }
          };
          const calculatePricePreview = listing => {
            if (!priceValue) return listing.price;
            const value = parseFloat(priceValue);
            if (isNaN(value)) return listing.price;
            switch (priceAdjustType) {
              case "increase":
                return priceUnit === "percent" ? listing.price * (1 + value / 100) : listing.price + value;
              case "decrease":
                return priceUnit === "percent" ? listing.price * (1 - value / 100) : listing.price - value;
              case "set":
                return value;
              default:
                return listing.price;
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-4",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  variant: "outline",
                  size: "sm",
                  onClick: allSelected ? onClearSelection : onSelectAll,
                  className: "gap-2",
                  children: allSelected ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SquareCheckBig, {
                      className: "w-4 h-4"
                    }), "Deselect All"]
                  }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Square, {
                      className: "w-4 h-4"
                    }), "Select All"]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  className: "text-sm font-medium",
                  children: [selectedIds.length, " of ", listings.length, " selected"]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "flex gap-2",
                children: selectedIds.length > 0 && !isEditing && /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                    variant: "outline",
                    size: "sm",
                    onClick: () => setIsEditing(true),
                    className: "gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SquarePen, {
                      className: "w-4 h-4"
                    }), "Bulk Edit"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                    variant: "destructive",
                    size: "sm",
                    onClick: handleBulkDelete,
                    className: "gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Trash2, {
                      className: "w-4 h-4"
                    }), "Delete Selected"]
                  })]
                })
              })]
            }), isEditing && selectedIds.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "p-6 bg-white rounded-lg border-2 border-primary shadow-lg",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center justify-between mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                  className: "text-lg font-semibold",
                  children: ["Bulk Edit ", selectedIds.length, " Listings"]
                }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  variant: "ghost",
                  size: "sm",
                  onClick: () => setIsEditing(false),
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(X, {
                    className: "w-4 h-4"
                  })
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    children: "Update Status"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    value: bulkUpdates.status || "",
                    onValueChange: value => setBulkUpdates({
                      ...bulkUpdates,
                      status: value
                    }),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                        placeholder: "Keep current status"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "active",
                        children: "Active"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "pending",
                        children: "Pending"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "sold",
                        children: "Sold"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "draft",
                        children: "Draft"
                      })]
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    children: "Update Category"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    value: bulkUpdates.category || "",
                    onValueChange: value => setBulkUpdates({
                      ...bulkUpdates,
                      category: value
                    }),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                        placeholder: "Keep current category"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "residential",
                        children: "Residential"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "commercial",
                        children: "Commercial"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "land",
                        children: "Land"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "rental",
                        children: "Rental"
                      })]
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "space-y-2 md:col-span-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    children: "Price Adjustment"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "grid grid-cols-3 gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                      value: priceAdjustType,
                      onValueChange: v => setPriceAdjustType(v),
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                        children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {})
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                          value: "increase",
                          children: "Increase"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                          value: "decrease",
                          children: "Decrease"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                          value: "set",
                          children: "Set to"
                        })]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      type: "number",
                      placeholder: "Value",
                      value: priceValue,
                      onChange: e => setPriceValue(e.target.value)
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                      value: priceUnit,
                      onValueChange: v => setPriceUnit(v),
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                        children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {})
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                          value: "percent",
                          children: "Percent"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                          value: "amount",
                          children: "Amount"
                        })]
                      })]
                    })]
                  })]
                })]
              }), selectedListings.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "mt-6 p-4 bg-gray-50 rounded-lg",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                  className: "font-medium mb-3",
                  children: "Preview Changes"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "space-y-2 max-h-48 overflow-y-auto",
                  children: [selectedListings.slice(0, 5).map(listing => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between text-sm p-2 bg-white rounded",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "truncate flex-1",
                      children: listing.title
                    }), priceValue && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                        className: "text-gray-500 line-through",
                        children: ["$", listing.price.toLocaleString()]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                        className: "font-medium text-primary",
                        children: ["$", calculatePricePreview(listing).toLocaleString()]
                      })]
                    })]
                  }, listing.id)), selectedListings.length > 5 && /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-xs text-gray-500 text-center",
                    children: ["... and ", selectedListings.length - 5, " ", "more"]
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex justify-end gap-2 mt-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  variant: "outline",
                  onClick: () => setIsEditing(false),
                  children: "Cancel"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: handleSaveBulkEdit,
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Save, {
                    className: "w-4 h-4"
                  }), "Apply Changes"]
                })]
              })]
            })]
          });
        }
        function AnalyticsWidget({
          stats,
          period = "Last 30 days",
          className
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: cn("space-y-4", className),
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "text-lg font-semibold",
                children: "Quick Analytics"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                className: "text-sm text-gray-600",
                children: period
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "grid grid-cols-2 md:grid-cols-4 gap-4",
              children: stats.map((stat, index) => /* @__PURE__ */jsxRuntimeExports.jsx(AnalyticsCard, {
                stat
              }, index))
            })]
          });
        }
        function AnalyticsCard({
          stat
        }) {
          const Icon = stat.icon || Home;
          const isPositive = stat.trend === "up";
          const isNegative = stat.trend === "down";
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-start justify-between mb-2",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: cn("p-2 rounded-lg", isPositive && "bg-green-100", isNegative && "bg-red-100", !isPositive && !isNegative && "bg-gray-100"),
                children: /* @__PURE__ */jsxRuntimeExports.jsx(Icon, {
                  className: cn("w-4 h-4", isPositive && "text-green-600", isNegative && "text-red-600", !isPositive && !isNegative && "text-gray-600")
                })
              }), stat.change !== void 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: cn("flex items-center gap-1 text-xs font-medium", isPositive && "text-green-600", isNegative && "text-red-600", !isPositive && !isNegative && "text-gray-600"),
                children: [isPositive && /* @__PURE__ */jsxRuntimeExports.jsx(ArrowUp, {
                  className: "w-3 h-3"
                }), isNegative && /* @__PURE__ */jsxRuntimeExports.jsx(ArrowDown, {
                  className: "w-3 h-3"
                }), Math.abs(stat.change), "%"]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "text-2xl font-bold mb-1",
              children: stat.value
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "text-sm text-gray-600",
              children: stat.label
            }), stat.changeLabel && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "text-xs text-gray-500 mt-1",
              children: stat.changeLabel
            })]
          });
        }
        const defaultRealEstateStats = data => [{
          label: "Total Listings",
          value: data.totalListings,
          icon: Home,
          trend: "neutral"
        }, {
          label: "Active Listings",
          value: data.activeListings,
          icon: TrendingUp,
          trend: "up"
        }, {
          label: "Total Views",
          value: data.totalViews.toLocaleString(),
          change: data.viewsChange,
          changeLabel: data.viewsChange ? "vs last period" : void 0,
          icon: Eye,
          trend: data.viewsChange && data.viewsChange > 0 ? "up" : data.viewsChange && data.viewsChange < 0 ? "down" : "neutral"
        }, {
          label: "Total Leads",
          value: data.totalLeads,
          change: data.leadsChange,
          changeLabel: data.leadsChange ? "vs last period" : void 0,
          icon: Users,
          trend: data.leadsChange && data.leadsChange > 0 ? "up" : data.leadsChange && data.leadsChange < 0 ? "down" : "neutral"
        }];
        const mockListings = [{
          id: "1",
          title: "Modern 3BR House in Downtown",
          price: 45e4,
          status: "active",
          updatedAt: new Date(Date.now() - 1e3 * 60 * 60 * 24 * 9).toISOString(),
          // 9 days ago
          views: 156,
          leads: 12
        }, {
          id: "2",
          title: "Luxury Condo with Ocean View",
          price: 85e4,
          status: "pending",
          updatedAt: new Date(Date.now() - 1e3 * 60 * 60 * 24 * 2).toISOString(),
          // 2 days ago
          views: 243,
          leads: 18
        }, {
          id: "3",
          title: "Cozy 2BR Apartment Near Park",
          price: 325e3,
          status: "active",
          updatedAt: new Date(Date.now() - 1e3 * 60 * 60 * 24 * 15).toISOString(),
          // 15 days ago - STALE
          views: 89,
          leads: 5
        }, {
          id: "4",
          title: "Spacious Family Home with Pool",
          price: 675e3,
          status: "active",
          updatedAt: new Date(Date.now() - 1e3 * 60 * 60 * 24 * 12).toISOString(),
          // 12 days ago - STALE
          views: 198,
          leads: 22
        }, {
          id: "5",
          title: "Renovated Townhouse in Suburbs",
          price: 425e3,
          status: "sold",
          updatedAt: new Date(Date.now() - 1e3 * 60 * 60 * 24 * 1).toISOString(),
          // 1 day ago
          views: 312,
          leads: 28
        }, {
          id: "6",
          title: "Charming Cottage with Garden",
          price: 385e3,
          status: "active",
          updatedAt: new Date(Date.now() - 1e3 * 60 * 60 * 24 * 20).toISOString(),
          // 20 days ago - CRITICAL
          views: 67,
          leads: 3
        }];
        function QuickActionsDashboard() {
          const [listings, setListings] = reactExports.useState(mockListings);
          const [selectedIds, setSelectedIds] = reactExports.useState([]);
          const [isLoading, setIsLoading] = reactExports.useState(false);
          const staleListings = listings.filter(listing => {
            const daysSinceUpdate = Math.floor((Date.now() - new Date(listing.updatedAt).getTime()) / (1e3 * 60 * 60 * 24));
            return daysSinceUpdate >= 7 && listing.status === "active";
          }).map(listing => ({
            id: listing.id,
            title: listing.title,
            status: listing.status,
            updatedAt: listing.updatedAt,
            daysSinceUpdate: Math.floor((Date.now() - new Date(listing.updatedAt).getTime()) / (1e3 * 60 * 60 * 24))
          }));
          const analyticsStats = defaultRealEstateStats({
            totalListings: listings.length,
            activeListings: listings.filter(l => l.status === "active").length,
            totalViews: listings.reduce((sum, l) => sum + (l.views || 0), 0),
            totalLeads: listings.reduce((sum, l) => sum + (l.leads || 0), 0),
            avgPrice: Math.floor(listings.reduce((sum, l) => sum + l.price, 0) / listings.length),
            viewsChange: 12.5,
            leadsChange: 8.3
          });
          const handleStatusChange = async (listingId, newStatus) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            setListings(prev => prev.map(listing => listing.id === listingId ? {
              ...listing,
              status: newStatus,
              updatedAt: (/* @__PURE__ */new Date()).toISOString()
            } : listing));
          };
          const handleRefresh = async () => {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1e3));
            setIsLoading(false);
            ue.success("Listings refreshed");
          };
          const handleRefreshStale = async listingId => {
            const listing = listings.find(l => l.id === listingId);
            if (listing) {
              ue.info(`Opening editor for "${listing.title}"`);
            }
          };
          const handleToggleSelect = id => {
            setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
          };
          const handleSelectAll = () => {
            setSelectedIds(listings.map(l => l.id));
          };
          const handleClearSelection = () => {
            setSelectedIds([]);
          };
          const handleBulkUpdate = async updates => {
            await new Promise(resolve => setTimeout(resolve, 1e3));
            setListings(prev => prev.map(listing => {
              if (!selectedIds.includes(listing.id)) return listing;
              let updated = {
                ...listing,
                updatedAt: (/* @__PURE__ */new Date()).toISOString()
              };
              if (updates.status) {
                updated.status = updates.status;
              }
              if (updates.priceAdjustment) {
                const {
                  type,
                  value,
                  unit
                } = updates.priceAdjustment;
                if (type === "increase") {
                  updated.price = unit === "percent" ? listing.price * (1 + value / 100) : listing.price + value;
                } else if (type === "decrease") {
                  updated.price = unit === "percent" ? listing.price * (1 - value / 100) : listing.price - value;
                } else if (type === "set") {
                  updated.price = value;
                }
              }
              return updated;
            }));
            handleClearSelection();
          };
          const handleBulkDelete = async ids => {
            await new Promise(resolve => setTimeout(resolve, 800));
            setListings(prev => prev.filter(l => !ids.includes(l.id)));
          };
          const shortcuts = [{
            key: "?",
            description: "Show keyboard shortcuts",
            action: () => {},
            category: "General"
          }, {
            key: "s",
            description: "Mark selected as Sold",
            action: () => {
              if (selectedIds.length > 0) {
                selectedIds.forEach(id => handleStatusChange(id, "sold"));
              }
            },
            category: "Status"
          }, {
            key: "p",
            description: "Mark selected as Pending",
            action: () => {
              if (selectedIds.length > 0) {
                selectedIds.forEach(id => handleStatusChange(id, "pending"));
              }
            },
            category: "Status"
          }, {
            key: "a",
            description: "Mark selected as Active",
            action: () => {
              if (selectedIds.length > 0) {
                selectedIds.forEach(id => handleStatusChange(id, "active"));
              }
            },
            category: "Status"
          }, {
            key: "Escape",
            description: "Clear selection",
            action: handleClearSelection,
            category: "Selection"
          }];
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "container mx-auto py-6 space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                  className: "text-3xl font-bold",
                  children: "Quick Actions Dashboard"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-gray-600 mt-1",
                  children: "Manage your listings efficiently with keyboard shortcuts and bulk actions"
                })]
              }), staleListings.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsx(StaleContentBadge, {
                count: staleListings.length
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(AnalyticsWidget, {
              stats: analyticsStats,
              period: "Last 30 days"
            }), staleListings.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsx(StaleContentAlert, {
              staleListings,
              onRefresh: handleRefreshStale
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(Tabs, {
              defaultValue: "quick-status",
              className: "w-full",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsList, {
                className: "grid w-full grid-cols-2 max-w-md",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                  value: "quick-status",
                  children: "Quick Status"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsTrigger, {
                  value: "bulk-edit",
                  children: "Bulk Edit"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "quick-status",
                className: "mt-6",
                children: /* @__PURE__ */jsxRuntimeExports.jsx(QuickStatusDashboard, {
                  listings,
                  onStatusChange: handleStatusChange,
                  onRefresh: handleRefresh,
                  isLoading
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsContent, {
                value: "bulk-edit",
                className: "mt-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(BulkEditMode, {
                  listings,
                  selectedIds,
                  onToggleSelect: handleToggleSelect,
                  onSelectAll: handleSelectAll,
                  onClearSelection: handleClearSelection,
                  onBulkUpdate: handleBulkUpdate,
                  onBulkDelete: handleBulkDelete
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6",
                  children: listings.map(listing => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    onClick: () => handleToggleSelect(listing.id),
                    className: `p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedIds.includes(listing.id) ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`,
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-start justify-between mb-2",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "font-semibold text-sm",
                        children: listing.title
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("input", {
                        type: "checkbox",
                        checked: selectedIds.includes(listing.id),
                        onChange: () => handleToggleSelect(listing.id),
                        className: "mt-1"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                      className: "text-lg font-bold text-primary",
                      children: ["$", listing.price.toLocaleString()]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-sm text-gray-600 capitalize",
                      children: listing.status
                    })]
                  }, listing.id))
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(KeyboardShortcutsHelper, {
              shortcuts
            })]
          });
        }
      }
    };
  });
})();
