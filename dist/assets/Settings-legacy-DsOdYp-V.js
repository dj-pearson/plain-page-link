;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './state-stores-legacy-80VekGrm.js', './data-legacy-BmYdDdMQ.js', './supabase-legacy-CQONYrP8.js', './index-legacy-CvrXsObU.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js', './utils-legacy-B2316hnE.js', './charts-legacy-D2SqRQVB.js', './three-addons-legacy-COT_Kqtz.js', './three-legacy-VFAp7wzH.js', './forms-legacy-BImVIBp0.js'], function (exports, module) {
    'use strict';

    var reactExports, jsxRuntimeExports, useNavigate, useAuthStore, useQueryClient, useQuery, useMutation, supabase, useUsernameCheck, useToast, Label, Input, Alert, AlertDescription, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Avatar, AvatarImage, AvatarFallback, Textarea, LoaderCircle, Check, X, ExternalLink, Copy, Share2, Globe, CircleCheck, Plus, Save, User, Lock, Bell, Eye, CreditCard, Shield, ue;
    return {
      setters: [module => {
        reactExports = module.r;
        jsxRuntimeExports = module.j;
        useNavigate = module.g;
      }, module => {
        useAuthStore = module.u;
      }, module => {
        useQueryClient = module.b;
        useQuery = module.u;
        useMutation = module.c;
      }, module => {
        supabase = module.s;
      }, module => {
        useUsernameCheck = module.b;
        useToast = module.u;
      }, module => {
        Label = module.L;
        Input = module.I;
        Alert = module.Q;
        AlertDescription = module.R;
        Card = module.C;
        CardHeader = module.f;
        CardTitle = module.g;
        CardDescription = module.h;
        CardContent = module.o;
        Button = module.j;
        Badge = module.B;
        Avatar = module.A;
        AvatarImage = module.p;
        AvatarFallback = module.q;
        Textarea = module.T;
      }, module => {
        LoaderCircle = module.L;
        Check = module.b;
        X = module.X;
        ExternalLink = module.h;
        Copy = module.ae;
        Share2 = module.u;
        Globe = module.G;
        CircleCheck = module.n;
        Plus = module.aw;
        Save = module.aE;
        User = module.a0;
        Lock = module.a3;
        Bell = module.aN;
        Eye = module.E;
        CreditCard = module.aO;
        Shield = module.ao;
      }, module => {
        ue = module.u;
      }, null, null, null, null],
      execute: function () {
        exports("default", Settings);
        function useSettings() {
          const {
            user
          } = useAuthStore();
          const queryClient = useQueryClient();
          const {
            data: settings,
            isLoading
          } = useQuery({
            queryKey: ["settings", user?.id],
            queryFn: async () => {
              if (!user?.id) return null;
              const {
                data,
                error
              } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
              if (error && error.code !== "PGRST116") throw error;
              if (!data) {
                const {
                  data: newSettings,
                  error: insertError
                } = await supabase.from("user_settings").insert({
                  user_id: user.id,
                  email_leads: true,
                  sms_leads: false,
                  weekly_report: true,
                  marketing_emails: false,
                  show_listings: true,
                  show_sold_properties: true,
                  show_testimonials: true,
                  show_social_proof: true,
                  show_contact_buttons: true
                }).select().single();
                if (insertError) throw insertError;
                return newSettings;
              }
              return data;
            },
            enabled: !!user?.id
          });
          const updateSettings = useMutation({
            mutationFn: async updates => {
              if (!user?.id) throw new Error("User not authenticated");
              const {
                data,
                error
              } = await supabase.from("user_settings").update(updates).eq("user_id", user.id).select().single();
              if (error) throw error;
              return data;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["settings", user?.id]
              });
            }
          });
          return {
            settings,
            isLoading,
            updateSettings
          };
        }
        const UsernameInput = ({
          value,
          onChange,
          currentUsername
        }) => {
          const {
            checkUsername,
            isChecking,
            error,
            isAvailable
          } = useUsernameCheck();
          const [touched, setTouched] = reactExports.useState(false);
          reactExports.useEffect(() => {
            if (value && value !== currentUsername) {
              checkUsername(value);
              setTouched(true);
            }
          }, [value, currentUsername, checkUsername]);
          const showSuccess = touched && isAvailable && !error && !isChecking && value !== currentUsername;
          const showError = touched && (error || isAvailable === false) && !isChecking;
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
              htmlFor: "username",
              children: "Username"
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                id: "username",
                value,
                onChange: e => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")),
                placeholder: "Enter username",
                className: `pr-10 ${showSuccess ? "border-green-500" : showError ? "border-red-500" : ""}`
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "absolute right-3 top-1/2 -translate-y-1/2",
                children: [isChecking && /* @__PURE__ */jsxRuntimeExports.jsx(LoaderCircle, {
                  className: "h-4 w-4 animate-spin text-muted-foreground"
                }), showSuccess && /* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                  className: "h-4 w-4 text-green-500"
                }), showError && /* @__PURE__ */jsxRuntimeExports.jsx(X, {
                  className: "h-4 w-4 text-red-500"
                })]
              })]
            }), showError && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-sm text-red-500",
              children: error
            }), showSuccess && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-sm text-green-500",
              children: "Username is available!"
            }), /* @__PURE__ */jsxRuntimeExports.jsx(Alert, {
              children: /* @__PURE__ */jsxRuntimeExports.jsxs(AlertDescription, {
                className: "text-sm",
                children: ["Your profile will be accessible at: ", /* @__PURE__ */jsxRuntimeExports.jsxs("strong", {
                  children: ["agentbio.net/", value || "username"]
                })]
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-xs text-muted-foreground space-y-1",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                children: "Username requirements:"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("ul", {
                className: "list-disc list-inside ml-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("li", {
                  children: "3-30 characters"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                  children: "Letters, numbers, hyphens, and underscores only"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                  children: "No profanity or reserved words"
                })]
              })]
            })]
          });
        };
        function ProfileURLCard({
          username
        }) {
          const [copied, setCopied] = reactExports.useState(false);
          const {
            toast
          } = useToast();
          const profileURL = `${window.location.origin}/${username}`;
          const copyToClipboard = async () => {
            try {
              await navigator.clipboard.writeText(profileURL);
              setCopied(true);
              toast({
                title: "Copied!",
                description: "Profile URL copied to clipboard"
              });
              setTimeout(() => setCopied(false), 2e3);
            } catch (err) {
              toast({
                title: "Failed to copy",
                description: "Please copy the URL manually",
                variant: "destructive"
              });
            }
          };
          const shareProfile = async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: "My Real Estate Profile",
                  text: "Check out my professional real estate profile",
                  url: profileURL
                });
              } catch (err) {
                console.log("Share cancelled or failed");
              }
            } else {
              copyToClipboard();
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
            className: "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardTitle, {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                  className: "h-5 w-5 text-blue-600"
                }), "Your Public Profile"]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                children: "Share this link to showcase your properties and capture leads"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
              className: "space-y-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("code", {
                  className: "flex-1 text-sm text-blue-600 font-mono truncate",
                  children: profileURL
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  onClick: copyToClipboard,
                  variant: "outline",
                  className: "flex-1",
                  children: copied ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                      className: "h-4 w-4 mr-2"
                    }), "Copied!"]
                  }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                      className: "h-4 w-4 mr-2"
                    }), "Copy Link"]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: shareProfile,
                  variant: "outline",
                  className: "flex-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Share2, {
                    className: "h-4 w-4 mr-2"
                  }), "Share"]
                }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  asChild: true,
                  variant: "default",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("a", {
                    href: `/${username}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                      className: "h-4 w-4 mr-2"
                    }), "View"]
                  })
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "text-xs text-muted-foreground",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                  className: "mb-2",
                  children: ["💡 ", /* @__PURE__ */jsxRuntimeExports.jsx("strong", {
                    children: "Pro tip:"
                  }), " Share this link on:"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("ul", {
                  className: "list-disc list-inside ml-2 space-y-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("li", {
                    children: "Your email signature"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                    children: "Business cards and flyers"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                    children: "Social media profiles"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                    children: "MLS listings and property descriptions"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                    children: "Text messages to potential clients"
                  })]
                })]
              })]
            })]
          });
        }
        function ProfileDisplaySettings() {
          const navigate = useNavigate();
          const {
            user
          } = useAuthStore();
          const [activePage, setActivePage] = reactExports.useState(null);
          const [loading, setLoading] = reactExports.useState(true);
          reactExports.useEffect(() => {
            loadActivePage();
          }, [user]);
          const loadActivePage = async () => {
            if (!user) return;
            try {
              const {
                data,
                error
              } = await supabase.from("custom_pages").select("*").eq("user_id", user.id).eq("is_active", true).single();
              if (!error && data) {
                setActivePage(data);
              }
            } catch (error) {
              console.error("Error loading active page:", error);
            } finally {
              setLoading(false);
            }
          };
          const handleDeactivate = async () => {
            if (!activePage) return;
            try {
              const {
                error
              } = await supabase.from("custom_pages").update({
                is_active: false
              }).eq("id", activePage.id);
              if (error) throw error;
              ue.success("Switched to default profile");
              setActivePage(null);
            } catch (error) {
              console.error("Error deactivating page:", error);
              ue.error("Failed to deactivate custom page");
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
            className: "p-6",
            children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                  className: "text-lg font-semibold mb-1",
                  children: "Profile Display"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Choose what visitors see when they visit your profile"
                })]
              }), loading ? /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm text-muted-foreground",
                children: "Loading..."
              }) : activePage ? /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between p-4 border rounded-lg bg-muted/50",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex-1",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-2 mb-1",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Globe, {
                        className: "h-4 w-4 text-primary"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "font-medium",
                        children: activePage.title
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs(Badge, {
                        variant: "default",
                        className: "gap-1",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheck, {
                          className: "h-3 w-3"
                        }), "Active"]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                      className: "text-sm text-muted-foreground",
                      children: ["Custom page: /", activePage.slug]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: "outline",
                    size: "sm",
                    asChild: true,
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("a", {
                      href: `/p/${activePage.slug}`,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "gap-2",
                      children: ["View", /* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                        className: "h-3 w-3"
                      })]
                    })
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: "outline",
                    onClick: () => navigate("/dashboard/page-builder"),
                    className: "gap-2",
                    children: "Edit Custom Page"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: "outline",
                    onClick: handleDeactivate,
                    children: "Use Default Profile"
                  })]
                })]
              }) : /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "p-4 border rounded-lg",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2 mb-1",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheck, {
                      className: "h-4 w-4 text-primary"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "font-medium",
                      children: "Default Profile"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                      variant: "secondary",
                      children: "Active"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-muted-foreground",
                    children: "Using the standard profile layout with listings, testimonials, and links"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: () => navigate("/dashboard/page-builder"),
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Plus, {
                    className: "h-4 w-4"
                  }), "Create Custom Page"]
                })]
              })]
            })
          });
        }
        function Settings() {
          const {
            user
          } = useAuthStore();
          const {
            settings,
            updateSettings
          } = useSettings();
          const {
            toast
          } = useToast();
          const queryClient = useQueryClient();
          const [notifications, setNotifications] = reactExports.useState({
            emailLeads: true,
            smsLeads: false,
            weeklyReport: true,
            marketingEmails: false
          });
          const [profileVisibility, setProfileVisibility] = reactExports.useState({
            showListings: true,
            showSoldProperties: true,
            showTestimonials: true,
            showSocialProof: true,
            showContactButtons: true
          });
          const [password, setPassword] = reactExports.useState({
            current: "",
            new: "",
            confirm: ""
          });
          const {
            data: profile,
            isLoading: profileLoading
          } = useQuery({
            queryKey: ["profile", user?.id],
            queryFn: async () => {
              if (!user?.id) return null;
              const {
                data,
                error
              } = await supabase.from("profiles").select("*").eq("id", user.id).single();
              if (error) throw error;
              return data;
            },
            enabled: !!user?.id
          });
          const [formData, setFormData] = reactExports.useState({
            username: "",
            full_name: "",
            bio: ""
          });
          reactExports.useEffect(() => {
            if (profile) {
              setFormData({
                username: profile.username || "",
                full_name: profile.full_name || "",
                bio: profile.bio || ""
              });
            }
          }, [profile]);
          const updateProfileMutation = useMutation({
            mutationFn: async data => {
              if (!user?.id) throw new Error("Not authenticated");
              const {
                error
              } = await supabase.from("profiles").update({
                username: data.username,
                full_name: data.full_name,
                bio: data.bio,
                updated_at: (/* @__PURE__ */new Date()).toISOString()
              }).eq("id", user.id);
              if (error) throw error;
            },
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["profile"]
              });
              toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully."
              });
            },
            onError: error => {
              toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive"
              });
            }
          });
          reactExports.useEffect(() => {
            if (settings) {
              setNotifications({
                emailLeads: settings.email_leads,
                smsLeads: settings.sms_leads,
                weeklyReport: settings.weekly_report,
                marketingEmails: settings.marketing_emails
              });
              setProfileVisibility({
                showListings: settings.show_listings,
                showSoldProperties: settings.show_sold_properties,
                showTestimonials: settings.show_testimonials,
                showSocialProof: settings.show_social_proof,
                showContactButtons: settings.show_contact_buttons
              });
            }
          }, [settings]);
          const handleNotificationChange = async (key, value) => {
            setNotifications(prev => ({
              ...prev,
              [key]: value
            }));
            const dbKey = key === "emailLeads" ? "email_leads" : key === "smsLeads" ? "sms_leads" : key === "weeklyReport" ? "weekly_report" : "marketing_emails";
            try {
              await updateSettings.mutateAsync({
                [dbKey]: value
              });
              toast({
                title: "Settings updated",
                description: "Your notification preferences have been saved."
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update settings.",
                variant: "destructive"
              });
            }
          };
          const handleProfileVisibilityChange = async (key, value) => {
            setProfileVisibility(prev => ({
              ...prev,
              [key]: value
            }));
            const dbKey = key === "showListings" ? "show_listings" : key === "showSoldProperties" ? "show_sold_properties" : key === "showTestimonials" ? "show_testimonials" : key === "showSocialProof" ? "show_social_proof" : "show_contact_buttons";
            try {
              await updateSettings.mutateAsync({
                [dbKey]: value
              });
              toast({
                title: "Profile visibility updated",
                description: "Your profile display preferences have been saved."
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update visibility settings.",
                variant: "destructive"
              });
            }
          };
          const handlePasswordChange = async e => {
            e.preventDefault();
            if (password.new !== password.confirm) {
              toast({
                title: "Error",
                description: "New passwords don't match.",
                variant: "destructive"
              });
              return;
            }
            if (password.new.length < 6) {
              toast({
                title: "Error",
                description: "Password must be at least 6 characters.",
                variant: "destructive"
              });
              return;
            }
            try {
              const {
                error
              } = await supabase.auth.updateUser({
                password: password.new
              });
              if (error) throw error;
              toast({
                title: "Password updated",
                description: "Your password has been changed successfully."
              });
              setPassword({
                current: "",
                new: "",
                confirm: ""
              });
            } catch (error) {
              toast({
                title: "Error",
                description: error.message || "Failed to update password.",
                variant: "destructive"
              });
            }
          };
          const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
          }) : "Unknown";
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                className: "text-3xl font-bold text-foreground",
                children: "Account Settings"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-muted-foreground mt-1",
                children: "Manage your account and preferences"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                  children: "Profile & Username"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                  children: "Manage your public profile and unique URL"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                className: "space-y-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "flex items-center gap-6",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs(Avatar, {
                    className: "w-20 h-20",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(AvatarImage, {
                      src: profile?.avatar_url || void 0
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(AvatarFallback, {
                      className: "text-xl",
                      children: profile?.full_name?.[0] || profile?.username?.[0] || "U"
                    })]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx(UsernameInput, {
                  value: formData.username,
                  onChange: value => setFormData({
                    ...formData,
                    username: value
                  }),
                  currentUsername: profile?.username
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "full_name",
                    children: "Full Name"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "full_name",
                    value: formData.full_name,
                    onChange: e => setFormData({
                      ...formData,
                      full_name: e.target.value
                    }),
                    placeholder: "Enter your full name"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "bio",
                    children: "Bio"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Textarea, {
                    id: "bio",
                    value: formData.bio,
                    onChange: e => setFormData({
                      ...formData,
                      bio: e.target.value
                    }),
                    placeholder: "Tell us about yourself",
                    rows: 4,
                    maxLength: 500
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-xs text-muted-foreground",
                    children: [formData.bio?.length || 0, "/500 characters"]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                  onClick: () => updateProfileMutation.mutate(formData),
                  disabled: updateProfileMutation.isPending,
                  className: "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Save, {
                    className: "h-4 w-4"
                  }), updateProfileMutation.isPending ? "Saving..." : "Save Profile Changes"]
                })]
              })]
            }), profile?.username && /* @__PURE__ */jsxRuntimeExports.jsx(ProfileURLCard, {
              username: profile.username
            }), /* @__PURE__ */jsxRuntimeExports.jsx(ProfileDisplaySettings, {}), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-card border border-border rounded-lg p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(User, {
                  className: "h-5 w-5 text-primary"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "text-lg font-semibold text-foreground",
                  children: "Account Information"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Email Address"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: user?.email || "Not available"
                    })]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "User ID"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground font-mono text-xs",
                      children: user?.id || "Not available"
                    })]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "flex items-center justify-between py-3",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Member Since"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: memberSince
                    })]
                  })
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("form", {
              onSubmit: handlePasswordChange,
              className: "bg-card border border-border rounded-lg p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Lock, {
                  className: "h-5 w-5 text-primary"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "text-lg font-semibold text-foreground",
                  children: "Change Password"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("label", {
                    className: "block text-sm font-medium text-foreground mb-2",
                    children: "New Password"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("input", {
                    type: "password",
                    value: password.new,
                    onChange: e => setPassword({
                      ...password,
                      new: e.target.value
                    }),
                    className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
                    required: true,
                    minLength: 6
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("label", {
                    className: "block text-sm font-medium text-foreground mb-2",
                    children: "Confirm New Password"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("input", {
                    type: "password",
                    value: password.confirm,
                    onChange: e => setPassword({
                      ...password,
                      confirm: e.target.value
                    }),
                    className: "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
                    required: true,
                    minLength: 6
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                  type: "submit",
                  className: "inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Save, {
                    className: "h-4 w-4"
                  }), "Update Password"]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-card border border-border rounded-lg p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Bell, {
                  className: "h-5 w-5 text-primary"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "text-lg font-semibold text-foreground",
                  children: "Notification Preferences"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Email Notifications for New Leads"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Get notified immediately when someone submits a lead form"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("label", {
                    className: "relative inline-flex items-center cursor-pointer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "checkbox",
                      checked: notifications.emailLeads,
                      onChange: e => handleNotificationChange("emailLeads", e.target.checked),
                      className: "sr-only peer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "SMS Notifications"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Receive text messages for urgent leads"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("label", {
                    className: "relative inline-flex items-center cursor-pointer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "checkbox",
                      checked: notifications.smsLeads,
                      onChange: e => handleNotificationChange("smsLeads", e.target.checked),
                      className: "sr-only peer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Weekly Performance Report"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Get a summary of your profile analytics every Monday"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("label", {
                    className: "relative inline-flex items-center cursor-pointer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "checkbox",
                      checked: notifications.weeklyReport,
                      onChange: e => handleNotificationChange("weeklyReport", e.target.checked),
                      className: "sr-only peer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Marketing Emails"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Tips, updates, and special offers from AgentBio.net"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("label", {
                    className: "relative inline-flex items-center cursor-pointer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "checkbox",
                      checked: notifications.marketingEmails,
                      onChange: e => handleNotificationChange("marketingEmails", e.target.checked),
                      className: "sr-only peer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                    })]
                  })]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-card border border-border rounded-lg p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Eye, {
                  className: "h-5 w-5 text-primary"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "text-lg font-semibold text-foreground",
                  children: "Profile Visibility"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm text-muted-foreground mb-4",
                children: "Control which sections appear on your public profile page"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Show Contact Buttons"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Display email, phone, and text buttons"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("label", {
                    className: "relative inline-flex items-center cursor-pointer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "checkbox",
                      checked: profileVisibility.showContactButtons,
                      onChange: e => handleProfileVisibilityChange("showContactButtons", e.target.checked),
                      className: "sr-only peer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Show Social Proof Banner"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Display stats like properties sold and total volume"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("label", {
                    className: "relative inline-flex items-center cursor-pointer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "checkbox",
                      checked: profileVisibility.showSocialProof,
                      onChange: e => handleProfileVisibilityChange("showSocialProof", e.target.checked),
                      className: "sr-only peer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Show Active Listings"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Display your currently available properties"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("label", {
                    className: "relative inline-flex items-center cursor-pointer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "checkbox",
                      checked: profileVisibility.showListings,
                      onChange: e => handleProfileVisibilityChange("showListings", e.target.checked),
                      className: "sr-only peer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Show Sold Properties"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Display your past sales and success history"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("label", {
                    className: "relative inline-flex items-center cursor-pointer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "checkbox",
                      checked: profileVisibility.showSoldProperties,
                      onChange: e => handleProfileVisibilityChange("showSoldProperties", e.target.checked),
                      className: "sr-only peer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Show Testimonials"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Display client reviews and ratings"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("label", {
                    className: "relative inline-flex items-center cursor-pointer",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "checkbox",
                      checked: profileVisibility.showTestimonials,
                      onChange: e => handleProfileVisibilityChange("showTestimonials", e.target.checked),
                      className: "sr-only peer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                    })]
                  })]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-card border border-border rounded-lg p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(CreditCard, {
                  className: "h-5 w-5 text-primary"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "text-lg font-semibold text-foreground",
                  children: "Billing & Subscription"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Current Plan"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "Professional - $49/month"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                    className: "px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium",
                    children: "Manage Plan"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3 border-b border-border",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Payment Method"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "•••• •••• •••• 4242"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                    className: "px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium",
                    children: "Update"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between py-3",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-medium text-foreground",
                      children: "Next Billing Date"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-sm text-muted-foreground",
                      children: "February 15, 2024"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                    className: "px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium",
                    children: "View Invoices"
                  })]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Shield, {
                  className: "h-5 w-5 text-red-600"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "text-lg font-semibold text-red-600",
                  children: "Danger Zone"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-3",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-red-800 dark:text-red-200",
                  children: "Once you delete your account, there is no going back. Please be certain."
                }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                  className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium",
                  children: "Delete Account"
                })]
              })]
            })]
          });
        }
      }
    };
  });
})();
