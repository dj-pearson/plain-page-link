;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js', './supabase-legacy-CQONYrP8.js', './utils-legacy-B2316hnE.js'], function (exports, module) {
    'use strict';

    var jsxRuntimeExports, reactExports, Avatar, AvatarImage, AvatarFallback, Button, Badge, Label, Input, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Checkbox, Mail, Phone, MapPin, Bed, Bath, Square, ExternalLink, ChevronRight, CircleCheckBig, LoaderCircle, Building, Home, Music, Youtube, Linkedin, Twitter, Instagram, Facebook, Play, Image, supabase, ue;
    return {
      setters: [module => {
        jsxRuntimeExports = module.j;
        reactExports = module.r;
      }, module => {
        Avatar = module.A;
        AvatarImage = module.p;
        AvatarFallback = module.q;
        Button = module.j;
        Badge = module.B;
        Label = module.L;
        Input = module.I;
        Textarea = module.T;
        Select = module.S;
        SelectTrigger = module.a;
        SelectValue = module.b;
        SelectContent = module.d;
        SelectItem = module.e;
        Checkbox = module.z;
      }, module => {
        Mail = module.M;
        Phone = module.P;
        MapPin = module.p;
        Bed = module.v;
        Bath = module.w;
        Square = module.ar;
        ExternalLink = module.h;
        ChevronRight = module.V;
        CircleCheckBig = module.J;
        LoaderCircle = module.L;
        Building = module.s;
        Home = module.H;
        Music = module.r;
        Youtube = module.Y;
        Linkedin = module.f;
        Twitter = module.ak;
        Instagram = module.I;
        Facebook = module.F;
        Play = module.as;
        Image = module.a9;
      }, module => {
        supabase = module.s;
      }, module => {
        ue = module.u;
      }],
      execute: function () {
        exports({
          B: BlockRenderer,
          g: getThemedStyles,
          p: preloadThemeFonts
        });
        function BioBlock({
          config,
          isEditing = false
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "text-center space-y-4 p-6",
            style: {
              fontFamily: "var(--theme-font-body, inherit)"
            },
            children: [config.avatarUrl && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "flex justify-center",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs(Avatar, {
                className: "w-24 h-24",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(AvatarImage, {
                  src: config.avatarUrl,
                  alt: config.title
                }), /* @__PURE__ */jsxRuntimeExports.jsx(AvatarFallback, {
                  className: "text-2xl",
                  children: config.title.charAt(0)
                })]
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                className: "text-3xl font-bold",
                style: {
                  color: "var(--theme-text, #1f2937)",
                  fontFamily: "var(--theme-font-heading, inherit)"
                },
                children: config.title
              }), config.subtitle && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-lg text-gray-600 mt-1",
                children: config.subtitle
              })]
            }), config.description && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-gray-700 max-w-2xl mx-auto whitespace-pre-wrap",
              children: config.description
            }), config.showContactButton && !isEditing && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex gap-3 justify-center pt-2",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                className: "gap-2",
                style: {
                  backgroundColor: "var(--theme-primary, #2563eb)",
                  borderRadius: "var(--theme-border-radius, 0.5rem)"
                },
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Mail, {
                  className: "w-4 h-4"
                }), "Contact Me"]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                variant: "outline",
                className: "gap-2",
                style: {
                  borderRadius: "var(--theme-border-radius, 0.5rem)",
                  borderColor: "var(--theme-primary, #2563eb)",
                  color: "var(--theme-primary, #2563eb)"
                },
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Phone, {
                  className: "w-4 h-4"
                }), "Call Now"]
              })]
            })]
          });
        }
        function ListingsBlock({
          config,
          isEditing = false,
          userId
        }) {
          const [listings, setListings] = reactExports.useState([]);
          const [isLoading, setIsLoading] = reactExports.useState(true);
          reactExports.useEffect(() => {
            async function fetchListings() {
              if (!userId) {
                setIsLoading(false);
                return;
              }
              try {
                let query = supabase.from("listings").select("*").eq("user_id", userId).order("created_at", {
                  ascending: false
                });
                if (config.filter === "active") {
                  query = query.eq("status", "active");
                } else if (config.filter === "featured") {
                  query = query.eq("is_featured", true);
                }
                if (config.maxItems) {
                  query = query.limit(config.maxItems);
                }
                const {
                  data,
                  error
                } = await query;
                if (error) throw error;
                setListings(data || []);
              } catch (error) {
                console.error("Error fetching listings:", error);
                setListings([]);
              } finally {
                setIsLoading(false);
              }
            }
            fetchListings();
          }, [userId, config.filter, config.maxItems]);
          const getGridClass = () => {
            switch (config.layout) {
              case "list":
                return "grid grid-cols-1 gap-4";
              case "carousel":
                return "flex overflow-x-auto gap-4 snap-x";
              case "grid":
              default:
                return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
            }
          };
          const getPhotoUrl = listing => {
            if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
              return listing.photos[0];
            }
            return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";
          };
          const formatAddress = listing => {
            return `${listing.address}, ${listing.city}, ${listing.state}`;
          };
          if (isLoading) {
            return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-6",
              children: [config.title && /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                className: "text-2xl font-bold text-center",
                children: config.title
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "text-center py-12 text-gray-500",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  children: "Loading listings..."
                })
              })]
            });
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [config.title && /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
              className: "text-2xl font-bold text-center",
              children: config.title
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: getGridClass(),
              children: listings.map(listing => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "relative aspect-video",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("img", {
                    src: getPhotoUrl(listing),
                    alt: formatAddress(listing),
                    className: "w-full h-full object-cover"
                  }), config.showStatus && /* @__PURE__ */jsxRuntimeExports.jsx(Badge, {
                    className: "absolute top-2 right-2 capitalize",
                    variant: listing.status === "active" ? "default" : "secondary",
                    children: listing.status
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "p-4 space-y-2",
                  children: [config.showPrices && /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-2xl font-bold text-primary",
                    children: ["$", listing.price.toLocaleString()]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-1 text-gray-600 text-sm",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(MapPin, {
                      className: "w-4 h-4"
                    }), formatAddress(listing)]
                  }), (listing.bedrooms || listing.bathrooms || listing.square_feet) && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-4 text-gray-700 text-sm pt-2",
                    children: [listing.bedrooms && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-1",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Bed, {
                        className: "w-4 h-4"
                      }), listing.bedrooms, " bd"]
                    }), listing.bathrooms && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-1",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Bath, {
                        className: "w-4 h-4"
                      }), listing.bathrooms, " ba"]
                    }), listing.square_feet && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-1",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Square, {
                        className: "w-4 h-4"
                      }), listing.square_feet.toLocaleString(), " sqft"]
                    })]
                  })]
                })]
              }, listing.id))
            }), listings.length === 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center py-12 text-gray-500",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                children: "No listings to display"
              }), isEditing && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm mt-1",
                children: "Add some properties in the Listings dashboard to see them here"
              })]
            })]
          });
        }
        function LinkBlock({
          config,
          isEditing = false
        }) {
          const handleClick = () => {
            if (isEditing) return;
            if (config.openInNewTab) {
              window.open(config.url, "_blank", "noopener,noreferrer");
            } else {
              window.location.href = config.url;
            }
          };
          const renderButton = () => /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
            onClick: handleClick,
            disabled: isEditing,
            className: "w-full gap-2 justify-between",
            variant: config.style === "minimal" ? "ghost" : "default",
            size: "lg",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("span", {
              className: "flex items-center gap-2",
              children: [config.icon && /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                children: config.icon
              }), config.title]
            }), config.openInNewTab ? /* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
              className: "w-4 h-4"
            }) : /* @__PURE__ */jsxRuntimeExports.jsx(ChevronRight, {
              className: "w-4 h-4"
            })]
          });
          const renderCard = () => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            onClick: handleClick,
            className: `
                p-4 rounded-lg border bg-white hover:shadow-md transition-all
                ${!isEditing && "cursor-pointer hover:border-primary"}
            `,
            children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3",
                children: [config.icon && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-2xl",
                  children: config.icon
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "font-semibold",
                  children: config.title
                })]
              }), config.openInNewTab ? /* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                className: "w-5 h-5 text-gray-400"
              }) : /* @__PURE__ */jsxRuntimeExports.jsx(ChevronRight, {
                className: "w-5 h-5 text-gray-400"
              })]
            })
          });
          const renderMinimal = () => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            onClick: handleClick,
            className: `
                py-3 px-4 text-center
                ${!isEditing && "cursor-pointer hover:text-primary"}
                transition-colors
            `,
            children: /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
              className: "flex items-center justify-center gap-2",
              children: [config.icon && /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                children: config.icon
              }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                className: "font-medium",
                children: config.title
              }), config.openInNewTab && /* @__PURE__ */jsxRuntimeExports.jsx(ExternalLink, {
                className: "w-4 h-4"
              })]
            })
          });
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "w-full max-w-md mx-auto",
            children: [config.style === "button" && renderButton(), config.style === "card" && renderCard(), config.style === "minimal" && renderMinimal()]
          });
        }
        function ContactBlock({
          config,
          isEditing = false
        }) {
          const [formData, setFormData] = reactExports.useState({});
          const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
          const [isSuccess, setIsSuccess] = reactExports.useState(false);
          const handleSubmit = async e => {
            e.preventDefault();
            if (isEditing) return;
            setIsSubmitting(true);
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              setIsSuccess(true);
              ue.success(config.successMessage || "Message sent successfully!");
              setTimeout(() => {
                setFormData({});
                setIsSuccess(false);
              }, 3e3);
            } catch (error) {
              ue.error("Failed to send message. Please try again.");
            } finally {
              setIsSubmitting(false);
            }
          };
          const handleChange = (fieldId, value) => {
            setFormData(prev => ({
              ...prev,
              [fieldId]: value
            }));
          };
          if (isSuccess) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "max-w-md mx-auto p-8 bg-green-50 rounded-lg border border-green-200",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "text-center space-y-3",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                  className: "w-12 h-12 text-green-600 mx-auto"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                  className: "text-lg font-semibold text-green-900",
                  children: "Message Sent!"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-green-700",
                  children: config.successMessage
                })]
              })
            });
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "max-w-md mx-auto",
            children: [config.title && /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
              className: "text-2xl font-bold text-center mb-6",
              children: config.title
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("form", {
              onSubmit: handleSubmit,
              className: "space-y-4",
              children: [config.fields.map(field => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                  htmlFor: field.id,
                  children: [field.label, field.required && /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "text-red-500 ml-1",
                    children: "*"
                  })]
                }), field.type === "text" && /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                  id: field.id,
                  type: "text",
                  placeholder: field.placeholder,
                  required: field.required,
                  disabled: isEditing || isSubmitting,
                  value: formData[field.id] || "",
                  onChange: e => handleChange(field.id, e.target.value)
                }), field.type === "email" && /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                  id: field.id,
                  type: "email",
                  placeholder: field.placeholder,
                  required: field.required,
                  disabled: isEditing || isSubmitting,
                  value: formData[field.id] || "",
                  onChange: e => handleChange(field.id, e.target.value)
                }), field.type === "phone" && /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                  id: field.id,
                  type: "tel",
                  placeholder: field.placeholder,
                  required: field.required,
                  disabled: isEditing || isSubmitting,
                  value: formData[field.id] || "",
                  onChange: e => handleChange(field.id, e.target.value)
                }), field.type === "textarea" && /* @__PURE__ */jsxRuntimeExports.jsx(Textarea, {
                  id: field.id,
                  placeholder: field.placeholder,
                  required: field.required,
                  disabled: isEditing || isSubmitting,
                  value: formData[field.id] || "",
                  onChange: e => handleChange(field.id, e.target.value),
                  rows: 4
                }), field.type === "select" && field.options && /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                  disabled: isEditing || isSubmitting,
                  value: formData[field.id],
                  onValueChange: value => handleChange(field.id, value),
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                      placeholder: field.placeholder
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectContent, {
                    children: field.options.map(option => /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                      value: option,
                      children: option
                    }, option))
                  })]
                }), field.type === "checkbox" && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Checkbox, {
                    id: field.id,
                    disabled: isEditing || isSubmitting,
                    checked: formData[field.id] || false,
                    onCheckedChange: checked => handleChange(field.id, checked)
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("label", {
                    htmlFor: field.id,
                    className: "text-sm cursor-pointer",
                    children: field.label
                  })]
                })]
              }, field.id)), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                type: "submit",
                className: "w-full gap-2",
                disabled: isEditing || isSubmitting,
                children: [isSubmitting && /* @__PURE__ */jsxRuntimeExports.jsx(LoaderCircle, {
                  className: "w-4 h-4 animate-spin"
                }), isSubmitting ? "Sending..." : config.submitButtonText || "Submit"]
              })]
            })]
          });
        }
        function SocialBlock({
          config,
          isEditing = false
        }) {
          const getIcon = platform => {
            const iconClass = `w-${config.iconSize === "small" ? "5" : config.iconSize === "large" ? "8" : "6"} h-${config.iconSize === "small" ? "5" : config.iconSize === "large" ? "8" : "6"}`;
            switch (platform) {
              case "facebook":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Facebook, {
                  className: iconClass
                });
              case "instagram":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Instagram, {
                  className: iconClass
                });
              case "twitter":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Twitter, {
                  className: iconClass
                });
              case "linkedin":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Linkedin, {
                  className: iconClass
                });
              case "youtube":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Youtube, {
                  className: iconClass
                });
              case "tiktok":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Music, {
                  className: iconClass
                });
              case "zillow":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Home, {
                  className: iconClass
                });
              case "realtor":
                return /* @__PURE__ */jsxRuntimeExports.jsx(Building, {
                  className: iconClass
                });
              default:
                return null;
            }
          };
          const getPlatformColor = platform => {
            const colors = {
              facebook: "hover:bg-blue-600",
              instagram: "hover:bg-pink-600",
              twitter: "hover:bg-sky-500",
              linkedin: "hover:bg-blue-700",
              youtube: "hover:bg-red-600",
              tiktok: "hover:bg-black",
              zillow: "hover:bg-blue-800",
              realtor: "hover:bg-red-700"
            };
            return colors[platform] || "hover:bg-gray-700";
          };
          const handleClick = url => {
            if (!isEditing) {
              window.open(url, "_blank", "noopener,noreferrer");
            }
          };
          const getLayoutClass = () => {
            switch (config.layout) {
              case "vertical":
                return "flex-col items-center";
              case "grid":
                return "grid grid-cols-4 gap-3";
              case "horizontal":
              default:
                return "flex-row justify-center";
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-4",
            children: [config.title && /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
              className: "text-xl font-semibold text-center",
              children: config.title
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: `flex gap-3 ${getLayoutClass()}`,
              children: config.links.map(link => /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                onClick: () => handleClick(link.url),
                disabled: isEditing,
                className: `
                            p-3 rounded-full bg-gray-800 text-white
                            transition-all hover:scale-110
                            ${getPlatformColor(link.platform)}
                            ${isEditing ? "cursor-default" : "cursor-pointer"}
                        `,
                title: link.username || link.platform,
                children: getIcon(link.platform)
              }, link.id))
            }), config.links.length === 0 && isEditing && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "text-center py-8 text-gray-500",
              children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm",
                children: "No social links added yet"
              })
            })]
          });
        }
        function VideoBlock({
          config,
          isEditing = false
        }) {
          const [isPlaying, setIsPlaying] = reactExports.useState(false);
          const getVideoEmbedUrl = () => {
            const url = config.videoUrl;
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
              let videoId = "";
              if (url.includes("youtube.com/watch?v=")) {
                videoId = url.split("v=")[1]?.split("&")[0];
              } else if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1]?.split("?")[0];
              }
              return `https://www.youtube.com/embed/${videoId}?autoplay=${config.autoplay ? "1" : "0"}&mute=${config.muted ? "1" : "0"}`;
            }
            if (url.includes("vimeo.com")) {
              const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
              return `https://player.vimeo.com/video/${videoId}?autoplay=${config.autoplay ? "1" : "0"}&muted=${config.muted ? "1" : "0"}`;
            }
            return url;
          };
          const handlePlay = () => {
            if (!isEditing) {
              setIsPlaying(true);
            }
          };
          if (!config.videoUrl && isEditing) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "text-center text-gray-500",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Play, {
                  className: "w-12 h-12 mx-auto mb-2"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "font-medium",
                  children: "No video URL"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm",
                  children: "Add a YouTube or Vimeo URL"
                })]
              })
            });
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-3",
            children: [config.title && /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
              className: "text-xl font-semibold text-center",
              children: config.title
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "relative aspect-video rounded-lg overflow-hidden bg-black",
              children: !isPlaying && config.thumbnail ?
              // Thumbnail with play button
              /* @__PURE__ */
              jsxRuntimeExports.jsxs("div", {
                className: "relative w-full h-full",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("img", {
                  src: config.thumbnail,
                  alt: config.title || "Video",
                  className: "w-full h-full object-cover"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                  onClick: handlePlay,
                  disabled: isEditing,
                  className: "absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Play, {
                      className: "w-8 h-8 text-primary ml-1"
                    })
                  })
                })]
              }) :
              // Embedded video player
              /* @__PURE__ */
              jsxRuntimeExports.jsx("iframe", {
                src: getVideoEmbedUrl(),
                title: config.title || "Video",
                className: "w-full h-full",
                allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                allowFullScreen: true
              })
            })]
          });
        }
        function SpacerBlock({
          config,
          isEditing = false
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            style: {
              height: `${config.height}px`
            },
            className: isEditing ? "border-2 border-dashed border-gray-300 rounded" : "",
            children: isEditing && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-center h-full text-gray-400 text-sm",
              children: [config.height, "px spacer"]
            })
          });
        }
        function TextBlock({
          config,
          isEditing = false
        }) {
          const getAlignClass = () => {
            switch (config.align) {
              case "center":
                return "text-center";
              case "right":
                return "text-right";
              case "left":
              default:
                return "text-left";
            }
          };
          const getFontSizeClass = () => {
            switch (config.fontSize) {
              case "small":
                return "text-sm";
              case "large":
                return "text-lg";
              case "medium":
              default:
                return "text-base";
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: `${getAlignClass()} ${getFontSizeClass()}`,
            children: config.content ? /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "whitespace-pre-wrap text-gray-700",
              children: config.content
            }) : isEditing && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-gray-400 italic",
              children: "Enter your text here..."
            })
          });
        }
        function ImageBlock({
          config,
          isEditing = false
        }) {
          const getSizeClass = () => {
            switch (config.size) {
              case "small":
                return "max-w-sm";
              case "medium":
                return "max-w-md";
              case "large":
                return "max-w-2xl";
              case "full":
                return "w-full";
              default:
                return "max-w-md";
            }
          };
          const handleClick = () => {
            if (!isEditing && config.link) {
              window.open(config.link, "_blank", "noopener,noreferrer");
            }
          };
          if (!config.imageUrl && isEditing) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: `${getSizeClass()} mx-auto`,
              children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "text-center text-gray-500",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Image, {
                    className: "w-12 h-12 mx-auto mb-2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "font-medium",
                    children: "No image"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm",
                    children: "Upload an image"
                  })]
                })
              })
            });
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: `${getSizeClass()} mx-auto space-y-2`,
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
              onClick: handleClick,
              className: `
                    rounded-lg overflow-hidden
                    ${config.link && !isEditing ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}
                `,
              children: /* @__PURE__ */jsxRuntimeExports.jsx("img", {
                src: config.imageUrl,
                alt: config.alt,
                className: "w-full h-auto"
              })
            }), config.caption && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-sm text-gray-600 text-center italic",
              children: config.caption
            })]
          });
        }
        function BlockRenderer({
          block,
          isEditing = false,
          isSelected = false,
          onSelect,
          userId
        }) {
          const renderBlock = () => {
            switch (block.type) {
              case "bio":
                return /* @__PURE__ */jsxRuntimeExports.jsx(BioBlock, {
                  config: block.config,
                  isEditing
                });
              case "listings":
                return /* @__PURE__ */jsxRuntimeExports.jsx(ListingsBlock, {
                  config: block.config,
                  isEditing,
                  userId
                });
              case "link":
                return /* @__PURE__ */jsxRuntimeExports.jsx(LinkBlock, {
                  config: block.config,
                  isEditing
                });
              case "contact":
                return /* @__PURE__ */jsxRuntimeExports.jsx(ContactBlock, {
                  config: block.config,
                  isEditing
                });
              case "social":
                return /* @__PURE__ */jsxRuntimeExports.jsx(SocialBlock, {
                  config: block.config,
                  isEditing
                });
              case "video":
                return /* @__PURE__ */jsxRuntimeExports.jsx(VideoBlock, {
                  config: block.config,
                  isEditing
                });
              case "spacer":
                return /* @__PURE__ */jsxRuntimeExports.jsx(SpacerBlock, {
                  config: block.config,
                  isEditing
                });
              case "text":
                return /* @__PURE__ */jsxRuntimeExports.jsx(TextBlock, {
                  config: block.config,
                  isEditing
                });
              case "image":
                return /* @__PURE__ */jsxRuntimeExports.jsx(ImageBlock, {
                  config: block.config,
                  isEditing
                });
              default:
                return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "p-4 bg-yellow-50 border border-yellow-200 rounded text-center",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-yellow-800",
                    children: ["Unknown block type: ", block.type]
                  })
                });
            }
          };
          if (!isEditing) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: !block.visible ? "hidden" : "",
              children: renderBlock()
            });
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            onClick: onSelect,
            className: `
                relative group transition-all
                ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
                ${!block.visible ? "opacity-50" : ""}
                ${onSelect ? "cursor-pointer" : ""}
            `,
            children: [renderBlock(), onSelect && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: `
                        absolute inset-0 pointer-events-none
                        ${isSelected ? "" : "group-hover:ring-1 group-hover:ring-gray-300"}
                    `
            })]
          });
        }
        function getBorderRadiusValue(radius) {
          const values = {
            none: "0",
            small: "0.25rem",
            medium: "0.5rem",
            large: "1rem",
            full: "9999px"
          };
          return values[radius];
        }
        function getSpacingValue(spacing) {
          const values = {
            compact: "1rem",
            normal: "2rem",
            spacious: "3rem"
          };
          return values[spacing];
        }
        function getThemedStyles(theme) {
          return {
            "--theme-primary": theme.colors.primary,
            "--theme-secondary": theme.colors.secondary,
            "--theme-background": theme.colors.background,
            "--theme-text": theme.colors.text,
            "--theme-accent": theme.colors.accent,
            "--theme-font-heading": `'${theme.fonts.heading}', sans-serif`,
            "--theme-font-body": `'${theme.fonts.body}', sans-serif`,
            "--theme-border-radius": getBorderRadiusValue(theme.borderRadius),
            "--theme-spacing": getSpacingValue(theme.spacing)
          };
        }
        function loadGoogleFont(fontFamily) {
          const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/\s+/g, "+")}"]`);
          if (existingLink) return;
          const link = document.createElement("link");
          link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, "+")}:wght@400;500;600;700&display=swap`;
          link.rel = "stylesheet";
          document.head.appendChild(link);
        }
        function preloadThemeFonts(theme) {
          loadGoogleFont(theme.fonts.heading);
          if (theme.fonts.body !== theme.fonts.heading) {
            loadGoogleFont(theme.fonts.body);
          }
        }
      }
    };
  });
})();
