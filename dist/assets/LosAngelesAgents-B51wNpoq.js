import { j as jsxRuntimeExports } from './react-vendor-a6jLNMWt.js';
import { L as LocationTemplate } from './LocationTemplate-DZGjyChr.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './ui-components-DLW4dShh.js';
import './icons-Bf8A6sFa.js';
import './supabase-D4RJa1Op.js';

const losAngelesData = {
  city: "Los Angeles",
  state: "California",
  stateAbbr: "CA",
  slug: "los-angeles-real-estate-agents",
  medianPrice: "$925,000",
  marketTrend: "Stable",
  agentCount: "15,000+",
  marketDescription: "LA's competitive luxury market demands strong personal branding. Top agents leverage Instagram to showcase celebrity neighborhoods, architectural gems, and lifestyle amenities.",
  neighborhoods: [
    "Beverly Hills",
    "West Hollywood",
    "Santa Monica",
    "Venice Beach",
    "Malibu",
    "Brentwood",
    "Pacific Palisades",
    "Silver Lake",
    "Los Feliz",
    "Downtown LA",
    "Pasadena",
    "Manhattan Beach",
    "Hermosa Beach",
    "Culver City",
    "Studio City"
  ]
};
function LosAngelesAgents() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(LocationTemplate, { location: losAngelesData });
}

export { LosAngelesAgents as default };
