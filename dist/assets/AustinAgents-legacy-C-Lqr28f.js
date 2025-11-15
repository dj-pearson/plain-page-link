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
        exports("default", AustinAgents);
        const austinData = {
          city: "Austin",
          state: "Texas",
          stateAbbr: "TX",
          slug: "austin-real-estate-agents",
          medianPrice: "$550,000",
          marketTrend: "Competitive",
          agentCount: "4,200+",
          marketDescription: "Austin's booming tech sector and population growth create high demand for agents who can effectively market to relocating professionals through social media.",
          neighborhoods: ["Downtown Austin", "South Congress", "East Austin", "West Lake Hills", "Tarrytown", "Hyde Park", "Mueller", "Zilker", "Barton Hills", "Clarksville", "Bouldin Creek", "Travis Heights"]
        };
        function AustinAgents() {
          return /* @__PURE__ */jsxRuntimeExports.jsx(LocationTemplate, {
            location: austinData
          });
        }
      }
    };
  });
})();
