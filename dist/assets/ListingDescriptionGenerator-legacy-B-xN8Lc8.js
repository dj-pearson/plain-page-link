;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './forms-legacy-BImVIBp0.js', './icons-legacy-C8x4ypXf.js', './utils-legacy-B2316hnE.js', './supabase-legacy-CQONYrP8.js', './charts-legacy-D2SqRQVB.js'], function (exports, module) {
    'use strict';

    var reactExports, jsxRuntimeExports, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Input, Textarea, Button, Tabs, TabsList, TabsTrigger, TabsContent, Dialog, DialogContent, DialogTitle, DialogDescription, Card, Helmet, useForm, Home, MapPin, Sparkles, Target, ArrowLeft, ArrowRight, Lock, FileText, Instagram, Facebook, Mail, MessageSquare, Check, Copy, LockOpen, Gift, Lightbulb, TrendingUp, CircleCheckBig, Star, Share2, Download, Linkedin, Twitter, Users, ue, supabase;
    return {
      setters: [module => {
        reactExports = module.r;
        jsxRuntimeExports = module.j;
      }, module => {
        Label = module.L;
        Select = module.S;
        SelectTrigger = module.a;
        SelectValue = module.b;
        SelectContent = module.d;
        SelectItem = module.e;
        Input = module.I;
        Textarea = module.T;
        Button = module.j;
        Tabs = module.J;
        TabsList = module.K;
        TabsTrigger = module.M;
        TabsContent = module.N;
        Dialog = module.D;
        DialogContent = module.l;
        DialogTitle = module.n;
        DialogDescription = module.G;
        Card = module.C;
        Helmet = module.x;
      }, module => {
        useForm = module.u;
      }, module => {
        Home = module.H;
        MapPin = module.p;
        Sparkles = module.g;
        Target = module.j;
        ArrowLeft = module.a2;
        ArrowRight = module.A;
        Lock = module.a3;
        FileText = module.aj;
        Instagram = module.I;
        Facebook = module.F;
        Mail = module.M;
        MessageSquare = module.q;
        Check = module.b;
        Copy = module.ae;
        LockOpen = module.ah;
        Gift = module.ai;
        Lightbulb = module.ad;
        TrendingUp = module.T;
        CircleCheckBig = module.J;
        Star = module.i;
        Share2 = module.u;
        Download = module.a1;
        Linkedin = module.f;
        Twitter = module.ak;
        Users = module.U;
      }, module => {
        ue = module.u;
      }, module => {
        supabase = module.s;
      }, null],
      execute: function () {
        exports("default", ListingDescriptionGenerator);
        const PROPERTY_FEATURES = [
        // Interior
        {
          id: "updated-kitchen",
          label: "Updated Kitchen",
          category: "interior"
        }, {
          id: "granite-countertops",
          label: "Granite Countertops",
          category: "interior"
        }, {
          id: "hardwood-floors",
          label: "Hardwood Floors",
          category: "interior"
        }, {
          id: "fireplace",
          label: "Fireplace",
          category: "interior"
        }, {
          id: "open-floor-plan",
          label: "Open Floor Plan",
          category: "interior"
        }, {
          id: "master-suite",
          label: "Master Suite",
          category: "interior"
        }, {
          id: "walk-in-closets",
          label: "Walk-in Closets",
          category: "interior"
        }, {
          id: "high-ceilings",
          label: "High Ceilings",
          category: "interior"
        }, {
          id: "modern-appliances",
          label: "Modern Appliances",
          category: "interior"
        }, {
          id: "finished-basement",
          label: "Finished Basement",
          category: "interior"
        },
        // Exterior
        {
          id: "pool",
          label: "Pool",
          category: "exterior"
        }, {
          id: "spa",
          label: "Spa/Hot Tub",
          category: "exterior"
        }, {
          id: "large-yard",
          label: "Large Yard",
          category: "exterior"
        }, {
          id: "deck-patio",
          label: "Deck/Patio",
          category: "exterior"
        }, {
          id: "outdoor-kitchen",
          label: "Outdoor Kitchen",
          category: "exterior"
        }, {
          id: "garage",
          label: "Attached Garage",
          category: "exterior"
        }, {
          id: "landscaping",
          label: "Professional Landscaping",
          category: "exterior"
        }, {
          id: "mountain-views",
          label: "Mountain Views",
          category: "exterior"
        }, {
          id: "water-views",
          label: "Water Views",
          category: "exterior"
        }, {
          id: "privacy",
          label: "Private/Secluded",
          category: "exterior"
        },
        // Location
        {
          id: "near-schools",
          label: "Near Schools",
          category: "location"
        }, {
          id: "near-shopping",
          label: "Near Shopping",
          category: "location"
        }, {
          id: "walkable",
          label: "Walkable Neighborhood",
          category: "location"
        }, {
          id: "near-transit",
          label: "Near Public Transit",
          category: "location"
        }, {
          id: "golf-course",
          label: "Golf Course Community",
          category: "location"
        }, {
          id: "gated-community",
          label: "Gated Community",
          category: "location"
        }, {
          id: "downtown",
          label: "Downtown Location",
          category: "location"
        }, {
          id: "quiet-street",
          label: "Quiet Street",
          category: "location"
        },
        // Upgrades
        {
          id: "smart-home",
          label: "Smart Home Features",
          category: "upgrades"
        }, {
          id: "solar-panels",
          label: "Solar Panels",
          category: "upgrades"
        }, {
          id: "energy-efficient",
          label: "Energy Efficient",
          category: "upgrades"
        }, {
          id: "new-roof",
          label: "New Roof",
          category: "upgrades"
        }, {
          id: "new-hvac",
          label: "New HVAC",
          category: "upgrades"
        }, {
          id: "new-windows",
          label: "New Windows",
          category: "upgrades"
        }, {
          id: "renovated",
          label: "Recently Renovated",
          category: "upgrades"
        }, {
          id: "wine-cellar",
          label: "Wine Cellar",
          category: "upgrades"
        }];
        function PropertyDetailsForm({
          onSubmit,
          onStepChange
        }) {
          const [step, setStep] = reactExports.useState(1);
          const [selectedFeatures, setSelectedFeatures] = reactExports.useState([]);
          const {
            register,
            handleSubmit,
            watch,
            setValue,
            formState: {
              errors
            }
          } = useForm({
            defaultValues: {
              selectedFeatures: []
            }
          });
          const totalSteps = 4;
          const progress = step / totalSteps * 100;
          const nextStep = () => {
            const newStep = Math.min(step + 1, totalSteps);
            setStep(newStep);
            onStepChange?.(newStep);
          };
          const prevStep = () => {
            const newStep = Math.max(step - 1, 1);
            setStep(newStep);
            onStepChange?.(newStep);
          };
          const handleFormSubmit = data => {
            data.selectedFeatures = selectedFeatures;
            onSubmit(data);
          };
          const toggleFeature = featureId => {
            setSelectedFeatures(prev => prev.includes(featureId) ? prev.filter(id => id !== featureId) : [...prev, featureId]);
          };
          const featuresByCategory = {
            interior: PROPERTY_FEATURES.filter(f => f.category === "interior"),
            exterior: PROPERTY_FEATURES.filter(f => f.category === "exterior"),
            location: PROPERTY_FEATURES.filter(f => f.category === "location"),
            upgrades: PROPERTY_FEATURES.filter(f => f.category === "upgrades")
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("form", {
            onSubmit: handleSubmit(handleFormSubmit),
            className: "space-y-8",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex justify-between text-sm text-gray-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  children: ["Step ", step, " of ", totalSteps]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                  children: [Math.round(progress), "% Complete"]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "w-full h-2 bg-gray-200 rounded-full overflow-hidden",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300",
                  style: {
                    width: `${progress}%`
                  }
                })
              })]
            }), step === 1 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-6 animate-in fade-in slide-in-from-right-4 duration-300",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(Home, {
                    className: "w-5 h-5 text-white"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                    className: "text-2xl font-bold",
                    children: "Property Basics"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-gray-600",
                    children: "Tell us about the property"
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "propertyType",
                    children: ["Property Type ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    onValueChange: value => setValue("propertyType", value),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      className: "mt-1",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                        placeholder: "Select property type"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "single-family",
                        children: "Single-Family Home"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "condo",
                        children: "Condominium"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "townhouse",
                        children: "Townhouse"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "multi-family",
                        children: "Multi-Family"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "land",
                        children: "Land"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "commercial",
                        children: "Commercial Property"
                      })]
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-2 gap-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                      htmlFor: "bedrooms",
                      children: ["Bedrooms ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-red-500",
                        children: "*"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "bedrooms",
                      type: "number",
                      min: "0",
                      placeholder: "3",
                      ...register("bedrooms", {
                        required: "Bedrooms is required",
                        valueAsNumber: true
                      }),
                      className: "mt-1"
                    }), errors.bedrooms && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-red-500 text-sm mt-1",
                      children: errors.bedrooms.message
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                      htmlFor: "bathrooms",
                      children: ["Bathrooms ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-red-500",
                        children: "*"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "bathrooms",
                      type: "number",
                      min: "0",
                      step: "0.5",
                      placeholder: "2.5",
                      ...register("bathrooms", {
                        required: "Bathrooms is required",
                        valueAsNumber: true
                      }),
                      className: "mt-1"
                    }), errors.bathrooms && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-red-500 text-sm mt-1",
                      children: errors.bathrooms.message
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-2 gap-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                      htmlFor: "squareFeet",
                      children: ["Square Feet ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-red-500",
                        children: "*"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "squareFeet",
                      type: "number",
                      min: "0",
                      placeholder: "2000",
                      ...register("squareFeet", {
                        required: "Square feet is required",
                        valueAsNumber: true
                      }),
                      className: "mt-1"
                    }), errors.squareFeet && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-red-500 text-sm mt-1",
                      children: errors.squareFeet.message
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                      htmlFor: "price",
                      children: ["Price ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-red-500",
                        children: "*"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "price",
                      type: "number",
                      min: "0",
                      placeholder: "450000",
                      ...register("price", {
                        required: "Price is required",
                        valueAsNumber: true
                      }),
                      className: "mt-1"
                    }), errors.price && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-red-500 text-sm mt-1",
                      children: errors.price.message
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-2 gap-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                      htmlFor: "yearBuilt",
                      children: "Year Built"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "yearBuilt",
                      type: "number",
                      min: "1800",
                      max: (/* @__PURE__ */new Date()).getFullYear(),
                      placeholder: "2015",
                      ...register("yearBuilt", {
                        valueAsNumber: true
                      }),
                      className: "mt-1"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                      htmlFor: "lotSize",
                      children: "Lot Size (sq ft)"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "lotSize",
                      type: "number",
                      min: "0",
                      placeholder: "8000",
                      ...register("lotSize", {
                        valueAsNumber: true
                      }),
                      className: "mt-1"
                    })]
                  })]
                })]
              })]
            }), step === 2 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-6 animate-in fade-in slide-in-from-right-4 duration-300",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(MapPin, {
                    className: "w-5 h-5 text-white"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                    className: "text-2xl font-bold",
                    children: "Location & Details"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-gray-600",
                    children: "Where is this property located?"
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "address",
                    children: "Street Address (Optional)"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "address",
                    placeholder: "123 Main Street",
                    ...register("address"),
                    className: "mt-1"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-500 mt-1",
                    children: "Leave blank for privacy"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-2 gap-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                      htmlFor: "city",
                      children: ["City ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-red-500",
                        children: "*"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "city",
                      placeholder: "Miami",
                      ...register("city", {
                        required: "City is required"
                      }),
                      className: "mt-1"
                    }), errors.city && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-red-500 text-sm mt-1",
                      children: errors.city.message
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                      htmlFor: "state",
                      children: ["State ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-red-500",
                        children: "*"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "state",
                      placeholder: "FL",
                      maxLength: 2,
                      ...register("state", {
                        required: "State is required"
                      }),
                      className: "mt-1"
                    }), errors.state && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-red-500 text-sm mt-1",
                      children: errors.state.message
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-2 gap-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                      htmlFor: "neighborhood",
                      children: "Neighborhood"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "neighborhood",
                      placeholder: "Downtown, Waterfront, etc.",
                      ...register("neighborhood"),
                      className: "mt-1"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                      htmlFor: "zipCode",
                      children: "ZIP Code"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "zipCode",
                      placeholder: "33101",
                      ...register("zipCode"),
                      className: "mt-1"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid grid-cols-2 gap-4",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                      htmlFor: "hoa",
                      children: "HOA Fee ($/month)"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "hoa",
                      type: "number",
                      min: "0",
                      placeholder: "150",
                      ...register("hoa", {
                        valueAsNumber: true
                      }),
                      className: "mt-1"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                      htmlFor: "parking",
                      children: "Parking"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                      id: "parking",
                      placeholder: "2-car garage",
                      ...register("parking"),
                      className: "mt-1"
                    })]
                  })]
                })]
              })]
            }), step === 3 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-6 animate-in fade-in slide-in-from-right-4 duration-300",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(Sparkles, {
                    className: "w-5 h-5 text-white"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                    className: "text-2xl font-bold",
                    children: "Property Features"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-gray-600",
                    children: "Select all that apply"
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                    className: "font-semibold text-lg mb-3",
                    children: "Interior Features"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-2 md:grid-cols-3 gap-2",
                    children: featuresByCategory.interior.map(feature => /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                      type: "button",
                      onClick: () => toggleFeature(feature.id),
                      className: `
                      border-2 rounded-lg p-3 text-left transition-all
                      ${selectedFeatures.includes(feature.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}
                    `,
                      children: /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-sm font-medium",
                        children: feature.label
                      })
                    }, feature.id))
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                    className: "font-semibold text-lg mb-3",
                    children: "Exterior Features"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-2 md:grid-cols-3 gap-2",
                    children: featuresByCategory.exterior.map(feature => /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                      type: "button",
                      onClick: () => toggleFeature(feature.id),
                      className: `
                      border-2 rounded-lg p-3 text-left transition-all
                      ${selectedFeatures.includes(feature.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}
                    `,
                      children: /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-sm font-medium",
                        children: feature.label
                      })
                    }, feature.id))
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                    className: "font-semibold text-lg mb-3",
                    children: "Location Features"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-2 md:grid-cols-3 gap-2",
                    children: featuresByCategory.location.map(feature => /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                      type: "button",
                      onClick: () => toggleFeature(feature.id),
                      className: `
                      border-2 rounded-lg p-3 text-left transition-all
                      ${selectedFeatures.includes(feature.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}
                    `,
                      children: /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-sm font-medium",
                        children: feature.label
                      })
                    }, feature.id))
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                    className: "font-semibold text-lg mb-3",
                    children: "Upgrades & Special Features"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-2 md:grid-cols-3 gap-2",
                    children: featuresByCategory.upgrades.map(feature => /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                      type: "button",
                      onClick: () => toggleFeature(feature.id),
                      className: `
                      border-2 rounded-lg p-3 text-left transition-all
                      ${selectedFeatures.includes(feature.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}
                    `,
                      children: /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-sm font-medium",
                        children: feature.label
                      })
                    }, feature.id))
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Label, {
                    htmlFor: "uniqueSellingPoints",
                    children: "Unique Selling Points (Optional)"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Textarea, {
                    id: "uniqueSellingPoints",
                    placeholder: "Describe any unique features not listed above (e.g., custom theater room, wine cellar, guest house)...",
                    rows: 4,
                    ...register("uniqueSellingPoints"),
                    className: "mt-1"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-500 mt-1",
                    children: "These details will be incorporated into your descriptions"
                  })]
                })]
              })]
            }), step === 4 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-6 animate-in fade-in slide-in-from-right-4 duration-300",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(Target, {
                    className: "w-5 h-5 text-white"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                    className: "text-2xl font-bold",
                    children: "Target Buyer"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-gray-600",
                    children: "Who is your ideal buyer?"
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "space-y-3",
                children: [{
                  value: "first-time",
                  label: "First-Time Homebuyers",
                  desc: "Young professionals or couples buying their first home"
                }, {
                  value: "luxury",
                  label: "Luxury Buyers",
                  desc: "Affluent buyers seeking high-end properties"
                }, {
                  value: "investor",
                  label: "Real Estate Investors",
                  desc: "Looking for rental income or appreciation"
                }, {
                  value: "family",
                  label: "Growing Families",
                  desc: "Parents with children needing more space"
                }, {
                  value: "downsizer",
                  label: "Downsizers / Empty Nesters",
                  desc: "Looking for less maintenance and space"
                }, {
                  value: "relocating",
                  label: "Relocating Professionals",
                  desc: "Moving to the area for work"
                }].map(buyer => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  onClick: () => setValue("targetBuyer", buyer.value),
                  className: `
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${watch("targetBuyer") === buyer.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}
                `,
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-start gap-3",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "radio",
                      name: "targetBuyer",
                      value: buyer.value,
                      ...register("targetBuyer", {
                        required: true
                      }),
                      className: "mt-1"
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "font-semibold",
                        children: buyer.label
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "text-sm text-gray-600",
                        children: buyer.desc
                      })]
                    })]
                  })
                }, buyer.value))
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                  className: "font-bold text-blue-900 mb-3",
                  children: "Summary"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "text-sm text-blue-800 space-y-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    children: ["• ", watch("bedrooms"), " bed, ", watch("bathrooms"), " bath ", watch("propertyType")]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    children: ["• ", watch("squareFeet")?.toLocaleString(), " sq ft"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    children: ["• $", watch("price")?.toLocaleString()]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    children: ["• ", watch("city"), ", ", watch("state")]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    children: ["• ", selectedFeatures.length, " features selected"]
                  })]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex justify-between pt-6 border-t",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                type: "button",
                variant: "outline",
                onClick: prevStep,
                disabled: step === 1,
                className: "gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(ArrowLeft, {
                  className: "w-4 h-4"
                }), "Previous"]
              }), step < totalSteps ? /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                type: "button",
                onClick: nextStep,
                className: "gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
                children: ["Next", /* @__PURE__ */jsxRuntimeExports.jsx(ArrowRight, {
                  className: "w-4 h-4"
                })]
              }) : /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                type: "submit",
                className: "gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
                children: ["Generate Descriptions", /* @__PURE__ */jsxRuntimeExports.jsx(Sparkles, {
                  className: "w-4 h-4"
                })]
              })]
            })]
          });
        }
        const STYLE_INFO = {
          luxury: {
            title: "Luxury / Upscale",
            color: "from-amber-500 to-amber-600",
            description: "Sophisticated language for high-end buyers",
            icon: "👑"
          },
          "family-friendly": {
            title: "Family-Friendly",
            color: "from-green-500 to-green-600",
            description: "Warm, emotional appeal for families",
            icon: "🏡"
          },
          investment: {
            title: "Investment-Focused",
            color: "from-blue-500 to-blue-600",
            description: "ROI and numbers for investors",
            icon: "📈"
          }
        };
        function DescriptionDisplay({
          descriptions,
          isLocked = false,
          onUnlock
        }) {
          const [copiedText, setCopiedText] = reactExports.useState(null);
          const [activeStyle, setActiveStyle] = reactExports.useState(0);
          const handleCopy = async (text, label) => {
            try {
              await navigator.clipboard.writeText(text);
              setCopiedText(label);
              ue.success(`${label} copied to clipboard!`);
              setTimeout(() => {
                setCopiedText(null);
              }, 2e3);
            } catch (error) {
              ue.error("Failed to copy text");
            }
          };
          if (descriptions.length === 0) {
            return null;
          }
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center mb-8",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                className: "text-2xl font-bold mb-2",
                children: "Your AI-Generated Descriptions"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-gray-600",
                children: isLocked ? "Preview one description - unlock all 3 styles + multiple formats" : "Choose your favorite or customize to your needs"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "grid md:grid-cols-3 gap-4 mb-6",
              children: descriptions.map((desc, index) => {
                const styleInfo = STYLE_INFO[desc.style];
                const isActive = activeStyle === index;
                const isPreview = isLocked && index > 0;
                return /* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                  onClick: () => !isPreview && setActiveStyle(index),
                  disabled: isPreview,
                  className: `
                relative p-6 rounded-lg border-2 transition-all text-left
                ${isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}
                ${isPreview ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `,
                  children: [isPreview && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Lock, {
                      className: "w-8 h-8 text-gray-400"
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "text-3xl mb-2",
                    children: styleInfo.icon
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                    className: "font-bold text-lg mb-1",
                    children: styleInfo.title
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-600",
                    children: styleInfo.description
                  })]
                }, index);
              })
            }), descriptions[activeStyle] && /* @__PURE__ */jsxRuntimeExports.jsxs(Tabs, {
              defaultValue: "mls",
              className: "w-full",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsList, {
                className: "grid w-full grid-cols-5",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "mls",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(FileText, {
                    className: "w-4 h-4"
                  }), "MLS"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "instagram",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Instagram, {
                    className: "w-4 h-4"
                  }), "Instagram"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "facebook",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Facebook, {
                    className: "w-4 h-4"
                  }), "Facebook"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "email",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Mail, {
                    className: "w-4 h-4"
                  }), "Email"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(TabsTrigger, {
                  value: "sms",
                  className: "gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(MessageSquare, {
                    className: "w-4 h-4"
                  }), "SMS"]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "mls",
                className: "space-y-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-white rounded-lg border border-gray-200 p-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "font-bold text-lg",
                        children: "Full MLS Description"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-sm text-gray-600",
                        children: [descriptions[activeStyle].wordCount, " words • ", descriptions[activeStyle].characterCount, " characters"]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      onClick: () => handleCopy(descriptions[activeStyle].mlsDescription, "MLS Description"),
                      variant: "outline",
                      className: "gap-2",
                      children: copiedText === "MLS Description" ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                          className: "w-4 h-4 text-green-500"
                        }), "Copied"]
                      }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                          className: "w-4 h-4"
                        }), "Copy"]
                      })
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "prose prose-sm max-w-none",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "bg-gray-50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap leading-relaxed",
                      children: descriptions[activeStyle].mlsDescription
                    })
                  }), descriptions[activeStyle].powerWords && descriptions[activeStyle].powerWords.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "mt-4 pt-4 border-t border-gray-200",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-sm font-semibold text-gray-700 mb-2",
                      children: "Power Words Used:"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "flex flex-wrap gap-2",
                      children: descriptions[activeStyle].powerWords.map((word, i) => /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium",
                        children: word
                      }, i))
                    })]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "instagram",
                className: "space-y-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-white rounded-lg border border-gray-200 p-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "font-bold text-lg",
                        children: "Instagram Caption"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm text-gray-600",
                        children: "Perfect for posts and stories"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      onClick: () => handleCopy(descriptions[activeStyle].instagramCaption, "Instagram Caption"),
                      variant: "outline",
                      className: "gap-2",
                      children: copiedText === "Instagram Caption" ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                          className: "w-4 h-4 text-green-500"
                        }), "Copied"]
                      }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                          className: "w-4 h-4"
                        }), "Copy"]
                      })
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "whitespace-pre-wrap leading-relaxed",
                      children: descriptions[activeStyle].instagramCaption
                    })
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "facebook",
                className: "space-y-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-white rounded-lg border border-gray-200 p-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "font-bold text-lg",
                        children: "Facebook Post"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm text-gray-600",
                        children: "Optimized for Facebook reach"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      onClick: () => handleCopy(descriptions[activeStyle].facebookPost, "Facebook Post"),
                      variant: "outline",
                      className: "gap-2",
                      children: copiedText === "Facebook Post" ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                          className: "w-4 h-4 text-green-500"
                        }), "Copied"]
                      }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                          className: "w-4 h-4"
                        }), "Copy"]
                      })
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "bg-blue-50 rounded-lg p-4 border border-blue-200",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "whitespace-pre-wrap leading-relaxed",
                      children: descriptions[activeStyle].facebookPost
                    })
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "email",
                className: "space-y-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-white rounded-lg border border-gray-200 p-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "font-bold text-lg",
                        children: "Email Version"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm text-gray-600",
                        children: "For listing announcements and newsletters"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      onClick: () => handleCopy(descriptions[activeStyle].emailVersion, "Email Version"),
                      variant: "outline",
                      className: "gap-2",
                      children: copiedText === "Email Version" ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                          className: "w-4 h-4 text-green-500"
                        }), "Copied"]
                      }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                          className: "w-4 h-4"
                        }), "Copy"]
                      })
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "bg-gray-50 rounded-lg p-4 border border-gray-200",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "whitespace-pre-wrap leading-relaxed",
                      children: descriptions[activeStyle].emailVersion
                    })
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx(TabsContent, {
                value: "sms",
                className: "space-y-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-white rounded-lg border border-gray-200 p-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "font-bold text-lg",
                        children: "SMS Snippet"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-sm text-gray-600",
                        children: "160 characters - perfect for text messages"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      onClick: () => handleCopy(descriptions[activeStyle].smsSnippet, "SMS Snippet"),
                      variant: "outline",
                      className: "gap-2",
                      children: copiedText === "SMS Snippet" ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                          className: "w-4 h-4 text-green-500"
                        }), "Copied"]
                      }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                          className: "w-4 h-4"
                        }), "Copy"]
                      })
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "bg-green-50 rounded-lg p-4 border border-green-200",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "whitespace-pre-wrap leading-relaxed font-mono text-sm",
                      children: descriptions[activeStyle].smsSnippet
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "mt-2 text-xs text-gray-600",
                      children: [descriptions[activeStyle].smsSnippet.length, "/160 characters"]
                    })]
                  })]
                })
              })]
            }), !isLocked && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "font-bold text-blue-900 mb-3",
                children: "💡 Pro Tips"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("ul", {
                className: "space-y-2 text-sm text-blue-800",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                    className: "w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    children: "Customize these descriptions to match your personal style"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                    className: "w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    children: "Mix and match sections from different styles"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                    className: "w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    children: "Add specific room dimensions for more detail"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                    className: "w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    children: "Update seasonal details (fall colors, spring blooms, etc.)"
                  })]
                })]
              })]
            }), isLocked && onUnlock && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "text-center mt-8",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                onClick: onUnlock,
                size: "lg",
                className: "gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Lock, {
                  className: "w-5 h-5"
                }), "Unlock All 3 Styles + Multiple Formats"]
              })
            })]
          });
        }
        function EmailCaptureModal({
          isOpen,
          onClose,
          onSubmit,
          listingId
        }) {
          const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
          const {
            register,
            handleSubmit,
            formState: {
              errors
            }
          } = useForm();
          const handleFormSubmit = async data => {
            setIsSubmitting(true);
            try {
              const captureData = {
                ...data,
                listingId,
                capturedAt: (/* @__PURE__ */new Date()).toISOString()
              };
              await onSubmit(captureData);
              ue.success("Success! All descriptions are now unlocked 🎉");
            } catch (error) {
              ue.error("Something went wrong. Please try again.");
            } finally {
              setIsSubmitting(false);
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx(Dialog, {
            open: isOpen,
            onOpenChange: onClose,
            children: /* @__PURE__ */jsxRuntimeExports.jsxs(DialogContent, {
              className: "max-w-2xl max-h-[90vh] overflow-y-auto",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "bg-gradient-to-r from-blue-500 to-purple-500 -mx-6 -mt-6 p-8 text-white mb-6",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-3 mb-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-12 h-12 bg-white/20 rounded-full flex items-center justify-center",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(LockOpen, {
                      className: "w-6 h-6"
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(DialogTitle, {
                      className: "text-2xl font-bold text-white",
                      children: "Unlock All 3 Styles + Bonuses"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(DialogDescription, {
                      className: "text-blue-100",
                      children: "Get complete access to all description formats and bonus resources"
                    })]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4 mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                  className: "font-bold text-lg flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Gift, {
                    className: "w-5 h-5 text-blue-600"
                  }), "Here's What You'll Get Instantly:"]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "grid gap-3",
                  children: [{
                    icon: FileText,
                    title: "All 3 Writing Styles",
                    desc: "Luxury, Family-Friendly, and Investment-Focused descriptions"
                  }, {
                    icon: Sparkles,
                    title: "5 Formats Per Style (15 total)",
                    desc: "MLS, Instagram, Facebook, Email, and SMS versions"
                  }, {
                    icon: Lightbulb,
                    title: "50 Power Words for Real Estate",
                    desc: "PDF guide with proven words that sell properties faster"
                  }, {
                    icon: TrendingUp,
                    title: "Listing Photography Checklist",
                    desc: "25-point checklist for photos that get more showings"
                  }, {
                    icon: CircleCheckBig,
                    title: "Pricing Strategy Guide",
                    desc: "Data-driven strategies to price listings competitively"
                  }, {
                    icon: Star,
                    title: "Weekly Marketing Tips",
                    desc: "Email newsletter with proven listing marketing strategies"
                  }].map((item, index) => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(item.icon, {
                        className: "w-4 h-4 text-blue-600"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "font-semibold text-gray-900",
                        children: item.title
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "text-sm text-gray-600",
                        children: item.desc
                      })]
                    })]
                  }, index))
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-start gap-3",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "flex text-yellow-400",
                    children: [1, 2, 3, 4, 5].map(star => /* @__PURE__ */jsxRuntimeExports.jsx(Star, {
                      className: "w-4 h-4 fill-current"
                    }, star))
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-sm italic text-gray-700 mb-1",
                      children: '"This AI tool writes better descriptions than I ever could. Saved me hours and my listings are getting way more interest!"'
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-xs font-semibold text-gray-600",
                      children: "- Sarah M., Top Producer in Austin, TX"
                    })]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("form", {
                onSubmit: handleSubmit(handleFormSubmit),
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "email",
                    children: ["Email Address ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "email",
                    type: "email",
                    placeholder: "you@example.com",
                    ...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    }),
                    className: "mt-1"
                  }), errors.email && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-red-500 text-sm mt-1",
                    children: errors.email.message
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "firstName",
                    children: ["First Name ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "firstName",
                    placeholder: "John",
                    ...register("firstName", {
                      required: "First name is required"
                    }),
                    className: "mt-1"
                  }), errors.firstName && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-red-500 text-sm mt-1",
                    children: errors.firstName.message
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "brokerageName",
                    children: ["Brokerage ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-gray-400",
                      children: "(Optional)"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "brokerageName",
                    placeholder: "Keller Williams, Coldwell Banker, etc.",
                    ...register("brokerageName"),
                    className: "mt-1"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "phoneNumber",
                    children: ["Phone Number ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-gray-400",
                      children: "(Optional)"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "phoneNumber",
                    type: "tel",
                    placeholder: "(555) 123-4567",
                    ...register("phoneNumber"),
                    className: "mt-1"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                      className: "w-4 h-4 text-green-500"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      children: "Join 4,200+ agents using AI for listing descriptions"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                      className: "w-4 h-4 text-green-500"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      children: "No spam. Unsubscribe anytime."
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                      className: "w-4 h-4 text-green-500"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      children: "Your data is secure and never shared"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  type: "submit",
                  disabled: isSubmitting,
                  className: "w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg py-6",
                  children: isSubmitting ? /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    }), "Unlocking..."]
                  }) : /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(LockOpen, {
                      className: "w-5 h-5"
                    }), "Unlock All Descriptions + Bonuses"]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-xs text-center text-gray-500",
                  children: "By submitting, you agree to receive helpful listing marketing tips and information about AgentBio. You can unsubscribe at any time."
                })]
              })]
            })
          });
        }
        function SocialShare({
          propertyAddress,
          city,
          state,
          price,
          propertyType,
          description
        }) {
          const [copied, setCopied] = reactExports.useState(false);
          const [downloading, setDownloading] = reactExports.useState(false);
          const shareTexts = {
            facebook: `🏠 NEW LISTING ALERT!

${propertyAddress}
${city}, ${state}
💰 $${price.toLocaleString()}

${description.substring(0, 200)}...

DM me for details or schedule a showing! 🔑`,
            linkedin: `🏡 Excited to share this exceptional ${propertyType} in ${city}!

📍 ${propertyAddress}
💵 Listed at $${price.toLocaleString()}

${description.substring(0, 150)}...

Reach out if you or someone you know is looking in this area. Let's connect! #RealEstate #${city.replace(/\s+/g, "")}`,
            twitter: `🏠 Just listed in ${city}! $${price.toLocaleString()}

${description.substring(0, 120)}...

DM for details! #RealEstate #${city.replace(/\s+/g, "")} #NewListing`,
            instagram: `🏠 NEW LISTING 🔑

${city}, ${state}
💰 $${price.toLocaleString()}

${description.substring(0, 100)}...

DM me for details!

#realestate #${city.toLowerCase().replace(/\s+/g, "")}realestate #newhome #dreamhome #househunting #realtor #listingalert`,
            email: `Subject: New Listing Alert - ${propertyAddress}

Hi [Name],

I wanted to reach out about an incredible property that just hit the market in ${city}:

${propertyAddress}
${city}, ${state}
$${price.toLocaleString()}

${description}

Would you like to schedule a showing? I have availability this week.

Best regards,
[Your Name]`
          };
          const handleCopyDescription = async () => {
            try {
              await navigator.clipboard.writeText(description);
              setCopied(true);
              ue.success("Description copied to clipboard!");
              setTimeout(() => setCopied(false), 2e3);
            } catch (error) {
              ue.error("Failed to copy description");
            }
          };
          const handleShare = platform => {
            const urls = {
              facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareTexts.facebook)}`,
              linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
              twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTexts.twitter)}`
            };
            window.open(urls[platform], "_blank", "width=600,height=400");
            trackShare(platform);
          };
          const handleCopyPost = async platform => {
            try {
              await navigator.clipboard.writeText(shareTexts[platform]);
              ue.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} post copied!`);
              trackShare(`copy-${platform}`);
            } catch (error) {
              ue.error("Failed to copy post");
            }
          };
          const handleDownloadDescription = () => {
            setDownloading(true);
            const content = `${propertyAddress}
${city}, ${state}
$${price.toLocaleString()}

${description}

---
Generated by AgentBio.net Listing Description Generator
Create your own: https://agentbio.net/tools/listing-description-generator`;
            const blob = new Blob([content], {
              type: "text/plain"
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${city.replace(/\s+/g, "-")}-listing-${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setTimeout(() => setDownloading(false), 1e3);
            ue.success("Description downloaded!");
            trackShare("download");
          };
          const trackShare = platform => {
            console.log("Share tracked:", platform);
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
              className: "p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                className: "text-lg font-semibold mb-4 flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Share2, {
                  className: "h-5 w-5 text-purple-600"
                }), "Share This Listing"]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-3",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: handleCopyDescription,
                  variant: "outline",
                  className: "justify-start gap-2",
                  children: [copied ? /* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                    className: "h-4 w-4 text-green-600"
                  }) : /* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                    className: "h-4 w-4"
                  }), copied ? "Copied!" : "Copy Full Description"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: handleDownloadDescription,
                  variant: "outline",
                  className: "justify-start gap-2",
                  disabled: downloading,
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Download, {
                    className: "h-4 w-4"
                  }), downloading ? "Downloading..." : "Download as TXT"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: () => handleShare("facebook"),
                  variant: "outline",
                  className: "justify-start gap-2 text-blue-600 hover:text-blue-700",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Facebook, {
                    className: "h-4 w-4"
                  }), "Share on Facebook"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: () => handleShare("linkedin"),
                  variant: "outline",
                  className: "justify-start gap-2 text-blue-700 hover:text-blue-800",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Linkedin, {
                    className: "h-4 w-4"
                  }), "Share on LinkedIn"]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: () => handleShare("twitter"),
                  variant: "outline",
                  className: "justify-start gap-2 text-sky-500 hover:text-sky-600",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Twitter, {
                    className: "h-4 w-4"
                  }), "Share on Twitter"]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
              className: "p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "text-lg font-semibold mb-4",
                children: "Pre-Written Social Posts"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm text-gray-600 mb-4",
                children: "Click to copy these ready-to-use posts for each platform:"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "border rounded-lg p-4 bg-gray-50",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-2 font-medium",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Facebook, {
                        className: "h-4 w-4 text-blue-600"
                      }), "Facebook"]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                      size: "sm",
                      variant: "ghost",
                      onClick: () => handleCopyPost("facebook"),
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                        className: "h-3 w-3 mr-1"
                      }), "Copy"]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-700 whitespace-pre-line",
                    children: shareTexts.facebook
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "border rounded-lg p-4 bg-gray-50",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-2 font-medium",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("svg", {
                        className: "h-4 w-4",
                        viewBox: "0 0 24 24",
                        fill: "url(#instagram-gradient)",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("defs", {
                          children: /* @__PURE__ */jsxRuntimeExports.jsxs("linearGradient", {
                            id: "instagram-gradient",
                            x1: "0%",
                            y1: "0%",
                            x2: "100%",
                            y2: "100%",
                            children: [/* @__PURE__ */jsxRuntimeExports.jsx("stop", {
                              offset: "0%",
                              stopColor: "#f09433"
                            }), /* @__PURE__ */jsxRuntimeExports.jsx("stop", {
                              offset: "25%",
                              stopColor: "#e6683c"
                            }), /* @__PURE__ */jsxRuntimeExports.jsx("stop", {
                              offset: "50%",
                              stopColor: "#dc2743"
                            }), /* @__PURE__ */jsxRuntimeExports.jsx("stop", {
                              offset: "75%",
                              stopColor: "#cc2366"
                            }), /* @__PURE__ */jsxRuntimeExports.jsx("stop", {
                              offset: "100%",
                              stopColor: "#bc1888"
                            })]
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("path", {
                          d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                        })]
                      }), "Instagram"]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                      size: "sm",
                      variant: "ghost",
                      onClick: () => handleCopyPost("instagram"),
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                        className: "h-3 w-3 mr-1"
                      }), "Copy"]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-700 whitespace-pre-line",
                    children: shareTexts.instagram
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "border rounded-lg p-4 bg-gray-50",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-2 font-medium",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Linkedin, {
                        className: "h-4 w-4 text-blue-700"
                      }), "LinkedIn"]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                      size: "sm",
                      variant: "ghost",
                      onClick: () => handleCopyPost("linkedin"),
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                        className: "h-3 w-3 mr-1"
                      }), "Copy"]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-700 whitespace-pre-line",
                    children: shareTexts.linkedin
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "border rounded-lg p-4 bg-gray-50",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-2 font-medium",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("svg", {
                        className: "h-4 w-4",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /* @__PURE__ */jsxRuntimeExports.jsx("path", {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: 2,
                          d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        })
                      }), "Email Template"]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                      size: "sm",
                      variant: "ghost",
                      onClick: () => handleCopyPost("email"),
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                        className: "h-3 w-3 mr-1"
                      }), "Copy"]
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-700 whitespace-pre-line font-mono text-xs",
                    children: shareTexts.email
                  })]
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
              className: "p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "text-lg font-semibold mb-2",
                children: "Love this tool? Share it!"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                className: "text-sm text-gray-700 mb-4",
                children: ["Share the AI Listing Description Generator with 3 colleagues and get our ", /* @__PURE__ */jsxRuntimeExports.jsx("strong", {
                  children: "Premium Real Estate Photography Checklist"
                }), " (worth $97) for free!"]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                onClick: () => handleCopyPost("email"),
                className: "w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                children: "Share with Colleagues"
              })]
            })]
          });
        }
        function ListingDescriptionGenerator() {
          const [currentStep, setCurrentStep] = reactExports.useState("intro");
          const [propertyDetails, setPropertyDetails] = reactExports.useState(null);
          const [descriptions, setDescriptions] = reactExports.useState([]);
          const [isUnlocked, setIsUnlocked] = reactExports.useState(false);
          const [showEmailModal, setShowEmailModal] = reactExports.useState(false);
          const [listingId, setListingId] = reactExports.useState("");
          const [sessionId] = reactExports.useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
          const trackEvent = async (eventType, eventData) => {
            try {
              await supabase.from("listing_generator_analytics").insert({
                event_type: eventType,
                event_data: eventData || {},
                session_id: sessionId,
                user_agent: navigator.userAgent,
                referrer: document.referrer
              });
            } catch (error) {
              console.error("Analytics tracking error:", error);
            }
          };
          const handleFormSubmit = async details => {
            setPropertyDetails(details);
            setCurrentStep("generating");
            await trackEvent("generator_started", {
              propertyType: details.propertyType,
              city: details.city,
              state: details.state,
              price: details.price,
              targetBuyer: details.targetBuyer
            });
            try {
              const {
                data,
                error
              } = await supabase.functions.invoke("generate-listing-description", {
                body: {
                  propertyDetails: details
                }
              });
              if (error) throw error;
              const {
                data: savedListing,
                error: saveError
              } = await supabase.from("listing_descriptions").insert({
                property_details: details,
                descriptions: data.descriptions,
                session_id: sessionId
              }).select().single();
              if (saveError) throw saveError;
              setListingId(savedListing.id);
              setDescriptions(data.descriptions);
              setCurrentStep("results");
              await trackEvent("generator_completed", {
                listingId: savedListing.id,
                stylesGenerated: data.descriptions.length
              });
              ue.success("Descriptions generated successfully!");
            } catch (error) {
              console.error("Generation error:", error);
              ue.error("Failed to generate descriptions. Please try again.");
              setCurrentStep("form");
            }
          };
          const handleEmailCapture = async data => {
            try {
              const {
                data: captureData,
                error: captureError
              } = await supabase.from("listing_email_captures").insert({
                listing_id: listingId,
                email: data.email,
                first_name: data.firstName,
                brokerage_name: data.brokerageName,
                phone_number: data.phoneNumber
              }).select().single();
              if (captureError) throw captureError;
              try {
                await supabase.functions.invoke("send-listing-generator-email", {
                  body: {
                    email: data.email,
                    firstName: data.firstName,
                    propertyDetails,
                    descriptions,
                    listingId
                  }
                });
              } catch (emailError) {
                console.error("Email send error:", emailError);
              }
              setIsUnlocked(true);
              setShowEmailModal(false);
              await trackEvent("email_captured", {
                listingId,
                email: data.email
              });
              ue.success("Success! All 3 styles unlocked. Check your email for your complete guide!");
            } catch (error) {
              console.error("Email capture error:", error);
              ue.error("Failed to capture email. Please try again.");
            }
          };
          const handleDescriptionCopy = async (style, format) => {
            await trackEvent("description_copied", {
              listingId,
              style,
              format
            });
          };
          const renderIntro = () => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "max-w-4xl mx-auto",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center mb-12",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Sparkles, {
                  className: "h-4 w-4 text-purple-600"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "text-sm font-medium text-purple-900",
                  children: "Free AI Tool for Real Estate Agents"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                className: "text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent",
                children: "AI Listing Description Generator"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                className: "text-lg text-gray-700 mb-4 max-w-3xl mx-auto leading-relaxed",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("strong", {
                  children: "The AI Listing Description Generator is a free tool that creates professional real estate property descriptions in three distinct writing styles (Luxury, Family-Friendly, and Investment) in under 60 seconds."
                }), " Simply input your property details—address, price, beds/baths, square footage, and key features—and select your target buyer type. The AI instantly generates complete MLS listing copy (300-500 words) plus ready-to-use versions for Instagram, Facebook, LinkedIn, email marketing, and SMS campaigns. Real estate agents save 2+ hours per listing compared to writing descriptions from scratch, while getting professionally crafted copy that highlights key features, creates emotional connections, and drives more showings."]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                className: "text-base text-gray-600 mb-8 max-w-2xl mx-auto",
                children: ["Want to showcase your listings effectively?", " ", /* @__PURE__ */jsxRuntimeExports.jsx("a", {
                  href: "/features/property-listings",
                  className: "text-purple-600 underline hover:text-purple-700 font-semibold",
                  children: "Learn about AgentBio's property listing galleries →"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                onClick: () => {
                  setCurrentStep("form");
                  trackEvent("intro_cta_clicked");
                },
                size: "lg",
                className: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg",
                children: ["Generate My Listing Descriptions", /* @__PURE__ */jsxRuntimeExports.jsx(Sparkles, {
                  className: "ml-2 h-5 w-5"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm text-gray-500 mt-4",
                children: "No credit card required • Takes 2 minutes • Get 3 complete style options"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "grid md:grid-cols-3 gap-6 mb-12",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                className: "p-6 text-center",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(FileText, {
                    className: "h-6 w-6 text-purple-600"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                  className: "font-semibold mb-2",
                  children: "3 Professional Styles"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: "Luxury, Family-Friendly, and Investment styles tailored to your target buyer"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                className: "p-6 text-center",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-lg mb-4",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                    className: "h-6 w-6 text-pink-600"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                  className: "font-semibold mb-2",
                  children: "15 Ready-to-Use Formats"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: "MLS, Instagram, Facebook, Email, SMS - all formats for every marketing channel"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Card, {
                className: "p-6 text-center",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(Users, {
                    className: "h-6 w-6 text-purple-600"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                  className: "font-semibold mb-2",
                  children: "Buyer Psychology"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600",
                  children: "AI-powered language that triggers emotions and drives action from qualified buyers"
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
              className: "p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "text-center",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-3xl font-bold text-gray-900 mb-2",
                  children: "4,200+ agents"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-gray-600 mb-6",
                  children: "are already using AI to write better listings in less time"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "grid md:grid-cols-3 gap-6 text-left",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "bg-white p-4 rounded-lg",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-sm text-gray-600 italic mb-2",
                      children: `"This tool saves me at least 2 hours per listing. The luxury style is chef's kiss!"`
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-xs font-medium",
                      children: "— Sarah M., Beverly Hills"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "bg-white p-4 rounded-lg",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-sm text-gray-600 italic mb-2",
                      children: '"I used to dread writing descriptions. Now I generate 3 versions in under a minute!"'
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-xs font-medium",
                      children: "— Mike T., Austin"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "bg-white p-4 rounded-lg",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-sm text-gray-600 italic mb-2",
                      children: '"My listings get 3x more engagement since using the family-friendly style. Game changer."'
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-xs font-medium",
                      children: "— Jennifer L., Denver"
                    })]
                  })]
                })]
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "mt-12 text-sm text-gray-600 space-y-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                className: "text-2xl font-bold text-gray-900 mb-4",
                children: "Why Real Estate Agents Need AI Listing Description Generators"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                children: "Writing compelling real estate listing descriptions is one of the most time-consuming tasks for agents. A great listing description can make the difference between a property sitting on the market for months or receiving multiple offers within days. Our AI listing description generator uses advanced natural language processing to create professional, emotionally resonant descriptions that speak directly to your target buyer's desires and needs."
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                children: "Whether you're marketing a luxury estate, a family-friendly suburban home, or an investment property, our AI generates descriptions in three distinct styles optimized for different buyer personas. Each description is carefully crafted to highlight key features, create emotional connections, and include powerful calls-to-action that drive showings and offers."
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                children: "Beyond just MLS descriptions, you'll receive ready-to-post content for Instagram, Facebook, LinkedIn, email campaigns, and SMS marketing - all generated in seconds. Stop spending hours writing listing copy and start focusing on what you do best: selling homes."
              })]
            })]
          });
          const renderGenerating = () => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "max-w-2xl mx-auto text-center py-16",
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "animate-pulse mb-8",
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Sparkles, {
                className: "h-16 w-16 text-purple-600 mx-auto mb-4"
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsx("h2", {
              className: "text-2xl font-bold mb-4",
              children: "Generating Your Descriptions..."
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-3 text-left max-w-md mx-auto",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 text-gray-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-2 h-2 bg-purple-600 rounded-full animate-pulse"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  children: "Analyzing property details..."
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 text-gray-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-2 h-2 bg-purple-600 rounded-full animate-pulse",
                  style: {
                    animationDelay: "0.2s"
                  }
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  children: "Crafting luxury style description..."
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 text-gray-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-2 h-2 bg-purple-600 rounded-full animate-pulse",
                  style: {
                    animationDelay: "0.4s"
                  }
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  children: "Creating family-friendly version..."
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 text-gray-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-2 h-2 bg-purple-600 rounded-full animate-pulse",
                  style: {
                    animationDelay: "0.6s"
                  }
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  children: "Optimizing investment style..."
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 text-gray-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-2 h-2 bg-purple-600 rounded-full animate-pulse",
                  style: {
                    animationDelay: "0.8s"
                  }
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  children: "Generating social media posts..."
                })]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-gray-500 mt-8",
              children: "This usually takes 15-30 seconds..."
            })]
          });
          const renderResults = () => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "max-w-6xl mx-auto",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between mb-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                variant: "ghost",
                onClick: () => {
                  setCurrentStep("form");
                  setDescriptions([]);
                  setIsUnlocked(false);
                },
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(ArrowLeft, {
                  className: "h-4 w-4 mr-2"
                }), "Generate Another"]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "text-sm text-gray-600",
                children: propertyDetails && /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                  children: [propertyDetails.city, ", ", propertyDetails.state, " • $", propertyDetails.price.toLocaleString()]
                })
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
              className: "p-6 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-start gap-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "flex-shrink-0",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-10 h-10 bg-green-100 rounded-full flex items-center justify-center",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Sparkles, {
                      className: "h-5 w-5 text-green-600"
                    })
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                    className: "font-semibold text-green-900 mb-1",
                    children: "Your Descriptions Are Ready!"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-green-700",
                    children: isUnlocked ? "All 3 professional styles unlocked. Scroll down to view, copy, and share." : "Preview the first style below. Enter your email to unlock all 3 styles + bonus content!"
                  })]
                })]
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsx(DescriptionDisplay, {
              descriptions,
              isUnlocked,
              onUnlockClick: () => setShowEmailModal(true),
              onCopy: handleDescriptionCopy
            }), isUnlocked && propertyDetails && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "mt-8",
              children: /* @__PURE__ */jsxRuntimeExports.jsx(SocialShare, {
                propertyAddress: propertyDetails.address || `${propertyDetails.city} Property`,
                city: propertyDetails.city,
                state: propertyDetails.state,
                price: propertyDetails.price,
                propertyType: propertyDetails.propertyType,
                description: descriptions[0]?.mlsDescription || ""
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsx(Card, {
              className: "p-8 mt-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "text-center",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                  className: "text-2xl font-bold mb-2",
                  children: "Want AI-Powered Marketing for Every Listing?"
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                  className: "text-gray-700 mb-6",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("a", {
                    href: "/for-real-estate-agents",
                    className: "text-purple-600 underline hover:text-purple-700 font-semibold",
                    children: "AgentBio"
                  }), " ", "creates your entire marketing presence - Instagram bios, link-in-bio pages, content calendars, and automated follow-up - all optimized to convert followers to clients."]
                }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  size: "lg",
                  className: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                  onClick: () => {
                    window.location.href = "/register?utm_source=listing-generator&utm_medium=cta";
                    trackEvent("trial_clicked");
                  },
                  children: "Start Your Free 14-Day Trial"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-sm text-gray-600 mt-3",
                  children: "No credit card required • Cancel anytime • 4,200+ agents trust AgentBio"
                })]
              })
            })]
          });
          const toolUrl = typeof window !== "undefined" ? `${window.location.origin}/tools/listing-description-generator` : "https://agentbio.net/tools/listing-description-generator";
          const schema = {
            "@context": "https://schema.org",
            "@graph": [{
              "@type": "WebPage",
              "name": "Free AI Listing Description Generator for Real Estate",
              "description": "Generate professional real estate listing descriptions in 3 styles using AI. Get MLS descriptions, social media posts, email copy, and SMS snippets in under 60 seconds.",
              "url": toolUrl
            }, {
              "@type": "HowTo",
              "name": "How to Generate Real Estate Listing Descriptions with AI",
              "description": "Step-by-step guide to creating professional property listing descriptions using AI for MLS, social media, and marketing.",
              "step": [{
                "@type": "HowToStep",
                "name": "Enter Property Details",
                "text": "Input basic property information including address, price, bedrooms, bathrooms, square footage, property type, and key features."
              }, {
                "@type": "HowToStep",
                "name": "Select Target Buyer",
                "text": "Choose your target buyer type: luxury buyer, first-time homebuyer, family, investor, or downsizer to tailor the language and focus."
              }, {
                "@type": "HowToStep",
                "name": "Generate 3 Professional Styles",
                "text": "Receive three distinct listing description styles in seconds: Luxury (upscale, sophisticated), Family-Friendly (warm, lifestyle-focused), and Investment (ROI-driven, practical)."
              }, {
                "@type": "HowToStep",
                "name": "Copy & Use Across Channels",
                "text": "Get ready-to-use descriptions for MLS, Instagram, Facebook, LinkedIn, email campaigns, and SMS marketing. One-click copy for each format."
              }]
            }, {
              "@type": "FAQPage",
              "mainEntity": [{
                "@type": "Question",
                "name": "How does the AI listing description generator work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The AI listing description generator uses advanced natural language processing to analyze your property details and create professional descriptions optimized for your target buyer. You input basic property information (address, price, beds/baths, features) and select your target buyer type. The AI then generates three distinct writing styles—Luxury, Family-Friendly, and Investment—each with complete MLS descriptions, social media posts, email copy, and SMS snippets. The entire process takes under 60 seconds."
                }
              }, {
                "@type": "Question",
                "name": "What formats do I get with the AI generator?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "For each of the 3 styles (Luxury, Family-Friendly, Investment), you receive: Full MLS listing description (300-500 words), Instagram post caption, Facebook post copy, LinkedIn professional summary, Email marketing template, and SMS text snippet. That's 15+ different formats total, all professionally written and ready to copy-paste into your marketing channels."
                }
              }, {
                "@type": "Question",
                "name": "Is the listing description generator free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, the AI listing description generator is completely free to use. You can generate descriptions for unlimited properties with no cost. Simply enter your property details and receive all 3 professional styles with 15+ ready-to-use formats. To receive your descriptions via email for future reference, you can optionally provide your email address."
                }
              }, {
                "@type": "Question",
                "name": "Can I edit the AI-generated descriptions?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, all generated descriptions are fully editable. The AI provides professional, compelling copy as your starting point, which you can customize with specific details, local market information, or your personal writing style. Most agents use the AI output as-is or with minor tweaks, saving 2+ hours per listing compared to writing from scratch."
                }
              }, {
                "@type": "Question",
                "name": "What makes a good real estate listing description?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A good real estate listing description includes: an attention-grabbing opening line, specific property features (beds, baths, square footage, lot size), lifestyle benefits tailored to your target buyer, neighborhood and location highlights, unique selling points, emotional triggers that create desire, a strong call-to-action, and SEO-optimized keywords for online visibility. Our AI generator incorporates all these elements automatically based on your property details and target buyer selection."
                }
              }]
            }]
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Helmet, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("title", {
                children: "Free AI Listing Description Generator for Real Estate | AgentBio"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "description",
                content: "Generate professional real estate listing descriptions in 3 styles using AI. Get MLS descriptions, social media posts, email copy, and SMS snippets in under 60 seconds. Free tool for agents."
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "keywords",
                content: "AI listing description generator, real estate property description, MLS listing copy, property description generator, real estate AI tools"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("script", {
                type: "application/ld+json",
                children: JSON.stringify(schema)
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4",
              children: [currentStep === "intro" && renderIntro(), currentStep === "form" && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "max-w-4xl mx-auto",
                children: /* @__PURE__ */jsxRuntimeExports.jsx(PropertyDetailsForm, {
                  onSubmit: handleFormSubmit
                })
              }), currentStep === "generating" && renderGenerating(), currentStep === "results" && renderResults(), /* @__PURE__ */jsxRuntimeExports.jsx(EmailCaptureModal, {
                isOpen: showEmailModal,
                onClose: () => setShowEmailModal(false),
                onSubmit: handleEmailCapture
              })]
            })]
          });
        }
      }
    };
  });
})();
