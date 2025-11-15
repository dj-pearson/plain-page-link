;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js'], function (exports, module) {
    'use strict';

    var jsxRuntimeExports, Link, Helmet, Button, TrendingUp, ArrowRight, Home, Users, CircleCheckBig, Star;
    return {
      setters: [module => {
        jsxRuntimeExports = module.j;
        Link = module.L;
      }, module => {
        Helmet = module.x;
        Button = module.j;
      }, module => {
        TrendingUp = module.T;
        ArrowRight = module.A;
        Home = module.H;
        Users = module.U;
        CircleCheckBig = module.J;
        Star = module.i;
      }],
      execute: function () {
        exports("L", LocationTemplate);
        function LocationTemplate({
          location
        }) {
          const {
            city,
            state,
            stateAbbr,
            slug,
            medianPrice,
            marketTrend,
            agentCount,
            marketDescription,
            neighborhoods
          } = location;
          const canonicalUrl = `${window.location.origin}/for/${slug}`;
          const pageTitle = `AgentBio for ${city} Real Estate Agents | Instagram Bio & Lead Generation`;
          const pageDescription = `Join ${city}, ${stateAbbr} real estate agents using AgentBio to convert Instagram followers into leads. Property listings, lead capture forms, and calendar booking built for ${city} agents.`;
          const schema = {
            "@context": "https://schema.org",
            "@graph": [{
              "@type": "WebPage",
              "@id": canonicalUrl,
              "url": canonicalUrl,
              "name": pageTitle,
              "description": pageDescription,
              "publisher": {
                "@type": "Organization",
                "name": "AgentBio"
              }
            }, {
              "@type": "LocalBusiness",
              "name": "AgentBio",
              "description": `Link in bio platform for ${city} real estate agents`,
              "areaServed": {
                "@type": "City",
                "name": city,
                "addressRegion": stateAbbr
              }
            }, {
              "@type": "FAQPage",
              "mainEntity": [{
                "@type": "Question",
                "name": `How do ${city} real estate agents use AgentBio?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `${city} real estate agents use AgentBio as their Instagram link in bio to showcase ${city} property listings, capture local buyer and seller leads, and book consultations. The platform is optimized for mobile traffic from Instagram and includes features specifically for real estate professionals.`
                }
              }, {
                "@type": "Question",
                "name": `Can I showcase ${city} property listings on AgentBio?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `Yes! AgentBio allows ${city} agents to display property listing cards with photos, addresses, prices, and details. You can update listings instantly when properties go pending or sell, ensuring your ${city} followers always see current inventory.`
                }
              }, {
                "@type": "Question",
                "name": `Does AgentBio work with ${city} MLS systems?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `AgentBio integrates with major MLS and IDX providers used in ${city}. You can automatically sync your active ${city} listings or manually add properties with photos and details.`
                }
              }]
            }]
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Helmet, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("title", {
                children: pageTitle
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                name: "description",
                content: pageDescription
              }), /* @__PURE__ */jsxRuntimeExports.jsx("link", {
                rel: "canonical",
                href: canonicalUrl
              }), /* @__PURE__ */jsxRuntimeExports.jsx("script", {
                type: "application/ld+json",
                children: JSON.stringify(schema)
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                property: "og:title",
                content: pageTitle
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                property: "og:description",
                content: pageDescription
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                property: "og:type",
                content: "website"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
                property: "og:url",
                content: canonicalUrl
              })]
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "container mx-auto px-4 pt-24 pb-16",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-4xl mx-auto text-center",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                      className: "h-4 w-4"
                    }), "Trusted by ", city, " Real Estate Professionals"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("h1", {
                    className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent",
                    children: ["The Link in Bio Platform for ", city, " Real Estate Agents"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto",
                    children: ["Convert Instagram followers into ", city, " buyer and seller leads with property showcases, lead capture forms, and calendar booking—all in one link."]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex flex-col sm:flex-row gap-4 justify-center items-center mb-8",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      asChild: true,
                      size: "lg",
                      className: "text-lg px-8",
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                        to: "/get-started",
                        children: ["Start Free Trial", /* @__PURE__ */jsxRuntimeExports.jsx(ArrowRight, {
                          className: "ml-2 h-5 w-5"
                        })]
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      asChild: true,
                      variant: "outline",
                      size: "lg",
                      className: "text-lg px-8",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                        to: "/demo",
                        children: "See Live Demo"
                      })
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-muted-foreground",
                    children: "No credit card required • Set up in 10 minutes • Cancel anytime"
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "bg-white border-y border-gray-200 py-12",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  className: "container max-w-4xl mx-auto px-4",
                  children: /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-base md:text-lg text-gray-700 leading-relaxed",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("strong", {
                      children: ["AgentBio is a specialized link-in-bio platform designed for ", city, ", ", state, " real estate agents who want to convert Instagram followers into qualified leads."]
                    }), " ", "Unlike generic tools like Linktree or Beacons, AgentBio includes features specifically for real estate: ", city, " property listing galleries with photos and prices, built-in lead capture forms for buyer/seller qualification, calendar booking for consultation scheduling, and testimonial showcases. ", city, " agents use AgentBio to consolidate their property portfolio, contact information, and lead generation tools into one mobile-optimized link that turns Instagram traffic into actual clients. The platform integrates with popular CRM systems used by ", city, " real estate professionals and provides detailed analytics to track which ", city, " neighborhoods and property types generate the most engagement."]
                  })
                })
              }), (medianPrice || marketTrend || agentCount) && /* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "container mx-auto px-4 py-16",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-5xl mx-auto",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h2", {
                    className: "text-3xl md:text-4xl font-bold text-center mb-12",
                    children: [city, " Real Estate Market Overview"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "grid md:grid-cols-3 gap-8",
                    children: [medianPrice && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6 text-center",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Home, {
                        className: "h-12 w-12 text-primary mx-auto mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "text-3xl font-bold mb-2",
                        children: medianPrice
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "text-muted-foreground",
                        children: "Median Home Price"
                      })]
                    }), marketTrend && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6 text-center",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                        className: "h-12 w-12 text-green-500 mx-auto mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "text-3xl font-bold mb-2",
                        children: marketTrend
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "text-muted-foreground",
                        children: "Market Trend"
                      })]
                    }), agentCount && /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6 text-center",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Users, {
                        className: "h-12 w-12 text-primary mx-auto mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "text-3xl font-bold mb-2",
                        children: agentCount
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                        className: "text-muted-foreground",
                        children: "Active Agents"
                      })]
                    })]
                  }), marketDescription && /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "mt-8 glass-panel p-6",
                    children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                      className: "text-muted-foreground text-center",
                      children: marketDescription
                    })
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "container mx-auto px-4 py-16 bg-muted/30",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-5xl mx-auto",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h2", {
                    className: "text-3xl md:text-4xl font-bold text-center mb-4",
                    children: ["Why ", city, " Real Estate Agents Choose AgentBio"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-center text-muted-foreground mb-12 text-lg",
                    children: ["Built specifically for real estate professionals in competitive markets like ", city]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "grid md:grid-cols-2 gap-8",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "glass-panel p-6",
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-start gap-4",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx(Home, {
                            className: "h-6 w-6 text-primary"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                            className: "text-xl font-bold mb-2",
                            children: ["Showcase ", city, " Property Listings"]
                          }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                            className: "text-muted-foreground",
                            children: ["Display your active ", city, " listings with photos, addresses, prices, and details. Update instantly when properties sell or go pending."]
                          })]
                        })]
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "glass-panel p-6",
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-start gap-4",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx(Users, {
                            className: "h-6 w-6 text-primary"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                            className: "text-xl font-bold mb-2",
                            children: "Capture Local Buyer/Seller Leads"
                          }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                            className: "text-muted-foreground",
                            children: ["Built-in forms for buyer pre-qualification, seller consultations, and home valuations. Perfect for capturing serious ", city, " leads."]
                          })]
                        })]
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "glass-panel p-6",
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-start gap-4",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                            className: "h-6 w-6 text-primary"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                            className: "text-xl font-bold mb-2",
                            children: "Mobile-Optimized for Instagram"
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                            className: "text-muted-foreground",
                            children: "90% of Instagram users are on mobile. Your AgentBio page loads fast and looks perfect on all devices."
                          })]
                        })]
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "glass-panel p-6",
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-start gap-4",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                          className: "h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0",
                          children: /* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                            className: "h-6 w-6 text-primary"
                          })
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                            className: "text-xl font-bold mb-2",
                            children: ["Track ", city, " Market Engagement"]
                          }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                            className: "text-muted-foreground",
                            children: ["See which ", city, " neighborhoods, property types, and price ranges generate the most clicks and leads."]
                          })]
                        })]
                      })
                    })]
                  })]
                })
              }), neighborhoods && neighborhoods.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "container mx-auto px-4 py-16",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-4xl mx-auto",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h2", {
                    className: "text-3xl md:text-4xl font-bold text-center mb-12",
                    children: ["Popular ", city, " Neighborhoods for Real Estate Agents"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-2 md:grid-cols-3 gap-4",
                    children: neighborhoods.map((neighborhood, index) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "glass-panel p-4 text-center hover:border-primary/50 transition-colors",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "font-medium",
                        children: neighborhood
                      })
                    }, index))
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "container mx-auto px-4 py-16 bg-muted/30",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-5xl mx-auto",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h2", {
                    className: "text-3xl md:text-4xl font-bold text-center mb-12",
                    children: ["Everything ", city, " Agents Need in One Platform"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "grid md:grid-cols-3 gap-8",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                      to: "/features/property-listings",
                      className: "glass-panel p-6 hover:border-primary/50 transition-colors",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Home, {
                        className: "h-10 w-10 text-primary mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "text-xl font-bold mb-2",
                        children: "Property Listings"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground text-sm",
                        children: ["Showcase ", city, " properties with beautiful listing cards"]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                      to: "/features/lead-capture",
                      className: "glass-panel p-6 hover:border-primary/50 transition-colors",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Users, {
                        className: "h-10 w-10 text-primary mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "text-xl font-bold mb-2",
                        children: "Lead Capture"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-muted-foreground text-sm",
                        children: "Built-in forms for buyer/seller qualification"
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                      to: "/features/calendar-booking",
                      className: "glass-panel p-6 hover:border-primary/50 transition-colors",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                        className: "h-10 w-10 text-primary mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "text-xl font-bold mb-2",
                        children: "Calendar Booking"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground text-sm",
                        children: ["Let ", city, " clients schedule consultations instantly"]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                      to: "/features/testimonials",
                      className: "glass-panel p-6 hover:border-primary/50 transition-colors",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Star, {
                        className: "h-10 w-10 text-primary mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "text-xl font-bold mb-2",
                        children: "Testimonials"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground text-sm",
                        children: ["Display reviews from happy ", city, " clients"]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                      to: "/features/analytics",
                      className: "glass-panel p-6 hover:border-primary/50 transition-colors",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(TrendingUp, {
                        className: "h-10 w-10 text-primary mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "text-xl font-bold mb-2",
                        children: "Analytics"
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground text-sm",
                        children: ["Track what resonates with ", city, " buyers"]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(CircleCheckBig, {
                        className: "h-10 w-10 text-primary mb-4"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
                        className: "text-xl font-bold mb-2",
                        children: "CRM Integration"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-muted-foreground text-sm",
                        children: "Auto-sync leads to your existing system"
                      })]
                    })]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "container mx-auto px-4 py-16",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-4xl mx-auto",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h2", {
                    className: "text-3xl md:text-4xl font-bold text-center mb-12",
                    children: ["Success Stories from ", city, " Agents"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "grid md:grid-cols-2 gap-8",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-3 mb-4",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary",
                          children: [city.charAt(0), "A"]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                            className: "font-bold",
                            children: [city, " Agent"]
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                            className: "text-sm text-muted-foreground",
                            children: "Residential Specialist"
                          })]
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground mb-4",
                        children: ['"AgentBio helped me convert my Instagram followers into real ', city, ` buyers. I've closed 3 deals in the past 2 months directly from Instagram leads."`]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-4 text-sm font-medium",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "text-primary",
                          children: "3 closings"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "text-muted-foreground",
                          children: "•"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "text-primary",
                          children: "15 leads/month"
                        })]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-3 mb-4",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          className: "h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary",
                          children: [city.charAt(0), "B"]
                        }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                          children: [/* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                            className: "font-bold",
                            children: [city, " Team Lead"]
                          }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                            className: "text-sm text-muted-foreground",
                            children: "Luxury Properties"
                          })]
                        })]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground mb-4",
                        children: ['"The property listing cards make it so easy to showcase my ', city, ' luxury homes. My Instagram followers love browsing properties right from my bio link."']
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                        className: "flex items-center gap-4 text-sm font-medium",
                        children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "text-primary",
                          children: "$2M+ in sales"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "text-muted-foreground",
                          children: "•"
                        }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                          className: "text-primary",
                          children: "10x engagement"
                        })]
                      })]
                    })]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "container mx-auto px-4 py-16 bg-muted/30",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-3xl mx-auto",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("h2", {
                    className: "text-3xl md:text-4xl font-bold text-center mb-12",
                    children: "Frequently Asked Questions"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "space-y-6",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                        className: "font-bold text-lg mb-2",
                        children: ["How do ", city, " real estate agents use AgentBio?"]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground",
                        children: [city, " real estate agents use AgentBio as their Instagram link in bio to showcase ", city, " property listings, capture local buyer and seller leads, and book consultations. The platform is optimized for mobile traffic from Instagram and includes features specifically for real estate professionals."]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                        className: "font-bold text-lg mb-2",
                        children: ["Can I showcase ", city, " property listings on AgentBio?"]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground",
                        children: ["Yes! AgentBio allows ", city, " agents to display property listing cards with photos, addresses, prices, and details. You can update listings instantly when properties go pending or sell, ensuring your ", city, " followers always see current inventory."]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                        className: "font-bold text-lg mb-2",
                        children: ["Does AgentBio work with ", city, " MLS systems?"]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground",
                        children: ["AgentBio integrates with major MLS and IDX providers used in ", city, ". You can automatically sync your active ", city, " listings or manually add properties with photos and details."]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                        className: "font-bold text-lg mb-2",
                        children: ["How much does AgentBio cost for ", city, " agents?"]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground",
                        children: ["AgentBio pricing starts at $19/month with a free trial. All plans include unlimited property listings, lead capture forms, calendar booking, and analytics—perfect for growing ", city, " real estate businesses."]
                      })]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      className: "glass-panel p-6",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h3", {
                        className: "font-bold text-lg mb-2",
                        children: ["Can I customize my AgentBio page for ", city, " branding?"]
                      }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                        className: "text-muted-foreground",
                        children: ["Absolutely! You can customize colors, fonts, logos, and background images to match your personal brand or brokerage guidelines. Many ", city, " agents maintain consistent branding across Instagram, their website, and AgentBio."]
                      })]
                    })]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "container mx-auto px-4 py-16",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-4xl mx-auto text-center glass-panel p-12 bg-gradient-to-br from-primary/10 to-accent/10",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("h2", {
                    className: "text-3xl md:text-4xl font-bold mb-6",
                    children: ["Join ", city, " Real Estate Agents Growing Their Business with AgentBio"]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-xl text-muted-foreground mb-8",
                    children: ["Start converting your Instagram followers into ", city, " buyer and seller leads today."]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex flex-col sm:flex-row gap-4 justify-center",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      asChild: true,
                      size: "lg",
                      className: "text-lg px-8",
                      children: /* @__PURE__ */jsxRuntimeExports.jsxs(Link, {
                        to: "/get-started",
                        children: ["Start Free Trial", /* @__PURE__ */jsxRuntimeExports.jsx(ArrowRight, {
                          className: "ml-2 h-5 w-5"
                        })]
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Button, {
                      asChild: true,
                      variant: "outline",
                      size: "lg",
                      className: "text-lg px-8",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                        to: "/pricing",
                        children: "View Pricing"
                      })
                    })]
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                    className: "text-sm text-muted-foreground mt-6",
                    children: ["No credit card required • Set up in 10 minutes • Used by ", city, " professionals"]
                  })]
                })
              }), /* @__PURE__ */jsxRuntimeExports.jsx("section", {
                className: "container mx-auto px-4 py-8 border-t border-glass-border/30",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-4xl mx-auto",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                    className: "text-sm text-muted-foreground text-center mb-4",
                    children: "Explore more resources for real estate agents:"
                  }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex flex-wrap justify-center gap-4 text-sm",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                      to: "/for-real-estate-agents",
                      className: "text-primary hover:underline",
                      children: "For Real Estate Agents"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-muted-foreground",
                      children: "•"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                      to: "/instagram-bio-for-realtors",
                      className: "text-primary hover:underline",
                      children: "Instagram Bio Tips"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-muted-foreground",
                      children: "•"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                      to: "/tools/instagram-bio-analyzer",
                      className: "text-primary hover:underline",
                      children: "Free Bio Analyzer"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                      className: "text-muted-foreground",
                      children: "•"
                    }), /* @__PURE__ */jsxRuntimeExports.jsx(Link, {
                      to: "/tools/listing-description-generator",
                      className: "text-primary hover:underline",
                      children: "Listing Generator"
                    })]
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
