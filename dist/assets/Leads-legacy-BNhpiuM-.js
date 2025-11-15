;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './index-legacy-CvrXsObU.js', './data-legacy-BmYdDdMQ.js', './supabase-legacy-CQONYrP8.js', './state-stores-legacy-80VekGrm.js', './UpgradeModal-legacy-1fJMHoGX.js', './ui-components-legacy-oJhN_-ge.js', './useProfile-legacy-DrgEb0hd.js', './icons-legacy-C8x4ypXf.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js', './three-addons-legacy-COT_Kqtz.js', './three-legacy-VFAp7wzH.js', './forms-legacy-BImVIBp0.js'], function (exports, module) {
    'use strict';

    var reactExports, jsxRuntimeExports, useToast, useQuery, supabase, useAuthStore, useSubscriptionLimits, UpgradeModal, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Input, Button, Badge, Card, CardContent, useProfile, Zap, CircleCheckBig, CircleX, LoaderCircle, CircleAlert, ExternalLink, Download, Search, Mail, Phone, Calendar, MessageSquare, User;
    return {
      setters: [module => {
        reactExports = module.r;
        jsxRuntimeExports = module.j;
      }, module => {
        useToast = module.u;
      }, module => {
        useQuery = module.u;
      }, module => {
        supabase = module.s;
      }, module => {
        useAuthStore = module.u;
      }, module => {
        useSubscriptionLimits = module.u;
        UpgradeModal = module.U;
      }, module => {
        Dialog = module.D;
        DialogContent = module.l;
        DialogHeader = module.m;
        DialogTitle = module.n;
        DialogDescription = module.G;
        Input = module.I;
        Button = module.j;
        Badge = module.B;
        Card = module.C;
        CardContent = module.o;
      }, module => {
        useProfile = module.u;
      }, module => {
        Zap = module.Z;
        CircleCheckBig = module.J;
        CircleX = module.aD;
        LoaderCircle = module.L;
        CircleAlert = module.c;
        ExternalLink = module.h;
        Download = module.a1;
        Search = module.S;
        Mail = module.M;
        Phone = module.P;
        Calendar = module.e;
        MessageSquare = module.q;
        User = module.a0;
      }, null, null, null, null, null],
      execute: function () {
        exports("default", Leads);
        function ZapierIntegrationModal({
          open,
          onOpenChange
        }) {
          const {
            toast
          } = useToast();
          const {
            profile,
            refetch
          } = useProfile();
          const [webhookUrl, setWebhookUrl] = reactExports.useState(profile?.zapier_webhook_url || "");
          const [isSaving, setIsSaving] = reactExports.useState(false);
          const [isTesting, setIsTesting] = reactExports.useState(false);
          const [testResult, setTestResult] = reactExports.useState(null);
          const handleSave = async () => {
            setIsSaving(true);
            try {
              const {
                data: {
                  user
                }
              } = await supabase.auth.getUser();
              if (!user) throw new Error("Not authenticated");
              const {
                error
              } = await supabase.from("profiles").update({
                zapier_webhook_url: webhookUrl || null
              }).eq("id", user.id);
              if (error) throw error;
              await refetch();
              toast({
                title: "Saved!",
                description: webhookUrl ? "Zapier webhook configured successfully" : "Zapier webhook removed"
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to save webhook URL",
                variant: "destructive"
              });
            } finally {
              setIsSaving(false);
            }
          };
          const handleTest = async () => {
            if (!webhookUrl) {
              toast({
                title: "Error",
                description: "Please enter a webhook URL first",
                variant: "destructive"
              });
              return;
            }
            setIsTesting(true);
            setTestResult(null);
            try {
              const testPayload = {
                test: true,
                lead_id: "test-lead-id",
                name: "Test Lead",
                email: "test@example.com",
                phone: "+1 555-123-4567",
                message: "This is a test lead from AgentBio.net",
                lead_type: "contact",
                created_at: (/* @__PURE__ */new Date()).toISOString()
              };
              const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(testPayload)
              });
              if (response.ok) {
                setTestResult("success");
                toast({
                  title: "Test successful!",
                  description: "Your Zapier webhook is working correctly"
                });
              } else {
                throw new Error(`HTTP ${response.status}`);
              }
            } catch (error) {
              setTestResult("error");
              toast({
                title: "Test failed",
                description: "Could not reach your webhook. Check the URL and try again.",
                variant: "destructive"
              });
            } finally {
              setIsTesting(false);
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx(Dialog, {
            open,
            onOpenChange,
            children: /* @__PURE__ */jsxRuntimeExports.jsxs(DialogContent, {
              className: "sm:max-w-2xl max-h-[90vh] overflow-y-auto",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(DialogHeader, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(DialogTitle, {
                  className: "text-2xl flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Zap, {
                    className: "h-6 w-6 text-orange-500"
                  }), "Zapier Integration"]
                }), /* @__PURE__ */jsxRuntimeExports.jsx(DialogDescription, {
                  children: "Automatically send new leads to your CRM via Zapier"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("label", {
                    className: "block text-sm font-semibold mb-2",
                    children: "Zapier Webhook URL"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    type: "url",
                    placeholder: "https://hooks.zapier.com/hooks/catch/...",
                    value: webhookUrl,
                    onChange: e => setWebhookUrl(e.target.value),
                    className: "font-mono text-sm"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-xs text-muted-foreground mt-1",
                    children: "Paste your Zapier webhook URL here"
                  })]
                }), testResult && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: `p-3 rounded-lg flex items-center gap-2 ${testResult === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`,
                  children: [testResult === "success" ? /* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                    className: "h-5 w-5"
                  }) : /* @__PURE__ */jsxRuntimeExports.jsx(CircleX, {
                    className: "h-5 w-5"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "text-sm font-medium",
                    children: testResult === "success" ? "Webhook test successful!" : "Webhook test failed. Check your URL."
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    onClick: handleTest,
                    variant: "outline",
                    disabled: isTesting || !webhookUrl,
                    className: "flex-1",
                    children: isTesting ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(LoaderCircle, {
                        className: "h-4 w-4 mr-2 animate-spin"
                      }), "Testing..."]
                    }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Zap, {
                        className: "h-4 w-4 mr-2"
                      }), "Test Webhook"]
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    onClick: handleSave,
                    disabled: isSaving,
                    className: "flex-1",
                    children: isSaving ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(LoaderCircle, {
                        className: "h-4 w-4 mr-2 animate-spin"
                      }), "Saving..."]
                    }) : "Save Configuration"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "bg-blue-50 border border-blue-200 rounded-lg p-4",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-start gap-3",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleAlert, {
                      className: "h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "text-sm",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "font-semibold text-blue-900 mb-2",
                        children: "How to set up Zapier integration:"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("ol", {
                        className: "text-blue-800 space-y-2 list-decimal list-inside",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                          children: ["Go to", " ", /* @__PURE__ */jsxRuntimeExports.jsxs("a", {
                            href: "https://zapier.com",
                            target: "_blank",
                            rel: "noopener noreferrer",
                            className: "underline inline-flex items-center gap-1",
                            children: ["Zapier.com", /* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                              className: "h-3 w-3"
                            })]
                          }), " ", "and create a new Zap"]
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                          children: 'Choose "Webhooks by Zapier" as the trigger'
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                          children: 'Select "Catch Hook" as the event'
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                          children: "Copy the webhook URL Zapier provides"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                          children: "Paste it in the field above and save"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                          children: "Connect your CRM (Salesforce, HubSpot, etc.) as the action"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                          children: "Map the lead fields to your CRM fields"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                          children: "Turn on your Zap!"
                        })]
                      })]
                    })]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-gray-50 border border-gray-200 rounded-lg p-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                    className: "font-semibold text-sm mb-2",
                    children: "Available Fields in Webhook Payload:"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "grid grid-cols-2 gap-2 text-xs font-mono",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "lead_id"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "name"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "email"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "phone"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "message"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "lead_type"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "price_range"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "timeline"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "property_address"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "preapproved"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "referrer_url"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "utm_source"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "utm_medium"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "utm_campaign"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "device"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600",
                      children: "created_at"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-purple-50 border border-purple-200 rounded-lg p-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                    className: "font-semibold text-sm mb-2 text-purple-900",
                    children: "⚡ Benefits of Zapier Integration:"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("ul", {
                    className: "text-sm text-purple-800 space-y-1",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("li", {
                      children: "• Automatically sync leads to 5,000+ apps"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                      children: "• Connect to popular CRMs (Salesforce, HubSpot, Zoho)"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                      children: "• Send leads to Google Sheets for easy tracking"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                      children: "• Get instant Slack/Teams notifications for new leads"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                      children: "• Create tasks in your project management tools"
                    })]
                  })]
                })]
              })]
            })
          });
        }
        function Leads() {
          const [searchQuery, setSearchQuery] = reactExports.useState("");
          const [showUpgradeModal, setShowUpgradeModal] = reactExports.useState(false);
          const [showZapierModal, setShowZapierModal] = reactExports.useState(false);
          const {
            user
          } = useAuthStore();
          const {
            toast
          } = useToast();
          const {
            subscription
          } = useSubscriptionLimits();
          const {
            data: leads,
            isLoading
          } = useQuery({
            queryKey: ["leads", user?.id],
            queryFn: async () => {
              if (!user?.id) return [];
              const {
                data,
                error
              } = await supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", {
                ascending: false
              });
              if (error) throw error;
              return data;
            },
            enabled: !!user?.id
          });
          const handleExportLeads = () => {
            if (subscription?.plan_name === "free") {
              setShowUpgradeModal(true);
              return;
            }
            if (!leads || leads.length === 0) {
              toast({
                title: "No leads to export",
                description: "You don't have any leads yet.",
                variant: "destructive"
              });
              return;
            }
            const headers = ["Name", "Email", "Phone", "Type", "Message", "Status", "Created At"];
            const csvContent = [headers.join(","), ...leads.map(lead => [lead.name, lead.email, lead.phone || "", lead.lead_type, `"${(lead.message || "").replace(/"/g, '""')}"`, lead.status, new Date(lead.created_at).toLocaleDateString()].join(","))].join("\n");
            const blob = new Blob([csvContent], {
              type: "text/csv"
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `leads-${(/* @__PURE__ */new Date()).toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({
              title: "Leads exported",
              description: `Successfully exported ${leads.length} leads to CSV`
            });
          };
          const getStatusBadge = status => {
            const statusMap = {
              new: {
                variant: "default",
                label: "New"
              },
              contacted: {
                variant: "secondary",
                label: "Contacted"
              },
              qualified: {
                variant: "outline",
                label: "Qualified"
              },
              converted: {
                variant: "default",
                label: "Converted"
              }
            };
            const config = statusMap[status] || {
              variant: "outline",
              label: status
            };
            return /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
              variant: config.variant,
              children: config.label
            });
          };
          const getLeadTypeIcon = type => {
            switch (type) {
              case "buyer":
                return /* @__PURE__ */jsxRuntimeExports.jsx(User, {
                  className: "h-4 w-4"
                });
              case "seller":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Phone, {
                  className: "h-4 w-4"
                });
              case "valuation":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Mail, {
                  className: "h-4 w-4"
                });
              default:
                return /* @__PURE__ */jsxRuntimeExports.jsx(MessageSquare, {
                  className: "h-4 w-4"
                });
            }
          };
          const filteredLeads = leads?.filter(lead => searchQuery ? lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || lead.email.toLowerCase().includes(searchQuery.toLowerCase()) : true);
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-4 sm:space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                  className: "text-2xl sm:text-3xl font-bold text-foreground",
                  children: "Lead Management"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1",
                  children: "Track and follow up with your inquiries"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex gap-2 w-full sm:w-auto",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: () => setShowZapierModal(true),
                  variant: "outline",
                  className: "flex-1 sm:flex-none min-h-[44px] active:scale-95 transition-all",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Zap, {
                    className: "h-4 w-4 mr-2 text-orange-500"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "text-sm sm:text-base",
                    children: "Zapier"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: handleExportLeads,
                  variant: "outline",
                  disabled: !leads || leads.length === 0,
                  className: "flex-1 sm:flex-none min-h-[44px] active:scale-95 transition-all",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Download, {
                    className: "h-4 w-4 mr-2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "text-sm sm:text-base",
                    children: "Export CSV"
                  }), subscription?.plan_name === "free" && /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                    variant: "secondary",
                    className: "ml-2",
                    children: "Pro"
                  })]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                className: "hover:shadow-md transition-shadow",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                  className: "pt-4 sm:pt-6 pb-4 sm:pb-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-xl sm:text-2xl font-bold text-foreground",
                    children: leads?.length || 0
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-xs sm:text-sm text-muted-foreground mt-0.5",
                    children: "Total Leads"
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                className: "hover:shadow-md transition-shadow",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                  className: "pt-4 sm:pt-6 pb-4 sm:pb-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-xl sm:text-2xl font-bold text-green-600",
                    children: leads?.filter(l => l.status === "new").length || 0
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-xs sm:text-sm text-muted-foreground mt-0.5",
                    children: "New"
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                className: "hover:shadow-md transition-shadow",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                  className: "pt-4 sm:pt-6 pb-4 sm:pb-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-xl sm:text-2xl font-bold text-blue-600",
                    children: leads?.filter(l => l.status === "contacted").length || 0
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-xs sm:text-sm text-muted-foreground mt-0.5",
                    children: "Contacted"
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                className: "hover:shadow-md transition-shadow",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                  className: "pt-4 sm:pt-6 pb-4 sm:pb-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-xl sm:text-2xl font-bold text-primary",
                    children: leads?.filter(l => l.status === "converted").length || 0
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-xs sm:text-sm text-muted-foreground mt-0.5",
                    children: "Converted"
                  })]
                })
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Search, {
                className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("input", {
                type: "text",
                placeholder: "Search leads by name or email...",
                value: searchQuery,
                onChange: e => setSearchQuery(e.target.value),
                className: "w-full pl-10 pr-4 py-2.5 sm:py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base min-h-[44px]"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "space-y-2 sm:space-y-3",
              children: isLoading ? /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                children: /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                  className: "p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base",
                  children: "Loading leads..."
                })
              }) : filteredLeads && filteredLeads.length > 0 ? filteredLeads.map(lead => /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                className: "hover:shadow-md active:shadow-lg transition-all",
                children: /* @__PURE__ */jsxRuntimeExports.jsx(CardContent, {
                  className: "p-4 sm:p-6",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-start gap-3 sm:gap-4 flex-1 min-w-0",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0",
                        children: getLeadTypeIcon(lead.lead_type)
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex-1 min-w-0",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "flex items-center gap-2 mb-2 flex-wrap",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                            className: "font-semibold text-sm sm:text-base text-foreground truncate",
                            children: lead.name
                          }), getStatusBadge(lead.status), /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                            variant: "outline",
                            className: "capitalize text-xs",
                            children: lead.lead_type
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "space-y-1.5 text-xs sm:text-sm text-muted-foreground",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                            className: "flex items-center gap-2 min-h-[32px]",
                            children: [/* @__PURE__ */jsxRuntimeExports.jsx(Mail, {
                              className: "h-3 w-3 flex-shrink-0"
                            }), /* @__PURE__ */jsxRuntimeExports.jsx("a", {
                              href: `mailto:${lead.email}`,
                              className: "hover:text-primary active:text-primary-dark break-all",
                              children: lead.email
                            })]
                          }), lead.phone && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                            className: "flex items-center gap-2 min-h-[32px]",
                            children: [/* @__PURE__ */jsxRuntimeExports.jsx(Phone, {
                              className: "h-3 w-3 flex-shrink-0"
                            }), /* @__PURE__ */jsxRuntimeExports.jsx("a", {
                              href: `tel:${lead.phone}`,
                              className: "hover:text-primary active:text-primary-dark",
                              children: lead.phone
                            })]
                          }), lead.message && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                            className: "mt-2 text-foreground line-clamp-2 text-xs sm:text-sm leading-relaxed",
                            children: lead.message
                          })]
                        })]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-left sm:text-right flex-shrink-0 pl-12 sm:pl-0",
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex sm:justify-end items-center gap-1 text-xs text-muted-foreground",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Calendar, {
                          className: "h-3 w-3"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          children: new Date(lead.created_at).toLocaleDateString()
                        })]
                      })
                    })]
                  })
                })
              }, lead.id)) : /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
                children: /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                  className: "p-8 sm:p-12 text-center",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-accent rounded-full mb-3 sm:mb-4",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(MessageSquare, {
                      className: "h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground"
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                    className: "text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2",
                    children: "No leads yet"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm sm:text-base text-muted-foreground max-w-sm mx-auto",
                    children: "Leads will appear here when visitors contact you through your profile"
                  })]
                })
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsx(UpgradeModal, {
              open: showUpgradeModal,
              onOpenChange: setShowUpgradeModal,
              feature: "lead_export",
              currentPlan: subscription?.plan_name || "Free",
              requiredPlan: "Starter"
            }), /* @__PURE__ */jsxRuntimeExports.jsx(ZapierIntegrationModal, {
              open: showZapierModal,
              onOpenChange: setShowZapierModal
            })]
          });
        }
      }
    };
  });
})();
