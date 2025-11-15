;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js', './index-legacy-CvrXsObU.js', './useLinks-legacy-Bo8FcSit.js', './UpgradeModal-legacy-1fJMHoGX.js', './LimitBanner-legacy-Bk32ie3V.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js', './supabase-legacy-CQONYrP8.js', './data-legacy-BmYdDdMQ.js', './three-addons-legacy-COT_Kqtz.js', './three-legacy-VFAp7wzH.js', './state-stores-legacy-80VekGrm.js', './forms-legacy-BImVIBp0.js'], function (exports, module) {
    'use strict';

    var reactExports, jsxRuntimeExports, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Label, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, DialogFooter, Button, Instagram, Facebook, Linkedin, Music, Youtube, Home, MapPin, Calendar, Globe, Mail, Phone, MessageCircle, FileText, Link, X, Plus, GripVertical, ExternalLink, SquarePen, Trash2, useToast, useLinks, useSubscriptionLimits, UpgradeModal, LimitBanner;
    return {
      setters: [module => {
        reactExports = module.r;
        jsxRuntimeExports = module.j;
      }, module => {
        Dialog = module.D;
        DialogContent = module.l;
        DialogHeader = module.m;
        DialogTitle = module.n;
        DialogDescription = module.G;
        Label = module.L;
        Input = module.I;
        Select = module.S;
        SelectTrigger = module.a;
        SelectValue = module.b;
        SelectContent = module.d;
        SelectItem = module.e;
        DialogFooter = module.O;
        Button = module.j;
      }, module => {
        Instagram = module.I;
        Facebook = module.F;
        Linkedin = module.f;
        Music = module.r;
        Youtube = module.Y;
        Home = module.H;
        MapPin = module.p;
        Calendar = module.e;
        Globe = module.G;
        Mail = module.M;
        Phone = module.P;
        MessageCircle = module.N;
        FileText = module.aj;
        Link = module.a7;
        X = module.X;
        Plus = module.aw;
        GripVertical = module.aJ;
        ExternalLink = module.h;
        SquarePen = module.ay;
        Trash2 = module.az;
      }, module => {
        useToast = module.u;
      }, module => {
        useLinks = module.u;
      }, module => {
        useSubscriptionLimits = module.u;
        UpgradeModal = module.U;
      }, module => {
        LimitBanner = module.L;
      }, null, null, null, null, null, null, null, null],
      execute: function () {
        exports("default", Links);
        const SOCIAL_ICONS = [{
          value: "instagram",
          label: "Instagram",
          icon: Instagram
        }, {
          value: "facebook",
          label: "Facebook",
          icon: Facebook
        }, {
          value: "linkedin",
          label: "LinkedIn",
          icon: Linkedin
        }, {
          value: "tiktok",
          label: "TikTok",
          icon: Music
        }, {
          value: "youtube",
          label: "YouTube",
          icon: Youtube
        }, {
          value: "zillow",
          label: "Zillow",
          icon: Home
        }, {
          value: "realtor",
          label: "Realtor.com",
          icon: MapPin
        }, {
          value: "calendar",
          label: "Calendar",
          icon: Calendar
        }, {
          value: "website",
          label: "Website",
          icon: Globe
        }, {
          value: "email",
          label: "Email",
          icon: Mail
        }, {
          value: "phone",
          label: "Phone",
          icon: Phone
        }, {
          value: "whatsapp",
          label: "WhatsApp",
          icon: MessageCircle
        }, {
          value: "document",
          label: "Document",
          icon: FileText
        }, {
          value: "link",
          label: "Link",
          icon: Link
        }];
        function AddLinkModal({
          open,
          onOpenChange,
          onSave
        }) {
          const [formData, setFormData] = reactExports.useState({
            title: "",
            url: "",
            icon: "link",
            active: true
          });
          const handleChange = e => {
            const {
              name,
              value
            } = e.target;
            setFormData(prev => ({
              ...prev,
              [name]: value
            }));
          };
          const handleSubmit = e => {
            e.preventDefault();
            onSave?.(formData);
            onOpenChange(false);
            setFormData({
              title: "",
              url: "",
              icon: "link",
              active: true
            });
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx(Dialog, {
            open,
            onOpenChange,
            children: /* @__PURE__ */jsxRuntimeExports.jsxs(DialogContent, {
              className: "max-w-md",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(DialogHeader, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(DialogTitle, {
                  children: "Add Custom Link"
                }), /* @__PURE__ */jsxRuntimeExports.jsx(DialogDescription, {
                  children: "Add a social media profile or custom link to your bio"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("form", {
                onSubmit: handleSubmit,
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "title",
                    children: "Link Title *"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "title",
                    name: "title",
                    value: formData.title,
                    onChange: handleChange,
                    placeholder: "Schedule a Consultation",
                    required: true
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "url",
                    children: "URL *"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "url",
                    name: "url",
                    type: "url",
                    value: formData.url,
                    onChange: handleChange,
                    placeholder: "https://example.com",
                    required: true
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "icon",
                    children: "Icon"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    value: formData.icon,
                    onValueChange: value => setFormData(prev => ({
                      ...prev,
                      icon: value
                    })),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                        children: (() => {
                          const selected = SOCIAL_ICONS.find(i => i.value === formData.icon);
                          const IconComponent = selected?.icon || Link;
                          return /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                            className: "flex items-center gap-2",
                            children: [/* @__PURE__ */jsxRuntimeExports.jsx(IconComponent, {
                              className: "h-4 w-4"
                            }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                              children: selected?.label || "Custom"
                            })]
                          });
                        })()
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectContent, {
                      children: SOCIAL_ICONS.map(iconItem => {
                        const IconComponent = iconItem.icon;
                        return /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                          value: iconItem.value,
                          children: /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                            className: "flex items-center gap-2",
                            children: [/* @__PURE__ */jsxRuntimeExports.jsx(IconComponent, {
                              className: "h-4 w-4"
                            }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                              children: iconItem.label
                            })]
                          })
                        }, iconItem.value);
                      })
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                    type: "checkbox",
                    id: "active",
                    checked: formData.active,
                    onChange: e => setFormData(prev => ({
                      ...prev,
                      active: e.target.checked
                    })),
                    className: "rounded border-border"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "active",
                    className: "cursor-pointer",
                    children: "Active (visible on profile)"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(DialogFooter, {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    type: "button",
                    variant: "outline",
                    onClick: () => onOpenChange(false),
                    children: "Cancel"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    type: "submit",
                    children: "Add Link"
                  })]
                })]
              })]
            })
          });
        }
        function EditLinkModal({
          isOpen,
          onClose,
          onSubmit,
          initialData
        }) {
          const [formData, setFormData] = reactExports.useState(initialData);
          reactExports.useEffect(() => {
            setFormData(initialData);
          }, [initialData]);
          if (!isOpen) return null;
          const handleSubmit = e => {
            e.preventDefault();
            onSubmit(formData);
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
            children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-card border border-border rounded-lg w-full max-w-md",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "border-b border-border p-4 flex items-center justify-between",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                  className: "text-xl font-semibold",
                  children: "Edit Link"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                  onClick: onClose,
                  className: "p-2 hover:bg-accent rounded-lg transition-colors",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(X, {
                    className: "w-5 h-5"
                  })
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("form", {
                onSubmit: handleSubmit,
                className: "p-6 space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "title",
                    children: "Link Title *"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "title",
                    value: formData.title,
                    onChange: e => setFormData({
                      ...formData,
                      title: e.target.value
                    }),
                    placeholder: "e.g., My Website",
                    required: true
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "url",
                    children: "URL *"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "url",
                    type: "url",
                    value: formData.url,
                    onChange: e => setFormData({
                      ...formData,
                      url: e.target.value
                    }),
                    placeholder: "https://example.com",
                    required: true
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "icon",
                    children: "Icon (optional)"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "icon",
                    value: formData.icon || "",
                    onChange: e => setFormData({
                      ...formData,
                      icon: e.target.value
                    }),
                    placeholder: "e.g., link, globe, home"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-xs text-muted-foreground mt-1",
                    children: "Icon name from Lucide icons"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex gap-3 pt-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    type: "button",
                    variant: "outline",
                    onClick: onClose,
                    className: "flex-1",
                    children: "Cancel"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    type: "submit",
                    className: "flex-1",
                    children: "Save Changes"
                  })]
                })]
              })]
            })
          });
        }
        function useSoftDelete(options) {
          const {
            onDelete,
            deleteDelay = 1e4,
            // 10 seconds default
            undoMessage,
            resourceName
          } = options;
          const {
            toast
          } = useToast();
          const [deletionQueue, setDeletionQueue] = reactExports.useState(/* @__PURE__ */new Map());
          const queueRef = reactExports.useRef(deletionQueue);
          queueRef.current = deletionQueue;
          const softDelete = reactExports.useCallback(async item => {
            if (queueRef.current.has(item.id)) {
              return;
            }
            const timeoutId = setTimeout(async () => {
              try {
                await onDelete(item.id);
                setDeletionQueue(prev => {
                  const newQueue = new Map(prev);
                  newQueue.delete(item.id);
                  return newQueue;
                });
                toast({
                  title: `${resourceName} deleted`,
                  description: `Your ${resourceName} has been permanently removed.`
                });
              } catch (error) {
                toast({
                  title: "Deletion failed",
                  description: `Failed to delete ${resourceName}. Please try again.`,
                  variant: "destructive"
                });
                setDeletionQueue(prev => {
                  const newQueue = new Map(prev);
                  newQueue.delete(item.id);
                  return newQueue;
                });
              }
            }, deleteDelay);
            const queueItem = {
              id: item.id,
              data: item,
              timeoutId,
              timestamp: Date.now()
            };
            setDeletionQueue(prev => {
              const newQueue = new Map(prev);
              newQueue.set(item.id, queueItem);
              return newQueue;
            });
            const {
              dismiss: dismissToast
            } = toast({
              title: `${resourceName} deleted`,
              description: undoMessage?.(item) || `Deleting ${resourceName} in ${deleteDelay / 1e3} seconds...`,
              action: {
                label: "Undo",
                onClick: () => {
                  undoDelete(item.id);
                  dismissToast();
                }
              },
              duration: deleteDelay
            });
          }, [onDelete, deleteDelay, undoMessage, resourceName, toast]);
          const undoDelete = reactExports.useCallback(id => {
            const queueItem = queueRef.current.get(id);
            if (!queueItem) {
              return;
            }
            clearTimeout(queueItem.timeoutId);
            setDeletionQueue(prev => {
              const newQueue = new Map(prev);
              newQueue.delete(id);
              return newQueue;
            });
            toast({
              title: "Deletion cancelled",
              description: `Your ${resourceName} has been restored.`
            });
          }, [resourceName, toast]);
          const isPendingDeletion = reactExports.useCallback(id => {
            return queueRef.current.has(id);
          }, []);
          const getPendingDeletions = reactExports.useCallback(() => {
            return Array.from(queueRef.current.values()).map(item => item.data);
          }, []);
          const cancelAllDeletions = reactExports.useCallback(() => {
            queueRef.current.forEach(item => {
              clearTimeout(item.timeoutId);
            });
            setDeletionQueue(/* @__PURE__ */new Map());
            if (queueRef.current.size > 0) {
              toast({
                title: "All deletions cancelled",
                description: `${queueRef.current.size} ${resourceName}${queueRef.current.size > 1 ? "s" : ""} restored.`
              });
            }
          }, [resourceName, toast]);
          const forceDelete = reactExports.useCallback(async id => {
            const queueItem = queueRef.current.get(id);
            if (!queueItem) {
              return;
            }
            clearTimeout(queueItem.timeoutId);
            setDeletionQueue(prev => {
              const newQueue = new Map(prev);
              newQueue.delete(id);
              return newQueue;
            });
            try {
              await onDelete(id);
              toast({
                title: `${resourceName} deleted`,
                description: `Your ${resourceName} has been permanently removed.`
              });
            } catch (error) {
              toast({
                title: "Deletion failed",
                description: `Failed to delete ${resourceName}. Please try again.`,
                variant: "destructive"
              });
            }
          }, [onDelete, resourceName, toast]);
          return {
            softDelete,
            undoDelete,
            isPendingDeletion,
            getPendingDeletions,
            cancelAllDeletions,
            forceDelete,
            pendingCount: deletionQueue.size
          };
        }
        const getIconComponent = iconName => {
          const iconMap = {
            calendar: Calendar,
            instagram: Instagram,
            facebook: Facebook,
            zillow: Home,
            link: Link,
            linkedin: Linkedin,
            tiktok: Music,
            youtube: Youtube,
            realtor: MapPin,
            website: Globe,
            email: Mail,
            phone: Phone,
            whatsapp: MessageCircle,
            document: FileText
          };
          return iconMap[iconName] || Link;
        };
        function Links() {
          const [isAddModalOpen, setIsAddModalOpen] = reactExports.useState(false);
          const [isEditModalOpen, setIsEditModalOpen] = reactExports.useState(false);
          const [editingLink, setEditingLink] = reactExports.useState(null);
          const [showUpgradeModal, setShowUpgradeModal] = reactExports.useState(false);
          const {
            toast
          } = useToast();
          const {
            links,
            isLoading,
            addLink,
            updateLink,
            deleteLink
          } = useLinks();
          const {
            subscription,
            canAdd,
            getLimit,
            getUsage
          } = useSubscriptionLimits();
          const {
            softDelete,
            isPendingDeletion
          } = useSoftDelete({
            onDelete: async id => {
              await deleteLink.mutateAsync(id);
            },
            deleteDelay: 1e4,
            // 10 seconds
            resourceName: "link",
            undoMessage: link => `"${link.title}" will be deleted in 10 seconds. Click Undo to cancel.`
          });
          const visibleLinks = reactExports.useMemo(() => links.filter(link => !isPendingDeletion(link.id)), [links, isPendingDeletion]);
          const handleAddClick = () => {
            if (!canAdd("links")) {
              setShowUpgradeModal(true);
              return;
            }
            setIsAddModalOpen(true);
          };
          const handleAddLink = async data => {
            try {
              await addLink.mutateAsync(data);
              toast({
                title: "Link added!",
                description: "Your custom link has been created successfully."
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to add link. Please try again.",
                variant: "destructive"
              });
            }
          };
          const handleEditLink = link => {
            setEditingLink(link);
            setIsEditModalOpen(true);
          };
          const handleUpdateLink = async (id, data) => {
            try {
              await updateLink.mutateAsync({
                id,
                ...data
              });
              toast({
                title: "Link updated!",
                description: "Your link has been updated successfully."
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update link. Please try again.",
                variant: "destructive"
              });
            }
          };
          const handleDeleteClick = link => {
            softDelete(link);
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-4 sm:space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                  className: "text-2xl sm:text-3xl font-bold text-foreground",
                  children: "Custom Links"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1",
                  children: "Manage your social and custom links"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                onClick: handleAddClick,
                className: "inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:scale-95 transition-all font-medium min-h-[44px] w-full sm:w-auto justify-center shadow-sm",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Plus, {
                  className: "h-4 w-4 sm:h-5 sm:w-5"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "text-sm sm:text-base",
                  children: "Add Link"
                })]
              })]
            }), subscription && getLimit("links") !== Infinity && /* @__PURE__ */jsxRuntimeExports.jsx(LimitBanner, {
              feature: "links",
              current: getUsage("links"),
              limit: getLimit("links")
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "grid grid-cols-3 gap-2 sm:gap-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-xl sm:text-2xl font-bold text-foreground",
                  children: visibleLinks.length
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-xs sm:text-sm text-muted-foreground mt-0.5",
                  children: "Total"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-xl sm:text-2xl font-bold text-green-600",
                  children: visibleLinks.filter(l => l.is_active).length
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-xs sm:text-sm text-muted-foreground mt-0.5",
                  children: "Active"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-xl sm:text-2xl font-bold text-primary",
                  children: visibleLinks.reduce((sum, l) => sum + l.click_count, 0)
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-xs sm:text-sm text-muted-foreground mt-0.5",
                  children: "Clicks"
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "bg-card border border-border rounded-lg divide-y divide-border",
              children: isLoading ? /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base",
                children: "Loading links..."
              }) : visibleLinks.length === 0 ? /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base",
                children: 'No links yet. Click "Add Link" to create your first link.'
              }) : visibleLinks.map(link => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "p-3 sm:p-4 flex items-center gap-2 sm:gap-4 hover:bg-accent/50 active:bg-accent/70 transition-colors",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("button", {
                  className: "cursor-grab active:cursor-grabbing p-1.5 hover:bg-accent rounded hidden sm:block min-h-[44px]",
                  "aria-label": "Drag to reorder",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(GripVertical, {
                    className: "h-5 w-5 text-muted-foreground"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-accent rounded-lg flex-shrink-0",
                  children: (() => {
                    const IconComponent = getIconComponent(link.icon);
                    return /* @__PURE__ */jsxRuntimeExports.jsx(IconComponent, {
                      className: "h-5 w-5 sm:h-6 sm:w-6 text-foreground"
                    });
                  })()
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex-1 min-w-0",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                      className: "font-medium text-sm sm:text-base text-foreground truncate",
                      children: link.title
                    }), link.is_active ? /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex-shrink-0",
                      children: "Active"
                    }) : /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium flex-shrink-0",
                      children: "Inactive"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("a", {
                    href: link.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-xs sm:text-sm text-muted-foreground hover:text-primary active:text-primary flex items-center gap-1 truncate",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "truncate",
                      children: link.url
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                      className: "h-3 w-3 flex-shrink-0"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "sm:hidden mt-1.5 text-xs text-muted-foreground",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "font-semibold text-foreground",
                      children: link.click_count
                    }), " clicks"]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "text-right hidden sm:block flex-shrink-0",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-lg font-semibold text-foreground",
                    children: link.click_count
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-xs text-muted-foreground",
                    children: "clicks"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-0.5 sm:gap-1 flex-shrink-0",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("button", {
                    onClick: () => handleEditLink(link),
                    className: "p-2 sm:p-2.5 hover:bg-accent active:bg-accent/80 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center",
                    "aria-label": "Edit link",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(SquarePen, {
                      className: "h-4 w-4 text-muted-foreground"
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                    onClick: () => handleDeleteClick(link),
                    className: "p-2 sm:p-2.5 hover:bg-red-50 active:bg-red-100 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center",
                    "aria-label": "Delete link",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Trash2, {
                      className: "h-4 w-4 text-red-500"
                    })
                  })]
                })]
              }, link.id))
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 sm:p-4",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                className: "text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed",
                children: ["💡 ", /* @__PURE__ */jsxRuntimeExports.jsx("strong", {
                  children: "Tip:"
                }), " ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "hidden sm:inline",
                  children: "Drag and drop links to reorder them."
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "sm:hidden",
                  children: "Use the edit option to change link details."
                }), " The order here will reflect on your public profile page."]
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsx(AddLinkModal, {
              open: isAddModalOpen,
              onOpenChange: setIsAddModalOpen,
              onSave: handleAddLink
            }), /* @__PURE__ */jsxRuntimeExports.jsx(EditLinkModal, {
              open: isEditModalOpen,
              onOpenChange: setIsEditModalOpen,
              link: editingLink,
              onSave: handleUpdateLink
            }), /* @__PURE__ */jsxRuntimeExports.jsx(UpgradeModal, {
              open: showUpgradeModal,
              onOpenChange: setShowUpgradeModal,
              feature: "links",
              currentPlan: subscription?.plan_name || "Free",
              requiredPlan: "Starter"
            })]
          });
        }
      }
    };
  });
})();
