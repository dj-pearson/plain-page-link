;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js', './utils-legacy-B2316hnE.js', './charts-legacy-D2SqRQVB.js', './supabase-legacy-CQONYrP8.js'], function (exports, module) {
    'use strict';

    var jsxRuntimeExports, reactExports, cn, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Minus, TrendingDown, TrendingUp, ChevronDown, Users, DollarSign, Target, Lightbulb, CircleAlert, CircleCheckBig, FileText, Calendar, Download, BarChart3, eachDayOfInterval, format, ue, subDays, startOfMonth, endOfMonth;
    return {
      setters: [module => {
        jsxRuntimeExports = module.j;
        reactExports = module.r;
      }, module => {
        cn = module.c;
        Label = module.L;
        Select = module.S;
        SelectTrigger = module.a;
        SelectValue = module.b;
        SelectContent = module.d;
        SelectItem = module.e;
        Button = module.j;
        Badge = module.B;
        Tabs = module.J;
        TabsList = module.K;
        TabsTrigger = module.M;
        TabsContent = module.N;
      }, module => {
        Minus = module.aL;
        TrendingDown = module.ac;
        TrendingUp = module.T;
        ChevronDown = module.C;
        Users = module.U;
        DollarSign = module.K;
        Target = module.j;
        Lightbulb = module.ad;
        CircleAlert = module.c;
        CircleCheckBig = module.J;
        FileText = module.aj;
        Calendar = module.e;
        Download = module.a1;
        BarChart3 = module.B;
      }, module => {
        eachDayOfInterval = module.e;
        format = module.a;
        ue = module.u;
        subDays = module.s;
        startOfMonth = module.d;
        endOfMonth = module.g;
      }, null, null],
      execute: function () {
        exports("default", AnalyticsDashboard);
        function KPICards({
          metrics,
          className
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className),
            children: metrics.map(metric => /* @__PURE__ */jsxRuntimeExports.jsx(KPICard, {
              metric
            }, metric.name))
          });
        }
        function KPICard({
          metric
        }) {
          const getTrendIcon = () => {
            switch (metric.trend) {
              case "up":
                return /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                  className: "w-4 h-4"
                });
              case "down":
                return /* @__PURE__ */jsxRuntimeExports.jsx(TrendingDown, {
                  className: "w-4 h-4"
                });
              case "flat":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Minus, {
                  className: "w-4 h-4"
                });
            }
          };
          const getTrendColor = () => {
            switch (metric.trend) {
              case "up":
                return "text-green-600 bg-green-100";
              case "down":
                return "text-red-600 bg-red-100";
              case "flat":
                return "text-gray-600 bg-gray-100";
            }
          };
          const formatValue = () => {
            if (metric.unit === "$") {
              return `$${metric.value.toLocaleString()}`;
            } else if (metric.unit === "%") {
              return `${metric.value.toFixed(1)}%`;
            } else if (metric.unit === "min") {
              return `${Math.round(metric.value)} min`;
            }
            return metric.value.toLocaleString();
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "bg-white p-6 rounded-lg border hover:shadow-md transition-shadow",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between mb-2",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "text-sm font-medium text-gray-600",
                children: metric.name
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: cn("p-2 rounded-full", getTrendColor()),
                children: getTrendIcon()
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "flex items-baseline gap-2",
              children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-3xl font-bold text-gray-900",
                children: formatValue()
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "mt-2 flex items-center gap-1",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                className: cn("text-sm font-medium", metric.trend === "up" ? "text-green-600" : metric.trend === "down" ? "text-red-600" : "text-gray-600"),
                children: [metric.change > 0 ? "+" : "", metric.change.toFixed(1), "%"]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                className: "text-sm text-gray-500",
                children: "vs last period"
              })]
            }), metric.benchmark && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "mt-2 pt-2 border-t",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                className: "text-xs text-gray-500",
                children: ["Benchmark: ", metric.unit === "$" ? "$" : "", metric.benchmark.toLocaleString(), metric.unit === "%" ? "%" : ""]
              })
            })]
          });
        }
        function TimeSeriesChart({
          data,
          title,
          color = "#2563eb",
          height = 300,
          showPredictions = false,
          className
        }) {
          const {
            actualData,
            predictedData,
            maxValue,
            minValue
          } = reactExports.useMemo(() => {
            const actual = data.filter(d => !d.label);
            const predicted = data.filter(d => d.label === "predicted");
            const allValues = data.map(d => d.value);
            return {
              actualData: actual,
              predictedData: predicted,
              maxValue: Math.max(...allValues),
              minValue: Math.min(...allValues)
            };
          }, [data]);
          const getYPosition = value => {
            const padding = 20;
            const chartHeight = height - padding * 2;
            const range = maxValue - minValue || 1;
            return padding + chartHeight - (value - minValue) / range * chartHeight;
          };
          const getXPosition = (index, total) => {
            const padding = 40;
            const chartWidth = 800 - padding * 2;
            return padding + index / (total - 1) * chartWidth;
          };
          const createPath = (dataPoints, dashed = false) => {
            if (dataPoints.length === 0) return "";
            const points = dataPoints.map((d, i) => ({
              x: getXPosition(i, dataPoints.length),
              y: getYPosition(d.value)
            }));
            const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            return path;
          };
          const createAreaPath = dataPoints => {
            if (dataPoints.length === 0) return "";
            const linePath = createPath(dataPoints);
            const lastPoint = getXPosition(dataPoints.length - 1, dataPoints.length);
            const firstPoint = getXPosition(0, dataPoints.length);
            const bottom = height - 20;
            return `${linePath} L ${lastPoint} ${bottom} L ${firstPoint} ${bottom} Z`;
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className,
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
              className: "text-lg font-semibold mb-4",
              children: title
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("svg", {
              width: "100%",
              height,
              viewBox: "0 0 800 300",
              className: "bg-white rounded-lg border",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("g", {
                className: "grid-lines",
                children: [0, 25, 50, 75, 100].map(percent => {
                  const y = 20 + (height - 40) * (percent / 100);
                  return /* @__PURE__ */jsxRuntimeExports.jsxs("g", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("line", {
                      x1: 40,
                      y1: y,
                      x2: 760,
                      y2: y,
                      stroke: "#e5e7eb",
                      strokeWidth: 1
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("text", {
                      x: 25,
                      y: y + 4,
                      fontSize: 10,
                      fill: "#6b7280",
                      textAnchor: "end",
                      children: Math.round(maxValue - percent / 100 * (maxValue - minValue))
                    })]
                  }, percent);
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("path", {
                d: createAreaPath(actualData),
                fill: color,
                fillOpacity: 0.1
              }), /* @__PURE__ */jsxRuntimeExports.jsx("path", {
                d: createPath(actualData),
                fill: "none",
                stroke: color,
                strokeWidth: 2,
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }), showPredictions && predictedData.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsx("path", {
                d: createPath(predictedData),
                fill: "none",
                stroke: color,
                strokeWidth: 2,
                strokeDasharray: "5,5",
                strokeOpacity: 0.5,
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }), actualData.map((d, i) => /* @__PURE__ */jsxRuntimeExports.jsx("circle", {
                cx: getXPosition(i, actualData.length),
                cy: getYPosition(d.value),
                r: 4,
                fill: "white",
                stroke: color,
                strokeWidth: 2
              }, i)), /* @__PURE__ */jsxRuntimeExports.jsx("g", {
                className: "x-axis-labels",
                children: actualData.map((d, i) => {
                  const showLabel = i % Math.ceil(actualData.length / 7) === 0;
                  if (!showLabel) return null;
                  return /* @__PURE__ */jsxRuntimeExports.jsx("text", {
                    x: getXPosition(i, actualData.length),
                    y: height - 5,
                    fontSize: 10,
                    fill: "#6b7280",
                    textAnchor: "middle",
                    children: d.date
                  }, i);
                })
              })]
            }), showPredictions && predictedData.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "mt-2 flex items-center gap-4 text-sm text-gray-600",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-4 h-0.5",
                  style: {
                    backgroundColor: color
                  }
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  children: "Actual"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-4 h-0.5",
                  style: {
                    backgroundColor: color,
                    opacity: 0.5,
                    borderTop: `2px dashed ${color}`
                  }
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  children: "Predicted"
                })]
              })]
            })]
          });
        }
        function ConversionFunnel({
          stages,
          className
        }) {
          const maxCount = stages[0]?.count || 1;
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: cn("bg-white p-6 rounded-lg border", className),
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
              className: "text-lg font-semibold mb-6",
              children: "Conversion Funnel"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "space-y-2",
              children: stages.map((stage, index) => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(FunnelStageCard, {
                  stage,
                  maxCount,
                  isFirst: index === 0,
                  isLast: index === stages.length - 1
                }), !isLast && stage.dropoff !== void 0 && stage.dropoff > 0 && /* @__PURE__ */jsxRuntimeExports.jsx(DropoffIndicator, {
                  count: stage.dropoff,
                  percentage: calculateDropoffPercentage(stage, stages[index + 1])
                })]
              }, stage.name))
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "mt-6 pt-6 border-t grid grid-cols-3 gap-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(StatItem, {
                label: "Overall Conversion",
                value: `${stages[stages.length - 1].percentage.toFixed(1)}%`
              }), /* @__PURE__ */jsxRuntimeExports.jsx(StatItem, {
                label: "Total Conversions",
                value: stages[stages.length - 1].count.toLocaleString()
              }), /* @__PURE__ */jsxRuntimeExports.jsx(StatItem, {
                label: "Total Dropoff",
                value: calculateTotalDropoff(stages).toLocaleString()
              })]
            })]
          });
        }
        function FunnelStageCard({
          stage,
          maxCount,
          isFirst,
          isLast: isLast2
        }) {
          const widthPercentage = stage.count / maxCount * 100;
          const getColor = () => {
            if (stage.percentage >= 75) return "bg-green-500";
            if (stage.percentage >= 50) return "bg-yellow-500";
            if (stage.percentage >= 25) return "bg-orange-500";
            return "bg-red-500";
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "relative",
            children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: cn("relative mx-auto rounded-lg p-4 transition-all duration-300 hover:shadow-md", getColor()),
              style: {
                width: `${Math.max(widthPercentage, 20)}%`
              },
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center justify-between text-white",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                    className: "font-semibold",
                    children: stage.name
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-sm opacity-90",
                    children: [stage.count.toLocaleString(), " leads"]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "text-right",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-2xl font-bold",
                    children: [stage.percentage.toFixed(1), "%"]
                  }), !isFirst && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-xs opacity-90",
                    children: "of total"
                  })]
                })]
              })
            })
          });
        }
        function DropoffIndicator({
          count,
          percentage
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "flex items-center justify-center py-2",
            children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center gap-2 text-sm text-gray-600",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(ChevronDown, {
                className: "w-4 h-4 text-red-500"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "font-medium text-red-600",
                  children: count.toLocaleString()
                }), " ", "dropped off (", percentage.toFixed(1), "%)"]
              })]
            })
          });
        }
        function StatItem({
          label,
          value
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "text-center",
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-2xl font-bold text-gray-900",
              children: value
            }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-sm text-gray-600 mt-1",
              children: label
            })]
          });
        }
        function calculateDropoffPercentage(current, next) {
          if (current.count === 0) return 0;
          return (current.count - next.count) / current.count * 100;
        }
        function calculateTotalDropoff(stages) {
          if (stages.length < 2) return 0;
          return stages[0].count - stages[stages.length - 1].count;
        }
        function LeadSourceBreakdown({
          sources,
          className
        }) {
          const totalLeads = sources.reduce((sum, s) => sum + s.leads, 0);
          const totalRevenue = sources.reduce((sum, s) => sum + s.revenue, 0);
          const sortedSources = [...sources].sort((a, b) => b.conversionRate - a.conversionRate);
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: cn("bg-white p-6 rounded-lg border", className),
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between mb-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "text-lg font-semibold",
                children: "Lead Sources"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex gap-4 text-sm text-gray-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Users, {
                    className: "w-4 h-4"
                  }), totalLeads, " leads"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(DollarSign, {
                    className: "w-4 h-4"
                  }), "$", totalRevenue.toLocaleString()]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "space-y-4",
              children: sortedSources.map(source => /* @__PURE__ */jsxRuntimeExports.jsx(SourceCard, {
                source,
                totalLeads
              }, source.source))
            }), sortedSources.length === 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center py-8 text-gray-500",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Target, {
                className: "w-12 h-12 mx-auto mb-3 opacity-50"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                children: "No lead source data available"
              })]
            })]
          });
        }
        function SourceCard({
          source,
          totalLeads
        }) {
          const leadPercentage = source.leads / totalLeads * 100;
          const getConversionColor = rate => {
            if (rate >= 20) return "text-green-600";
            if (rate >= 10) return "text-yellow-600";
            return "text-gray-600";
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "p-4 border rounded-lg hover:shadow-md transition-shadow",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between mb-3",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                className: "font-semibold text-gray-900 capitalize",
                children: source.source
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  className: cn("text-lg font-bold", getConversionColor(source.conversionRate)),
                  children: [source.conversionRate.toFixed(1), "%"]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "text-sm text-gray-500",
                  children: "conversion"
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "mb-3",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center justify-between text-sm mb-1",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "text-gray-600",
                  children: "Lead share"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  className: "font-medium",
                  children: [leadPercentage.toFixed(1), "%"]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "w-full bg-gray-200 rounded-full h-2",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "bg-primary rounded-full h-2 transition-all duration-500",
                  style: {
                    width: `${leadPercentage}%`
                  }
                })
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "grid grid-cols-3 gap-3 text-center",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: "Leads"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-lg font-bold text-gray-900",
                  children: source.leads
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: "Conversions"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-lg font-bold text-gray-900",
                  children: source.conversions
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: "Revenue"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                  className: "text-lg font-bold text-gray-900",
                  children: ["$", source.revenue.toLocaleString()]
                })]
              })]
            }), source.roi !== void 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "mt-3 pt-3 border-t flex items-center justify-between",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                className: "text-sm text-gray-600",
                children: "ROI"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-1",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                  className: "w-4 h-4 text-green-600"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  className: cn("font-semibold", source.roi > 0 ? "text-green-600" : "text-red-600"),
                  children: [source.roi > 0 ? "+" : "", source.roi.toFixed(1), "%"]
                })]
              })]
            })]
          });
        }
        function InsightsPanel({
          insights,
          className
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: cn("bg-white p-6 rounded-lg border", className),
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center gap-2 mb-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Lightbulb, {
                className: "w-5 h-5 text-yellow-500"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "text-lg font-semibold",
                children: "Key Insights"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "space-y-3",
              children: insights.map((insight, index) => /* @__PURE__ */jsxRuntimeExports.jsx(InsightCard, {
                insight
              }, index))
            }), insights.length === 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center py-8 text-gray-500",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Lightbulb, {
                className: "w-12 h-12 mx-auto mb-3 opacity-50"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                children: "No insights available yet"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm mt-1",
                children: "Check back when you have more data"
              })]
            })]
          });
        }
        function InsightCard({
          insight
        }) {
          const getIcon = () => {
            if (insight.includes("📈") || insight.includes("🚀") || insight.includes("🎯")) {
              return /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                className: "w-5 h-5 text-green-600"
              });
            } else if (insight.includes("⚠️") || insight.includes("🐌")) {
              return /* @__PURE__ */jsxRuntimeExports.jsx(CircleAlert, {
                className: "w-5 h-5 text-orange-600"
              });
            } else if (insight.includes("⚡") || insight.includes("🌟")) {
              return /* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                className: "w-5 h-5 text-blue-600"
              });
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(Lightbulb, {
              className: "w-5 h-5 text-yellow-600"
            });
          };
          const getBackgroundColor = () => {
            if (insight.includes("📈") || insight.includes("🚀") || insight.includes("🎯")) {
              return "bg-green-50 border-green-200";
            } else if (insight.includes("⚠️") || insight.includes("🐌")) {
              return "bg-orange-50 border-orange-200";
            } else if (insight.includes("⚡") || insight.includes("🌟")) {
              return "bg-blue-50 border-blue-200";
            }
            return "bg-yellow-50 border-yellow-200";
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: cn("p-4 rounded-lg border", getBackgroundColor()),
            children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-start gap-3",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "flex-shrink-0 mt-0.5",
                children: getIcon()
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm text-gray-700 leading-relaxed",
                children: insight
              })]
            })
          });
        }
        class AnalyticsEngine {
          /**
           * Calculate key performance indicators
           */
          static calculateKPIs(current, previous) {
            return [this.createMetric("Total Page Views", current.pageViews, "", previous.pageViews), this.createMetric("Unique Visitors", current.uniqueVisitors, "", previous.uniqueVisitors), this.createMetric("Total Leads", current.leads, "", previous.leads), this.createMetric("Conversions", current.conversions, "", previous.conversions), this.createMetric("Revenue", current.revenue, "$", previous.revenue), this.createMetric("Avg Response Time", current.avgResponseTime, "min", previous.avgResponseTime, true
            // lower is better
            ), this.createMetric("Conversion Rate", this.calculateConversionRate(current.leads, current.conversions), "%", this.calculateConversionRate(previous.leads, previous.conversions)), this.createMetric("Lead-to-Visitor Rate", this.calculateConversionRate(current.uniqueVisitors, current.leads), "%", this.calculateConversionRate(previous.uniqueVisitors, previous.leads))];
          }
          /**
           * Create a performance metric with trend
           */
          static createMetric(name, current, unit, previous, lowerIsBetter = false) {
            const change = this.calculatePercentageChange(current, previous);
            const trend = this.determineTrend(change, lowerIsBetter);
            return {
              name,
              value: current,
              unit,
              change,
              trend
            };
          }
          /**
           * Calculate percentage change
           */
          static calculatePercentageChange(current, previous) {
            if (previous === 0) return current > 0 ? 100 : 0;
            return (current - previous) / previous * 100;
          }
          /**
           * Determine trend direction
           */
          static determineTrend(change, lowerIsBetter = false) {
            const threshold = 2;
            if (Math.abs(change) < threshold) return "flat";
            if (lowerIsBetter) {
              return change < 0 ? "up" : "down";
            }
            return change > 0 ? "up" : "down";
          }
          /**
           * Calculate conversion rate
           */
          static calculateConversionRate(total, converted) {
            if (total === 0) return 0;
            return converted / total * 100;
          }
          /**
           * Generate time series data
           */
          static generateTimeSeries(startDate, endDate, dataGenerator) {
            const days = eachDayOfInterval({
              start: startDate,
              end: endDate
            });
            return days.map(date => ({
              date: format(date, "MMM d"),
              value: dataGenerator(date)
            }));
          }
          /**
           * Calculate funnel stages
           */
          static calculateFunnel(stages) {
            const {
              visitors,
              viewed,
              contacted,
              qualified,
              converted
            } = stages;
            return [{
              name: "Visitors",
              count: visitors,
              percentage: 100
            }, {
              name: "Viewed Listing",
              count: viewed,
              percentage: this.calculateConversionRate(visitors, viewed),
              dropoff: visitors - viewed
            }, {
              name: "Contacted",
              count: contacted,
              percentage: this.calculateConversionRate(visitors, contacted),
              dropoff: viewed - contacted
            }, {
              name: "Qualified",
              count: qualified,
              percentage: this.calculateConversionRate(visitors, qualified),
              dropoff: contacted - qualified
            }, {
              name: "Converted",
              count: converted,
              percentage: this.calculateConversionRate(visitors, converted),
              dropoff: qualified - converted
            }];
          }
          /**
           * Analyze lead sources
           */
          static analyzeLeadSources(sources) {
            return sources.map(source => ({
              source: source.source,
              leads: source.leads,
              conversions: source.conversions,
              conversionRate: this.calculateConversionRate(source.leads, source.conversions),
              revenue: source.revenue,
              roi: source.cost ? (source.revenue - source.cost) / source.cost * 100 : void 0
            }));
          }
          /**
           * Rank listings by performance
           */
          static rankListings(listings) {
            return listings.map(listing => ({
              ...listing,
              conversionRate: this.calculateConversionRate(listing.views, listing.leads)
            })).sort((a, b) => b.conversionRate - a.conversionRate);
          }
          /**
           * Calculate trend prediction (simple linear regression)
           */
          static predictTrend(data, daysToPredict = 7) {
            if (data.length < 2) return [];
            const n = data.length;
            const xValues = data.map((_, i) => i);
            const yValues = data.map(d => d.value);
            const sumX = xValues.reduce((a, b) => a + b, 0);
            const sumY = yValues.reduce((a, b) => a + b, 0);
            const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
            const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            const predictions = [];
            const lastDate = new Date(data[data.length - 1].date);
            for (let i = 1; i <= daysToPredict; i++) {
              const x = n + i - 1;
              const predictedValue = Math.max(0, Math.round(slope * x + intercept));
              const predictedDate = new Date(lastDate);
              predictedDate.setDate(predictedDate.getDate() + i);
              predictions.push({
                date: format(predictedDate, "MMM d"),
                value: predictedValue,
                label: "predicted"
              });
            }
            return predictions;
          }
          /**
           * Calculate engagement score (0-100)
           */
          static calculateEngagementScore(metrics) {
            const {
              avgTimeOnPage,
              bounceRate,
              pagesPerSession,
              returnVisitorRate
            } = metrics;
            const timeScore = Math.min(avgTimeOnPage / 180 * 25, 25);
            const bounceScore = Math.max((100 - bounceRate) / 4, 0);
            const pagesScore = Math.min(pagesPerSession / 5 * 25, 25);
            const returnScore = returnVisitorRate / 100 * 25;
            return Math.round(timeScore + bounceScore + pagesScore + returnScore);
          }
          /**
           * Generate insights from data
           */
          static generateInsights(current, previous, sources) {
            const insights = [];
            const leadChange = this.calculatePercentageChange(current.leads, previous.leads);
            if (leadChange > 20) {
              insights.push(`📈 Lead generation is up ${Math.round(leadChange)}% compared to last period`);
            } else if (leadChange < -20) {
              insights.push(`⚠️ Lead generation is down ${Math.abs(Math.round(leadChange))}% - consider increasing marketing efforts`);
            }
            const currentCR = this.calculateConversionRate(current.leads, current.conversions);
            const previousCR = this.calculateConversionRate(previous.leads, previous.conversions);
            if (currentCR > previousCR + 5) {
              insights.push(`🎯 Conversion rate improved to ${currentCR.toFixed(1)}% - keep up the good work!`);
            }
            if (current.avgResponseTime < 5) {
              insights.push(`⚡ Excellent response time! You're responding in under 5 minutes`);
            } else if (current.avgResponseTime > 60) {
              insights.push(`🐌 Response time is high (${Math.round(current.avgResponseTime)} min) - faster responses increase conversions`);
            }
            if (sources.length > 0) {
              const bestSource = sources.reduce((best, current2) => current2.conversionRate > best.conversionRate ? current2 : best);
              if (bestSource.conversionRate > 15) {
                insights.push(`🌟 ${bestSource.source} is your best performing source at ${bestSource.conversionRate.toFixed(1)}% conversion rate`);
              }
            }
            const trafficChange = this.calculatePercentageChange(current.uniqueVisitors, previous.uniqueVisitors);
            if (trafficChange > 30) {
              insights.push(`🚀 Traffic is surging! Up ${Math.round(trafficChange)}% - great time to capture leads`);
            }
            return insights;
          }
          /**
           * Export data to CSV format
           */
          static exportToCSV(data, filename) {
            if (data.length === 0) return;
            const headers = Object.keys(data[0]);
            const csvContent = [headers.join(","),
            // Header row
            ...data.map(row => headers.map(header => JSON.stringify(row[header] || "")).join(","))].join("\n");
            const blob = new Blob([csvContent], {
              type: "text/csv;charset=utf-8;"
            });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}_${Date.now()}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
        const calculateKPIs = AnalyticsEngine.calculateKPIs;
        const generateTimeSeries = AnalyticsEngine.generateTimeSeries;
        const calculateFunnel = AnalyticsEngine.calculateFunnel;
        const analyzeLeadSources = AnalyticsEngine.analyzeLeadSources;
        const predictTrend = AnalyticsEngine.predictTrend;
        const generateInsights = AnalyticsEngine.generateInsights;
        const exportToCSV = AnalyticsEngine.exportToCSV;
        function ReportBuilder({
          onGenerateReport,
          className
        }) {
          const [reportType, setReportType] = reactExports.useState("leads");
          const [dateRange, setDateRange] = reactExports.useState("30d");
          const [format2, setFormat] = reactExports.useState("csv");
          const [isGenerating, setIsGenerating] = reactExports.useState(false);
          const reportTypes = [{
            value: "leads",
            label: "Leads Report"
          }, {
            value: "listings",
            label: "Listings Performance"
          }, {
            value: "conversions",
            label: "Conversion Analytics"
          }, {
            value: "sources",
            label: "Lead Sources"
          }, {
            value: "performance",
            label: "Overall Performance"
          }];
          const dateRanges = [{
            value: "7d",
            label: "Last 7 Days"
          }, {
            value: "30d",
            label: "Last 30 Days"
          }, {
            value: "90d",
            label: "Last 90 Days"
          }, {
            value: "this_month",
            label: "This Month"
          }, {
            value: "last_month",
            label: "Last Month"
          }];
          const formats = [{
            value: "csv",
            label: "CSV"
          }, {
            value: "pdf",
            label: "PDF (Coming Soon)",
            disabled: true
          }, {
            value: "excel",
            label: "Excel (Coming Soon)",
            disabled: true
          }];
          const getDateRangeForReport = () => {
            const now = /* @__PURE__ */new Date();
            switch (dateRange) {
              case "7d":
                return {
                  start: subDays(now, 7),
                  end: now
                };
              case "30d":
                return {
                  start: subDays(now, 30),
                  end: now
                };
              case "90d":
                return {
                  start: subDays(now, 90),
                  end: now
                };
              case "this_month":
                return {
                  start: startOfMonth(now),
                  end: endOfMonth(now)
                };
              case "last_month":
                const lastMonth = subDays(startOfMonth(now), 1);
                return {
                  start: startOfMonth(lastMonth),
                  end: endOfMonth(lastMonth)
                };
              default:
                return {
                  start: subDays(now, 30),
                  end: now
                };
            }
          };
          const handleGenerateReport = async () => {
            setIsGenerating(true);
            try {
              const {
                start,
                end
              } = getDateRangeForReport();
              const config = {
                reportType,
                dateRange,
                metrics: [],
                // Will be filled based on report type
                format: format2,
                startDate: start,
                endDate: end
              };
              const data = await onGenerateReport(config);
              if (format2 === "csv") {
                const filename = `${reportType}_report_${format2(start, "yyyy-MM-dd")}_to_${format2(end, "yyyy-MM-dd")}`;
                exportToCSV(data, filename);
                ue.success("Report exported successfully!");
              }
            } catch (error) {
              console.error("Report generation error:", error);
              ue.error("Failed to generate report");
            } finally {
              setIsGenerating(false);
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: cn("bg-white p-6 rounded-lg border", className),
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center gap-2 mb-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(FileText, {
                className: "w-5 h-5 text-primary"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "text-lg font-semibold",
                children: "Custom Report Builder"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                  children: "Report Type"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                  value: reportType,
                  onValueChange: v => setReportType(v),
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {})
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectContent, {
                    children: reportTypes.map(type => /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                      value: type.value,
                      children: type.label
                    }, type.value))
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                  className: "flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Calendar, {
                    className: "w-4 h-4"
                  }), "Date Range"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                  value: dateRange,
                  onValueChange: v => setDateRange(v),
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {})
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectContent, {
                    children: dateRanges.map(range => /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                      value: range.value,
                      children: range.label
                    }, range.value))
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                  children: "Export Format"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                  value: format2,
                  onValueChange: v => setFormat(v),
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {})
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectContent, {
                    children: formats.map(fmt => /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                      value: fmt.value,
                      disabled: fmt.disabled,
                      children: fmt.label
                    }, fmt.value))
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                onClick: handleGenerateReport,
                disabled: isGenerating,
                className: "w-full gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Download, {
                  className: "w-4 h-4"
                }), isGenerating ? "Generating..." : "Generate Report"]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "mt-6 p-4 bg-gray-50 rounded-lg",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                className: "text-sm font-semibold mb-2",
                children: "Report Preview"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-1 text-sm text-gray-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                  children: ["Type: ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "font-medium",
                    children: reportType
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                  children: ["Range:", " ", /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                    className: "font-medium",
                    children: [format2(getDateRangeForReport().start, "MMM d, yyyy"), " ", "-", " ", format2(getDateRangeForReport().end, "MMM d, yyyy")]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                  children: ["Format:", " ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "font-medium uppercase",
                    children: format2
                  })]
                })]
              })]
            })]
          });
        }
        const generateMockData = () => {
          const now = /* @__PURE__ */new Date();
          return {
            current: {
              pageViews: 3542,
              uniqueVisitors: 1876,
              leads: 156,
              conversions: 23,
              revenue: 156e3,
              avgResponseTime: 12,
              period: "month",
              startDate: subDays(now, 30),
              endDate: now
            },
            previous: {
              pageViews: 2890,
              uniqueVisitors: 1520,
              leads: 128,
              conversions: 18,
              revenue: 122e3,
              avgResponseTime: 18,
              period: "month",
              startDate: subDays(now, 60),
              endDate: subDays(now, 30)
            }
          };
        };
        const generateMockTimeSeriesData = () => {
          const now = /* @__PURE__ */new Date();
          return generateTimeSeries(subDays(now, 30), now, date => {
            const base = 5;
            const variance = Math.random() * 8;
            const trend = (date.getTime() - subDays(now, 30).getTime()) / (1e3 * 60 * 60 * 24 * 30);
            return Math.round(base + variance + trend * 5);
          });
        };
        const generateMockLeadSources = () => {
          return [{
            source: "zillow",
            leads: 45,
            conversions: 12,
            revenue: 85e3,
            cost: 5e3
          }, {
            source: "realtor",
            leads: 38,
            conversions: 8,
            revenue: 62e3,
            cost: 4e3
          }, {
            source: "facebook",
            leads: 32,
            conversions: 5,
            revenue: 38e3,
            cost: 3500
          }, {
            source: "google",
            leads: 28,
            conversions: 4,
            revenue: 31e3,
            cost: 4500
          }, {
            source: "website",
            leads: 25,
            conversions: 3,
            revenue: 28e3,
            cost: 1e3
          }, {
            source: "referral",
            leads: 18,
            conversions: 4,
            revenue: 45e3,
            cost: 0
          }];
        };
        function AnalyticsDashboard() {
          const [showPredictions, setShowPredictions] = reactExports.useState(true);
          const {
            current,
            previous
          } = reactExports.useMemo(() => generateMockData(), []);
          const timeSeriesData = reactExports.useMemo(() => generateMockTimeSeriesData(), []);
          const predictions = reactExports.useMemo(() => predictTrend(timeSeriesData, 7), [timeSeriesData]);
          const combinedData = [...timeSeriesData, ...(showPredictions ? predictions : [])];
          const kpis = reactExports.useMemo(() => calculateKPIs(current, previous), [current, previous]);
          const funnel = reactExports.useMemo(() => calculateFunnel({
            visitors: current.uniqueVisitors,
            viewed: Math.round(current.uniqueVisitors * 0.7),
            contacted: current.leads,
            qualified: Math.round(current.leads * 0.4),
            converted: current.conversions
          }), [current]);
          const leadSources = reactExports.useMemo(() => analyzeLeadSources(generateMockLeadSources()), []);
          const insights = reactExports.useMemo(() => generateInsights(current, previous, leadSources), [current, previous, leadSources]);
          const handleGenerateReport = async config => {
            await new Promise(resolve => setTimeout(resolve, 1e3));
            switch (config.reportType) {
              case "leads":
                return Array.from({
                  length: 50
                }, (_, i) => ({
                  id: `L${i + 1}`,
                  name: `Lead ${i + 1}`,
                  email: `lead${i + 1}@example.com`,
                  source: leadSources[i % leadSources.length].source,
                  status: ["new", "contacted", "qualified", "converted"][Math.floor(Math.random() * 4)],
                  score: Math.floor(Math.random() * 100),
                  created: (/* @__PURE__ */new Date()).toISOString()
                }));
              case "sources":
                return leadSources.map(s => ({
                  source: s.source,
                  leads: s.leads,
                  conversions: s.conversions,
                  conversion_rate: `${s.conversionRate.toFixed(1)}%`,
                  revenue: s.revenue,
                  roi: s.roi ? `${s.roi.toFixed(1)}%` : "N/A"
                }));
              default:
                return [{
                  metric: "Page Views",
                  current: current.pageViews,
                  previous: previous.pageViews,
                  change: `${((current.pageViews - previous.pageViews) / previous.pageViews * 100).toFixed(1)}%`
                }, {
                  metric: "Leads",
                  current: current.leads,
                  previous: previous.leads,
                  change: `${((current.leads - previous.leads) / previous.leads * 100).toFixed(1)}%`
                }, {
                  metric: "Conversions",
                  current: current.conversions,
                  previous: previous.conversions,
                  change: `${((current.conversions - previous.conversions) / previous.conversions * 100).toFixed(1)}%`
                }];
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "container mx-auto py-6 space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                  className: "text-3xl font-bold",
                  children: "Analytics Dashboard"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-gray-600 mt-1",
                  children: "Track your performance and gain insights"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "flex gap-2",
                children: /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                  variant: "outline",
                  className: "px-4 py-2",
                  children: "Last 30 Days"
                })
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(KPICards, {
              metrics: kpis
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(Tabs, {
              defaultValue: "overview",
              className: "w-full",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsList, {
                className: "grid w-full grid-cols-4 max-w-2xl",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "overview",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(BarChart3, {
                    className: "w-4 h-4"
                  }), "Overview"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "funnel",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                    className: "w-4 h-4"
                  }), "Funnel"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "sources",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Users, {
                    className: "w-4 h-4"
                  }), "Sources"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "reports",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(FileText, {
                    className: "w-4 h-4"
                  }), "Reports"]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "overview",
                className: "mt-6 space-y-6",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "lg:col-span-2",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(TimeSeriesChart, {
                      data: combinedData,
                      title: "Lead Generation Trend",
                      color: "#2563eb",
                      showPredictions
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(InsightsPanel, {
                    insights
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "funnel",
                className: "mt-6",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(ConversionFunnel, {
                    stages: funnel
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "space-y-6",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(InsightsPanel, {
                      insights
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "bg-white p-6 rounded-lg border",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "text-lg font-semibold mb-4",
                        children: "Optimization Tips"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("ul", {
                        className: "space-y-2 text-sm text-gray-700",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                          className: "flex items-start gap-2",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            className: "text-primary",
                            children: "•"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            children: "Improve Viewed → Contacted rate with clearer CTAs"
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                          className: "flex items-start gap-2",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            className: "text-primary",
                            children: "•"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            children: "Reduce dropoff with faster response times"
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                          className: "flex items-start gap-2",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            className: "text-primary",
                            children: "•"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            children: "Qualify leads better with targeted questions"
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                          className: "flex items-start gap-2",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            className: "text-primary",
                            children: "•"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            children: "Nurture qualified leads with follow-ups"
                          })]
                        })]
                      })]
                    })]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "sources",
                className: "mt-6",
                children: /* @__PURE__ */jsxRuntimeExports.jsx(LeadSourceBreakdown, {
                  sources: leadSources
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "reports",
                className: "mt-6",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "lg:col-span-2",
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "bg-white p-6 rounded-lg border",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "text-lg font-semibold mb-4",
                        children: "Available Reports"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(ReportCard, {
                          title: "Leads Report",
                          description: "Detailed lead data with scores and sources",
                          icon: /* @__PURE__ */jsxRuntimeExports.jsx(Users, {
                            className: "w-6 h-6"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(ReportCard, {
                          title: "Performance Report",
                          description: "Overall performance metrics and trends",
                          icon: /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                            className: "w-6 h-6"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(ReportCard, {
                          title: "Sources Report",
                          description: "Lead source analysis with ROI",
                          icon: /* @__PURE__ */jsxRuntimeExports.jsx(BarChart3, {
                            className: "w-6 h-6"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(ReportCard, {
                          title: "Conversion Report",
                          description: "Conversion funnel and rates",
                          icon: /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                            className: "w-6 h-6"
                          })
                        })]
                      })]
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(ReportBuilder, {
                    onGenerateReport: handleGenerateReport
                  })]
                })
              })]
            })]
          });
        }
        function ReportCard({
          title,
          description,
          icon
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer",
            children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-start gap-3",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "p-2 bg-primary/10 rounded-lg text-primary",
                children: icon
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                  className: "font-semibold mb-1",
                  children: title
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: description
                })]
              })]
            })
          });
        }
      }
    };
  });
})();
