;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './LocationTemplate-legacy-etTLfBG5.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js', './ui-components-legacy-oJhN_-ge.js', './icons-legacy-C8x4ypXf.js', './supabase-legacy-CQONYrP8.js'], function (exports, module) {
    'use strict';

    var jsxRuntimeExports, LocationTemplate;
    return {
      setters: [module => {
        jsxRuntimeExports = module.j;
      }, module => {
        LocationTemplate = module.L;
      }, null, null, null, null, null],
      execute: function () {
        exports("default", LosAngelesAgents);
        const losAngelesData = {
          city: "Los Angeles",
          state: "California",
          stateAbbr: "CA",
          slug: "los-angeles-real-estate-agents",
          medianPrice: "$925,000",
          marketTrend: "Stable",
          agentCount: "15,000+",
          marketDescription: "LA's competitive luxury market demands strong personal branding. Top agents leverage Instagram to showcase celebrity neighborhoods, architectural gems, and lifestyle amenities.",
          neighborhoods: ["Beverly Hills", "West Hollywood", "Santa Monica", "Venice Beach", "Malibu", "Brentwood", "Pacific Palisades", "Silver Lake", "Los Feliz", "Downtown LA", "Pasadena", "Manhattan Beach", "Hermosa Beach", "Culver City", "Studio City"]
        };
        function LosAngelesAgents() {
          return /* @__PURE__ */jsxRuntimeExports.jsx(LocationTemplate, {
            location: losAngelesData
          });
        }
      }
    };
  });
})();
