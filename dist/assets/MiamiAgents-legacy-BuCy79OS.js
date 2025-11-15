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
        exports("default", MiamiAgents);
        const miamiData = {
          city: "Miami",
          state: "Florida",
          stateAbbr: "FL",
          slug: "miami-real-estate-agents",
          medianPrice: "$565,000",
          marketTrend: "Rising",
          agentCount: "8,500+",
          marketDescription: "Miami's luxury condo market and international buyer demand create unique opportunities for agents with strong Instagram presence and bilingual capabilities.",
          neighborhoods: ["Brickell", "Coconut Grove", "Coral Gables", "Miami Beach", "Wynwood", "Design District", "Key Biscayne", "Aventura", "Bal Harbour", "Sunny Isles Beach", "Pinecrest", "South Beach"]
        };
        function MiamiAgents() {
          return /* @__PURE__ */jsxRuntimeExports.jsx(LocationTemplate, {
            location: miamiData
          });
        }
      }
    };
  });
})();
