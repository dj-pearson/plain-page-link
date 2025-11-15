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
        exports("default", DenverAgents);
        const denverData = {
          city: "Denver",
          state: "Colorado",
          stateAbbr: "CO",
          slug: "denver-real-estate-agents",
          medianPrice: "$615,000",
          marketTrend: "Competitive",
          agentCount: "3,800+",
          marketDescription: "Denver's outdoor lifestyle attracts young professionals and remote workers. Agents who showcase neighborhood amenities and mountain access through Instagram see strong engagement.",
          neighborhoods: ["Cherry Creek", "Washington Park", "Capitol Hill", "Highlands", "LoDo", "RiNo", "Congress Park", "Park Hill", "Stapleton", "Uptown", "Sloan's Lake", "Baker"]
        };
        function DenverAgents() {
          return /* @__PURE__ */jsxRuntimeExports.jsx(LocationTemplate, {
            location: denverData
          });
        }
      }
    };
  });
})();
