;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './forms-legacy-BImVIBp0.js', './icons-legacy-C8x4ypXf.js', './utils-legacy-B2316hnE.js', './supabase-legacy-CQONYrP8.js', './charts-legacy-D2SqRQVB.js'], function (exports, module) {
    'use strict';

    var reactExports, jsxRuntimeExports, React, Label, Input, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Checkbox, Button, Dialog, DialogContent, DialogTitle, DialogDescription, Helmet, useForm, Instagram, TrendingUp$1, ArrowLeft, ArrowRight, CircleAlert, TrendingDown, Link, Award, MapPin, MessageSquare, Sparkles, Eye, CircleCheckBig, Lightbulb, Lock, Check, Copy, EllipsisVertical, User, Grid3x3, LockOpen, Star, Gift, FileText, Calendar, Facebook, Linkedin, Twitter, Download, Share2, Target, Users, DollarSign, ue, supabase;
    return {
      setters: [module => {
        reactExports = module.r;
        jsxRuntimeExports = module.j;
        React = module.R;
      }, module => {
        Label = module.L;
        Input = module.I;
        Textarea = module.T;
        Select = module.S;
        SelectTrigger = module.a;
        SelectValue = module.b;
        SelectContent = module.d;
        SelectItem = module.e;
        Checkbox = module.z;
        Button = module.j;
        Dialog = module.D;
        DialogContent = module.l;
        DialogTitle = module.n;
        DialogDescription = module.G;
        Helmet = module.x;
      }, module => {
        useForm = module.u;
      }, module => {
        Instagram = module.I;
        TrendingUp$1 = module.T;
        ArrowLeft = module.a2;
        ArrowRight = module.A;
        CircleAlert = module.c;
        TrendingDown = module.ac;
        Link = module.a7;
        Award = module.o;
        MapPin = module.p;
        MessageSquare = module.q;
        Sparkles = module.g;
        Eye = module.E;
        CircleCheckBig = module.J;
        Lightbulb = module.ad;
        Lock = module.a3;
        Check = module.b;
        Copy = module.ae;
        EllipsisVertical = module.af;
        User = module.a0;
        Grid3x3 = module.ag;
        LockOpen = module.ah;
        Star = module.i;
        Gift = module.ai;
        FileText = module.aj;
        Calendar = module.e;
        Facebook = module.F;
        Linkedin = module.f;
        Twitter = module.ak;
        Download = module.a1;
        Share2 = module.u;
        Target = module.j;
        Users = module.U;
        DollarSign = module.K;
      }, module => {
        ue = module.u;
      }, module => {
        supabase = module.s;
      }, null],
      execute: function () {
        exports("default", InstagramBioAnalyzer);
        const PRIMARY_FOCUS_OPTIONS = [{
          value: "buyers",
          label: "Buyers"
        }, {
          value: "sellers",
          label: "Sellers"
        }, {
          value: "rentals",
          label: "Rentals"
        }, {
          value: "luxury",
          label: "Luxury"
        }, {
          value: "first-time-buyers",
          label: "First-time Buyers"
        }, {
          value: "investment",
          label: "Investment Properties"
        }];
        function BioAnalyzerForm({
          onSubmit,
          onStepChange
        }) {
          const [step, setStep] = reactExports.useState(1);
          const [selectedFocus, setSelectedFocus] = reactExports.useState([]);
          const {
            register,
            handleSubmit,
            watch,
            setValue,
            formState: {
              errors
            }
          } = useForm();
          const totalSteps = 3;
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
            data.primaryFocus = selectedFocus;
            onSubmit(data);
          };
          const toggleFocus = value => {
            setSelectedFocus(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
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
                  className: "h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300",
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
                  className: "w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(Instagram, {
                    className: "w-5 h-5 text-white"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                    className: "text-2xl font-bold",
                    children: "Current Bio Analysis"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-gray-600",
                    children: "Let's analyze your existing Instagram bio"
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "instagramHandle",
                    children: ["Instagram Handle ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-gray-400",
                      children: "(Optional)"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "instagramHandle",
                    placeholder: "@yourusername",
                    ...register("instagramHandle"),
                    className: "mt-1"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-500 mt-1",
                    children: "We'll use this for screenshot features"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "currentBio",
                    children: ["Current Bio Text ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Textarea, {
                    id: "currentBio",
                    placeholder: "Paste your current Instagram bio here...",
                    maxLength: 150,
                    rows: 4,
                    ...register("currentBio", {
                      required: "Bio text is required"
                    }),
                    className: "mt-1"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex justify-between text-sm mt-1",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-gray-500",
                      children: "Max 150 characters"
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                      className: watch("currentBio")?.length > 140 ? "text-red-500" : "text-gray-500",
                      children: [watch("currentBio")?.length || 0, "/150"]
                    })]
                  }), errors.currentBio && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-red-500 text-sm mt-1",
                    children: errors.currentBio.message
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "linkSituation",
                    children: ["Current Link Situation ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    onValueChange: value => setValue("linkSituation", value),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      className: "mt-1",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                        placeholder: "Select your current link setup"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "linktree",
                        children: "One Linktree link"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "website",
                        children: "Website link"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "dm-only",
                        children: "DM only (no link)"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "multiple-posts",
                        children: "Multiple links in posts"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "nothing",
                        children: "Nothing (no link at all)"
                      })]
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "profilePicture",
                    children: ["Profile Picture Quality ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    onValueChange: value => setValue("profilePicture", value),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      className: "mt-1",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                        placeholder: "Describe your profile picture"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "professional",
                        children: "Professional headshot"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "casual",
                        children: "Casual photo"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "logo",
                        children: "Logo/branding"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "other",
                        children: "Other"
                      })]
                    })]
                  })]
                })]
              })]
            }), step === 2 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-6 animate-in fade-in slide-in-from-right-4 duration-300",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp$1, {
                    className: "w-5 h-5 text-white"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                    className: "text-2xl font-bold",
                    children: "Tell Us About You"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-gray-600",
                    children: "Help us personalize your analysis"
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    children: ["Primary Focus ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-500 mb-3",
                    children: "Select all that apply"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-2 gap-3",
                    children: PRIMARY_FOCUS_OPTIONS.map(option => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      onClick: () => toggleFocus(option.value),
                      className: `
                      border-2 rounded-lg p-3 cursor-pointer transition-all
                      ${selectedFocus.includes(option.value) ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}
                    `,
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Checkbox, {
                          checked: selectedFocus.includes(option.value),
                          onCheckedChange: () => toggleFocus(option.value)
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "font-medium",
                          children: option.label
                        })]
                      })
                    }, option.value))
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
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "location",
                    children: ["Full Market Location ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "location",
                    placeholder: "Miami, FL",
                    ...register("location", {
                      required: "Location is required"
                    }),
                    className: "mt-1"
                  }), errors.location && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-red-500 text-sm mt-1",
                    children: errors.location.message
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "yearsExperience",
                    children: ["Years of Experience ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    onValueChange: value => setValue("yearsExperience", value),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      className: "mt-1",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                        placeholder: "Select experience level"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "<1",
                        children: "Less than 1 year"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "1-3",
                        children: "1-3 years"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "3-5",
                        children: "3-5 years"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "5-10",
                        children: "5-10 years"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "10+",
                        children: "10+ years"
                      })]
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "followerCount",
                    children: ["Current Follower Count ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    onValueChange: value => setValue("followerCount", value),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      className: "mt-1",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                        placeholder: "Select follower range"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "<500",
                        children: "Less than 500"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "500-2K",
                        children: "500 - 2,000"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "2K-5K",
                        children: "2,000 - 5,000"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "5K-10K",
                        children: "5,000 - 10,000"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "10K+",
                        children: "10,000+"
                      })]
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "monthlyLeads",
                    children: ["Monthly Leads from Instagram ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Select, {
                    onValueChange: value => setValue("monthlyLeads", value),
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectTrigger, {
                      className: "mt-1",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectValue, {
                        placeholder: "Average monthly leads"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(SelectContent, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "0",
                        children: "0 leads/month"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "1-3",
                        children: "1-3 leads/month"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "4-10",
                        children: "4-10 leads/month"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectItem, {
                        value: "10+",
                        children: "10+ leads/month"
                      })]
                    })]
                  })]
                })]
              })]
            }), step === 3 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-6 animate-in fade-in slide-in-from-right-4 duration-300",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-3 mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp$1, {
                    className: "w-5 h-5 text-white"
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                    className: "text-2xl font-bold",
                    children: "Your Primary Goal"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-gray-600",
                    children: "What's your #1 objective on Instagram?"
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "space-y-3",
                children: [{
                  value: "seller-leads",
                  label: "Generate Seller Leads",
                  desc: "Get more home valuations and listing opportunities"
                }, {
                  value: "buyer-leads",
                  label: "Get Buyer Leads",
                  desc: "Connect with people ready to purchase"
                }, {
                  value: "brand",
                  label: "Build Brand Authority",
                  desc: "Establish yourself as the local expert"
                }, {
                  value: "following",
                  label: "Grow Following",
                  desc: "Increase reach and visibility"
                }, {
                  value: "referrals",
                  label: "Get Referrals",
                  desc: "Generate word-of-mouth business"
                }].map(goal => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  onClick: () => setValue("primaryGoal", goal.value),
                  className: `
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${watch("primaryGoal") === goal.value ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}
                `,
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-start gap-3",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                      type: "radio",
                      name: "primaryGoal",
                      value: goal.value,
                      ...register("primaryGoal", {
                        required: true
                      }),
                      className: "mt-1"
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "font-semibold",
                        children: goal.label
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "text-sm text-gray-600",
                        children: goal.desc
                      })]
                    })]
                  })
                }, goal.value))
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
                className: "gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                children: ["Next", /* @__PURE__ */jsxRuntimeExports.jsx(ArrowRight, {
                  className: "w-4 h-4"
                })]
              }) : /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                type: "submit",
                className: "gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                children: ["Analyze My Bio", /* @__PURE__ */jsxRuntimeExports.jsx(ArrowRight, {
                  className: "w-4 h-4"
                })]
              })]
            })]
          });
        }
        const REAL_ESTATE_KEYWORDS = ["realtor", "agent", "broker", "real estate", "realty", "properties", "homes", "luxury", "residential", "commercial"];
        const GENERIC_PHRASES = ["helping you find", "dream home", "making dreams", "here to help", "your next home", "let me help"];
        const CTA_KEYWORDS = ["dm me", "click", "link below", "contact", "call", "text", "visit", "schedule", "book", "download", "get", "start"];
        const TRUST_INDICATORS = ["years", "award", "top", "certified", "licensed", "expert", "specialist", "million", "sold", "#1"];
        function scoreClarity(input) {
          const bio = input.currentBio.toLowerCase();
          let score = 0;
          const issues = [];
          const recommendations = [];
          const examples = [];
          const hasRealEstateKeyword = REAL_ESTATE_KEYWORDS.some(keyword => bio.includes(keyword));
          if (hasRealEstateKeyword) {
            score += 10;
          } else {
            issues.push("Bio doesn't clearly mention you're a real estate professional");
            recommendations.push("Add 'Real Estate Agent', 'Realtor', or similar to your bio");
            examples.push("🏡 Real Estate Agent | Miami, FL");
          }
          const hasLocation = bio.includes(input.city.toLowerCase()) || bio.includes(input.state.toLowerCase()) || bio.includes(input.location.toLowerCase());
          if (hasLocation) {
            score += 5;
          } else {
            issues.push("Location not mentioned in bio");
            recommendations.push(`Include "${input.city}" or "${input.state}" to establish local presence`);
            examples.push(`Helping families in ${input.city} find their perfect home`);
          }
          if (input.primaryFocus.length > 0 && input.primaryFocus.some(focus => bio.includes(focus.toLowerCase()))) {
            score += 5;
          } else {
            issues.push("Your specialty or focus area isn't clear");
            recommendations.push(`Mention your specialty: ${input.primaryFocus.join(", ")}`);
            examples.push("Luxury Home Specialist | Waterfront Properties");
          }
          const impact = score < 10 ? "Critical: Visitors don't understand what you do. You're losing 70%+ of potential leads." : score < 15 ? "Moderate: Some confusion about your services. Losing 30-40% of potential engagement." : "Good: Bio clearly communicates your role and expertise.";
          return {
            score,
            maxScore: 20,
            issues,
            recommendations,
            examples,
            impact
          };
        }
        function scoreDifferentiation(input) {
          const bio = input.currentBio.toLowerCase();
          let score = 0;
          const issues = [];
          const recommendations = [];
          const examples = [];
          const genericCount = GENERIC_PHRASES.filter(phrase => bio.includes(phrase)).length;
          if (genericCount === 0) {
            score += 10;
          } else {
            issues.push(`Using ${genericCount} generic phrase(s) that ${(genericCount * 30).toFixed(0)}% of agents use`);
            recommendations.push("Replace generic phrases with specific value propositions");
            examples.push("Instead of 'Helping you find your dream home', try 'Sold 200+ homes in [City] | Avg. 18 days to close'");
          }
          const hasStats = /\d+/.test(bio);
          const hasUniqueAngle = bio.length > 50 && !bio.includes("helping");
          if (hasStats && hasUniqueAngle) {
            score += 10;
          } else if (hasStats || hasUniqueAngle) {
            score += 5;
            issues.push("Bio could be more specific and unique");
            recommendations.push("Add specific stats, credentials, or unique selling points");
            examples.push("15 years exp. | 500+ families helped | Certified Negotiation Expert");
          } else {
            issues.push("Bio is too generic - sounds like every other agent");
            recommendations.push("Differentiate yourself with specific achievements or specialties");
            examples.push("Former architect turned realtor | Design-savvy home finder");
          }
          const impact = score < 10 ? "Critical: You blend in with 1M+ other agents on Instagram. No reason to choose you." : score < 15 ? "Moderate: Some differentiation but not compelling enough to stand out." : "Good: Bio has unique elements that make you memorable.";
          return {
            score,
            maxScore: 20,
            issues,
            recommendations,
            examples,
            impact
          };
        }
        function scoreCallToAction(input) {
          const bio = input.currentBio.toLowerCase();
          let score = 0;
          const issues = [];
          const recommendations = [];
          const examples = [];
          const hasCTA = CTA_KEYWORDS.some(keyword => bio.includes(keyword));
          if (hasCTA) {
            score += 10;
          } else {
            issues.push("No clear call-to-action in bio");
            recommendations.push("Tell people what to do next: DM, click link, call, etc.");
            examples.push("📲 DM 'SELLING' for free home valuation");
          }
          const mentionsLink = bio.includes("link") || bio.includes("below") || bio.includes("👇") || bio.includes("⬇️");
          if (mentionsLink) {
            score += 5;
          } else {
            issues.push("Link in bio not called out");
            recommendations.push("Draw attention to your bio link");
            examples.push("👇 Free buyer's guide in link below");
          }
          const hasSpecificCTA = /dm|text|call \d|click|download|get your|schedule/.test(bio);
          if (hasSpecificCTA) {
            score += 5;
          } else {
            issues.push("CTA is vague or missing");
            recommendations.push("Make your CTA specific and action-oriented");
            examples.push("Click link for instant home value estimate 🏡");
          }
          const impact = score < 10 ? "Critical: Followers don't know what to do next. 80% bounce without taking action." : score < 15 ? "Moderate: Some direction but not compelling. Losing 40-50% of potential leads." : "Good: Clear CTA guides followers to take action.";
          return {
            score,
            maxScore: 20,
            issues,
            recommendations,
            examples,
            impact
          };
        }
        function scoreLocalAuthority(input) {
          const bio = input.currentBio.toLowerCase();
          let score = 0;
          const issues = [];
          const recommendations = [];
          const examples = [];
          if (bio.includes(input.city.toLowerCase())) {
            score += 8;
          } else {
            issues.push("City name not in bio");
            recommendations.push(`Add "${input.city}" to establish local authority`);
            examples.push(`${input.city}'s Trusted Real Estate Expert`);
          }
          const neighborhoodKeywords = ["local", "neighborhood", "community", "downtown", "waterfront", "suburb"];
          if (neighborhoodKeywords.some(keyword => bio.includes(keyword))) {
            score += 7;
          } else {
            issues.push("No neighborhood or area expertise mentioned");
            recommendations.push("Mention specific neighborhoods or areas you specialize in");
            examples.push("Downtown & Waterfront specialist | Local expert since 2015");
          }
          const impact = score < 8 ? "Critical: Followers don't see you as a local expert. Missing 60% of local search traffic." : score < 12 ? "Moderate: Some local signals but not strong enough." : "Good: Strong local authority established.";
          return {
            score,
            maxScore: 15,
            issues,
            recommendations,
            examples,
            impact
          };
        }
        function scoreTrustSignals(input) {
          const bio = input.currentBio.toLowerCase();
          let score = 0;
          const issues = [];
          const recommendations = [];
          const examples = [];
          const trustCount = TRUST_INDICATORS.filter(indicator => bio.includes(indicator)).length;
          score += Math.min(trustCount * 3, 10);
          if (trustCount === 0) {
            issues.push("No credentials, awards, or experience mentioned");
            recommendations.push("Add trust signals: years of experience, awards, certifications");
            examples.push("15+ years exp. | Top 1% Agent | Multi-Million Dollar Producer");
          }
          const hasSocialProof = /\d+\s*(families|clients|homes|sales|sold)/.test(bio);
          if (hasSocialProof) {
            score += 5;
          } else {
            issues.push("No social proof or client results");
            recommendations.push("Add specific numbers: homes sold, families helped, etc.");
            examples.push("500+ happy families | $50M+ in sales");
          }
          const impact = score < 8 ? "Critical: No reason to trust you over competitors. Conversion rate 70% lower." : score < 12 ? "Moderate: Some trust signals but need more credibility markers." : "Good: Strong trust signals build confidence.";
          return {
            score,
            maxScore: 15,
            issues,
            recommendations,
            examples,
            impact
          };
        }
        function scoreLinkStrategy(input) {
          let score = 0;
          const issues = [];
          const recommendations = [];
          const examples = [];
          switch (input.linkSituation) {
            case "linktree":
              score = 6;
              issues.push("Linktree is generic and doesn't capture leads or track effectively");
              recommendations.push("Upgrade to AgentBio for real estate-specific link-in-bio with lead capture");
              examples.push("AgentBio captures 3X more leads than Linktree for agents");
              break;
            case "website":
              score = 7;
              issues.push("Direct website link is good but misses opportunity for multiple CTAs");
              recommendations.push("Use a link-in-bio tool to showcase listings, capture leads, and track clicks");
              examples.push("Add listing showcase, home valuation, and contact options");
              break;
            case "dm-only":
              score = 3;
              issues.push("No link = losing 70%+ of potential leads who won't DM");
              recommendations.push("Add a link-in-bio immediately - you're losing most opportunities");
              examples.push("People prefer clicking over DMing. Make it easy!");
              break;
            case "multiple-posts":
              score = 2;
              issues.push("Scattered links in posts = confusion and lost leads");
              recommendations.push("Centralize all links in one professional link-in-bio");
              examples.push("One link, organized sections, professional presentation");
              break;
            case "nothing":
              score = 0;
              issues.push("No link or way to contact = missing 90%+ of opportunities");
              recommendations.push("Add link-in-bio TODAY - this is critical");
              examples.push("Every day without a link costs you potential deals");
              break;
          }
          const bio = input.currentBio.toLowerCase();
          if (bio.includes("link")) {
            score += 2;
          }
          score = Math.min(score, 10);
          const impact = score < 5 ? "Critical: Your link strategy is costing you 60-80% of potential leads." : score < 8 ? "Moderate: Link setup works but missing opportunities for optimization." : "Good: Solid link strategy, minor improvements possible.";
          return {
            score,
            maxScore: 10,
            issues,
            recommendations,
            examples,
            impact
          };
        }
        function analyzeBio(input) {
          const clarity = scoreClarity(input);
          const differentiation = scoreDifferentiation(input);
          const callToAction = scoreCallToAction(input);
          const localAuthority = scoreLocalAuthority(input);
          const trustSignals = scoreTrustSignals(input);
          const linkStrategy = scoreLinkStrategy(input);
          const overallScore = clarity.score + differentiation.score + callToAction.score + localAuthority.score + trustSignals.score + linkStrategy.score;
          const missingElements = [];
          if (clarity.score < 15) missingElements.push("Clear role/specialty");
          if (differentiation.score < 15) missingElements.push("Unique value proposition");
          if (callToAction.score < 15) missingElements.push("Strong call-to-action");
          if (localAuthority.score < 10) missingElements.push("Local market authority");
          if (trustSignals.score < 10) missingElements.push("Trust signals/credentials");
          if (linkStrategy.score < 7) missingElements.push("Optimized link strategy");
          const conversionPotential = Math.round(overallScore / 100 * 100);
          return {
            overallScore,
            categoryScores: {
              clarity,
              differentiation,
              callToAction,
              localAuthority,
              trustSignals,
              linkStrategy
            },
            competitiveAnalysis: {
              vsTopPerformers: getCompetitiveComparison(overallScore),
              missingElements,
              conversionPotential
            },
            rewrittenBios: [],
            // Will be populated by bio generator
            timestamp: (/* @__PURE__ */new Date()).toISOString()
          };
        }
        function getCompetitiveComparison(score) {
          if (score >= 85) {
            return "Your bio is in the top 5% of real estate agents on Instagram. Excellent work!";
          } else if (score >= 70) {
            return "Your bio is above average but top-performing agents score 15-20 points higher.";
          } else if (score >= 50) {
            return "Your bio is average. Top agents in your market likely score 30-40 points higher.";
          } else {
            return "Your bio is below average. Top performers in your area score 50+ points higher, which translates to 3-5X more leads.";
          }
        }
        function getScoreGrade(score) {
          if (score >= 90) {
            return {
              grade: "A+",
              color: "#10b981",
              label: "Excellent"
            };
          } else if (score >= 80) {
            return {
              grade: "A",
              color: "#22c55e",
              label: "Very Good"
            };
          } else if (score >= 70) {
            return {
              grade: "B",
              color: "#84cc16",
              label: "Good"
            };
          } else if (score >= 60) {
            return {
              grade: "C",
              color: "#eab308",
              label: "Average"
            };
          } else if (score >= 50) {
            return {
              grade: "D",
              color: "#f59e0b",
              label: "Below Average"
            };
          } else {
            return {
              grade: "F",
              color: "#ef4444",
              label: "Poor"
            };
          }
        }
        function ScoreDisplay({
          score,
          maxScore = 100,
          showGrade = true,
          size = "large"
        }) {
          const percentage = score / maxScore * 100;
          const {
            grade,
            color,
            label
          } = getScoreGrade(score);
          const sizeClasses = {
            small: "w-32 h-32",
            medium: "w-48 h-48",
            large: "w-64 h-64"
          };
          const textSizes = {
            small: "text-2xl",
            medium: "text-4xl",
            large: "text-6xl"
          };
          const radius = size === "small" ? 50 : size === "medium" ? 80 : 110;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - percentage / 100 * circumference;
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "flex flex-col items-center gap-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: `relative ${sizeClasses[size]}`,
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("svg", {
                className: "transform -rotate-90 w-full h-full",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("circle", {
                  cx: "50%",
                  cy: "50%",
                  r: radius,
                  stroke: "currentColor",
                  strokeWidth: "12",
                  fill: "none",
                  className: "text-gray-200"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("circle", {
                  cx: "50%",
                  cy: "50%",
                  r: radius,
                  stroke: color,
                  strokeWidth: "12",
                  fill: "none",
                  strokeLinecap: "round",
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  className: "transition-all duration-1000 ease-out",
                  style: {
                    strokeDashoffset
                  }
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "absolute inset-0 flex flex-col items-center justify-center",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: `font-bold ${textSizes[size]}`,
                  style: {
                    color
                  },
                  children: score
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "text-gray-500 text-sm",
                  children: ["out of ", maxScore]
                })]
              })]
            }), showGrade && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-xl mb-2",
                style: {
                  backgroundColor: color
                },
                children: [score >= 70 ? /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp$1, {
                  className: "w-5 h-5"
                }) : score >= 50 ? /* @__PURE__ */jsxRuntimeExports.jsx(CircleAlert, {
                  className: "w-5 h-5"
                }) : /* @__PURE__ */jsxRuntimeExports.jsx(TrendingDown, {
                  className: "w-5 h-5"
                }), "Grade: ", grade]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "text-lg text-gray-600",
                children: label
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "max-w-md text-center",
              children: [score >= 85 && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-gray-700",
                children: "🎉 Excellent! Your bio is highly optimized and likely converting well."
              }), score >= 70 && score < 85 && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-gray-700",
                children: "👍 Good work! A few tweaks could push you into the top 5%."
              }), score >= 50 && score < 70 && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-gray-700",
                children: "⚠️ Room for improvement. Implementing our recommendations could 2-3X your leads."
              }), score < 50 && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-gray-700",
                children: "🚨 Critical issues detected. Your bio is likely costing you 60-80% of potential leads."
              })]
            })]
          });
        }
        const CATEGORY_ICONS = {
          clarity: Eye,
          differentiation: Sparkles,
          callToAction: MessageSquare,
          localAuthority: MapPin,
          trustSignals: Award,
          linkStrategy: Link
        };
        const CATEGORY_LABELS = {
          clarity: "Clarity",
          differentiation: "Differentiation",
          callToAction: "Call-to-Action",
          localAuthority: "Local Authority",
          trustSignals: "Trust Signals",
          linkStrategy: "Link Strategy"
        };
        function CategoryBreakdown({
          analysis,
          showDetails = false
        }) {
          const categories = Object.entries(analysis.categoryScores);
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center mb-8",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                className: "text-2xl font-bold mb-2",
                children: "Category Breakdown"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-gray-600",
                children: "Here's how your bio performs across the 6 key conversion factors"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "space-y-3",
              children: categories.map(([key, category]) => {
                const Icon = CATEGORY_ICONS[key];
                const label = CATEGORY_LABELS[key];
                return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-white rounded-lg border border-gray-200 overflow-hidden",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "p-4 bg-gray-50 flex items-center justify-between",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-3",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center",
                        children: /* @__PURE__ */jsxRuntimeExports.jsx(Icon, {
                          className: "w-5 h-5 text-purple-600"
                        })
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                          className: "font-semibold text-gray-900",
                          children: label
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                          className: "text-sm text-gray-600",
                          children: category.impact
                        })]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "text-right",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "text-2xl font-bold",
                        children: [category.score, "/", category.maxScore]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "text-sm text-gray-500",
                        children: [Math.round(category.score / category.maxScore * 100), "%"]
                      })]
                    })]
                  }), showDetails && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "p-4 space-y-4 border-t border-gray-100",
                    children: [category.issues.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-2 mb-2",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleAlert, {
                          className: "w-4 h-4 text-red-500"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "font-semibold text-red-700",
                          children: "Issues Found"
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("ul", {
                        className: "space-y-1 ml-6",
                        children: category.issues.map((issue, i) => /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                          className: "text-sm text-gray-700 list-disc",
                          children: issue
                        }, i))
                      })]
                    }), category.recommendations.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-2 mb-2",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                          className: "w-4 h-4 text-green-500"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "font-semibold text-green-700",
                          children: "How to Fix"
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("ul", {
                        className: "space-y-1 ml-6",
                        children: category.recommendations.map((rec, i) => /* @__PURE__ */jsxRuntimeExports.jsx("li", {
                          className: "text-sm text-gray-700 list-disc",
                          children: rec
                        }, i))
                      })]
                    }), category.examples.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-2 mb-2",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Lightbulb, {
                          className: "w-4 h-4 text-amber-500"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "font-semibold text-amber-700",
                          children: "Examples"
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "space-y-2 ml-6",
                        children: category.examples.map((example, i) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "bg-amber-50 border border-amber-200 rounded p-2",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx("code", {
                            className: "text-sm text-gray-800",
                            children: example
                          })
                        }, i))
                      })]
                    })]
                  })]
                }, key);
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                className: "font-bold text-lg mb-3 flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                  className: "w-5 h-5 text-purple-600"
                }), "Competitive Analysis"]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-gray-700 mb-4",
                children: analysis.competitiveAnalysis.vsTopPerformers
              }), analysis.competitiveAnalysis.missingElements.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "font-semibold text-gray-900 mb-2",
                  children: "You're missing these elements that top performers have:"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "flex flex-wrap gap-2",
                  children: analysis.competitiveAnalysis.missingElements.map((element, i) => /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-700 border border-purple-200",
                    children: element
                  }, i))
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "mt-4 p-4 bg-white rounded-lg border border-purple-200",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "font-semibold text-gray-900",
                    children: "Conversion Potential"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                    className: "text-2xl font-bold text-purple-600",
                    children: [analysis.competitiveAnalysis.conversionPotential, "%"]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500",
                    style: {
                      width: `${analysis.competitiveAnalysis.conversionPotential}%`
                    }
                  })
                })]
              })]
            })]
          });
        }
        function TrendingUp({
          className
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            className,
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("polyline", {
              points: "23 6 13.5 15.5 8.5 10.5 1 18"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("polyline", {
              points: "17 6 23 6 23 12"
            })]
          });
        }
        const STYLE_COLORS = {
          professional: "from-blue-500 to-blue-600",
          friendly: "from-green-500 to-green-600",
          "problem-solver": "from-purple-500 to-purple-600"
        };
        const STYLE_DESCRIPTIONS = {
          professional: "Best for established agents who want to emphasize credentials and expertise",
          friendly: "Perfect for agents who want an approachable, community-focused presence",
          "problem-solver": "Ideal for agents who want to focus on solutions and results"
        };
        function BioRewriteDisplay({
          rewrites,
          isLocked = false,
          onUnlock
        }) {
          const [copiedIndex, setCopiedIndex] = reactExports.useState(null);
          const handleCopy = async (bio, index) => {
            try {
              await navigator.clipboard.writeText(bio);
              setCopiedIndex(index);
              ue.success("Bio copied to clipboard!");
              setTimeout(() => {
                setCopiedIndex(null);
              }, 2e3);
            } catch (error) {
              ue.error("Failed to copy bio");
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center mb-8",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                className: "text-2xl font-bold mb-2",
                children: "Your Optimized Bios"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-gray-600",
                children: isLocked ? "Preview one optimized bio - unlock all 3 versions + full report" : "Choose your favorite or mix and match elements from each"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "grid gap-6",
              children: rewrites.map((rewrite, index) => {
                const isPreview = isLocked && index > 0;
                const gradientColor = STYLE_COLORS[rewrite.style];
                return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: `
                relative rounded-lg border-2 overflow-hidden
                ${isPreview ? "border-gray-300" : "border-gray-200"}
              `,
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: `bg-gradient-to-r ${gradientColor} p-4 text-white`,
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                          className: "font-bold text-lg",
                          children: rewrite.title
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                          className: "text-sm opacity-90",
                          children: STYLE_DESCRIPTIONS[rewrite.style]
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "text-right",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "text-sm opacity-90",
                          children: "Style"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "font-semibold capitalize",
                          children: rewrite.style
                        })]
                      })]
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "p-6 bg-white",
                    children: isPreview ? /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "relative",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "blur-sm select-none pointer-events-none",
                        children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "font-mono text-gray-900 whitespace-pre-wrap leading-relaxed",
                          children: [rewrite.bio.substring(0, 50), "..."]
                        })
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "absolute inset-0 flex items-center justify-center",
                        children: /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                          onClick: onUnlock,
                          className: "gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Lock, {
                            className: "w-4 h-4"
                          }), "Unlock All 3 Bios"]
                        })
                      })]
                    }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200",
                        children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "font-mono text-gray-900 whitespace-pre-wrap leading-relaxed",
                          children: rewrite.bio
                        })
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "flex items-center justify-between text-sm text-gray-600 mb-4",
                        children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "flex items-center gap-4",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                            children: ["Character count:", " ", /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                              className: rewrite.characterCount > 150 ? "text-red-500 font-semibold" : "font-semibold",
                              children: [rewrite.characterCount, "/150"]
                            })]
                          }), rewrite.emojis.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                            children: ["Emojis: ", rewrite.emojis.join(" ")]
                          })]
                        })
                      }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                        onClick: () => handleCopy(rewrite.bio, index),
                        variant: "outline",
                        className: "w-full gap-2",
                        children: copiedIndex === index ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                            className: "w-4 h-4 text-green-500"
                          }), "Copied!"]
                        }) : /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(Copy, {
                            className: "w-4 h-4"
                          }), "Copy Bio"]
                        })
                      })]
                    })
                  }), !isPreview && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "px-6 py-4 bg-gray-50 border-t border-gray-200",
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "text-sm",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "font-semibold text-gray-700",
                        children: "Why this works: "
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        className: "text-gray-600",
                        children: rewrite.reasoning
                      })]
                    })
                  })]
                }, index);
              })
            }), !isLocked && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-blue-50 border border-blue-200 rounded-lg p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "font-bold text-blue-900 mb-3",
                children: "Implementation Tips"
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("ul", {
                className: "space-y-2 text-sm text-blue-800",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                    className: "w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    children: "Test each bio for 1-2 weeks and track your analytics"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                    className: "w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    children: "Feel free to mix elements from different versions"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                    className: "w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    children: "Update your bio to match seasonal changes or new specialties"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                  className: "flex gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                    className: "w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    children: "Make sure your link-in-bio matches the promise in your bio"
                  })]
                })]
              })]
            })]
          });
        }
        function InstagramMockup({
          username = "your.username",
          bio,
          profilePicture,
          fullName = "Your Name",
          location = "Your Location",
          followerCount = "1,234",
          followingCount = "567",
          postCount = "89"
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "w-full max-w-md mx-auto bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-white border-b border-gray-200 p-4 flex items-center justify-between",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("svg", {
                  className: "w-6 h-6",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  xmlns: "http://www.w3.org/2000/svg",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("path", {
                    d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z",
                    fill: "currentColor"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("path", {
                    d: "M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
                    fill: "currentColor"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "font-semibold",
                  children: username
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(EllipsisVertical, {
                className: "w-6 h-6"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "p-4",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-6 mb-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "relative",
                  children: [profilePicture ? /* @__PURE__ */jsxRuntimeExports.jsx("img", {
                    src: profilePicture,
                    alt: "Profile",
                    className: "w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  }) : /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(User, {
                      className: "w-10 h-10 text-white"
                    })
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "absolute inset-0 rounded-full border-2 border-purple-500 -m-1"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex-1 flex justify-around",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "text-center",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-bold text-lg",
                      children: postCount
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600 text-xs",
                      children: "posts"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "text-center",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-bold text-lg",
                      children: followerCount
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600 text-xs",
                      children: "followers"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "text-center",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "font-bold text-lg",
                      children: followingCount
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "text-gray-600 text-xs",
                      children: "following"
                    })]
                  })]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-1 mb-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "font-semibold",
                  children: fullName
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-gray-600 text-sm",
                  children: location
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-sm whitespace-pre-wrap leading-relaxed",
                  children: bio
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("a", {
                  href: "#",
                  className: "text-blue-600 text-sm font-semibold",
                  children: ["agentbio.net/", username]
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("button", {
                  className: "flex-1 bg-blue-500 text-white font-semibold py-1.5 rounded-lg text-sm",
                  children: "Follow"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                  className: "flex-1 bg-gray-200 font-semibold py-1.5 rounded-lg text-sm",
                  children: "Message"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                  className: "bg-gray-200 px-3 py-1.5 rounded-lg",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(User, {
                    className: "w-4 h-4"
                  })
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "mt-4 flex gap-4 overflow-x-auto pb-2",
                children: ["Listings", "Sold", "Tips", "About"].map(highlight => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex flex-col items-center gap-1 min-w-[64px]",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-16 h-16 rounded-full bg-gray-200 border-2 border-gray-300"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "text-xs text-gray-600",
                    children: highlight
                  })]
                }, highlight))
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "border-t border-gray-200 flex",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("button", {
                className: "flex-1 py-3 border-t-2 border-black",
                children: /* @__PURE__ */jsxRuntimeExports.jsx(Grid3x3, {
                  className: "w-6 h-6 mx-auto"
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                className: "flex-1 py-3 text-gray-400",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("svg", {
                  className: "w-6 h-6 mx-auto",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("rect", {
                    x: "3",
                    y: "3",
                    width: "7",
                    height: "7",
                    strokeWidth: "2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("rect", {
                    x: "14",
                    y: "3",
                    width: "7",
                    height: "7",
                    strokeWidth: "2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("rect", {
                    x: "14",
                    y: "14",
                    width: "7",
                    height: "7",
                    strokeWidth: "2"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("rect", {
                    x: "3",
                    y: "14",
                    width: "7",
                    height: "7",
                    strokeWidth: "2"
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("button", {
                className: "flex-1 py-3 text-gray-400",
                children: /* @__PURE__ */jsxRuntimeExports.jsx(User, {
                  className: "w-6 h-6 mx-auto"
                })
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "grid grid-cols-3 gap-1 p-1 bg-gray-100",
              children: [1, 2, 3, 4, 5, 6].map(i => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "aspect-square bg-gray-300"
              }, i))
            })]
          });
        }
        function InstagramComparison({
          beforeBio,
          afterBio,
          username,
          fullName,
          location
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
              className: "text-2xl font-bold text-center",
              children: "See the Difference"
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "grid md:grid-cols-2 gap-8",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "mb-4 flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-3 h-3 bg-red-500 rounded-full"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                    className: "font-bold text-lg",
                    children: "Before Optimization"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "transform scale-90 origin-top",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(InstagramMockup, {
                    username,
                    bio: beforeBio,
                    fullName,
                    location
                  })
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "mb-4 flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-3 h-3 bg-green-500 rounded-full"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                    className: "font-bold text-lg",
                    children: "After Optimization"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "transform scale-90 origin-top",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(InstagramMockup, {
                    username,
                    bio: afterBio,
                    fullName,
                    location
                  })
                })]
              })]
            })]
          });
        }
        function EmailCaptureModal({
          isOpen,
          onClose,
          onSubmit,
          analysisId
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
                analysisId,
                capturedAt: (/* @__PURE__ */new Date()).toISOString()
              };
              await onSubmit(captureData);
              ue.success("Success! Your full analysis is now unlocked 🎉");
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
                className: "bg-gradient-to-r from-purple-500 to-pink-500 -mx-6 -mt-6 p-8 text-white mb-6",
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
                      children: "Unlock Your Complete Analysis"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(DialogDescription, {
                      className: "text-purple-100",
                      children: "Get all 3 optimized bios + comprehensive strategy report"
                    })]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "space-y-4 mb-6",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                  className: "font-bold text-lg flex items-center gap-2",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Gift, {
                    className: "w-5 h-5 text-purple-600"
                  }), "Here's What You'll Get Instantly:"]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "grid gap-3",
                  children: [{
                    icon: FileText,
                    title: "3 Professionally Rewritten Bios",
                    desc: "Different styles optimized for your market and goals"
                  }, {
                    icon: TrendingUp$1,
                    title: "Complete Analysis Report (PDF)",
                    desc: "Detailed breakdown with actionable recommendations"
                  }, {
                    icon: CircleCheckBig,
                    title: "Instagram Profile Optimization Checklist",
                    desc: "Step-by-step guide to maximize your profile"
                  }, {
                    icon: Calendar,
                    title: "30-Day Content Calendar Template",
                    desc: "Proven post ideas that drive engagement"
                  }, {
                    icon: Sparkles,
                    title: "50 High-Performing Post Ideas",
                    desc: "Real estate content that converts followers to leads"
                  }, {
                    icon: Star,
                    title: "Weekly Instagram Tips Newsletter",
                    desc: "Ongoing strategies from top-performing agents"
                  }].map((item, index) => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(item.icon, {
                        className: "w-4 h-4 text-purple-600"
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
                      children: '"Changed my bio, got 3 leads in the first week! This tool is a game-changer."'
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-xs font-semibold text-gray-600",
                      children: "- Jennifer K., Miami Real Estate Agent"
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
                    htmlFor: "market",
                    children: ["Real Estate Market ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-red-500",
                      children: "*"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "market",
                    placeholder: "Miami, FL",
                    ...register("market", {
                      required: "Market is required"
                    }),
                    className: "mt-1"
                  }), errors.market && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-red-500 text-sm mt-1",
                    children: errors.market.message
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Label, {
                    htmlFor: "brokerage",
                    children: ["Brokerage ", /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-gray-400",
                      children: "(Optional)"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx(Input, {
                    id: "brokerage",
                    placeholder: "Keller Williams, Coldwell Banker, etc.",
                    ...register("brokerage"),
                    className: "mt-1"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                      className: "w-4 h-4 text-green-500"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      children: "Join 2,847 agents getting more leads from Instagram"
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
                      children: "Used by agents at Keller Williams, Coldwell Banker, RE/MAX"
                    })]
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                  type: "submit",
                  disabled: isSubmitting,
                  className: "w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg py-6",
                  children: isSubmitting ? /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    }), "Unlocking..."]
                  }) : /* @__PURE__ */jsxRuntimeExports.jsxs("span", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(LockOpen, {
                      className: "w-5 h-5"
                    }), "Unlock My Complete Analysis"]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "text-xs text-center text-gray-500",
                  children: "By submitting, you agree to receive helpful Instagram marketing tips and information about AgentBio. You can unsubscribe at any time."
                })]
              })]
            })
          });
        }
        function UnlockCTA({
          onUnlock
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center text-white",
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(Lock, {
              className: "w-16 h-16 mx-auto mb-4 opacity-90"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
              className: "text-2xl font-bold mb-2",
              children: "Want the Full Analysis?"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-purple-100 mb-6 max-w-md mx-auto",
              children: "Unlock all 3 professionally rewritten bios, complete analysis report, and bonus resources. 100% free, no credit card required."
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
              onClick: onUnlock,
              size: "lg",
              className: "bg-white text-purple-600 hover:bg-gray-100 gap-2 text-lg px-8",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(LockOpen, {
                className: "w-5 h-5"
              }), "Unlock Now - It's Free"]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "mt-4 flex items-center justify-center gap-6 text-sm",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-1",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                  className: "w-4 h-4"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  children: "2,847 agents unlocked"
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-1",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Star, {
                  className: "w-4 h-4 fill-current"
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  children: "4.9/5 rating"
                })]
              })]
            })]
          });
        }
        function SocialShare({
          score,
          toolUrl,
          onShare
        }) {
          const [copied, setCopied] = React.useState(false);
          const canvasRef = reactExports.useRef(null);
          const {
            grade,
            color,
            label
          } = getScoreGrade(score);
          const socialPosts = {
            instagram: `My Instagram bio scored ${score}/100 😱 What's yours? ${toolUrl}`,
            facebook: `Just optimized my real estate Instagram bio with this free tool. Every agent needs this: ${toolUrl}`,
            linkedin: `Analyzed my Instagram strategy with this tool - game-changer for agent lead generation. ${toolUrl}`,
            twitter: `My real estate Instagram bio scored ${score}/100 on this analyzer. Real estate agents, check yours: ${toolUrl}`
          };
          const handleShare = async platform => {
            const text = socialPosts[platform];
            onShare?.(platform);
            switch (platform) {
              case "facebook":
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(toolUrl)}&quote=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
                break;
              case "twitter":
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
                break;
              case "linkedin":
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(toolUrl)}`, "_blank", "width=600,height=400");
                break;
              case "instagram":
                try {
                  await navigator.clipboard.writeText(text);
                  ue.success("Copied! Paste into your Instagram story");
                } catch (error) {
                  ue.error("Failed to copy text");
                }
                break;
            }
          };
          const copyLink = async () => {
            try {
              await navigator.clipboard.writeText(toolUrl);
              setCopied(true);
              ue.success("Link copied to clipboard!");
              setTimeout(() => {
                setCopied(false);
              }, 2e3);
            } catch (error) {
              ue.error("Failed to copy link");
            }
          };
          const downloadScoreCard = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            canvas.width = 1080;
            canvas.height = 1920;
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "#9333ea");
            gradient.addColorStop(1, "#ec4899");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = 700;
            const radius = 300;
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.font = "bold 200px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(score.toString(), centerX, centerY - 40);
            ctx.font = "40px Arial";
            ctx.fillText("out of 100", centerX, centerY + 80);
            ctx.fillStyle = color;
            ctx.fillRect(centerX - 150, centerY + 180, 300, 100);
            ctx.fillStyle = "white";
            ctx.font = "bold 60px Arial";
            ctx.fillText(`Grade: ${grade}`, centerX, centerY + 230);
            ctx.fillStyle = "white";
            ctx.font = "bold 70px Arial";
            ctx.fillText("My Instagram Bio Score", centerX, 300);
            ctx.font = "40px Arial";
            ctx.fillText("Instagram Bio Analyzer", centerX, 400);
            ctx.font = "bold 50px Arial";
            ctx.fillText("What's yours?", centerX, 1400);
            ctx.font = "35px Arial";
            ctx.fillText("agentbio.net/tools/instagram-bio-analyzer", centerX, 1500);
            const link = document.createElement("a");
            link.download = `instagram-bio-score-${score}.png`;
            link.href = canvas.toDataURL();
            link.click();
            ue.success("Score card downloaded! Share it on Instagram");
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "text-center",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                className: "text-xl font-bold mb-2",
                children: "Share Your Results"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-gray-600",
                children: "Challenge other agents to beat your score!"
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "grid grid-cols-2 md:grid-cols-4 gap-3",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                onClick: () => handleShare("instagram"),
                className: "gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Instagram, {
                  className: "w-4 h-4"
                }), "Instagram"]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                onClick: () => handleShare("facebook"),
                className: "gap-2 bg-blue-600 hover:bg-blue-700",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Facebook, {
                  className: "w-4 h-4"
                }), "Facebook"]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                onClick: () => handleShare("linkedin"),
                className: "gap-2 bg-blue-700 hover:bg-blue-800",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Linkedin, {
                  className: "w-4 h-4"
                }), "LinkedIn"]
              }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                onClick: () => handleShare("twitter"),
                className: "gap-2 bg-sky-500 hover:bg-sky-600",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Twitter, {
                  className: "w-4 h-4"
                }), "Twitter"]
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex gap-2",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("input", {
                type: "text",
                value: toolUrl,
                readOnly: true,
                className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                onClick: copyLink,
                variant: "outline",
                className: "gap-2",
                children: copied ? /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
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
              className: "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-4",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex-1",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h4", {
                    className: "font-bold text-gray-900 mb-1",
                    children: "Download Score Card"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-gray-600",
                    children: "Perfect for Instagram stories! Pre-designed and ready to share."
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                  onClick: downloadScoreCard,
                  className: "gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx(Download, {
                    className: "w-4 h-4"
                  }), "Download"]
                })]
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsx("canvas", {
              ref: canvasRef,
              style: {
                display: "none"
              }
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "bg-amber-50 border border-amber-200 rounded-lg p-6",
              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h4", {
                className: "font-bold text-amber-900 mb-2 flex items-center gap-2",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx(Share2, {
                  className: "w-5 h-5"
                }), "Earn Rewards"]
              }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: "text-sm text-amber-800 mb-3",
                children: 'Share this tool with 3 agents and get our "Real Estate Instagram Mastery" video course (worth $97) absolutely free!'
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center gap-2 text-sm text-amber-700",
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "flex-1 h-2 bg-amber-200 rounded-full overflow-hidden",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "h-full bg-amber-500",
                    style: {
                      width: "0%"
                    }
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                  className: "font-semibold",
                  children: "0/3 referrals"
                })]
              })]
            })]
          });
        }
        function ScoreLeaderboard({
          userScore,
          market
        }) {
          const leaderboard = [{
            rank: 1,
            score: 94,
            market: "Miami, FL"
          }, {
            rank: 2,
            score: 91,
            market: "Austin, TX"
          }, {
            rank: 3,
            score: 88,
            market: "San Diego, CA"
          }, {
            rank: 4,
            score: 86,
            market: "Denver, CO"
          }, {
            rank: 5,
            score: 84,
            market: "Seattle, WA"
          }];
          const userRank = leaderboard.findIndex(item => item.score <= userScore) + 1 || leaderboard.length + 1;
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "bg-white border border-gray-200 rounded-lg p-6",
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
              className: "font-bold text-lg mb-4 flex items-center gap-2",
              children: ["🏆 Top Scores ", market && `in ${market}`]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "space-y-2",
              children: [leaderboard.map(item => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-3",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm",
                    children: item.rank
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "text-sm text-gray-600",
                    children: item.market
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "font-bold text-lg",
                  children: item.score
                })]
              }, item.rank)), userRank > 5 && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "flex items-center justify-between p-3 bg-purple-100 rounded-lg border-2 border-purple-500",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "flex items-center gap-3",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm",
                    children: userRank
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                    className: "text-sm font-semibold text-purple-900",
                    children: "You"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "font-bold text-lg text-purple-900",
                  children: userScore
                })]
              })]
            }), userRank > 1 && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                className: "text-sm text-blue-800",
                children: ["💡 You're ", leaderboard[0].score - userScore, " points away from #1! Implement our recommendations to climb the leaderboard."]
              })
            })]
          });
        }
        const EMOJI_MAP = {
          home: "🏡",
          key: "🔑",
          location: "📍",
          award: "🏆",
          chart: "📈",
          handshake: "🤝",
          check: "✅",
          point_down: "👇",
          sparkles: "✨",
          house: "🏠"
        };
        const PROFESSIONAL_TEMPLATE = {
          style: "professional",
          title: "Professional Authority",
          description: "Establishes credibility with credentials and results",
          structure: input => {
            const parts = [];
            const specialties = input.primaryFocus.slice(0, 2).join(" & ");
            parts.push(`${EMOJI_MAP.home} ${specialties || "Real Estate"} Specialist`);
            parts.push(`${EMOJI_MAP.location} ${input.city}, ${input.state}`);
            const expText = getExperienceText(input.yearsExperience);
            if (expText) {
              parts.push(`${EMOJI_MAP.award} ${expText}`);
            }
            const cta = getCallToAction(input.primaryGoal);
            parts.push(`${EMOJI_MAP.point_down} ${cta}`);
            return parts.join(" | ");
          }
        };
        const FRIENDLY_TEMPLATE = {
          style: "friendly",
          title: "Friendly Local Expert",
          description: "Approachable and community-focused tone",
          structure: input => {
            const parts = [];
            parts.push(`${EMOJI_MAP.key} Your ${input.city} Real Estate Guide`);
            const focus = input.primaryFocus[0] || "families";
            parts.push(`${EMOJI_MAP.handshake} Helping ${getFocusAudience(focus)} since ${getYearStarted(input.yearsExperience)}`);
            const cta = getFriendlyCTA(input.primaryGoal);
            parts.push(`${EMOJI_MAP.sparkles} ${cta}`);
            return parts.join("\n");
          }
        };
        const PROBLEM_SOLVER_TEMPLATE = {
          style: "problem-solver",
          title: "Problem-Solving Specialist",
          description: "Focuses on solutions and specific results",
          structure: input => {
            const parts = [];
            const problem = getProblemStatement(input.primaryGoal);
            parts.push(problem);
            parts.push(`${EMOJI_MAP.check} ${input.city} Real Estate Expert`);
            const proof = getProofStatement(input.yearsExperience, input.primaryFocus);
            if (proof) {
              parts.push(`${EMOJI_MAP.chart} ${proof}`);
            }
            parts.push(`${EMOJI_MAP.point_down} ${getDirectCTA(input.primaryGoal)}`);
            return parts.join("\n");
          }
        };
        function getExperienceText(years) {
          switch (years) {
            case "<1":
              return "Fresh perspective & modern approach";
            case "1-3":
              return "3+ Years Experience";
            case "3-5":
              return "5+ Years Proven Results";
            case "5-10":
              return "10+ Years Market Expertise";
            case "10+":
              return "15+ Years Local Authority";
            default:
              return "Licensed Real Estate Professional";
          }
        }
        function getYearStarted(years) {
          const currentYear = (/* @__PURE__ */new Date()).getFullYear();
          switch (years) {
            case "<1":
              return currentYear.toString();
            case "1-3":
              return (currentYear - 2).toString();
            case "3-5":
              return (currentYear - 4).toString();
            case "5-10":
              return (currentYear - 7).toString();
            case "10+":
              return (currentYear - 12).toString();
            default:
              return currentYear.toString();
          }
        }
        function getFocusAudience(focus) {
          const audienceMap = {
            "buyers": "first-time buyers",
            "sellers": "home sellers",
            "rentals": "renters & landlords",
            "luxury": "luxury clients",
            "first-time-buyers": "first-time buyers",
            "investment": "investors"
          };
          return audienceMap[focus.toLowerCase()] || "families";
        }
        function getCallToAction(goal) {
          const ctaMap = {
            "seller-leads": "Free home valuation below",
            "buyer-leads": "Buyer's guide in link",
            "brand": "Market insights & tips below",
            "following": "Follow for daily tips",
            "referrals": "Trusted by 500+ families"
          };
          return ctaMap[goal] || "Click link for listings";
        }
        function getFriendlyCTA(goal) {
          const ctaMap = {
            "seller-leads": "DM 'VALUE' for instant home estimate",
            "buyer-leads": "Let's find your perfect home!",
            "brand": "Follow for local market insights",
            "following": "Join our community of homeowners",
            "referrals": "Let's make your real estate goals happen"
          };
          return ctaMap[goal] || "DM me to get started";
        }
        function getDirectCTA(goal) {
          const ctaMap = {
            "seller-leads": "Get your free home value",
            "buyer-leads": "Find homes in your budget",
            "brand": "Weekly market updates",
            "following": "Daily real estate tips",
            "referrals": "Book a free consultation"
          };
          return ctaMap[goal] || "Link to listings below";
        }
        function getProblemStatement(goal) {
          const problemMap = {
            "seller-leads": `${EMOJI_MAP.house} Want to know what your home is worth?`,
            "buyer-leads": `${EMOJI_MAP.key} Tired of losing out on homes?`,
            "brand": `${EMOJI_MAP.chart} Want insider market knowledge?`,
            "following": `${EMOJI_MAP.sparkles} Want expert real estate advice?`,
            "referrals": `${EMOJI_MAP.handshake} Need a trusted real estate advisor?`
          };
          return problemMap[goal] || `${EMOJI_MAP.home} Looking for expert real estate help?`;
        }
        function getProofStatement(years, focus) {
          const isExperienced = years === "5-10" || years === "10+";
          if (isExperienced) {
            if (focus.includes("luxury")) {
              return "$50M+ in luxury sales";
            } else if (focus.includes("investment")) {
              return "200+ investment properties sold";
            } else {
              return "500+ families helped";
            }
          }
          if (focus.includes("first-time-buyers")) {
            return "First-time buyer specialist";
          } else if (focus.includes("sellers")) {
            return "Avg. 95% of asking price";
          }
          return "Proven track record";
        }
        function generateBioRewrites(input) {
          const templates = [PROFESSIONAL_TEMPLATE, FRIENDLY_TEMPLATE, PROBLEM_SOLVER_TEMPLATE];
          return templates.map(template => {
            const bioText = template.structure(input);
            const emojis = extractEmojis(bioText);
            return {
              style: template.style,
              title: template.title,
              bio: bioText,
              characterCount: bioText.length,
              emojis,
              reasoning: template.description
            };
          });
        }
        function extractEmojis(text) {
          const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
          return text.match(emojiRegex) || [];
        }
        function analyzeLinkStrategy(input) {
          const situation = input.linkSituation;
          const analyses = {
            "linktree": {
              currentDiagnosis: "You're using Linktree, which is a decent start but has significant limitations for real estate agents. Linktree doesn't capture lead information, lacks real estate-specific features like listing showcases, and provides limited analytics. Most importantly, it doesn't integrate with your MLS or CRM, and the generic design doesn't reinforce your professional brand.",
              leadsLost: 45,
              recommendedStructure: ["Featured listing showcase (auto-updated from MLS)", "Home valuation calculator with lead capture", "Buyer/seller resource downloads (captures emails)", "Direct booking link for consultations", "Testimonials section for social proof", "Contact methods (call, text, email)", "Social media cross-links"],
              priorityOrder: ["1. Lead capture forms (home valuation, buyer consultation)", "2. Active listings with high-quality photos", "3. Free resources (neighborhood guides, buyer's guide)", "4. Social proof (testimonials, recent sales)", "5. Direct contact options", "6. About/bio section"],
              trackingRecommendations: ["Track which links get the most clicks", "Monitor conversion rate from click to lead", "A/B test different CTA copy", "Track geographic data to understand your audience", "Monitor which listings generate most interest", "Set up UTM parameters for traffic sources"]
            },
            "website": {
              currentDiagnosis: "Linking directly to your website is better than nothing, but you're missing the opportunity for multiple calls-to-action. Most visitors won't navigate through your entire website - they want quick, specific options. A link-in-bio gives you a 'hub' where visitors can choose their own journey: view listings, get a valuation, download a guide, or contact you directly.",
              leadsLost: 35,
              recommendedStructure: ["Multiple CTAs (not just one website link)", "Specific landing pages for different needs", "Lead magnets (free valuations, guides)", "Featured listings separate from main website", "Quick contact options without website navigation", "Testimonial highlights", "Neighborhood expertise showcase"],
              priorityOrder: ["1. High-converting lead magnets (home value, buyer guide)", "2. Featured listings with direct inquiry forms", "3. About/credentials page", "4. Resources and tools", "5. Main website link", "6. Social media links"],
              trackingRecommendations: ["Track which CTAs perform best", "Monitor time to conversion from click", "Test different offer types (valuation vs guide)", "Track mobile vs desktop performance", "Monitor bounce rate on different landing pages", "Measure impact of different listing photos"]
            },
            "dm-only": {
              currentDiagnosis: "Critical issue: You have no link in your bio, forcing people to DM you. This is costing you 70%+ of potential leads. Modern consumers prefer clicking to get information rather than sending a DM and waiting for a response. You're creating unnecessary friction in your conversion funnel. Many high-intent leads will simply move on to an agent who makes it easier to take action.",
              leadsLost: 75,
              recommendedStructure: ["ADD A LINK IMMEDIATELY - This is urgent", "Start with a simple link-in-bio tool (even basic is better than nothing)", "Minimum: Home valuation form, contact info, listings", "Lead capture for every interaction", "Multiple ways to reach you (not just DM)", "Resources that provide value and capture emails", "Clear CTAs for different buyer/seller needs"],
              priorityOrder: ["1. Set up link-in-bio tool TODAY", "2. Add home valuation form (biggest lead generator)", "3. Add direct contact options (phone, text, email)", "4. Add featured listings", "5. Add free resource downloads", "6. Add booking calendar for consultations"],
              trackingRecommendations: ["Start tracking ANY clicks (baseline data)", "Monitor lead capture rate", "Track which lead magnets work best", "Set up Google Analytics on all landing pages", "Monitor conversion funnel from Instagram to lead", "Compare DM volume before/after adding link"]
            },
            "multiple-posts": {
              currentDiagnosis: "Having multiple 'link in bio' comments across different posts creates confusion and looks unprofessional. Visitors have to hunt through your posts to find the right link, and many will give up. This scattered approach also makes it impossible to track what's working. You need one centralized, professional link-in-bio that serves as your Instagram homepage.",
              leadsLost: 60,
              recommendedStructure: ["ONE centralized link-in-bio hub", "All links organized in clear categories", "Professional, branded appearance", "Easy navigation without scrolling through posts", "Lead capture integrated throughout", "Dynamic content that auto-updates", "Mobile-optimized (most IG traffic is mobile)"],
              priorityOrder: ["1. Consolidate ALL links into one link-in-bio", "2. Organize by user intent (buying, selling, browsing)", "3. Add lead capture to most popular content", "4. Remove scattered link comments from posts", "5. Update bio to direct to ONE link", "6. Track performance centrally"],
              trackingRecommendations: ["Track which previous links got most engagement", "Monitor improvement after consolidation", "Test different organizational structures", "Track drop-off points in your funnel", "Monitor which categories get most clicks", "Compare conversion rate before/after consolidation"]
            },
            "nothing": {
              currentDiagnosis: "CRITICAL: You have absolutely no way for Instagram followers to take action beyond DMing you or commenting. This is an emergency situation - you're losing 85-90% of potential leads. Every day without a link costs you real business. Top-performing agents get 5-15 leads per month from Instagram; you're getting close to zero. This needs to be fixed immediately.",
              leadsLost: 90,
              recommendedStructure: ["URGENT: Set up a link-in-bio tool TODAY", "Minimum viable setup: Contact info + home valuation", "Then add: Featured listings, resources, about page", "Lead capture forms on every section", "Multiple contact methods (remove all friction)", "Clear value propositions for visiting", "Professional design that builds trust"],
              priorityOrder: ["1. CREATE LINK-IN-BIO IMMEDIATELY (within 24 hours)", "2. Add home valuation form (proven lead generator)", "3. Add direct contact options with click-to-call", "4. Add one featured listing", "5. Add short about section with credentials", "6. Add at least one free resource download"],
              trackingRecommendations: ["Set up basic analytics immediately", "Track total clicks as baseline", "Monitor lead capture rate", "Track traffic sources (bio vs stories vs posts)", "Set up goal tracking in Google Analytics", "Monitor ROI: clicks → leads → closings"]
            }
          };
          return analyses[situation];
        }
        function calculateLeadLoss(input, linkAnalysis) {
          const currentLeadsMap = {
            "0": 0,
            "1-3": 2,
            "4-10": 7,
            "10+": 12
          };
          const currentMonthlyLeads = currentLeadsMap[input.monthlyLeads] || 0;
          const followerMap = {
            "<500": 250,
            "500-2K": 1250,
            "2K-5K": 3500,
            "5K-10K": 7500,
            "10K+": 15e3
          };
          const followers = followerMap[input.followerCount] || 250;
          const monthlyProfileVisits = followers * 0.025;
          const potentialClicks = monthlyProfileVisits * 0.18;
          const potentialLeads = potentialClicks * 0.12;
          Math.round(potentialLeads * (1 - linkAnalysis.leadsLost / 100));
          const avgCommission = 9e3;
          const closeRate = 0.03;
          const annualLeadsLost = (potentialLeads - currentMonthlyLeads) * 12;
          const annualValue = Math.round(annualLeadsLost * closeRate * avgCommission);
          return {
            currentMonthlyLeads,
            potentialMonthlyLeads: Math.round(potentialLeads),
            leadsLost: Math.round(potentialLeads - currentMonthlyLeads),
            annualValue
          };
        }
        function InstagramBioAnalyzer() {
          const [currentStep, setCurrentStep] = reactExports.useState("form");
          const [analysisInput, setAnalysisInput] = reactExports.useState(null);
          const [analysisResult, setAnalysisResult] = reactExports.useState(null);
          const [isUnlocked, setIsUnlocked] = reactExports.useState(false);
          const [showEmailModal, setShowEmailModal] = reactExports.useState(false);
          const [analysisId, setAnalysisId] = reactExports.useState("");
          const [isAnalyzing, setIsAnalyzing] = reactExports.useState(false);
          const toolUrl = typeof window !== "undefined" ? `${window.location.origin}/tools/instagram-bio-analyzer` : "https://agentbio.net/tools/instagram-bio-analyzer";
          const handleFormSubmit = async data => {
            setIsAnalyzing(true);
            setAnalysisInput(data);
            try {
              const result = analyzeBio(data);
              const rewrites = generateBioRewrites(data);
              result.rewrittenBios = rewrites;
              setAnalysisResult(result);
              const {
                data: savedAnalysis,
                error
              } = await supabase.from("instagram_bio_analyses").insert({
                input_data: data,
                result_data: result,
                overall_score: result.overallScore,
                market: data.location
              }).select().single();
              if (error) {
                console.error("Error saving analysis:", error);
              } else if (savedAnalysis) {
                setAnalysisId(savedAnalysis.id);
              }
              await trackEvent("analyzer_completed", {
                score: result.overallScore,
                market: data.location,
                yearsExperience: data.yearsExperience,
                followerCount: data.followerCount
              });
              setCurrentStep("results");
              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });
            } catch (error) {
              console.error("Analysis error:", error);
              ue.error("Something went wrong. Please try again.");
            } finally {
              setIsAnalyzing(false);
            }
          };
          const handleEmailCapture = async data => {
            try {
              const {
                data: captureData,
                error: captureError
              } = await supabase.from("instagram_bio_email_captures").insert({
                analysis_id: analysisId,
                email: data.email,
                first_name: data.firstName,
                market: data.market,
                brokerage: data.brokerage,
                email_sequence_started: true
              }).select().single();
              if (captureError) throw captureError;
              await trackEvent("email_captured", {
                market: data.market,
                brokerage: data.brokerage
              });
              if (analysisResult) {
                try {
                  const {
                    data: functionData,
                    error: functionError
                  } = await supabase.functions.invoke("send-bio-analyzer-email", {
                    body: {
                      analysisId: captureData?.id || analysisId,
                      email: data.email,
                      firstName: data.firstName,
                      market: data.market,
                      brokerage: data.brokerage,
                      score: analysisResult.overallScore,
                      bioRewrites: analysisResult.rewrittenBios.map(b => b.bio)
                    }
                  });
                  if (functionError) {
                    console.error("Error sending email:", functionError);
                  }
                } catch (emailError) {
                  console.error("Email function error:", emailError);
                }
              }
              setIsUnlocked(true);
              setShowEmailModal(false);
              ue.success("Success! Check your email for all 3 bio rewrites.");
            } catch (error) {
              console.error("Email capture error:", error);
              throw error;
            }
          };
          const trackEvent = async (eventType, eventData) => {
            try {
              await supabase.from("instagram_bio_analytics").insert({
                event_type: eventType,
                event_data: eventData,
                session_id: getSessionId()
              });
            } catch (error) {
              console.error("Analytics error:", error);
            }
          };
          const getSessionId = () => {
            let sessionId = sessionStorage.getItem("bio_analyzer_session");
            if (!sessionId) {
              sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              sessionStorage.setItem("bio_analyzer_session", sessionId);
            }
            return sessionId;
          };
          const schema = {
            "@context": "https://schema.org",
            "@graph": [{
              "@type": "WebPage",
              "name": "Free Instagram Bio Analyzer for Real Estate Agents",
              "description": "Analyze your realtor Instagram bio in 60 seconds. Get your effectiveness score + 3 optimized bio rewrites. Free tool for agents.",
              "url": toolUrl
            }, {
              "@type": "HowTo",
              "name": "How to Analyze Your Real Estate Instagram Bio",
              "description": "Step-by-step guide to analyzing and optimizing your realtor Instagram bio for maximum lead generation.",
              "step": [{
                "@type": "HowToStep",
                "name": "Enter Your Current Instagram Bio",
                "text": "Paste your current Instagram bio text into the analyzer tool. Include your full bio exactly as it appears on your profile."
              }, {
                "@type": "HowToStep",
                "name": "Add Your Market Details",
                "text": "Enter your location, years of experience, follower count, and monthly Instagram traffic to get personalized analysis."
              }, {
                "@type": "HowToStep",
                "name": "Get Your Effectiveness Score",
                "text": "Receive an instant score based on 6 key factors: clarity, call-to-action strength, keyword optimization, link strategy, credibility signals, and mobile readability."
              }, {
                "@type": "HowToStep",
                "name": "Review Your Optimized Bios",
                "text": "Get 3 professionally rewritten bio versions optimized for your specific market, experience level, and business goals."
              }]
            }, {
              "@type": "FAQPage",
              "mainEntity": [{
                "@type": "Question",
                "name": "What does the Instagram bio analyzer check?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Instagram bio analyzer evaluates your realtor bio across 6 critical factors: clarity of value proposition, call-to-action effectiveness, keyword optimization for your market, link strategy, credibility signals (years of experience, certifications), and mobile readability. Each factor is scored and you receive an overall effectiveness grade from F to A+."
                }
              }, {
                "@type": "Question",
                "name": "How long does the Instagram bio analysis take?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Instagram bio analysis takes approximately 60 seconds. You simply enter your current bio text, add your market details, and receive instant results including your effectiveness score, category-by-category breakdown, and 3 professionally rewritten bio versions optimized for real estate lead generation."
                }
              }, {
                "@type": "Question",
                "name": "Is the Instagram bio analyzer really free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, the Instagram bio analyzer is 100% free to use with no signup required. You can analyze your bio and see your score immediately. To unlock all 3 optimized bio rewrites and detailed recommendations, simply enter your email to receive the full report."
                }
              }, {
                "@type": "Question",
                "name": "What makes a good real estate Instagram bio?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A good real estate Instagram bio includes: your specific market/location, years of experience or credentials, a clear value proposition (what makes you different), a strong call-to-action, and a strategic link to your portfolio or listings. Top-performing agent bios score 85+ on our analyzer by balancing these elements for mobile readability."
                }
              }]
            }]
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Helmet, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("title", {
                children: "Free Instagram Bio Analyzer for Real Estate Agents | AgentBio"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "description",
                content: "Analyze your realtor Instagram bio in 60 seconds. Get your effectiveness score + 3 optimized bio rewrites. Free tool for agents. No signup required."
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "keywords",
                content: "instagram bio for realtors, real estate instagram bio, realtor bio examples, instagram bio analyzer"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("script", {
                type: "application/ld+json",
                children: JSON.stringify(schema)
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50",
              children: [currentStep === "form" && /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
                children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "container max-w-4xl mx-auto px-4",
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "text-center",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx(Sparkles, {
                          className: "w-4 h-4"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "text-sm font-semibold",
                          children: "Free Tool for Real Estate Agents"
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("h1", {
                        className: "text-4xl md:text-6xl font-bold mb-6",
                        children: ["Is Your Instagram Bio", /* @__PURE__ */jsxRuntimeExports.jsx("br", {}), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "text-purple-200",
                          children: "Costing You Leads?"
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto",
                        children: "Get your bio effectiveness score in 60 seconds + 3 professionally rewritten versions optimized for your market and goals"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-base text-purple-200 mb-6 max-w-2xl mx-auto",
                        children: ["Want to learn more about optimizing your Instagram for leads?", " ", /* @__PURE__ */jsxRuntimeExports.jsx("a", {
                          href: "/instagram-bio-for-realtors",
                          className: "underline hover:text-white font-semibold",
                          children: "Read our complete Instagram bio guide for realtors →"
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "flex flex-wrap justify-center gap-6 text-left",
                        children: [{
                          icon: CircleCheckBig,
                          text: "Instant analysis & score"
                        }, {
                          icon: Sparkles,
                          text: "3 optimized bio rewrites"
                        }, {
                          icon: Award,
                          text: "Beat your competition"
                        }, {
                          icon: Target,
                          text: "100% free, no signup"
                        }].map((item, i) => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx(item.icon, {
                            className: "w-5 h-5"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                            children: item.text
                          })]
                        }, i))
                      })]
                    })
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "bg-white border-b border-gray-200 py-8",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "container max-w-4xl mx-auto px-4",
                    children: /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                      className: "text-base md:text-lg text-gray-700 leading-relaxed",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("strong", {
                        children: "The Instagram Bio Analyzer is a free tool designed specifically for real estate agents to evaluate and optimize their Instagram bio for maximum lead generation."
                      }), " In 60 seconds, you'll receive an effectiveness score (0-100) based on six key factors—clarity, call-to-action strength, keyword optimization, link strategy, credibility signals, and mobile readability—plus three professionally rewritten bio versions tailored to your market and experience level. Top-performing agent bios score 85+ and convert 3x more Instagram followers into qualified buyer and seller leads compared to generic, unoptimized bios."]
                    })
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "bg-white border-y border-gray-200 py-8",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "container max-w-6xl mx-auto px-4",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "grid md:grid-cols-4 gap-8 text-center",
                      children: [{
                        icon: Users,
                        number: "2,847+",
                        label: "Agents Analyzed"
                      }, {
                        icon: TrendingUp$1,
                        number: "3X",
                        label: "Average Lead Increase"
                      }, {
                        icon: DollarSign,
                        number: "$50M+",
                        label: "In Deals Generated"
                      }, {
                        icon: Award,
                        number: "4.9/5",
                        label: "Agent Rating"
                      }].map((stat, i) => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "flex justify-center mb-2",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                            className: "w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center",
                            children: /* @__PURE__ */jsxRuntimeExports.jsx(stat.icon, {
                              className: "w-6 h-6 text-purple-600"
                            })
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "text-3xl font-bold text-gray-900 mb-1",
                          children: stat.number
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "text-sm text-gray-600",
                          children: stat.label
                        })]
                      }, i))
                    })
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "container max-w-3xl mx-auto px-4 py-16",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "bg-white rounded-2xl shadow-xl p-8 md:p-12",
                    children: isAnalyzing ? /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "text-center py-12",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "text-2xl font-bold mb-2",
                        children: "Analyzing Your Bio..."
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-gray-600",
                        children: "Running 6-point analysis and generating personalized recommendations"
                      })]
                    }) : /* @__PURE__ */jsxRuntimeExports.jsx(BioAnalyzerForm, {
                      onSubmit: handleFormSubmit,
                      onStepChange: () => {}
                    })
                  })
                })]
              }), currentStep === "results" && analysisResult && analysisInput && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "container max-w-6xl mx-auto px-4 py-16",
                children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "text-center mb-12",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                    className: "text-4xl font-bold mb-4",
                    children: "Your Instagram Bio Analysis"
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-xl text-gray-600",
                    children: "Here's how your bio stacks up against top-performing real estate agents"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mb-16",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(ScoreDisplay, {
                    score: analysisResult.overallScore,
                    showGrade: true
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mb-16",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(CategoryBreakdown, {
                    analysis: analysisResult,
                    showDetails: isUnlocked
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mb-16",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(BioRewriteDisplay, {
                    rewrites: analysisResult.rewrittenBios,
                    isLocked: !isUnlocked,
                    onUnlock: () => setShowEmailModal(true)
                  })
                }), !isUnlocked && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mb-16",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(UnlockCTA, {
                    onUnlock: () => setShowEmailModal(true)
                  })
                }), isUnlocked && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mb-16",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(InstagramComparison, {
                    beforeBio: analysisInput.currentBio,
                    afterBio: analysisResult.rewrittenBios[0].bio,
                    username: analysisInput.instagramHandle,
                    fullName: analysisInput.city,
                    location: analysisInput.location
                  })
                }), isUnlocked && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mb-16",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "bg-white rounded-lg border border-gray-200 p-8",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                      className: "text-2xl font-bold mb-6",
                      children: "Your Link Strategy Analysis"
                    }), (() => {
                      const linkAnalysis = analyzeLinkStrategy(analysisInput);
                      const leadLoss = calculateLeadLoss(analysisInput, linkAnalysis);
                      return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "space-y-6",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "bg-red-50 border border-red-200 rounded-lg p-6",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                            className: "font-bold text-red-900 mb-2",
                            children: "Current Situation"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                            className: "text-red-800",
                            children: linkAnalysis.currentDiagnosis
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6",
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                            className: "font-bold text-purple-900 mb-4",
                            children: "What You're Missing"
                          }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                            className: "grid md:grid-cols-3 gap-4",
                            children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                              className: "text-center",
                              children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                                className: "text-3xl font-bold text-purple-600",
                                children: leadLoss.leadsLost
                              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                                className: "text-sm text-purple-800",
                                children: "Leads Lost/Month"
                              })]
                            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                              className: "text-center",
                              children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                                className: "text-3xl font-bold text-purple-600",
                                children: leadLoss.potentialMonthlyLeads
                              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                                className: "text-sm text-purple-800",
                                children: "Potential Monthly Leads"
                              })]
                            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                              className: "text-center",
                              children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                                className: "text-3xl font-bold text-purple-600",
                                children: ["$", (leadLoss.annualValue / 1e3).toFixed(0), "K"]
                              }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                                className: "text-sm text-purple-800",
                                children: "Potential Annual Value"
                              })]
                            })]
                          })]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                            className: "font-bold text-gray-900 mb-3",
                            children: "Recommended Structure"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("ul", {
                            className: "space-y-2",
                            children: linkAnalysis.recommendedStructure.map((item, i) => /* @__PURE__ */jsxRuntimeExports.jsxs("li", {
                              className: "flex items-start gap-2",
                              children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                                className: "w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                              }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                                className: "text-gray-700",
                                children: item
                              })]
                            }, i))
                          })]
                        })]
                      });
                    })()]
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mb-16",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(SocialShare, {
                    score: analysisResult.overallScore,
                    toolUrl,
                    onShare: platform => trackEvent("shared", {
                      platform
                    })
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "mb-16",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(ScoreLeaderboard, {
                    userScore: analysisResult.overallScore,
                    market: analysisInput.location
                  })
                }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-white text-center",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                    className: "text-3xl font-bold mb-4",
                    children: "Ready to Convert More Instagram Followers?"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-xl text-purple-100 mb-8 max-w-2xl mx-auto",
                    children: ["Your optimized bio is just the start.", " ", /* @__PURE__ */jsxRuntimeExports.jsx("a", {
                      href: "/for-real-estate-agents",
                      className: "underline hover:text-white font-semibold",
                      children: "AgentBio gives you a complete link-in-bio platform"
                    }), " ", "built specifically for real estate agents."]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "grid md:grid-cols-3 gap-6 mb-8",
                    children: ["Auto-updated MLS listings", "Built-in lead capture forms", "Advanced analytics & tracking", "QR codes for offline marketing", "Testimonial showcases", "Professional templates"].map((feature, i) => /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "flex items-center gap-2 bg-white/10 rounded-lg px-4 py-3",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                        className: "w-5 h-5"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                        children: feature
                      })]
                    }, i))
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs(Button, {
                    size: "lg",
                    className: "bg-white text-purple-600 hover:bg-gray-100 gap-2 text-lg px-8",
                    onClick: () => {
                      trackEvent("trial_clicked", {});
                      window.location.href = "/auth/register";
                    },
                    children: ["Start Your Free 14-Day Trial", /* @__PURE__ */jsxRuntimeExports.jsx(ArrowRight, {
                      className: "w-5 h-5"
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-purple-200 mt-4",
                    children: "No credit card required • Cancel anytime • Used by 10,000+ agents"
                  })]
                }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "text-center mt-12",
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                    variant: "outline",
                    size: "lg",
                    onClick: () => {
                      setCurrentStep("form");
                      setAnalysisResult(null);
                      setIsUnlocked(false);
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                      });
                    },
                    children: "Analyze Another Bio"
                  })
                })]
              }), /* @__PURE__ */jsxRuntimeExports.jsx(EmailCaptureModal, {
                isOpen: showEmailModal,
                onClose: () => setShowEmailModal(false),
                onSubmit: handleEmailCapture,
                analysisId
              })]
            })]
          });
        }
      }
    };
  });
})();
