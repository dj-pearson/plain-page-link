import { j as jsxRuntimeExports } from './react-vendor-a6jLNMWt.js';
import { L as LocationTemplate } from './LocationTemplate-DZGjyChr.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './ui-components-DLW4dShh.js';
import './icons-Bf8A6sFa.js';
import './supabase-D4RJa1Op.js';

const miamiData = {
  city: "Miami",
  state: "Florida",
  stateAbbr: "FL",
  slug: "miami-real-estate-agents",
  medianPrice: "$565,000",
  marketTrend: "Rising",
  agentCount: "8,500+",
  marketDescription: "Miami's luxury condo market and international buyer demand create unique opportunities for agents with strong Instagram presence and bilingual capabilities.",
  neighborhoods: [
    "Brickell",
    "Coconut Grove",
    "Coral Gables",
    "Miami Beach",
    "Wynwood",
    "Design District",
    "Key Biscayne",
    "Aventura",
    "Bal Harbour",
    "Sunny Isles Beach",
    "Pinecrest",
    "South Beach"
  ]
};
function MiamiAgents() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(LocationTemplate, { location: miamiData });
}

export { MiamiAgents as default };
