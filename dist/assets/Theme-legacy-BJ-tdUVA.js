;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js', './index-legacy-CvrXsObU.js', './supabase-legacy-CQONYrP8.js', './state-stores-legacy-80VekGrm.js', './UpgradeModal-legacy-1fJMHoGX.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js', './data-legacy-BmYdDdMQ.js', './three-addons-legacy-COT_Kqtz.js', './three-legacy-VFAp7wzH.js', './forms-legacy-BImVIBp0.js'], function (exports, module) {
    'use strict';

    var jsxRuntimeExports, reactExports, Card, cn, CardContent, Badge, Button, Label, Popover, PopoverTrigger, PopoverContent, Input, getCurrentTheme, DEFAULT_THEMES, applyTheme, LoadingSpinner, Tabs, TabsList, TabsTrigger, TabsContent, CardHeader, CardTitle, CardDescription, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Check, Eye, RotateCcw, Save, Palette, Monitor, Smartphone, useToast, supabase, useAuthStore, useSubscriptionLimits, UpgradeModal;
    return {
      setters: [module => {
        jsxRuntimeExports = module.j;
        reactExports = module.r;
      }, module => {
        Card = module.C;
        cn = module.c;
        CardContent = module.o;
        Badge = module.B;
        Button = module.j;
        Label = module.L;
        Popover = module.U;
        PopoverTrigger = module.V;
        PopoverContent = module.W;
        Input = module.I;
        getCurrentTheme = module.X;
        DEFAULT_THEMES = module.Y;
        applyTheme = module.s;
        LoadingSpinner = module.t;
        Tabs = module.J;
        TabsList = module.K;
        TabsTrigger = module.M;
        TabsContent = module.N;
        CardHeader = module.f;
        CardTitle = module.g;
        CardDescription = module.h;
        Select = module.S;
        SelectTrigger = module.a;
        SelectValue = module.b;
        SelectContent = module.d;
        SelectItem = module.e;
      }, module => {
        Check = module.b;
        Eye = module.E;
        RotateCcw = module.aG;
        Save = module.aE;
        Palette = module.am;
        Monitor = module.aH;
        Smartphone = module.aI;
      }, module => {
        useToast = module.u;
      }, module => {
        supabase = module.s;
      }, module => {
        useAuthStore = module.u;
      }, module => {
        useSubscriptionLimits = module.u;
        UpgradeModal = module.U;
      }, null, null, null, null, null, null],
      execute: function () {
        exports("default", Theme);
        function ThemeCard({
          theme,
          isSelected,
          onSelect,
          onPreview
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
            className: cn("relative cursor-pointer transition-all hover:shadow-lg", isSelected && "ring-2 ring-primary"),
            onClick: () => onSelect(theme),
            children: [isSelected && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center",
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                className: "w-4 h-4 text-white"
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
              className: "p-0",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "h-32 p-4 rounded-t-lg relative overflow-hidden",
                style: {
                  backgroundColor: theme.colors.background
                },
                children: [theme.has3D && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 animate-pulse"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-start gap-2 mb-3 relative z-10",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-16 h-16 rounded-full",
                    style: {
                      backgroundColor: theme.colors.primary
                    }
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex-1 space-y-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "h-3 rounded",
                      style: {
                        backgroundColor: theme.colors.foreground,
                        opacity: 0.8,
                        width: "70%"
                      }
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "h-2 rounded",
                      style: {
                        backgroundColor: theme.colors.muted,
                        width: "90%"
                      }
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex gap-2 relative z-10",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-8 h-8 rounded",
                    style: {
                      backgroundColor: theme.colors.primary
                    },
                    title: "Primary"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-8 h-8 rounded",
                    style: {
                      backgroundColor: theme.colors.secondary
                    },
                    title: "Secondary"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-8 h-8 rounded",
                    style: {
                      backgroundColor: theme.colors.accent
                    },
                    title: "Accent"
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "p-4 space-y-3",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-start justify-between gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex-1 min-w-0",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                      className: "font-semibold truncate",
                      children: theme.name
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-xs text-muted-foreground mt-1 line-clamp-2",
                      children: theme.description
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex flex-col gap-1",
                    children: [theme.isPremium && /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                      variant: "secondary",
                      className: "text-xs",
                      children: "Pro"
                    }), theme.has3D && /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                      variant: "outline",
                      className: "text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
                      children: "3D"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "text-xs text-muted-foreground",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "font-medium",
                    children: "Fonts:"
                  }), " ", theme.fonts.heading, theme.fonts.heading !== theme.fonts.body && ` / ${theme.fonts.body}`]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: isSelected ? "default" : "outline",
                    size: "sm",
                    className: "flex-1",
                    onClick: e => {
                      e.stopPropagation();
                      onSelect(theme);
                    },
                    children: isSelected ? "Selected" : "Apply"
                  }), onPreview && /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: "ghost",
                    size: "sm",
                    onClick: e => {
                      e.stopPropagation();
                      onPreview(theme);
                    },
                    children: "Preview"
                  })]
                })]
              })]
            })]
          });
        }
        const PRESET_COLORS = ["#3B82F6",
        // Blue
        "#10B981",
        // Green
        "#F59E0B",
        // Amber
        "#EF4444",
        // Red
        "#8B5CF6",
        // Purple
        "#EC4899",
        // Pink
        "#06B6D4",
        // Cyan
        "#F97316",
        // Orange
        "#1F2937",
        // Gray Dark
        "#6B7280"
        // Gray
        ];
        function ColorPicker({
          label,
          value,
          onChange,
          description
        }) {
          const [isOpen, setIsOpen] = reactExports.useState(false);
          const handleColorChange = newColor => {
            onChange(newColor);
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
              htmlFor: label,
              children: label
            }), description && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-xs text-muted-foreground",
              children: description
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex gap-2",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Popover, {
                open: isOpen,
                onOpenChange: setIsOpen,
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(PopoverTrigger, {
                  asChild: true,
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: "outline",
                    className: "w-12 h-10 p-0 border-2",
                    style: {
                      backgroundColor: value
                    },
                    "aria-label": `Pick ${label}`
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx(PopoverContent, {
                  className: "w-64 p-4",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "space-y-4",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm font-medium mb-2",
                        children: "Preset Colors"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "grid grid-cols-5 gap-2",
                        children: PRESET_COLORS.map(color => /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                          className: "w-10 h-10 rounded border-2 hover:scale-110 transition-transform",
                          style: {
                            backgroundColor: color
                          },
                          onClick: () => {
                            handleColorChange(color);
                            setIsOpen(false);
                          },
                          "aria-label": `Select ${color}`
                        }, color))
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm font-medium mb-2",
                        children: "Custom Color"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex gap-2",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                          type: "color",
                          value,
                          onChange: e => handleColorChange(e.target.value),
                          className: "w-12 h-10 rounded border cursor-pointer"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                          type: "text",
                          value,
                          onChange: e => handleColorChange(e.target.value),
                          placeholder: "#000000",
                          className: "flex-1 font-mono text-sm"
                        })]
                      })]
                    })]
                  })
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                type: "text",
                value,
                onChange: e => handleColorChange(e.target.value),
                placeholder: "#000000",
                className: "flex-1 font-mono"
              })]
            })]
          });
        }
        const AVAILABLE_FONTS = ["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Playfair Display", "Merriweather", "Bebas Neue", "Source Sans Pro"];
        function Theme() {
          const {
            toast
          } = useToast();
          const {
            user
          } = useAuthStore();
          const [selectedTheme, setSelectedTheme] = reactExports.useState(getCurrentTheme());
          const [customColors, setCustomColors] = reactExports.useState(selectedTheme.colors);
          const [customFonts, setCustomFonts] = reactExports.useState(selectedTheme.fonts);
          const [isCustomizing, setIsCustomizing] = reactExports.useState(false);
          const [isSaving, setIsSaving] = reactExports.useState(false);
          const [showUpgradeModal, setShowUpgradeModal] = reactExports.useState(false);
          const [previewMode, setPreviewMode] = reactExports.useState("desktop");
          const {
            subscription
          } = useSubscriptionLimits();
          reactExports.useEffect(() => {
            loadSavedTheme();
          }, [user]);
          const loadSavedTheme = async () => {
            if (!user) return;
            try {
              const {
                data,
                error
              } = await supabase.from("profiles").select("theme").eq("id", user.id).single();
              if (error) throw error;
              if (data?.theme) {
                let savedTheme;
                if (typeof data.theme === "string") {
                  if (data.theme.startsWith("{")) {
                    savedTheme = JSON.parse(data.theme);
                  } else {
                    const matchingTheme = DEFAULT_THEMES.find(t => t.id === data.theme);
                    savedTheme = matchingTheme || DEFAULT_THEMES[0];
                  }
                } else {
                  savedTheme = data.theme;
                }
                setSelectedTheme(savedTheme);
                setCustomColors(savedTheme.colors);
                setCustomFonts(savedTheme.fonts);
                applyTheme(savedTheme);
              }
            } catch (error) {
              console.error("Failed to load saved theme:", error);
              const defaultTheme = DEFAULT_THEMES[0];
              setSelectedTheme(defaultTheme);
              setCustomColors(defaultTheme.colors);
              setCustomFonts(defaultTheme.fonts);
            }
          };
          const handleThemeSelect = async theme => {
            if (theme.isPremium && subscription?.plan_name === "free") {
              setShowUpgradeModal(true);
              return;
            }
            setSelectedTheme(theme);
            setCustomColors(theme.colors);
            setCustomFonts(theme.fonts);
            setIsCustomizing(false);
            applyTheme(theme);
          };
          const handleSaveTheme = async () => {
            if (!user) {
              toast({
                title: "Error",
                description: "You must be logged in to save themes",
                variant: "destructive"
              });
              return;
            }
            setIsSaving(true);
            try {
              const themeToApply = {
                ...selectedTheme,
                colors: customColors,
                fonts: customFonts
              };
              const {
                error
              } = await supabase.from("profiles").update({
                theme: JSON.stringify(themeToApply)
              }).eq("id", user.id);
              if (error) throw error;
              applyTheme(themeToApply);
              toast({
                title: "Theme saved!",
                description: "Your profile theme has been updated successfully."
              });
              setIsCustomizing(false);
            } catch (error) {
              console.error("Failed to save theme:", error);
              toast({
                title: "Error",
                description: "Failed to save theme. Please try again.",
                variant: "destructive"
              });
            } finally {
              setIsSaving(false);
            }
          };
          const handlePreviewTheme = async () => {
            if (!user) {
              toast({
                title: "Error",
                description: "You must be logged in to preview",
                variant: "destructive"
              });
              return;
            }
            try {
              const {
                data,
                error
              } = await supabase.from("profiles").select("username").eq("id", user.id).single();
              if (error) throw error;
              if (data?.username) {
                window.open(`/${data.username}`, "_blank");
              }
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to open preview",
                variant: "destructive"
              });
            }
          };
          const handleResetToDefault = () => {
            setCustomColors(selectedTheme.colors);
            setCustomFonts(selectedTheme.fonts);
            setIsCustomizing(false);
            toast({
              title: "Reset to default",
              description: "Theme has been reset to its default settings."
            });
          };
          const handleColorChange = (key, value) => {
            setCustomColors(prev => ({
              ...prev,
              [key]: value
            }));
            setIsCustomizing(true);
          };
          const handleFontChange = (key, value) => {
            setCustomFonts(prev => ({
              ...prev,
              [key]: value
            }));
            setIsCustomizing(true);
          };
          const freeThemes = DEFAULT_THEMES.filter(t => !t.isPremium);
          const premiumThemes = DEFAULT_THEMES.filter(t => t.isPremium);
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-4 sm:space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                  className: "text-2xl sm:text-3xl font-bold",
                  children: "Theme Customization"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1",
                  children: "Customize your profile's look and feel"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex gap-2 flex-wrap",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  variant: "outline",
                  size: "sm",
                  onClick: handlePreviewTheme,
                  title: "Open your public profile in a new tab to see your theme",
                  className: "flex-1 sm:flex-none",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Eye, {
                    className: "w-4 h-4 sm:mr-2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "hidden sm:inline",
                    children: "Preview Live"
                  })]
                }), isCustomizing && /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  variant: "outline",
                  size: "sm",
                  onClick: handleResetToDefault,
                  className: "flex-1 sm:flex-none",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(RotateCcw, {
                    className: "w-4 h-4 sm:mr-2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "hidden sm:inline",
                    children: "Reset"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  size: "sm",
                  onClick: handleSaveTheme,
                  disabled: isSaving,
                  className: "flex-1 sm:flex-none",
                  children: [isSaving ? /* @__PURE__ */jsxRuntimeExports.jsx(LoadingSpinner, {
                    size: "sm",
                    className: "mr-2"
                  }) : /* @__PURE__ */jsxRuntimeExports.jsx(Save, {
                    className: "w-4 h-4 mr-2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "text-xs sm:text-sm",
                    children: "Save Theme"
                  })]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 sm:p-4",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-start gap-2 sm:gap-3",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-xl sm:text-2xl flex-shrink-0",
                  children: "✨"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1",
                    children: "How to see your theme changes:"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("ol", {
                    className: "text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-0.5 sm:space-y-1 list-decimal list-inside",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                      children: ["Select a theme below and click ", /* @__PURE__ */jsxRuntimeExports.jsx("strong", {
                        children: '"Save Theme"'
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                      children: ["Click ", /* @__PURE__ */jsxRuntimeExports.jsx("strong", {
                        children: '"Preview Live"'
                      }), " button above to open your public profile in a new tab"]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                      children: "Premium themes with 3D effects will show animated backgrounds on your public page!"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-xs text-blue-700 dark:text-blue-300 mt-1 sm:mt-2",
                    children: ["💡 Note: Theme effects only appear on your ", /* @__PURE__ */jsxRuntimeExports.jsx("strong", {
                      children: "public profile page"
                    }), ", not in this dashboard."]
                  })]
                })]
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(Tabs, {
              defaultValue: "presets",
              className: "space-y-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsList, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "presets",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Palette, {
                    className: "w-4 h-4 mr-2"
                  }), "Theme Presets"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "customize",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Eye, {
                    className: "w-4 h-4 mr-2"
                  }), "Customize"]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsContent, {
                value: "presets",
                className: "space-y-4 sm:space-y-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                    className: "text-base sm:text-lg font-semibold mb-3 sm:mb-4",
                    children: "Free Themes"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4",
                    children: freeThemes.map(theme => /* @__PURE__ */jsxRuntimeExports.jsx(ThemeCard, {
                      theme,
                      isSelected: selectedTheme.id === theme.id,
                      onSelect: handleThemeSelect
                    }, theme.id))
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2 mb-3 sm:mb-4",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                      className: "text-base sm:text-lg font-semibold",
                      children: "Premium Themes"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                      children: "Pro"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4",
                    children: premiumThemes.map(theme => /* @__PURE__ */jsxRuntimeExports.jsx(ThemeCard, {
                      theme,
                      isSelected: selectedTheme.id === theme.id,
                      onSelect: handleThemeSelect
                    }, theme.id))
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsContent, {
                value: "customize",
                className: "space-y-4 sm:space-y-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                      className: "pb-3 sm:pb-4",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                        className: "text-base sm:text-lg",
                        children: "Colors"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                        className: "text-xs sm:text-sm",
                        children: "Customize the color scheme of your profile"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                      className: "space-y-3 sm:space-y-4",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(ColorPicker, {
                        label: "Primary Color",
                        value: customColors.primary,
                        onChange: value => handleColorChange("primary", value),
                        description: "Main brand color (buttons, links)"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(ColorPicker, {
                        label: "Secondary Color",
                        value: customColors.secondary,
                        onChange: value => handleColorChange("secondary", value),
                        description: "Secondary accent color"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(ColorPicker, {
                        label: "Accent Color",
                        value: customColors.accent,
                        onChange: value => handleColorChange("accent", value),
                        description: "Highlights and CTAs"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(ColorPicker, {
                        label: "Background Color",
                        value: customColors.background,
                        onChange: value => handleColorChange("background", value),
                        description: "Page background"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(ColorPicker, {
                        label: "Text Color",
                        value: customColors.foreground,
                        onChange: value => handleColorChange("foreground", value),
                        description: "Primary text color"
                      })]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(CardHeader, {
                      className: "pb-3 sm:pb-4",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                        className: "text-base sm:text-lg",
                        children: "Typography"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                        className: "text-xs sm:text-sm",
                        children: "Select fonts for headings and body text"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                      className: "space-y-3 sm:space-y-4",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "space-y-2",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                          htmlFor: "heading-font",
                          children: "Heading Font"
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                          value: customFonts.heading,
                          onValueChange: value => handleFontChange("heading", value),
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                            id: "heading-font",
                            children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {})
                          }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectContent, {
                            children: AVAILABLE_FONTS.map(font => /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                              value: font,
                              children: /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                                style: {
                                  fontFamily: font
                                },
                                children: font
                              })
                            }, font))
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                          className: "text-xs text-muted-foreground",
                          children: "Font used for titles and headings"
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "space-y-2",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                          htmlFor: "body-font",
                          children: "Body Font"
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                          value: customFonts.body,
                          onValueChange: value => handleFontChange("body", value),
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                            id: "body-font",
                            children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {})
                          }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectContent, {
                            children: AVAILABLE_FONTS.map(font => /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                              value: font,
                              children: /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                                style: {
                                  fontFamily: font
                                },
                                children: font
                              })
                            }, font))
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                          className: "text-xs text-muted-foreground",
                          children: "Font used for paragraphs and text"
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "mt-6 p-4 border rounded-lg space-y-2",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                          className: "text-sm font-semibold text-muted-foreground",
                          children: "Preview"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                          className: "text-2xl font-bold",
                          style: {
                            fontFamily: customFonts.heading,
                            color: customColors.primary
                          },
                          children: "Your Profile Heading"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                          className: "text-sm",
                          style: {
                            fontFamily: customFonts.body,
                            color: customColors.foreground
                          },
                          children: "This is how your body text will appear on your profile. It should be readable and professional."
                        })]
                      })]
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardHeader, {
                    className: "pb-3 sm:pb-4",
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(CardTitle, {
                          className: "text-base sm:text-lg",
                          children: "Live Preview"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx(CardDescription, {
                          className: "text-xs sm:text-sm",
                          children: "See how your theme will look on different devices"
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex gap-1 bg-muted p-1 rounded-lg",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                          variant: previewMode === "desktop" ? "default" : "ghost",
                          size: "sm",
                          onClick: () => setPreviewMode("desktop"),
                          className: "gap-1.5",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Monitor, {
                            className: "h-4 w-4"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            className: "hidden sm:inline text-xs",
                            children: "Desktop"
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                          variant: previewMode === "mobile" ? "default" : "ghost",
                          size: "sm",
                          onClick: () => setPreviewMode("mobile"),
                          className: "gap-1.5",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Smartphone, {
                            className: "h-4 w-4"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            className: "hidden sm:inline text-xs",
                            children: "Mobile"
                          })]
                        })]
                      })]
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(CardContent, {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "flex justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 sm:p-8",
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: `rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 transition-all duration-300 ${previewMode === "mobile" ? "w-full max-w-[375px]" : "w-full"}`,
                        style: {
                          backgroundColor: customColors.background,
                          boxShadow: previewMode === "mobile" ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" : "none"
                        },
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: `flex items-start ${previewMode === "mobile" ? "flex-col items-center text-center" : "gap-4"}`,
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                            className: `rounded-full ${previewMode === "mobile" ? "w-16 h-16 mb-3" : "w-20 h-20"}`,
                            style: {
                              backgroundColor: customColors.primary
                            }
                          }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                            className: "flex-1 space-y-2",
                            children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                              className: `font-bold ${previewMode === "mobile" ? "text-xl" : "text-2xl"}`,
                              style: {
                                fontFamily: customFonts.heading,
                                color: customColors.foreground
                              },
                              children: "Agent Name"
                            }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                              className: "text-sm",
                              style: {
                                fontFamily: customFonts.body,
                                color: customColors.mutedForeground
                              },
                              children: "Realtor® | Luxury Home Specialist"
                            })]
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: `flex ${previewMode === "mobile" ? "flex-col w-full" : "flex-wrap"} gap-2`,
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("button", {
                            className: `py-2 rounded-lg text-white text-xs sm:text-sm font-medium min-h-[44px] ${previewMode === "mobile" ? "w-full px-4" : "px-3 sm:px-4"}`,
                            style: {
                              backgroundColor: customColors.primary
                            },
                            children: "Primary Button"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                            className: `py-2 rounded-lg text-xs sm:text-sm font-medium min-h-[44px] ${previewMode === "mobile" ? "w-full px-4" : "px-3 sm:px-4"}`,
                            style: {
                              backgroundColor: customColors.secondary,
                              color: "white"
                            },
                            children: "Secondary Button"
                          }), previewMode === "desktop" && /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                            className: "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium min-h-[44px]",
                            style: {
                              backgroundColor: customColors.accent,
                              color: "white"
                            },
                            children: "Accent Button"
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "p-4 rounded-lg",
                          style: {
                            backgroundColor: customColors.card
                          },
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                            className: "font-semibold mb-2 text-sm",
                            style: {
                              fontFamily: customFonts.heading,
                              color: customColors.cardForeground
                            },
                            children: "Property Card"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                            className: "text-xs",
                            style: {
                              fontFamily: customFonts.body,
                              color: customColors.mutedForeground
                            },
                            children: previewMode === "mobile" ? "Mobile view" : "This is how property cards will appear with your selected theme."
                          })]
                        })]
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "mt-4 text-center",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-xs text-muted-foreground",
                        children: previewMode === "mobile" ? "📱 Viewing mobile preview (375px wide)" : "🖥️ Viewing desktop preview (full width)"
                      })
                    })]
                  })]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(UpgradeModal, {
              open: showUpgradeModal,
              onOpenChange: setShowUpgradeModal,
              feature: "premium_themes",
              currentPlan: subscription?.plan_name || "Free",
              requiredPlan: "Professional"
            })]
          });
        }
      }
    };
  });
})();
