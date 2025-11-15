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
        exports("default", PhoenixAgents);
        const phoenixData = {
          city: "Phoenix",
          state: "Arizona",
          stateAbbr: "AZ",
          slug: "phoenix-real-estate-agents",
          medianPrice: "$450,000",
          marketTrend: "Growing",
          agentCount: "7,100+",
          marketDescription: "Phoenix attracts retirees and California transplants seeking affordability, creating opportunities for agents with strong online lead generation strategies.",
          neighborhoods: ["Scottsdale", "Paradise Valley", "Arcadia", "Biltmore", "Downtown Phoenix", "Tempe", "Chandler", "Gilbert", "Mesa", "Ahwatukee", "North Phoenix", "Camelback East"]
        };
        function PhoenixAgents() {
          return /* @__PURE__ */jsxRuntimeExports.jsx(LocationTemplate, {
            location: phoenixData
          });
        }
      }
    };
  });
})();
