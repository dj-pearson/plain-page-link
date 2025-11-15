import { j as jsxRuntimeExports } from './react-vendor-a6jLNMWt.js';
import { L as LocationTemplate } from './LocationTemplate-DZGjyChr.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './ui-components-DLW4dShh.js';
import './icons-Bf8A6sFa.js';
import './supabase-D4RJa1Op.js';

const austinData = {
  city: "Austin",
  state: "Texas",
  stateAbbr: "TX",
  slug: "austin-real-estate-agents",
  medianPrice: "$550,000",
  marketTrend: "Competitive",
  agentCount: "4,200+",
  marketDescription: "Austin's booming tech sector and population growth create high demand for agents who can effectively market to relocating professionals through social media.",
  neighborhoods: [
    "Downtown Austin",
    "South Congress",
    "East Austin",
    "West Lake Hills",
    "Tarrytown",
    "Hyde Park",
    "Mueller",
    "Zilker",
    "Barton Hills",
    "Clarksville",
    "Bouldin Creek",
    "Travis Heights"
  ]
};
function AustinAgents() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(LocationTemplate, { location: austinData });
}

export { AustinAgents as default };
